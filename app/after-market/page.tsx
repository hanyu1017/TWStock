'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
      } else {
        console.error('Failed to fetch institutional data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching institutional data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string) => {
    try {
      const num = BigInt(amount);
      const absNum = num < 0n ? -num : num;
      const millions = Number(absNum) / 1000000;
      const sign = num < 0n ? '-' : '+';
      return `${sign}${millions.toFixed(2)}M`;
    } catch (error) {
      return '0.00M';
    }
  };

  const getAmountColor = (amount: string) => {
    try {
      const num = BigInt(amount);
      // 紅漲綠跌
      if (num > 0n) return 'text-red-600'; // 買超用紅色
      if (num < 0n) return 'text-green-600'; // 賣超用綠色
      return 'text-gray-600';
    } catch (error) {
      return 'text-gray-600';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部導航欄 */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                📊 盤後法人
              </h1>
            </div>
            <button
              onClick={fetchInstitutionalData}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="重新整理"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="p-4">
        <div className="bg-white rounded-lg shadow-sm">
          {/* 標題 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">三大法人買賣超</h2>
              {lastUpdate && (
                <span className="text-xs text-gray-500">
                  {lastUpdate.toLocaleTimeString('zh-TW')}
                </span>
              )}
            </div>
          </div>

          {/* 內容 */}
          {trades.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                目前沒有可用的法人資料
              </p>
              <p className="text-xs text-gray-400 mt-2">
                請確保您已新增持股或關注股票
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {trades.map((trade) => (
                <div key={trade.symbol} className="p-4">
                  {/* 股票資訊 */}
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900">{trade.name}</h3>
                    <p className="text-sm text-gray-500">
                      {trade.symbol.replace('.TW', '')}
                    </p>
                  </div>

                  {/* 法人資料 */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">外資</span>
                      <span className={`font-semibold ${getAmountColor(trade.foreignInvestor)}`}>
                        {formatAmount(trade.foreignInvestor)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">投信</span>
                      <span className={`font-semibold ${getAmountColor(trade.investmentTrust)}`}>
                        {formatAmount(trade.investmentTrust)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">自營商</span>
                      <span className={`font-semibold ${getAmountColor(trade.dealer)}`}>
                        {formatAmount(trade.dealer)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">合計</span>
                      <span className={`font-bold ${getAmountColor(trade.total)}`}>
                        {formatAmount(trade.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 說明 */}
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-2">說明</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">+</span>
              <span>買超 (淨買進)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold">-</span>
              <span>賣超 (淨賣出)</span>
            </div>
            <p className="text-gray-500 mt-2">單位: 百萬股 (M)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
