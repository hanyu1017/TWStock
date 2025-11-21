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
        <CardTitle className="flex items-center gap-2">
          📈 持股明細
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            ({holdings.length} 檔)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  股票
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  股數
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  均價
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  現價
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  市值
                </th>
                <th className="text-right py-4 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  損益
                </th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => {
                const colorClass = getPriceChangeColor(holding.profitLoss);
                const isProfitable = holding.profitLoss >= 0;
                return (
                  <tr
                    key={holding.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-12 rounded ${isProfitable ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {holding.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {holding.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatNumber(holding.quantity, 0)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-gray-700 dark:text-gray-300">
                        ${formatNumber(holding.averagePrice, 2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${formatNumber(holding.currentPrice, 2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(holding.marketValue)}
                      </span>
                    </td>
                    <td className={`py-4 px-4 text-right`}>
                      <div className={`inline-flex flex-col items-end p-2 rounded-lg ${
                        isProfitable
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        <div className={`font-bold ${colorClass}`}>
                          {holding.profitLoss >= 0 ? '+' : ''}
                          {formatCurrency(holding.profitLoss)}
                        </div>
                        <div className={`text-sm font-semibold ${colorClass}`}>
                          {formatPercent(holding.profitLossPercent)}
                        </div>
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
