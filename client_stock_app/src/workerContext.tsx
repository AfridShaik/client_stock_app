import React, { createContext, useEffect, useRef, useState, PropsWithChildren } from 'react';

interface WorkerContextProps {
    stocks: { [symbol: string]: number };
    subscribe: (symbols: string[]) => void;
    connected: boolean;
    connectionStatusMessage: string | null;
    error: string | null;
    removeStock: (symbol: string) => void;
}

export const WorkerContext = createContext<WorkerContextProps>({
    stocks: {},
    subscribe: () => {},
    connected: false,
    connectionStatusMessage: null,
    error: null,
    removeStock: () => {},
});

export const WorkerProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const workerRef = useRef<Worker | null>(null);
    const [stocks, setStocks] = useState<{ [symbol: string]: number }>({});
    const [connected, setConnected] = useState<boolean>(false);
    const [connectionStatusMessage, setConnectionStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('./worker.ts', import.meta.url));

        workerRef.current.onmessage = (event: MessageEvent) => {
            const { type, data, message, willRetry } = event.data;

            switch(type) {
                case 'connected':
                    setConnected(true);
                    setConnectionStatusMessage(null);
                    setError(null);
                    setStocks(prevStocks => ({ ...prevStocks }));
                    break;
                case 'update':
                    setStocks(prevStocks => ({ ...prevStocks, ...data }));
                    break;
                case 'connectionStatus':
                    setConnected(false);
                    setConnectionStatusMessage(message);
                    if (!willRetry) {
                        setError('Unable to reconnect to the server.');
                    }
                    break;
                case 'error':
                    setError(data);
                    break;
                default:
                    console.warn('Unknown message type:', type);
            }
        };

        workerRef.current.postMessage({ type: 'init' });

        workerRef.current.onerror = (e) => {
            setError(e.message);
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const subscribe = (symbols: string[]) => {
        workerRef.current?.postMessage({ type: 'subscribe', stocks: symbols });
    };

    const removeStock = (symbol: string) => {
        setStocks(prevStocks => {
            const newStocks = { ...prevStocks };
            delete newStocks[symbol];
            return newStocks;
        });
    };

    return (
        <WorkerContext.Provider value={{ stocks, subscribe, connected, connectionStatusMessage, error, removeStock }}>
            {children}
        </WorkerContext.Provider>
    );
};


