import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { fetchStockData } from './stock-service';

interface PortfolioSummary {
  totalCost: number;
  totalMarketValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  holdings: {
    symbol: string;
    name: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    marketValue: number;
    profitLoss: number;
    profitLossPercent: number;
  }[];
}

/**
 * Create email transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

/**
 * Get portfolio summary for a user
 */
async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
  });

  const holdings = await Promise.all(
    portfolios.map(async (portfolio) => {
      const stockData = await fetchStockData(portfolio.symbol);
      const currentPrice = stockData?.currentPrice || portfolio.averagePrice;
      const marketValue = portfolio.quantity * currentPrice;
      const cost = portfolio.quantity * portfolio.averagePrice;
      const profitLoss = marketValue - cost;
      const profitLossPercent = (profitLoss / cost) * 100;

      return {
        symbol: portfolio.symbol,
        name: portfolio.name,
        quantity: portfolio.quantity,
        averagePrice: portfolio.averagePrice,
        currentPrice,
        marketValue,
        profitLoss,
        profitLossPercent,
      };
    })
  );

  const totalCost = holdings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0);
  const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  const totalProfitLoss = totalMarketValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return {
    totalCost,
    totalMarketValue,
    totalProfitLoss,
    totalProfitLossPercent,
    holdings,
  };
}

/**
 * Generate HTML email template
 */
function generateEmailHTML(
  userName: string,
  summary: PortfolioSummary,
  date: string
): string {
  const profitLossColor = summary.totalProfitLoss >= 0 ? '#22c55e' : '#ef4444';
  const profitLossSign = summary.totalProfitLoss >= 0 ? '+' : '';

  const holdingsRows = summary.holdings
    .map((holding) => {
      const plColor = holding.profitLoss >= 0 ? '#22c55e' : '#ef4444';
      const plSign = holding.profitLoss >= 0 ? '+' : '';

      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${holding.symbol}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${holding.name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${holding.quantity.toFixed(0)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${holding.averagePrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${holding.currentPrice.toFixed(2)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${plColor}; font-weight: 600;">
            ${plSign}$${holding.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <br>
            <span style="font-size: 12px;">(${plSign}${holding.profitLossPercent.toFixed(2)}%)</span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>每日持股報告</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">📊 每日持股報告</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">${date}</p>
      </div>

      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${userName},</p>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">以下是您今天的投資組合狀況：</p>

        <!-- Summary Card -->
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">投資組合總覽</h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">總成本</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600; color: #1f2937;">$${summary.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">市值</p>
              <p style="margin: 5px 0 0 0; font-size: 20px; font-weight: 600; color: #1f2937;">$${summary.totalMarketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div style="grid-column: 1 / -1;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">損益</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: ${profitLossColor};">
                ${profitLossSign}$${summary.totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span style="font-size: 18px;">(${profitLossSign}${summary.totalProfitLossPercent.toFixed(2)}%)</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Holdings Table -->
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">持股明細</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">代號</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">名稱</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">股數</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">均價</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">現價</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">市值</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">損益</th>
              </tr>
            </thead>
            <tbody>
              ${holdingsRows}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>此報告由 TWStock 投資組合追蹤系統自動生成</p>
          <p style="margin-top: 10px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #667eea; text-decoration: none;">查看完整報告</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send daily portfolio email to a user
 */
export async function sendDailyPortfolioEmail(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user || !user.email) {
      console.error('User not found or email not available');
      return false;
    }

    if (user.settings && !user.settings.dailyEmailEnabled) {
      console.log('Daily email disabled for user:', userId);
      return false;
    }

    const summary = await getPortfolioSummary(userId);

    if (summary.holdings.length === 0) {
      console.log('No holdings found for user:', userId);
      return false;
    }

    const date = new Date().toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });

    const html = generateEmailHTML(user.name || user.email, summary, date);

    const transporter = createTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to: user.email,
      subject: `📊 每日持股報告 - ${date}`,
      html,
    });

    console.log('Email sent successfully to:', user.email);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send daily portfolio emails to all users
 */
export async function sendDailyPortfolioEmailsToAll(): Promise<{
  success: number;
  failed: number;
}> {
  try {
    const users = await prisma.user.findMany({
      include: {
        settings: true,
        portfolios: true,
      },
    });

    let success = 0;
    let failed = 0;

    for (const user of users) {
      // Skip users with no portfolios or disabled emails
      if (user.portfolios.length === 0) {
        continue;
      }

      if (user.settings && !user.settings.dailyEmailEnabled) {
        continue;
      }

      const result = await sendDailyPortfolioEmail(user.id);
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return { success, failed };
  } catch (error) {
    console.error('Error sending daily emails:', error);
    return { success: 0, failed: 0 };
  }
}
