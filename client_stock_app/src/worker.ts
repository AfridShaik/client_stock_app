// This defines what a stock update message looks like - it's just a list of stock symbols and their prices
interface StockUpdate {
    [symbol: string]: number;
}

// These are our main variables that we use throughout the code
let socket: WebSocket | null = null;                                      // Stores our connection to the server
let onMessageCallback: ((data: StockUpdate) => void) | null = null;      // Function to call when we get new stock prices
let subscribedStocks: Set<string> = new Set();                           // List of stocks we want updates for

// Variables for controlling how often we send updates
let throttleTimeout: ReturnType<typeof setTimeout> | null = null;         // Timer for spacing out updates
let throttledData: StockUpdate = {};                                      // Temporary storage for updates we haven't sent yet

// Variables for handling connection problems
let isReconnecting = false;                                              // Are we trying to reconnect right now?
let reconnectAttempts = 0;                                               // How many times have we tried to reconnect?
const MAX_RECONNECT_ATTEMPTS = 10;                                       // Maximum number of times we'll try to reconnect
const RECONNECT_INTERVAL_BASE = 1000;                                    // We'll wait this many milliseconds between attempts

// This function creates a connection to our stock server
function connect() {
    socket = new WebSocket('ws://localhost:8080');

    // When we successfully connect:
    socket.onopen = () => {
        console.log('WebSocket connection established');
        reconnectAttempts = 0;                                           // Reset our reconnection counter
        globalThis.postMessage({ type: 'connected' });                   // Tell the main app we're connected
        isReconnecting = false;
        sendSubscription();                                              // Ask for updates for our stocks
    };

    // When we get a message from the server:
    socket.onmessage = (event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data);                      // Try to read the message
            if (message.type === 'update') {
                const data: StockUpdate = message.data;
                handleIncomingData(data);                                // Process the new stock prices
            }
        } catch (error) {
            console.error('Error parsing message from server:', error);
            globalThis.postMessage({ type: 'error', data: 'Received malformed data from server.' });
        }
    };

    // When we lose connection:
    socket.onclose = () => {
        if (!isReconnecting) {
            isReconnecting = true;
            reconnectAttempts++;
            // Wait longer between each reconnection attempt (but not more than 30 seconds)
            let retryInterval = RECONNECT_INTERVAL_BASE * Math.pow(2, reconnectAttempts);
            retryInterval = Math.min(retryInterval, 30000);

            // Tell the main app we're disconnected
            globalThis.postMessage({
                type: 'connectionStatus',
                status: 'disconnected',
                message: `Connection lost. Attempting to reconnect in ${Math.floor(retryInterval/1000)}s...`,
                willRetry: true
            });

            console.log(`Reconnecting in ${retryInterval}ms...`);
            globalThis.setTimeout(() => {
                connect();                                               // Try to connect again
                if (subscribedStocks.size > 0) {
                    sendSubscription();                                  // Re-subscribe to our stocks
                }
            }, retryInterval);
        }
    };

    // If there's an error with the connection:
    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket?.close();                                                // Close the connection and try again
    };
}

// This function processes new stock prices we receive
function handleIncomingData(data: StockUpdate) {
    const filteredData: StockUpdate = {};
    // Only keep prices for stocks we care about
    Object.keys(data).forEach(symbol => {
        if (subscribedStocks.has(symbol)) {
            filteredData[symbol] = data[symbol];
        }
    });

    // Add the new prices to our temporary storage
    throttledData = { ...throttledData, ...filteredData };

    // If we're not already waiting to send updates:
    if (!throttleTimeout) {
        // Wait 100ms, then send all the updates we've collected
        throttleTimeout = globalThis.setTimeout(() => {
            if (onMessageCallback) {
                onMessageCallback(throttledData);
            }
            throttledData = {};                                         // Clear our temporary storage
            throttleTimeout = null;
        }, 100);                                                       // Only send updates every 100ms
    }
}

// This handles messages from the main app
globalThis.onmessage = (event: MessageEvent) => {
    const { type, stocks } = event.data;

    // When the app first starts:
    if (type === 'init') {
        onMessageCallback = (data: StockUpdate) => {
            globalThis.postMessage({ type: 'update', data });           // Set up how we'll send updates back
        };
        connect();                                                     // Connect to the server
    }

    // When the app wants updates for specific stocks:
    if (type === 'subscribe') {
        subscribedStocks = new Set(stocks);                           // Update our list of stocks to watch
        sendSubscription();                                           // Tell the server which stocks we want
    }
};

// This tells the server which stocks we want updates for
function sendSubscription() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'subscribe', stocks: Array.from(subscribedStocks) }));
    }
}

export {};
