import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '1');

    // Get user's portfolio stocks
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      select: { symbol: true, name: true },
    });

    // Get user's watchlist stocks
    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      select: { symbol: true, name: true },
    });

    // Combine and deduplicate symbols
    const allStocks = [...portfolio, ...watchlist];
    const uniqueStocks = Array.from(
      new Map(allStocks.map((s) => [s.symbol, s])).values()
    );

    // If no stocks, return empty array
    if (uniqueStocks.length === 0) {
      return NextResponse.json({ trades: [] });
    }

    // Get institutional trades for all stocks
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trades = await prisma.institutionalTrade.findMany({
      where: {
        symbol: {
          in: uniqueStocks.map((s) => s.symbol),
        },
        date: {
          gte: startDate,
        },
      },
      orderBy: [{ date: 'desc' }, { total: 'desc' }],
    });

    // Group by stock and get latest trade
    const latestTrades = new Map();
    trades.forEach((trade) => {
      if (!latestTrades.has(trade.symbol)) {
        latestTrades.set(trade.symbol, trade);
      }
    });

    // Combine with stock info
    const result = uniqueStocks
      .map((stock) => {
        const trade = latestTrades.get(stock.symbol);
        if (!trade) return null;

        return {
          symbol: stock.symbol,
          name: stock.name,
          date: trade.date,
          foreignInvestor: trade.foreignInvestor.toString(),
          investmentTrust: trade.investmentTrust.toString(),
          dealer: trade.dealer.toString(),
          total: trade.total.toString(),
        };
      })
      .filter((item) => item !== null)
      .sort((a, b) => {
        const aTotal = BigInt(a!.total);
        const bTotal = BigInt(b!.total);
        if (aTotal > bTotal) return -1;
        if (aTotal < bTotal) return 1;
        return 0;
      });

    return NextResponse.json({ trades: result });
  } catch (error) {
    console.error('Error fetching portfolio institutional trades:', error);
    return NextResponse.json(
      { error: '獲取三大法人資料時發生錯誤' },
      { status: 500 }
    );
  }
}
