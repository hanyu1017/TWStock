import axios from 'axios';
import { StockData } from './types';

/**
 * Fallback stock data fetcher using Yahoo Finance API directly
 * This is used when Python script fails
 */
export async function fetchStockDataFallback(symbol: string): Promise<StockData | null> {
  try {
    // Yahoo Finance API endpoint
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await axios.get(url, {
      params: {
        range: '1d',
        interval: '1m',
      },
      timeout: 10000,
    });

    const data = response.data;
    const result = data.chart?.result?.[0];

    if (!result) {
      return null;
    }

    const meta = result.meta;
    const quote = result.indicators?.quote?.[0];

    if (!meta) {
      return null;
    }

    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol,
      name: meta.shortName || meta.longName || symbol,
      currentPrice,
      previousClose,
      open: quote?.open?.[quote.open.length - 1] || currentPrice,
      high: quote?.high?.[0] || currentPrice,
      low: quote?.low?.[0] || currentPrice,
      volume: quote?.volume?.reduce((a: number, b: number) => a + b, 0) || 0,
      change,
      changePercent,
      marketCap: meta.marketCap,
      pe: meta.trailingPE,
      dividend: meta.dividendYield,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`Fallback fetch failed for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch multiple stocks using fallback method
 */
export async function fetchMultipleStocksFallback(symbols: string[]): Promise<StockData[]> {
  const promises = symbols.map(symbol => fetchStockDataFallback(symbol));
  const results = await Promise.allSettled(promises);

  return results
    .filter((result): result is PromiseFulfilledResult<StockData> =>
      result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value);
}

/**
 * Get Taiwan stock info from TWSE API
 */
export async function fetchTaiwanStockInfo(stockCode: string): Promise<{
  name: string;
  price: number;
  change: number;
  changePercent: number;
} | null> {
  try {
    // Remove .TW suffix if present
    const code = stockCode.replace('.TW', '').replace('.TWO', '');

    // TWSE API for real-time quote
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp`;

    const response = await axios.get(url, {
      params: {
        ex_ch: `tse_${code}.tw`,
        json: 1,
        delay: 0,
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const data = response.data;
    const stock = data.msgArray?.[0];

    if (!stock) {
      return null;
    }

    const price = parseFloat(stock.z) || 0; // 成交價
    const previousClose = parseFloat(stock.y) || price; // 昨收價
    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      name: stock.n || stock.c,
      price,
      change,
      changePercent,
    };
  } catch (error) {
    console.error(`Error fetching Taiwan stock info for ${stockCode}:`, error);
    return null;
  }
}
