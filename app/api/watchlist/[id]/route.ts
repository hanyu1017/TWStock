import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE from watchlist
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { error: '找不到此關注名單項目' },
        { status: 404 }
      );
    }

    await prisma.watchlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: '已從關注名單移除' });
  } catch (error) {
    console.error('Error deleting from watchlist:', error);
    return NextResponse.json(
      { error: '從關注名單移除時發生錯誤' },
      { status: 500 }
    );
  }
}

// PATCH update watchlist item
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { notes, order } = await req.json();

    const watchlistItem = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!watchlistItem) {
      return NextResponse.json(
        { error: '找不到此關注名單項目' },
        { status: 404 }
      );
    }

    const updated = await prisma.watchlist.update({
      where: { id: params.id },
      data: {
        notes: notes !== undefined ? notes : watchlistItem.notes,
        order: order !== undefined ? order : watchlistItem.order,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ watchlist: updated });
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return NextResponse.json(
      { error: '更新關注名單時發生錯誤' },
      { status: 500 }
    );
  }
}
