'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatPercent, getPriceChangeColor } from '@/lib/utils';

interface Summary {
  totalCost: number;
  totalMarketValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
}

export default function PortfolioSummary({ refreshTrigger }: { refreshTrigger: number }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
    // Refresh every 5 seconds
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/portfolio/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return null;
  }

  const colorClass = getPriceChangeColor(summary.totalProfitLoss);
  const isProfitable = summary.totalProfitLoss >= 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
        <CardTitle className="flex items-center gap-2">
          💼 投資組合總覽
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Cost */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">總成本</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalCost)}
            </p>
          </div>

          {/* Total Market Value */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">總市值</p>
            </div>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(summary.totalMarketValue)}
            </p>
          </div>

          {/* Profit/Loss */}
          <div className={`p-4 rounded-lg border-2 ${
            isProfitable
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700'
              : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-300 dark:border-red-700'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {isProfitable ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              )}
              <p className={`text-sm font-semibold ${
                isProfitable
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {isProfitable ? '總獲利' : '總虧損'}
              </p>
            </div>
            <div className="space-y-1">
              <p className={`text-2xl font-bold ${colorClass}`}>
                {summary.totalProfitLoss >= 0 ? '+' : ''}
                {formatCurrency(summary.totalProfitLoss)}
              </p>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-semibold ${colorClass}`}>
                  {formatPercent(summary.totalProfitLossPercent)}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  isProfitable
                    ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200'
                }`}>
                  {isProfitable ? '獲利中' : '虧損中'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
