import { NextResponse } from 'next/server';
import { updateInstitutionalTradesInDb } from '@/lib/institutional-service';

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // Update institutional trades
    const count = await updateInstitutionalTradesInDb();

    return NextResponse.json({
      message: '三大法人資料更新成功',
      count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating institutional trades:', error);
    return NextResponse.json(
      { error: '更新三大法人資料時發生錯誤' },
      { status: 500 }
    );
  }
}
