import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchMarketIndices } from '@/lib/stock-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // Try to get from cache first
    const cached = await prisma.marketIndex.findMany();

    // If we have cached data less than 1 minute old, return it
    if (cached.length > 0) {
      const oldestUpdate = Math.min(
        ...cached.map((idx) => idx.lastUpdated.getTime())
      );
      const age = Date.now() - oldestUpdate;

      if (age < 60000) {
        // 1 minute
        return NextResponse.json({ indices: cached });
      }
    }

    // Fetch fresh data
    const indices = await fetchMarketIndices();

    // Update cache
    for (const index of indices) {
      await prisma.marketIndex.upsert({
        where: { symbol: index.symbol },
        update: {
          name: index.name,
          country: index.country,
          type: index.type,
          currentValue: index.currentValue,
          previousClose: index.previousClose,
          change: index.change,
          changePercent: index.changePercent,
          lastUpdated: new Date(),
        },
        create: {
          symbol: index.symbol,
          name: index.name,
          country: index.country,
          type: index.type,
          currentValue: index.currentValue,
          previousClose: index.previousClose,
          change: index.change,
          changePercent: index.changePercent,
          lastUpdated: new Date(),
        },
      });
    }

    return NextResponse.json({ indices });
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return NextResponse.json(
      { error: '獲取市場指數時發生錯誤' },
      { status: 500 }
    );
  }
}
