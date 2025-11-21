import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getInstitutionalTradesFromDb } from '@/lib/institutional-service';
import { extractStockCode } from '@/lib/utils';

export async function GET(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    const { symbol } = params;
    const stockCode = extractStockCode(symbol);
    const fullSymbol = `${stockCode}.TW`;

    const trades = await getInstitutionalTradesFromDb(fullSymbol, days);

    // Convert BigInt to strings for JSON serialization
    const serializedTrades = trades.map((trade) => ({
      symbol: trade.symbol,
      date: trade.date,
      foreignInvestor: trade.foreignInvestor.toString(),
      investmentTrust: trade.investmentTrust.toString(),
      dealer: trade.dealer.toString(),
      total: trade.total.toString(),
    }));

    return NextResponse.json({ trades: serializedTrades });
  } catch (error) {
    console.error('Error fetching institutional trades:', error);
    return NextResponse.json(
      { error: '獲取三大法人資料時發生錯誤' },
      { status: 500 }
    );
  }
}
