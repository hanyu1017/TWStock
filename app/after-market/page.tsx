'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface InstitutionalTrade {
  symbol: string;
  name: string;
  date: string;
  foreignInvestor: string;
  investmentTrust: string;
  dealer: string;
  total: string;
}

export default function AfterMarketPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trades, setTrades] = useState<InstitutionalTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstitutionalData();
    }
  }, [status]);

  const fetchInstitutionalData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/institutional/portfolio?days=1');
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching institutional data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    const num = BigInt(amount);
    const absNum = num < 0n ? -num : num;

    // Convert to millions (除以一百萬)
    const millions = Number(absNum) / 1000000;
    const sign = num < 0n ? '-' : '+';

    return `${sign}${millions.toFixed(2)}M`;
  };

  const getAmountColor = (amount: string) => {
    const num = BigInt(amount);
    if (num > 0n) return 'text-green-600 dark:text-green-400';
    if (num < 0n) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📊 盤後三大法人
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                查看您持股與關注股票的三大法人買賣超
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={fetchInstitutionalData} variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新整理
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="ghost" size="sm">
                ← 返回儀表板
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>三大法人買賣超統計</CardTitle>
              {lastUpdate && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  更新時間: {lastUpdate.toLocaleString('zh-TW')}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {trades.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                  目前沒有可用的三大法人資料
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  請確保您已新增持股或關注股票
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        股票
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        外資
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        投信
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        自營商
                      </th>
                      <th className="text-right py-4 px-4 font-semibold text-gray-700 dark:text-gray-300">
                        合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade) => (
                      <tr
                        key={trade.symbol}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {trade.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {trade.symbol.replace('.TW', '')}
                            </div>
                          </div>
                        </td>
                        <td className={`text-right py-4 px-4 font-medium ${getAmountColor(trade.foreignInvestor)}`}>
                          {formatAmount(trade.foreignInvestor)}
                        </td>
                        <td className={`text-right py-4 px-4 font-medium ${getAmountColor(trade.investmentTrust)}`}>
                          {formatAmount(trade.investmentTrust)}
                        </td>
                        <td className={`text-right py-4 px-4 font-medium ${getAmountColor(trade.dealer)}`}>
                          {formatAmount(trade.dealer)}
                        </td>
                        <td className={`text-right py-4 px-4 font-bold ${getAmountColor(trade.total)}`}>
                          {formatAmount(trade.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            說明
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">外資:</span> 外國投資人買賣超
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">投信:</span> 投資信託基金買賣超
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">自營商:</span> 證券自營商買賣超
            </div>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">合計:</span> 三大法人買賣超總和
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400 font-bold">+</span>
              <span className="text-gray-600 dark:text-gray-400">買超 (淨買進)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 font-bold">-</span>
              <span className="text-gray-600 dark:text-gray-400">賣超 (淨賣出)</span>
            </div>
            <div className="text-gray-500 dark:text-gray-500">
              單位: 百萬股 (M)
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
