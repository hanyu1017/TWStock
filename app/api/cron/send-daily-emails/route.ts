import { NextResponse } from 'next/server';
import { sendDailyPortfolioEmailsToAll } from '@/lib/email-service';

export async function GET(req: Request) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    // Send daily emails
    const result = await sendDailyPortfolioEmailsToAll();

    return NextResponse.json({
      message: '每日郵件發送完成',
      success: result.success,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending daily emails:', error);
    return NextResponse.json(
      { error: '發送每日郵件時發生錯誤' },
      { status: 500 }
    );
  }
}
