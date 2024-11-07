"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = __importStar(require("ws"));
const PriceSimulator_1 = __importDefault(require("./PriceSimulator"));
const PriceSimulator_2 = require("./PriceSimulator");
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
app.use((0, cors_1.default)());
app.get('/', (req, res) => {
    res.send('Welcome to the Real-Time Stock Price Streaming Application!');
});
const PORT = 8080;
const UPDATE_INTERVAL = 25; // in milliseconds
wss.on('connection', (ws) => {
    const client = ws;
    client.subscribedStocks = new Set();
    console.log('New client connected');
    ws.on('message', (message) => {
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
        }
        catch (error) {
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
    const updatedStocks = {};
    Object.keys(PriceSimulator_2.stockListWithInitialPrice).forEach(symbol => {
        const newPrice = (0, PriceSimulator_1.default)(symbol);
        updatedStocks[symbol] = parseFloat(newPrice.toFixed(2));
    });
    wss.clients.forEach(client => {
        if (client.readyState === ws_1.default.OPEN) {
            const subscribedClient = client;
            const clientData = {};
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
app.use(express_1.default.static('public'));
// Correctly serve the stock_list.json
app.get('/stock_list.json', (req, res) => {
    const filePath = path_1.default.join(__dirname, 'stock_list.json');
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
