import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
  lastUpdated: Date;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice?: number;
  marketValue?: number;
  cost?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  currency: string;
  notes?: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  notes?: string;
}

export interface InstitutionalTradeData {
  symbol: string;
  date: Date;
  foreignInvestor: number;
  investmentTrust: number;
  dealer: number;
  total: number;
}

export interface MarketIndexData {
  symbol: string;
  name: string;
  country: string;
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
}

export interface TransactionData {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  totalAmount: number;
  date: Date;
  notes?: string;
}

export interface AlertData {
  id: string;
  symbol: string;
  name: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  notes?: string;
}
