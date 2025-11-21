import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toYfinanceSymbol } from '@/lib/stock-service';

// GET all portfolios for the current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        dividends: {
          orderBy: { exDate: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return NextResponse.json(
      { error: '獲取投資組合時發生錯誤' },
      { status: 500 }
    );
  }
}

// POST create or update portfolio
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const { symbol, name, quantity, price, type, fee = 0, tax = 0, date, notes, isMarginTrading = false, marginType = null } = await req.json();

    if (!symbol || !quantity || !price || !type) {
      return NextResponse.json(
        { error: '請提供必要的欄位' },
        { status: 400 }
      );
    }

    const yfinanceSymbol = toYfinanceSymbol(symbol);
    const transactionDate = date ? new Date(date) : new Date();
    const totalAmount = type === 'BUY'
      ? quantity * price + fee + tax
      : quantity * price - fee - tax;

    // Find existing portfolio for this stock
    let portfolio = await prisma.portfolio.findFirst({
      where: {
        userId: session.user.id,
        symbol: yfinanceSymbol,
      },
    });

    if (type === 'BUY') {
      if (portfolio) {
        // Update existing portfolio
        const newTotalQuantity = portfolio.quantity + quantity;
        const newTotalCost = portfolio.quantity * portfolio.averagePrice + totalAmount;
        const newAveragePrice = newTotalCost / newTotalQuantity;

        portfolio = await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            quantity: newTotalQuantity,
            averagePrice: newAveragePrice,
            isMarginTrading,
            marginType,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new portfolio
        portfolio = await prisma.portfolio.create({
          data: {
            userId: session.user.id,
            symbol: yfinanceSymbol,
            name: name || symbol,
            quantity,
            averagePrice: totalAmount / quantity,
            notes,
            isMarginTrading,
            marginType,
          },
        });
      }
    } else if (type === 'SELL') {
      if (!portfolio) {
        return NextResponse.json(
          { error: '找不到此股票的持股記錄' },
          { status: 404 }
        );
      }

      if (portfolio.quantity < quantity) {
        return NextResponse.json(
          { error: '賣出數量超過持有數量' },
          { status: 400 }
        );
      }

      // Update portfolio quantity
      const newQuantity = portfolio.quantity - quantity;

      if (newQuantity === 0) {
        // Delete portfolio if quantity becomes 0
        await prisma.portfolio.delete({
          where: { id: portfolio.id },
        });
      } else {
        portfolio = await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        portfolioId: portfolio!.id,
        type,
        symbol: yfinanceSymbol,
        quantity,
        price,
        fee,
        tax,
        totalAmount,
        date: transactionDate,
        notes,
      },
    });

    return NextResponse.json({ portfolio, transaction }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating portfolio:', error);
    return NextResponse.json(
      { error: '操作投資組合時發生錯誤' },
      { status: 500 }
    );
  }
}
