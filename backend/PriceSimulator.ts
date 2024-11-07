import Stock_List from './stock_list.json';

class PriceSimulator {
    public symbol: string;
    private previousPrice: number;
    private drift = 0.05;
    private volatility = 0.2;
    private timeInterval = 1/252
    private priceHistory: Array<number> = [];

    constructor(symbol: string, initialPrice: number) {
        this.symbol = symbol;
        this.previousPrice = initialPrice;
    }

    private standardNormal(): number {
        const rand = Math.random();

        return Math.sqrt(-2 * Math.log(rand)) * Math.cos(2 * Math.PI * rand);
    }

    generatePrice(): number {
        const prevPrice = this.previousPrice;
        const standardNormal = this.standardNormal();
        const priceChange = this.drift * prevPrice * this.timeInterval + this.volatility * prevPrice * Math.sqrt(this.timeInterval) * standardNormal;
        const newPrice = prevPrice + priceChange;
        this.priceHistory.push(newPrice);
        return newPrice;
    }
}

export const stockListWithInitialPrice: { [symbol: string]: number } = Object.assign({}, Stock_List);

const symbols = Object.keys(stockListWithInitialPrice);
const simulatorInstances = symbols.reduce((list: { [symbol: string]: PriceSimulator}, symbol: string) => {
    list[symbol] = new PriceSimulator(symbol, stockListWithInitialPrice[symbol]);
    return list;
}, {} as { [symbol: string]: PriceSimulator });

function generatePrice(symbol: string): number {
    if (simulatorInstances[symbol]) {
        return simulatorInstances[symbol].generatePrice();
    }

    console.error(`${symbol} not found in list ${symbols.join(',')}`);

    return 0;
}

export default generatePrice;


