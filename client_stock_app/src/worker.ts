interface StockUpdate {
    [symbol: string]: number;
}

let socket: WebSocket | null = null;
let onMessageCallback: ((data: StockUpdate) => void) | null = null;
let subscribedStocks: Set<string> = new Set();

let throttleTimeout: ReturnType<typeof setTimeout> | null = null;
let throttledData: StockUpdate = {};

let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_BASE = 1000;

function connect() {
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        console.log('WebSocket connection established');
        reconnectAttempts = 0;
        globalThis.postMessage({ type: 'connected' });
        isReconnecting = false;
        sendSubscription();
    };

    socket.onmessage = (event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'update') {
                const data: StockUpdate = message.data;
                handleIncomingData(data);
            }
        } catch (error) {
            console.error('Error parsing message from server:', error);
            globalThis.postMessage({ type: 'error', data: 'Received malformed data from server.' });
        }
    };

    socket.onclose = () => {
        if (!isReconnecting) {
            isReconnecting = true;
            reconnectAttempts++;
            let retryInterval = RECONNECT_INTERVAL_BASE * Math.pow(2, reconnectAttempts);
            retryInterval = Math.min(retryInterval, 30000); // Cap the interval at 30 seconds

            globalThis.postMessage({
                type: 'connectionStatus',
                status: 'disconnected',
                message: `Connection lost. Attempting to reconnect in ${Math.floor(retryInterval/1000)}s...`,
                willRetry: true
            });

            console.log(`Reconnecting in ${retryInterval}ms...`);
            globalThis.setTimeout(() => {
                connect();
                if (subscribedStocks.size > 0) {
                    sendSubscription(); // Resend subscriptions after reconnecting
                }
            }, retryInterval);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket?.close();
    };
}

function handleIncomingData(data: StockUpdate) {
    const filteredData: StockUpdate = {};
    Object.keys(data).forEach(symbol => {
        if (subscribedStocks.has(symbol)) {
            filteredData[symbol] = data[symbol];
        }
    });

    throttledData = { ...throttledData, ...filteredData };

    if (!throttleTimeout) {
        throttleTimeout = globalThis.setTimeout(() => {
            if (onMessageCallback) {
                onMessageCallback(throttledData);
            }
            throttledData = {};
            throttleTimeout = null;
        }, 100); // Throttle updates to 100ms
    }
}

globalThis.onmessage = (event: MessageEvent) => {
    const { type, stocks } = event.data;

    if (type === 'init') {
        onMessageCallback = (data: StockUpdate) => {
            globalThis.postMessage({ type: 'update', data });
        };
        connect();
    }

    if (type === 'subscribe') {
        subscribedStocks = new Set(stocks);
        sendSubscription();
    }
};

function sendSubscription() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'subscribe', stocks: Array.from(subscribedStocks) }));
    }
}

export {};
