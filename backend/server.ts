import express from 'express';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import generatePrice from './PriceSimulator';
import { stockListWithInitialPrice } from './PriceSimulator';
import path from 'path';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());

app.get('/', (req, res) => {
    res.send('Welcome to the Real-Time Stock Price Streaming Application!');
});

const PORT = 8080;
const UPDATE_INTERVAL = 25; // in milliseconds

interface Client extends WebSocket {
    subscribedStocks: Set<string>;
}

wss.on('connection', (ws: WebSocket) => {
    const client = ws as Client;
    client.subscribedStocks = new Set<string>();

    console.log('New client connected');

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'subscribe':
                    client.subscribedStocks = new Set(data.stocks);
                    console.log(`Client subscribed to: ${data.stocks.join(', ')}`);
                    break;
                default:
                    console.error('Received unknown message type:', data.type);
            }
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({ error: 'Failed to parse message' }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Broadcast stock updates at regular intervals
setInterval(() => {
  const updatedStocks: { [symbol: string]: number } = {};
  Object.keys(stockListWithInitialPrice).forEach(symbol => {
      const newPrice = generatePrice(symbol);
      updatedStocks[symbol] = parseFloat(newPrice.toFixed(2));
  });

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            const subscribedClient = client as Client;
            const clientData: { [symbol: string]: number } = {};
            subscribedClient.subscribedStocks.forEach(symbol => {
                if (updatedStocks[symbol] !== undefined) {
                    clientData[symbol] = updatedStocks[symbol];
                }
            });

            if (Object.keys(clientData).length > 0) {
                client.send(JSON.stringify({ type: 'update', data: clientData }));
            }
        }
    });
}, UPDATE_INTERVAL);

// Serve static files
app.use(express.static('public'));

// Correctly serve the stock_list.json
app.get('/stock_list.json', (req, res) => {
    const filePath = path.join(__dirname, 'stock_list.json');
    console.log(`Serving stock_list.json from ${filePath}`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Failed to send stock_list.json:', err);
            res.status(500).send('Error serving file.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});


