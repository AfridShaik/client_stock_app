import { useContext, useEffect, useState } from 'react'; // Import React hooks we need for managing state and side effects
import './App.css'; // Import the styles for this component
import { WorkerContext, WorkerProvider } from './workerContext'; // Import our WebSocket worker context that manages stock data
import Portfolio from './Portfolio'; // Import the Portfolio component that shows user's stock holdings

// StockList component displays checkboxes for selecting stocks to monitor
// It takes a callback function onSelect that gets called when stocks are selected/unselected
const StockList = ({ onSelect }: { onSelect: (stocks: string[]) => void }) => {
    const [availableStocks, setAvailableStocks] = useState<string[]>([]); // Store list of all available stocks
    const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set()); // Track which stocks are selected using a Set

    // When component mounts, fetch the list of available stocks from JSON file
    useEffect(() => {
        fetch('/stock_list.json')
            .then(response => response.json())
            .then(data => {
                const stockSymbols = Object.keys(data).sort(); // Get stock symbols and sort alphabetically
                setAvailableStocks(stockSymbols); // Update state with sorted stock list
            })
            .catch(error => {
                console.error('Error fetching stock list:', error);
            });
    }, []);

    // This function handles toggling stocks when a user clicks a checkbox
    // It maintains a Set of selected stock symbols and updates the parent component
    const toggleStock = (symbol: string) => {
        // Create a new Set from existing selections to avoid mutating state directly
        const newSelected = new Set(selectedStocks);

        // If stock is already selected, remove it
        // If stock isn't selected, add it
        if (newSelected.has(symbol)) {
            newSelected.delete(symbol);
        } else {
            newSelected.add(symbol);
        }

        // Update the local state with new selections
        setSelectedStocks(newSelected);
        // Notify parent component of changes by converting Set to Array
        onSelect(Array.from(newSelected));
    };

    // Render a list of checkboxes for each available stock
    return (
        <div className="stock-list">
            <h2>Select Stocks to Monitor:</h2>
            <ul>
                {availableStocks.map(symbol => (
                    <li key={symbol}>
                        <label>
                            <input
                                type="checkbox"
                                checked={selectedStocks.has(symbol)} // Checkbox is checked if stock is in selectedStocks Set
                                onChange={() => toggleStock(symbol)} // Call toggleStock when checkbox is clicked
                            />
                            {symbol}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// StockPrices component shows real-time prices for stocks in a table
// Takes a Set of selectedStocks to know which stocks should show buy/sell buttons
const StockPrices = ({ selectedStocks }: { selectedStocks: Set<string> }) => {
    const { stocks, removeStock } = useContext(WorkerContext); // Get current stock prices and removeStock function from context
    const [prevStocks, setPrevStocks] = useState<{ [symbol: string]: number }>({}); // Track previous prices to show price changes

    // Update previous prices whenever current prices change
    useEffect(() => {
        const newPrevStocks: { [symbol: string]: number } = {};
        Object.keys(stocks).forEach(symbol => {
            newPrevStocks[symbol] = prevStocks[symbol] || stocks[symbol];
        });

        // Use requestAnimationFrame for smooth visual updates
        requestAnimationFrame(() => {
            setPrevStocks(newPrevStocks);
        });
    }, [stocks]);

    // Sort stocks alphabetically by symbol
    const sortedStocks = Object.entries(stocks)
        .sort(([symbolA], [symbolB]) => symbolA.localeCompare(symbolB));

    // Render table showing stock prices and actions
    return (
        <div className="stock-prices">
            <h2>Live Stock Prices:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Symbol</th> {/* Column for stock symbol/name */}
                        <th>Price ($)</th> {/* Column for current price */}
                        <th>Actions</th> {/* Column for Buy/Sell/Delete buttons */}
                    </tr>
                </thead>
                <tbody>
                    {/* Create a row for each stock */}
                    {sortedStocks.map(([symbol, price]) => {
                        const prevPrice = prevStocks[symbol];
                        let className = '';
                        
                        // Add CSS classes to show price movement:
                        // Green for price increase, red for decrease
                        if (prevPrice !== undefined && price > prevPrice) {
                            className = 'price-up';
                        } else if (prevPrice !== undefined && price < prevPrice) {
                            className = 'price-down';
                        }

                        return (
                            <tr key={symbol}>
                                <td>{symbol}</td>
                                <td className={className}>{typeof price === 'number' ? price : 'N/A'}</td>
                                <td>
                                    {/* Show Buy/Sell buttons for selected stocks, Delete button for others */}
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

// AppContent component manages the main application layout and state
const AppContent = () => {
    const { subscribe, connected, connectionStatusMessage, error } = useContext(WorkerContext); // Get connection status and functions from context
    const [selectedStocks, setSelectedStocks] = useState<string[]>([]); // Track which stocks are selected

    // Subscribe to updates for selected stocks when connection is established
    useEffect(() => {
        if (connected && selectedStocks.length > -1) {
            subscribe(selectedStocks);
        }
    }, [connected, selectedStocks, subscribe]);

    // Render main app layout with connection status, stock selection, prices, and portfolio
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

// Main App component wraps everything in the WorkerProvider context
const App = () => {
    return (
        <WorkerProvider>
            <AppContent />
        </WorkerProvider>
    );
};

export default App;
