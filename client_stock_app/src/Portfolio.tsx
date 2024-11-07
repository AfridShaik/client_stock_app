import  { useEffect, useState } from 'react';
import './App.css';

const Portfolio = () => {
    const [stocks, setStocks] = useState({
        "Belvedere Trading (BVD)": 100.00
    });
    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8080/stock_list.json');

        ws.onopen = () => {
            console.log('WebSocket connection established');
            ws.send(JSON.stringify({
                type: 'subscribe',
                stocks: Object.keys(stocks)
            }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
                setStocks(prevStocks => ({
                    ...prevStocks,
                    ...data.data
                }));
            }
        };

        ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            ws.close();
        };
    }, []);

    useEffect(() => {
        const total = Object.values(stocks).reduce((acc, curr) => acc + curr, 0);
        setTotalValue(total);
    }, [stocks]);

    return (
        <div className="portfolio">
            <h2>Portfolio</h2>
            <p>Total Value: ${totalValue.toFixed(2)}</p>
            <div className="stock-details">
                {Object.entries(stocks).map(([name, price]) => (
                    <p key={name}>{name}: ${price.toFixed(2)}</p>
                ))}
            </div>
        </div>
    );
};

export default Portfolio;
