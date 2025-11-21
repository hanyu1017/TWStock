import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { InstitutionalTradeData } from './types';
import { prisma } from './prisma';

const execAsync = promisify(exec);

const PYTHON_SCRIPT = path.join(
  process.cwd(),
  'scripts',
  'fetch_institutional_trades.py'
);

/**
 * Fetch institutional trading data for all stocks
 * @param date Date in YYYYMMDD format (optional)
 * @returns Array of institutional trading data
 */
export async function fetchAllInstitutionalTrades(
  date?: string
): Promise<InstitutionalTradeData[]> {
  try {
    const dateParam = date ? ` ${date}` : '';
    const { stdout } = await execAsync(`python3 ${PYTHON_SCRIPT} all${dateParam}`);
    const data = JSON.parse(stdout);

    return data.map((item: any) => ({
      symbol: item.symbol,
      date: new Date(item.date),
      foreignInvestor: BigInt(item.foreignInvestor),
      investmentTrust: BigInt(item.investmentTrust),
      dealer: BigInt(item.dealer),
      total: BigInt(item.total),
    }));
  } catch (error) {
    console.error('Error fetching institutional trades:', error);
    return [];
  }
}

/**
 * Fetch institutional trading data for a specific stock
 * @param stockCode Stock code (e.g., "2330")
 * @param date Date in YYYYMMDD format (optional)
 * @returns Institutional trading data
 */
export async function fetchInstitutionalTradeForStock(
  stockCode: string,
  date?: string
): Promise<InstitutionalTradeData | null> {
  try {
    const dateParam = date ? ` ${date}` : '';
    const { stdout } = await execAsync(
      `python3 ${PYTHON_SCRIPT} stock ${stockCode}${dateParam}`
    );
    const data = JSON.parse(stdout);

    if (!data) {
      return null;
    }

    return {
      symbol: data.symbol,
      date: new Date(data.date),
      foreignInvestor: BigInt(data.foreignInvestor),
      investmentTrust: BigInt(data.investmentTrust),
      dealer: BigInt(data.dealer),
      total: BigInt(data.total),
    };
  } catch (error) {
    console.error(`Error fetching institutional trade for ${stockCode}:`, error);
    return null;
  }
}

/**
 * Update institutional trading data in database
 * @param date Date in YYYYMMDD format (optional)
 */
export async function updateInstitutionalTradesInDb(date?: string): Promise<number> {
  try {
    const trades = await fetchAllInstitutionalTrades(date);

    let count = 0;
    for (const trade of trades) {
      await prisma.institutionalTrade.upsert({
        where: {
          symbol_date: {
            symbol: trade.symbol,
            date: trade.date,
          },
        },
        update: {
          foreignInvestor: trade.foreignInvestor,
          investmentTrust: trade.investmentTrust,
          dealer: trade.dealer,
          total: trade.total,
          updatedAt: new Date(),
        },
        create: {
          symbol: trade.symbol,
          date: trade.date,
          foreignInvestor: trade.foreignInvestor,
          investmentTrust: trade.investmentTrust,
          dealer: trade.dealer,
          total: trade.total,
        },
      });
      count++;
    }

    return count;
  } catch (error) {
    console.error('Error updating institutional trades in database:', error);
    return 0;
  }
}

/**
 * Get institutional trading data from database
 * @param symbol Stock symbol
 * @param days Number of days to fetch (default: 30)
 * @returns Array of institutional trading data
 */
export async function getInstitutionalTradesFromDb(
  symbol: string,
  days: number = 30
): Promise<InstitutionalTradeData[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trades = await prisma.institutionalTrade.findMany({
      where: {
        symbol,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return trades.map((trade) => ({
      symbol: trade.symbol,
      date: trade.date,
      foreignInvestor: trade.foreignInvestor,
      investmentTrust: trade.investmentTrust,
      dealer: trade.dealer,
      total: trade.total,
    }));
  } catch (error) {
    console.error('Error fetching institutional trades from database:', error);
    return [];
  }
}
