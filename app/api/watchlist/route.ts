import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toYfinanceSymbol, fetchMultipleStocks } from '@/lib/stock-service';

// Helper function to generate mock OHLC data for mini K-line chart
function generateMockOHLC(stockData: any) {
  const currentPrice = stockData.currentPrice || 100;
  const volatility = currentPrice * 0.02; // 2% volatility
  const ohlcData = [];

  // Generate 5 days of mock data
  for (let i = 4; i >= 0; i--) {
    const dayVariation = (Math.random() - 0.5) * volatility;
    const basePrice = currentPrice - dayVariation * i;

    const open = basePrice + (Math.random() - 0.5) * volatility;
    const close = basePrice + (Math.random() - 0.5) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    ohlcData.push({
      open: Math.max(0, open),
      high: Math.max(0, high),
      low: Math.max(0, low),
      close: Math.max(0, close),
    });
  }

  return ohlcData;
}

// GET all watchlist items for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { order: 'asc' },
    });

    // Fetch current prices for all watchlist items
    if (watchlist.length > 0) {
      try {
        const symbols = watchlist.map(item => item.symbol);
        const stockDataList = await fetchMultipleStocks(symbols);

        // Create a map of symbol to stock data
        const stockDataMap = new Map(
          stockDataList.map(data => [data.symbol, data])
        );

        // Merge stock data with watchlist items
        const enrichedWatchlist = watchlist.map(item => {
          const stockData = stockDataMap.get(item.symbol);

          // Generate simple OHLC data for mini K-line chart (last 5 days mock data)
          const ohlcData = stockData ? generateMockOHLC(stockData) : [];

          return {
            ...item,
            currentPrice: stockData?.currentPrice || null,
            change: stockData?.change || null,
            changePercent: stockData?.changePercent || null,
            ohlcData,
          };
        });

        return NextResponse.json({ watchlist: enrichedWatchlist });
      } catch (priceError) {
        console.error('Error fetching stock prices:', priceError);
        // Return watchlist without prices if fetching fails
        return NextResponse.json({ watchlist });
      }
    }

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: '獲取關注名單時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST add to watchlist
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { symbol, name, notes } = await req.json();

    if (!symbol || !name) {
      return NextResponse.json(
        { error: '請提供股票代碼和名稱' },
        { status: 400 }
      );
    }

    const yfinanceSymbol = toYfinanceSymbol(symbol);

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: yfinanceSymbol,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: '此股票已在關注名單中' },
        { status: 400 }
      );
    }

    // Get the highest order number
    const maxOrder = await prisma.watchlist.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        symbol: yfinanceSymbol,
        name,
        notes,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ watchlist: watchlistItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: '加入關注名單時發生錯誤' },
      { status: 500 }
    );
  }
}
