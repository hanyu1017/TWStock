'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCurrency, formatNumber, formatPercent, getPriceChangeColor } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  cost: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export default function PortfolioList({ refreshTrigger }: { refreshTrigger: number }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHoldings();
    // Refresh every 5 seconds
    const interval = setInterval(fetchHoldings, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchHoldings = async () => {
    try {
      const response = await fetch('/api/portfolio/summary');
      if (response.ok) {
        const data = await response.json();
        setHoldings(data.holdings || []);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>持股明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>持股明細</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              尚無持股
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              點擊右上角的「新增股票」按鈕開始記錄您的投資
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>持股明細</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  股票
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  股數
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  均價
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  現價
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  市值
                </th>
                <th className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                  損益
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const colorClass = getPriceChangeColor(holding.profitLoss);
                return (
                  <tr
                    key={holding.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {holding.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {holding.symbol}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-white">
                      {formatNumber(holding.quantity, 0)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-white">
                      ${formatNumber(holding.averagePrice, 2)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-white">
                      ${formatNumber(holding.currentPrice, 2)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-900 dark:text-white">
                      {formatCurrency(holding.marketValue)}
                    </td>
                    <td className={`py-3 px-2 text-right font-semibold ${colorClass}`}>
                      <div>
                        {holding.profitLoss >= 0 ? '+' : ''}
                        {formatCurrency(holding.profitLoss)}
                      </div>
                      <div className="text-sm">
                        {formatPercent(holding.profitLossPercent)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
