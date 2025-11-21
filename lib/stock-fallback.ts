import axios from 'axios';
import { StockData, MarketIndexData } from './types';

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
 * Fetch market indices using Node.js fallback with OHLC data
 */
export async function fetchMarketIndicesFallback(): Promise<MarketIndexData[]> {
  const indices = {
    // Cash Indices
    '^TWII': { name: '加權指數', country: 'TW', type: 'index' as const },
    '^DJI': { name: '道瓊指數', country: 'US', type: 'index' as const },
    '^IXIC': { name: '那斯達克', country: 'US', type: 'index' as const },
    '^GSPC': { name: 'S&P 500', country: 'US', type: 'index' as const },
    '^N225': { name: '日經指數', country: 'JP', type: 'index' as const },
    '^KS11': { name: '韓國綜合', country: 'KR', type: 'index' as const },
    // Futures
    'ES=F': { name: 'S&P期貨', country: 'US', type: 'futures' as const },
    'NQ=F': { name: '那指期貨', country: 'US', type: 'futures' as const },
    'YM=F': { name: '道瓊期貨', country: 'US', type: 'futures' as const },
    'NKD=F': { name: '日經期貨', country: 'JP', type: 'futures' as const },
  };

  const results: MarketIndexData[] = [];

  for (const [symbol, info] of Object.entries(indices)) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await axios.get(url, {
        params: { range: '2d', interval: '1d' },
        timeout: 10000,
      });

      const result = response.data.chart?.result?.[0];
      if (!result) continue;

      const meta = result.meta;
      const quotes = result.indicators?.quote?.[0];
      const timestamps = result.timestamp;

      if (!meta || !quotes || !timestamps || timestamps.length < 2) continue;

      // Get latest candle OHLC data
      const latestIndex = quotes.close.length - 1;
      const close = quotes.close[latestIndex];
      const open = quotes.open[latestIndex];
      const high = quotes.high[latestIndex];
      const low = quotes.low[latestIndex];
      const previous = quotes.close[latestIndex - 1];

      if (!close || !previous) continue;

      const currentValue = close;
      const previousClose = previous;
      const change = currentValue - previousClose;
      const changePercent = (change / previousClose) * 100;

      results.push({
        symbol,
        name: info.name,
        country: info.country,
        type: info.type,
        currentValue,
        previousClose,
        change,
        changePercent,
        lastUpdated: new Date(),
        // Add OHLC data for K-bar
        ohlc: {
          open: open || close,
          high: high || close,
          low: low || close,
          close,
        },
      });
    } catch (error) {
      console.error(`Error fetching index ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Fetch all Taiwan stocks from TWSE using Node.js
 */
export async function fetchTaiwanStocksFallback(): Promise<Array<{
  code: string;
  name: string;
  type: 'stock' | 'etf';
  market: 'TWSE' | 'TPEX';
}>> {
  const stocks: Array<{ code: string; name: string; type: 'stock' | 'etf'; market: 'TWSE' | 'TPEX' }> = [];

  try {
    // Fetch TWSE (上市) stocks
    const twseUrl = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=2';
    const twseResponse = await axios.get(twseUrl, {
      timeout: 15000,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    // Decode Big5 to UTF-8
    const decoder = new TextDecoder('big5');
    const html = decoder.decode(twseResponse.data);

    // Parse HTML
    const lines = html.split('\n');
    for (const line of lines) {
      if (line.includes('<td') && (line.includes('股票') || line.includes('ETF'))) {
        const parts = line.split('</td>');
        if (parts.length >= 2) {
          let codeNamePart = parts[0]
            .replace(/<td[^>]*>/g, '')
            .replace(/<[^>]*>/g, '')
            .trim();

          // Split by full-width space or regular space
          const splitChar = codeNamePart.includes('\u3000') ? '\u3000' : ' ';
          const splitParts = codeNamePart.split(splitChar);

          if (splitParts.length >= 2) {
            const code = splitParts[0].trim();
            const name = splitParts.slice(1).join(' ').trim();

            // Only include 4-digit codes
            if (code.match(/^\d{4,5}[A-Z]?$/)) {
              const type = line.includes('ETF') ? 'etf' : 'stock';
              stocks.push({ code, name, type, market: 'TWSE' });
            }
          }
        }
      }
    }

    // Fetch TPEX (上櫃) stocks
    const tpexUrl = 'https://isin.twse.com.tw/isin/C_public.jsp?strMode=4';
    const tpexResponse = await axios.get(tpexUrl, {
      timeout: 15000,
      responseType: 'arraybuffer',
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const tpexHtml = decoder.decode(tpexResponse.data);
    const tpexLines = tpexHtml.split('\n');

    for (const line of tpexLines) {
      if (line.includes('<td') && line.includes('股票')) {
        const parts = line.split('</td>');
        if (parts.length >= 2) {
          let codeNamePart = parts[0]
            .replace(/<td[^>]*>/g, '')
            .replace(/<[^>]*>/g, '')
            .trim();

          const splitChar = codeNamePart.includes('\u3000') ? '\u3000' : ' ';
          const splitParts = codeNamePart.split(splitChar);

          if (splitParts.length >= 2) {
            const code = splitParts[0].trim();
            const name = splitParts.slice(1).join(' ').trim();

            if (code.match(/^\d{4,5}$/)) {
              stocks.push({ code, name, type: 'stock', market: 'TPEX' });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching Taiwan stocks fallback:', error);
  }

  return stocks;
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
