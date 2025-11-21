import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Cache for stock list
let stockListCache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getAllStocks() {
  // Check cache
  if (stockListCache && Date.now() - stockListCache.timestamp < CACHE_DURATION) {
    return stockListCache.data;
  }

  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_twse_stocks.py');
    const { stdout } = await execAsync(`python3 ${scriptPath} all`, { timeout: 30000 });
    const stocks = JSON.parse(stdout);

    // Update cache
    stockListCache = {
      data: stocks,
      timestamp: Date.now(),
    };

    return stocks;
  } catch (error) {
    console.error('Error fetching stock list:', error);
    // Return cached data if available, even if expired
    return stockListCache?.data || [];
  }
}

function searchStocks(stocks: any[], query: string, limit: number = 20) {
  const lowerQuery = query.toLowerCase().trim();

  // Find matches
  const matches = stocks.filter(stock =>
    stock.code.includes(lowerQuery) || stock.name.toLowerCase().includes(lowerQuery)
  );

  // Sort by relevance
  matches.sort((a, b) => {
    const aCode = a.code.toLowerCase();
    const bCode = b.code.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // Exact code match
    if (aCode === lowerQuery) return -1;
    if (bCode === lowerQuery) return 1;

    // Code starts with query
    if (aCode.startsWith(lowerQuery) && !bCode.startsWith(lowerQuery)) return -1;
    if (bCode.startsWith(lowerQuery) && !aCode.startsWith(lowerQuery)) return 1;

    // Name starts with query
    if (aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
    if (bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;

    // Alphabetical
    return aCode.localeCompare(bCode);
  });

  return matches.slice(0, limit);
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const allStocks = await getAllStocks();
    const results = searchStocks(allStocks, query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      { error: '搜尋股票時發生錯誤' },
      { status: 500 }
    );
  }
}
