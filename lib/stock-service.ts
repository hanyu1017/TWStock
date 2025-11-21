import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { StockData, MarketIndexData } from './types';
import { fetchStockDataFallback, fetchMultipleStocksFallback } from './stock-fallback';

const execAsync = promisify(exec);

const PYTHON_SCRIPT = path.join(process.cwd(), 'scripts', 'fetch_stock_data.py');
const USE_FALLBACK = process.env.USE_STOCK_FALLBACK === 'true';

/**
 * Convert Taiwan stock code to yfinance symbol
 * @param code Stock code (e.g., "2330")
 * @returns yfinance symbol (e.g., "2330.TW")
 */
export function toYfinanceSymbol(code: string): string {
  // If already has suffix, return as is
  if (code.includes('.')) {
    return code;
  }

  // Add .TW suffix for Taiwan stocks
  return `${code}.TW`;
}

/**
 * Fetch stock data using yfinance with fallback
 * @param symbol Stock symbol (e.g., "2330.TW")
 * @returns Stock data
 */
export async function fetchStockData(symbol: string): Promise<StockData | null> {
  // Try fallback first if enabled
  if (USE_FALLBACK) {
    return fetchStockDataFallback(symbol);
  }

  try {
    const { stdout, stderr } = await execAsync(
      `python3 ${PYTHON_SCRIPT} stock ${symbol}`,
      { timeout: 10000 }
    );

    if (stderr) {
      console.warn(`Python script warning for ${symbol}:`, stderr);
    }

    const data = JSON.parse(stdout);

    if (!data) {
      console.log(`No data from Python, trying fallback for ${symbol}`);
      return fetchStockDataFallback(symbol);
    }

    return {
      ...data,
      lastUpdated: new Date(data.lastUpdated),
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    console.log(`Trying fallback method for ${symbol}`);
    return fetchStockDataFallback(symbol);
  }
}

/**
 * Fetch multiple stocks data with fallback
 * @param symbols Array of stock symbols
 * @returns Array of stock data
 */
export async function fetchMultipleStocks(symbols: string[]): Promise<StockData[]> {
  // Try fallback first if enabled
  if (USE_FALLBACK) {
    return fetchMultipleStocksFallback(symbols);
  }

  try {
    const symbolsStr = symbols.join(' ');
    const { stdout, stderr } = await execAsync(
      `python3 ${PYTHON_SCRIPT} stocks ${symbolsStr}`,
      { timeout: 15000 }
    );

    if (stderr) {
      console.warn('Python script warnings:', stderr);
    }

    const data = JSON.parse(stdout);

    if (!data || data.length === 0) {
      console.log('No data from Python, trying fallback');
      return fetchMultipleStocksFallback(symbols);
    }

    return data.map((item: any) => ({
      ...item,
      lastUpdated: new Date(item.lastUpdated),
    }));
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    console.log('Trying fallback method');
    return fetchMultipleStocksFallback(symbols);
  }
}

/**
 * Fetch market indices (US, Japan, Korea, Taiwan)
 * @returns Array of market index data
 */
export async function fetchMarketIndices(): Promise<MarketIndexData[]> {
  try {
    const { stdout } = await execAsync(`python3 ${PYTHON_SCRIPT} indices`);
    const data = JSON.parse(stdout);

    return data.map((item: any) => ({
      ...item,
      lastUpdated: new Date(item.lastUpdated),
    }));
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return [];
  }
}

/**
 * Search for Taiwan stocks by code or name
 * Includes listed stocks, OTC stocks, ETFs, and warrants
 */
export { searchTaiwanStocks } from './taiwan-stocks-data';
