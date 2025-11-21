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

  return (
    <Card>
      <CardHeader>
        <CardTitle>投資組合總覽</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">總成本</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">總市值</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(summary.totalMarketValue)}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">損益</p>
            <div className="flex items-baseline gap-3">
              <p className={`text-3xl font-bold ${colorClass}`}>
                {summary.totalProfitLoss >= 0 ? '+' : ''}
                {formatCurrency(summary.totalProfitLoss)}
              </p>
              <p className={`text-xl font-semibold ${colorClass}`}>
                {formatPercent(summary.totalProfitLossPercent)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
