import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchStockData, toYfinanceSymbol } from '@/lib/stock-service';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { symbol } = params;
    const yfinanceSymbol = toYfinanceSymbol(symbol);

    // Try to get from cache first
    const cached = await prisma.stockPrice.findUnique({
      where: { symbol: yfinanceSymbol },
    });

    // If cache is less than 5 seconds old, return it
    if (cached) {
      const age = Date.now() - cached.lastUpdated.getTime();
      if (age < 5000) {
        return NextResponse.json(cached);
      }
    }

    // Fetch fresh data
    const stockData = await fetchStockData(yfinanceSymbol);

    if (!stockData) {
      return NextResponse.json(
        { error: '找不到股票資料' },
        { status: 404 }
      );
    }

    // Update cache
    const updated = await prisma.stockPrice.upsert({
      where: { symbol: yfinanceSymbol },
      update: {
        name: stockData.name,
        currentPrice: stockData.currentPrice,
        previousClose: stockData.previousClose,
        open: stockData.open,
        high: stockData.high,
        low: stockData.low,
        volume: BigInt(stockData.volume),
        change: stockData.change,
        changePercent: stockData.changePercent,
        marketCap: stockData.marketCap ? BigInt(stockData.marketCap) : null,
        pe: stockData.pe || null,
        dividend: stockData.dividend || null,
        lastUpdated: new Date(),
      },
      create: {
        symbol: yfinanceSymbol,
        name: stockData.name,
        currentPrice: stockData.currentPrice,
        previousClose: stockData.previousClose,
        open: stockData.open,
        high: stockData.high,
        low: stockData.low,
        volume: BigInt(stockData.volume),
        change: stockData.change,
        changePercent: stockData.changePercent,
        marketCap: stockData.marketCap ? BigInt(stockData.marketCap) : null,
        pe: stockData.pe || null,
        dividend: stockData.dividend || null,
        lastUpdated: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      { error: '獲取股票資料時發生錯誤' },
      { status: 500 }
    );
  }
}
