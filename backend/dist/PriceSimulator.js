"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockListWithInitialPrice = void 0;
const stock_list_json_1 = __importDefault(require("./stock_list.json"));
class PriceSimulator {
    constructor(symbol, initialPrice) {
        this.drift = 0.05;
        this.volatility = 0.2;
        this.timeInterval = 1 / 252;
        this.priceHistory = [];
        this.symbol = symbol;
        this.previousPrice = initialPrice;
    }
    standardNormal() {
        const rand = Math.random();
        return Math.sqrt(-2 * Math.log(rand)) * Math.cos(2 * Math.PI * rand);
    }
    generatePrice() {
        const prevPrice = this.previousPrice;
        const standardNormal = this.standardNormal();
        const priceChange = this.drift * prevPrice * this.timeInterval + this.volatility * prevPrice * Math.sqrt(this.timeInterval) * standardNormal;
        const newPrice = prevPrice + priceChange;
        this.priceHistory.push(newPrice);
        return newPrice;
    }
}
exports.stockListWithInitialPrice = Object.assign({}, stock_list_json_1.default);
const symbols = Object.keys(exports.stockListWithInitialPrice);
const simulatorInstances = symbols.reduce((list, symbol) => {
    list[symbol] = new PriceSimulator(symbol, exports.stockListWithInitialPrice[symbol]);
    return list;
}, {});
function generatePrice(symbol) {
    if (simulatorInstances[symbol]) {
        return simulatorInstances[symbol].generatePrice();
    }
    console.error(`${symbol} not found in list ${symbols.join(',')}`);
    return 0;
}
exports.default = generatePrice;
