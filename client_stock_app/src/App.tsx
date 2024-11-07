import { useContext, useEffect, useState } from 'react';
import './App.css';
import { WorkerContext, WorkerProvider } from './workerContext';
import Portfolio from './Portfolio';

const StockList = ({ onSelect }: { onSelect: (stocks: string[]) => void }) => {
    const [availableStocks, setAvailableStocks] = useState<string[]>([]);
    const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetch('/stock_list.json')
            .then(response => response.json())
            .then(data => {
                const stockSymbols = Object.keys(data).sort();
                setAvailableStocks(stockSymbols);
            })
            .catch(error => {
                console.error('Error fetching stock list:', error);
            });
    }, []);

    const toggleStock = (symbol: string) => {
        const newSelected = new Set(selectedStocks);
        if (newSelected.has(symbol)) {
            newSelected.delete(symbol);
        } else {
            newSelected.add(symbol);
        }
        setSelectedStocks(newSelected);
        onSelect(Array.from(newSelected));
    };

    return (
        <div className="stock-list">
            <h2>Select Stocks to Monitor:</h2>
            <ul>
                {availableStocks.map(symbol => (
                    <li key={symbol}>
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedStocks.has(symbol)}
                                onChange={() => toggleStock(symbol)}
                            />
                            {symbol}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const StockPrices = ({ selectedStocks }: { selectedStocks: Set<string> }) => {
    const { stocks, removeStock } = useContext(WorkerContext);
    const [prevStocks, setPrevStocks] = useState<{ [symbol: string]: number }>({});

    useEffect(() => {
        const newPrevStocks: { [symbol: string]: number } = {};
        Object.keys(stocks).forEach(symbol => {
            newPrevStocks[symbol] = prevStocks[symbol] || stocks[symbol];
        });

        requestAnimationFrame(() => {
            setPrevStocks(newPrevStocks);
        });
    }, [stocks]);

    const sortedStocks = Object.entries(stocks)
        .sort(([symbolA], [symbolB]) => symbolA.localeCompare(symbolB));

    return (
        <div className="stock-prices">
            <h2>Live Stock Prices:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Price ($)</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedStocks.map(([symbol, price]) => {
                        const prevPrice = prevStocks[symbol];
                        let className = '';
                        if (prevPrice !== undefined && price > prevPrice) {
                            className = 'price-up';
                        } else if (prevPrice !== undefined && price < prevPrice) {
                            className = 'price-down';
                        }
                        return (
                            <tr key={symbol}>
                                <td>{symbol}</td>
                                <td className={className}>{typeof price === 'number' ? price.toFixed(2) : 'N/A'}</td>
                                <td>
                                    {selectedStocks.has(symbol) ? (
                                        <>
                                            <button className="buy-sell-btn buy-btn">Buy</button>
                                            <button className="buy-sell-btn sell-btn">Sell</button>
                                        </>
                                    ) : (
                                        <button className="delete-btn" onClick={() => removeStock(symbol)}>Delete</button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const AppContent = () => {
    const { subscribe, connected, connectionStatusMessage, error } = useContext(WorkerContext);
    const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

    useEffect(() => {
        if (connected && selectedStocks.length > -1) {
            subscribe(selectedStocks);
        }
    }, [connected, selectedStocks, subscribe]);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Real-Time Stock Price Streaming</h1>
            </header>
            <main>
                {!connected && <p>{connectionStatusMessage}</p>}
                {error && <p className="error">Error: {error}</p>}
                <div className="container">
                    <div className="stock-selection">
                        <StockList onSelect={setSelectedStocks} />
                    </div>
                    <div className="stock-prices">
                        <StockPrices selectedStocks={new Set(selectedStocks)} />
                    </div>
                    <div className="portfolio-container">
                        <Portfolio />
                    </div>
                </div>
            </main>
        </div>
    );
};

const App = () => {
    return (
        <WorkerProvider>
            <AppContent />
        </WorkerProvider>
    );
};

export default App;
