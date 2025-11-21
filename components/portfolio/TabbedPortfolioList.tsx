'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

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
  isMarginTrading?: boolean;
  marginType?: string;
}

export default function TabbedPortfolioList({ refreshTrigger }: { refreshTrigger: number }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'TW' | 'US'>('TW');

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

  // 分類台股和美股
  const twHoldings = holdings.filter(h => h.symbol.includes('.TW') || h.symbol.includes('.TWO'));
  const usHoldings = holdings.filter(h => !h.symbol.includes('.TW') && !h.symbol.includes('.TWO'));

  const currentHoldings = activeTab === 'TW' ? twHoldings : usHoldings;

  // 紅漲綠跌顏色
  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // 上漲用紅色
    if (change < 0) return 'text-green-600'; // 下跌用綠色
    return 'text-gray-600';
  };

  const getBackgroundColor = (change: number) => {
    if (change > 0) return 'bg-red-50 border-l-red-500'; // 上漲背景
    if (change < 0) return 'bg-green-50 border-l-green-500'; // 下跌背景
    return 'bg-gray-50 border-l-gray-300';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* 標籤頁 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('TW')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === 'TW'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>🇹🇼 台股</span>
            {twHoldings.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {twHoldings.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('US')}
          className={`flex-1 py-4 text-center font-semibold transition-colors ${
            activeTab === 'US'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>🇺🇸 美股</span>
            {usHoldings.length > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {usHoldings.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* 持股列表 */}
      <div className="divide-y divide-gray-100">
        {currentHoldings.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">
              {activeTab === 'TW' ? '尚無台股持股' : '尚無美股持股'}
            </p>
          </div>
        ) : (
          currentHoldings.map((holding) => {
            const isProfitable = holding.profitLoss >= 0;
            return (
              <div
                key={holding.id}
                className={`p-4 ${getBackgroundColor(holding.profitLoss)} border-l-4 hover:shadow-sm transition-shadow`}
              >
                {/* 股票名稱和代號 */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">
                        {holding.name}
                      </h3>
                      {holding.isMarginTrading && holding.marginType && (
                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                          holding.marginType === '融資'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {holding.marginType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {holding.symbol.replace('.TW', '').replace('.TWO', '')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900">
                      ${formatNumber(holding.currentPrice, 2)}
                    </div>
                  </div>
                </div>

                {/* 持股資訊 */}
                <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                  <div>
                    <div className="text-gray-500 text-xs">股數</div>
                    <div className="font-medium text-gray-900">
                      {formatNumber(holding.quantity, 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">均價</div>
                    <div className="font-medium text-gray-900">
                      ${formatNumber(holding.averagePrice, 2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">市值</div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(holding.marketValue)}
                    </div>
                  </div>
                </div>

                {/* 損益 */}
                <div className={`flex items-center justify-between p-2 rounded-lg ${
                  isProfitable ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <span className="text-xs text-gray-600 font-medium">損益</span>
                  <div className="text-right">
                    <div className={`font-bold ${getPriceColor(holding.profitLoss)}`}>
                      {holding.profitLoss >= 0 ? '+' : ''}
                      {formatCurrency(holding.profitLoss)}
                    </div>
                    <div className={`text-sm font-semibold ${getPriceColor(holding.profitLoss)}`}>
                      {formatPercent(holding.profitLossPercent)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
