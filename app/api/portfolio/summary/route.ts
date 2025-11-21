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

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
    });

    if (portfolios.length === 0) {
      return NextResponse.json({
        totalCost: 0,
        totalMarketValue: 0,
        totalProfitLoss: 0,
        totalProfitLossPercent: 0,
        holdings: [],
      });
    }

    // Fetch current prices for all stocks
    const symbols = portfolios.map((p) => p.symbol);
    const stocksData = await fetchMultipleStocks(symbols);

    // Create a map for quick lookup
    const priceMap = new Map(
      stocksData.map((stock) => [stock.symbol, stock.currentPrice])
    );

    // Calculate holdings with current prices
    const holdings = portfolios.map((portfolio) => {
      const currentPrice = priceMap.get(portfolio.symbol) || portfolio.averagePrice;
      const cost = portfolio.quantity * portfolio.averagePrice;
      const marketValue = portfolio.quantity * currentPrice;
      const profitLoss = marketValue - cost;
      const profitLossPercent = cost > 0 ? (profitLoss / cost) * 100 : 0;

      return {
        id: portfolio.id,
        symbol: portfolio.symbol,
        name: portfolio.name,
        quantity: portfolio.quantity,
        averagePrice: portfolio.averagePrice,
        currentPrice,
        cost,
        marketValue,
        profitLoss,
        profitLossPercent,
        currency: portfolio.currency,
        notes: portfolio.notes,
      };
    });

    // Calculate totals
    const totalCost = holdings.reduce((sum, h) => sum + h.cost, 0);
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalProfitLoss = totalMarketValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return NextResponse.json({
      totalCost,
      totalMarketValue,
      totalProfitLoss,
      totalProfitLossPercent,
      holdings,
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    return NextResponse.json(
      { error: '獲取投資組合摘要時發生錯誤' },
      { status: 500 }
    );
  }
}
