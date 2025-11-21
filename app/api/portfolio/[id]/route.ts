import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET single portfolio
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { id } = await params;
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
        dividends: {
          orderBy: { exDate: 'desc' },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: '找不到投資組合' },
        { status: 404 }
      );
    }

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: '獲取投資組合時發生錯誤' },
      { status: 500 }
    );
  }
}

// DELETE portfolio
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { id } = await params;
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: '找不到投資組合' },
        { status: 404 }
      );
    }

    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({ message: '投資組合已刪除' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return NextResponse.json(
      { error: '刪除投資組合時發生錯誤' },
      { status: 500 }
    );
  }
}

// PATCH update portfolio
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { notes } = await req.json();
    const { id } = await params;

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { error: '找不到投資組合' },
        { status: 404 }
      );
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data: {
        notes,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ portfolio: updated });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return NextResponse.json(
      { error: '更新投資組合時發生錯誤' },
      { status: 500 }
    );
  }
}
