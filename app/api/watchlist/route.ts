import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toYfinanceSymbol } from '@/lib/stock-service';

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
