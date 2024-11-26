import  { useEffect, useState } from 'react';
import './App.css';

const Portfolio = () => {
    // Initialize portfolio with default BVD stock holding
    const [stocks, setStocks] = useState({
        "Belvedere Trading (BVD)": 100.00
    });
    // Track total portfolio value across all holdings
    const [totalValue, setTotalValue] = useState(0);

    // Establish WebSocket connection and handle real-time updates
    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080/stock_list.json');

        // When connection opens, subscribe to updates for held stocks
        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({
                type: 'subscribe',
                stocks: Object.keys(stocks)
            }));
        };

        // When a new WebSocket message arrives, this function processes it
        ws.onmessage = (event) => {
            // We take the message text and turn it into a JavaScript object we can use
            const data = JSON.parse(event.data);
            
            // We look at the message type to see if it contains new stock prices
            if (data.type === 'update') {
                // This line updates our stock prices:
                // - It keeps all existing stock prices from prevStocks
                // - It adds or updates prices from the new data
                // - Any matching stocks get their prices replaced with new values
                setStocks(prevStocks => ({
                    ...prevStocks,
                    ...data.data
                }));
            }
        };

        // Log when connection closes
        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        // Clean up WebSocket on component unmount
        return () => {
            ws.close();
        };
    }, []);

    // Recalculate total portfolio value when stock prices change
    useEffect(() => {
        const total = Object.values(stocks).reduce((acc, curr) => acc + curr, 0);
        setTotalValue(total);
    }, [stocks]);

    // Render portfolio summary and individual stock holdings
    return (
        <div className="portfolio">
            <h2>Portfolio</h2>
            <p>Total Value: ${totalValue}</p>
            <div className="stock-details">
                {Object.entries(stocks).map(([name, price]) => (
                    <p key={name}>{name}: ${price.toFixed(2)}</p>
                ))}
            </div>
        </div>
    );
};

export default Portfolio;
