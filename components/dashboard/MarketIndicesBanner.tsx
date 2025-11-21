'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [selectedIndices, setSelectedIndices] = useState<string[]>(['^TWII', '^DJI', '^IXIC', '^GSPC']);
  const [updateInterval, setUpdateInterval] = useState(5);
  const previousValuesRef = useRef<Map<string, number>>(new Map());

  // Load settings from database
  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          const indicesArray = data.settings.selectedIndices ?
            data.settings.selectedIndices.split(',') :
            ['^TWII', '^DJI', '^IXIC', '^GSPC'];
          setSelectedIndices(indicesArray);
          setUpdateInterval(data.settings.updateInterval || 5);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const fetchIndices = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('/api/indices');
      if (response.ok) {
        const data = await response.json();
        const fetchedIndices = data.indices || [];
        setIndices(fetchedIndices);
        setConnectionStatus(fetchedIndices.length > 0 ? 'connected' : 'disconnected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching market indices:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, updateInterval * 1000);
    return () => clearInterval(interval);
  }, [fetchIndices, updateInterval]);

  // Filter indices based on user settings
  const displayedIndices = indices.filter(idx => selectedIndices.includes(idx.symbol));

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

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '即時';
      case 'disconnected':
        return '斷線';
      case 'connecting':
        return '連線中';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border-b border-gray-200 py-3">
        <div className="flex items-center justify-center h-20">
          <div className="animate-pulse text-sm text-gray-400">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 py-2 px-2">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status */}
        <div className="flex items-center justify-end mb-1 px-1">
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${getConnectionColor()}`} />
            <span className="text-gray-500">{getConnectionText()}</span>
          </div>
        </div>

        {/* Indices Grid - Responsive 2-4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {displayedIndices.slice(0, 4).map((index) => {
            const isPositive = index.change >= 0;
            return (
              <div
                key={index.symbol}
                className={`px-3 py-2 rounded-lg border ${getBackgroundColor(index.change)}`}
              >
                <div className="text-xs font-medium text-gray-700 mb-0.5 truncate">
                  {index.name}
                </div>
                <div className="flex items-baseline justify-between gap-1 mb-0.5">
                  <div className="text-base font-bold text-gray-900">
                    {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-xs font-semibold ${getPriceColor(index.change)} flex items-center`}>
                    <span className="mr-0.5">{isPositive ? '▲' : '▼'}</span>
                  </div>
                </div>
                {/* Show both points and percentage */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold ${getPriceColor(index.change)}`}>
                    {isPositive ? '+' : ''}{index.change.toFixed(2)}
                  </span>
                  <span className={`font-semibold ${getPriceColor(index.change)}`}>
                    {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
