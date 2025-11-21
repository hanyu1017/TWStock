import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET user settings
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    let settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          updateInterval: 5,
          selectedIndices: '^TWII,^DJI,^IXIC,^GSPC',
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: '獲取設定時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST/PUT update user settings
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await req.json();
    const { updateInterval, selectedIndices } = body;

    // Convert array to comma-separated string
    const indicesString = Array.isArray(selectedIndices)
      ? selectedIndices.join(',')
      : selectedIndices;

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        updateInterval: updateInterval || 5,
        selectedIndices: indicesString || '^TWII,^DJI,^IXIC,^GSPC',
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        updateInterval: updateInterval || 5,
        selectedIndices: indicesString || '^TWII,^DJI,^IXIC,^GSPC',
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: '更新設定時發生錯誤' },
      { status: 500 }
    );
  }
}
