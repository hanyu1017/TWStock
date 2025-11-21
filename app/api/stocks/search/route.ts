import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchTaiwanStocks } from '@/lib/stock-service';

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

    const results = searchTaiwanStocks(query);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      { error: '搜尋股票時發生錯誤' },
      { status: 500 }
    );
  }
}
