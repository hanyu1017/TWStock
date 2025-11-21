import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchMultipleStocks } from '@/lib/stock-service';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // Get user's watchlist
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
    });

    if (watchlist.length === 0) {
      return NextResponse.json({ prices: [] });
    }

    // Fetch current prices
    const symbols = watchlist.map((item) => item.symbol);
    const stocksData = await fetchMultipleStocks(symbols);

    // Create a map for quick lookup
    const priceMap = new Map(
      stocksData.map((stock) => [
        stock.symbol,
        {
          currentPrice: stock.currentPrice,
          change: stock.change,
          changePercent: stock.changePercent,
        },
      ])
    );

    // Combine watchlist with prices
    const result = watchlist.map((item) => {
      const prices = priceMap.get(item.symbol);
      return {
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        currentPrice: prices?.currentPrice,
        change: prices?.change,
        changePercent: prices?.changePercent,
        notes: item.notes,
      };
    });

    return NextResponse.json({ prices: result });
  } catch (error) {
    console.error('Error fetching watchlist prices:', error);
    return NextResponse.json(
      { error: '獲取關注名單價格時發生錯誤' },
      { status: 500 }
    );
  }
}
