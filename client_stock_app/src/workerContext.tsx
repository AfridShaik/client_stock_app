// Import what we need from React
import React, { createContext, useEffect, useRef, useState, PropsWithChildren } from 'react';

// Define what data we want to share
interface WorkerContextProps {
    stocks: { [symbol: string]: number };      // List of stocks and their prices
    subscribe: (symbols: string[]) => void;     // Way to ask for stock updates
    connected: boolean;                         // Are we connected? Yes/No
    connectionStatusMessage: string | null;     // Message about connection
    error: string | null;                      // Any error message
    removeStock: (symbol: string) => void;      // Way to remove a stock
}

// Create a place to store our shared data
export const WorkerContext = createContext<WorkerContextProps>({
    stocks: {},                                // Start with no stocks
    subscribe: () => {},                       // Empty function for now
    connected: false,                          // Start disconnected
    connectionStatusMessage: null,             // No message yet
    error: null,                              // No errors yet
    removeStock: () => {},                     // Empty function for now
});

// This part wraps our app and handles all the stock data
export const WorkerProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    // Keep track of our worker
    const workerRef = useRef<Worker | null>(null);
    // Keep track of stock prices
    const [stocks, setStocks] = useState<{ [symbol: string]: number }>({});
    // Keep track if we're connected
    const [connected, setConnected] = useState<boolean>(false);
    // Keep track of connection messages
    const [connectionStatusMessage, setConnectionStatusMessage] = useState<string | null>(null);
    // Keep track of any errors
    const [error, setError] = useState<string | null>(null);

    // When the app starts, set up our worker
    useEffect(() => {
        // Make a new worker
        workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));

        // Listen for messages from the worker
        workerRef.current.onmessage = (event: MessageEvent) => {
            const { type, data, message, willRetry } = event.data;

            // Handle different kinds of messages
            switch(type) {
                case 'connected':
                    // We're connected!
                    setConnected(true);
                    setConnectionStatusMessage(null);
                    setError(null);
                    setStocks(prevStocks => ({ ...prevStocks }));
                    break;
                case 'update':
                    // Update stock prices
                    setStocks(prevStocks => ({ ...prevStocks, ...data }));
                    break;
                case 'connectionStatus':
                    // Connection changed
                    setConnected(false);
                    setConnectionStatusMessage(message);
                    if (!willRetry) {
                        setError('Cannot connect to server.');
                    }
                    break;
                case 'error':
                    // Something went wrong
                    setError(data);
                    break;
                default:
                    // Unknown message
                    console.warn('Got unknown message:', type);
            }
        };

        // Start the worker
        workerRef.current.postMessage({ type: 'init' });

        // If worker has error
        workerRef.current.onerror = (e) => {
            setError(e.message);
        };

        // Clean up when done
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    // Function to ask for stock updates
    const subscribe = (symbols: string[]) => {
        workerRef.current?.postMessage({ type: 'subscribe', stocks: symbols });
    };

    // Function to stop watching a stock
    const removeStock = (symbol: string) => {
        setStocks(prevStocks => {
            const newStocks = { ...prevStocks };
            delete newStocks[symbol];
            return newStocks;
        });
    };

    // Share all our data with the app
    return (
        <WorkerContext.Provider value={{ stocks, subscribe, connected, connectionStatusMessage, error, removeStock }}>
            {children}
        </WorkerContext.Provider>
    );
};
