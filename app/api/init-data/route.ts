import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchMarketIndices } from '@/lib/stock-service';
import { updateInstitutionalTradesInDb } from '@/lib/institutional-service';
import { prisma } from '@/lib/prisma';

/**
 * Initialize or refresh market data
 * This endpoint can be called to populate initial data or refresh all data
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const results = {
      indices: 0,
      institutional: 0,
      errors: [] as string[],
    };

    // Fetch and update market indices
    try {
      const indices = await fetchMarketIndices();

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
        results.indices++;
      }
    } catch (error: any) {
      console.error('Error updating market indices:', error);
      results.errors.push(`Market indices: ${error.message}`);
    }

    // Fetch and update institutional trading data
    try {
      const count = await updateInstitutionalTradesInDb();
      results.institutional = count;
    } catch (error: any) {
      console.error('Error updating institutional trades:', error);
      results.errors.push(`Institutional trades: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: '資料初始化完成',
      results,
    });
  } catch (error) {
    console.error('Error initializing data:', error);
    return NextResponse.json(
      { error: '初始化資料時發生錯誤' },
      { status: 500 }
    );
  }
}

/**
 * Get initialization status
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const indicesCount = await prisma.marketIndex.count();
    const institutionalCount = await prisma.institutionalTrade.count();

    // Get latest update times
    const latestIndex = await prisma.marketIndex.findFirst({
      orderBy: { lastUpdated: 'desc' },
    });

    const latestInstitutional = await prisma.institutionalTrade.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      indices: {
        count: indicesCount,
        lastUpdated: latestIndex?.lastUpdated,
      },
      institutional: {
        count: institutionalCount,
        lastUpdated: latestInstitutional?.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting initialization status:', error);
    return NextResponse.json(
      { error: '獲取初始化狀態時發生錯誤' },
      { status: 500 }
    );
  }
}
