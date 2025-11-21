import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Cache for stock list (refresh every 24 hours)
let stockListCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: Request) {
  try {
    // Check cache
    if (stockListCache && Date.now() - stockListCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ stocks: stockListCache.data });
    }

    // Fetch from TWSE
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_twse_stocks.py');

    try {
      const { stdout } = await execAsync(`python3 ${scriptPath} all`, { timeout: 30000 });
      const stocks = JSON.parse(stdout);

      // Update cache
      stockListCache = {
        data: stocks,
        timestamp: Date.now(),
      };

      return NextResponse.json({ stocks });
    } catch (error) {
      console.error('Error fetching from TWSE, using fallback list:', error);

      // Return fallback list if TWSE fetch fails
      return NextResponse.json({ stocks: [] });
    }
  } catch (error) {
    console.error('Error in stocks list API:', error);
    return NextResponse.json(
      { error: '獲取股票清單時發生錯誤' },
      { status: 500 }
    );
  }
}
