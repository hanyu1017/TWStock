import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fetchMultipleStocks } from '@/lib/stock-service';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: '請提供股票代碼陣列' },
        { status: 400 }
      );
    }

    const stocksData = await fetchMultipleStocks(symbols);

    return NextResponse.json({ stocks: stocksData });
  } catch (error) {
    console.error('Error fetching multiple stocks:', error);
    return NextResponse.json(
      { error: '獲取股票資料時發生錯誤' },
      { status: 500 }
    );
  }
}
