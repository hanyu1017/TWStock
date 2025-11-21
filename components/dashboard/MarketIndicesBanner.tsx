'use client';

import { useEffect, useState, useRef } from 'react';

interface MarketIndex {
  symbol: string;
  name: string;
  country: string;
  type?: 'index' | 'futures';
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export default function MarketIndicesBanner() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousValuesRef = useRef<Map<string, number>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchIndices();
    // Refresh every 5 seconds
    const interval = setInterval(fetchIndices, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchIndices = async () => {
    try {
      const response = await fetch('/api/indices');
      if (response.ok) {
        const data = await response.json();
        const fetchedIndices = data.indices || [];
        setIndices(fetchedIndices);
      }
    } catch (error) {
      console.error('Error fetching market indices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 紅漲綠跌顏色
  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // 上漲用紅色
    if (change < 0) return 'text-green-600'; // 下跌用綠色
    return 'text-gray-600';
  };

  const getBackgroundColor = (change: number) => {
    if (change > 0) return 'bg-red-50 border-red-200'; // 上漲背景
    if (change < 0) return 'bg-green-50 border-green-200'; // 下跌背景
    return 'bg-gray-50 border-gray-200';
  };

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200 py-2">
        <div className="flex items-center justify-center h-16">
          <div className="animate-pulse text-sm text-gray-400">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide py-2 px-2 gap-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {indices.map((index) => {
          const isPositive = index.change >= 0;
          return (
            <div
              key={index.symbol}
              className={`flex-shrink-0 px-3 py-2 rounded-lg border ${getBackgroundColor(index.change)} min-w-[140px]`}
            >
              <div className="text-xs font-medium text-gray-700 mb-0.5 truncate">
                {index.name}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm font-bold text-gray-900">
                  {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs font-semibold ${getPriceColor(index.change)} flex items-center`}>
                  <span className="mr-0.5">{isPositive ? '▲' : '▼'}</span>
                  {Math.abs(index.changePercent).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
