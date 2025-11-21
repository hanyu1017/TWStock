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
  const [currentPage, setCurrentPage] = useState(0);
  const previousValuesRef = useRef<Map<string, number>>(new Map());

  const ITEMS_PER_PAGE = 4;

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

        // Check for value changes and trigger flash animation
        const newFlashingIndices = new Set<string>();
        fetchedIndices.forEach((index: MarketIndex) => {
          const previousValue = previousValuesRef.current.get(index.symbol);
          if (previousValue !== undefined && previousValue !== index.currentValue) {
            newFlashingIndices.add(index.symbol);
          }
          previousValuesRef.current.set(index.symbol, index.currentValue);
        });

        // Trigger flash animation for updated indices
        if (newFlashingIndices.size > 0) {
          const flashElements = document.querySelectorAll('.index-card');
          flashElements.forEach((el) => {
            const symbol = el.getAttribute('data-symbol');
            if (symbol && newFlashingIndices.has(symbol)) {
              el.classList.add('flash-update');
              setTimeout(() => el.classList.remove('flash-update'), 800);
            }
          });
        }

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

  // Filter and sort indices based on user settings
  const displayedIndices = indices
    .filter(idx => selectedIndices.includes(idx.symbol))
    .sort((a, b) => {
      // Sort by the order in selectedIndices array
      const aIndex = selectedIndices.indexOf(a.symbol);
      const bIndex = selectedIndices.indexOf(b.symbol);
      return aIndex - bIndex;
    });

  // Pagination
  const totalPages = Math.ceil(displayedIndices.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentIndices = displayedIndices.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  // 紅漲綠跌顏色
  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-red-600'; // 上漲用紅色
    if (change < 0) return 'text-green-600'; // 下跌用綠色
    return 'text-gray-600';
  };

  const getBackgroundColor = (change: number) => {
    if (change > 0) return 'bg-red-900/20 border-red-700'; // 上漲背景
    if (change < 0) return 'bg-green-900/20 border-green-700'; // 下跌背景
    return 'bg-slate-700 border-slate-600';
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
      <div className="bg-slate-800 border-b border-slate-700 py-3">
        <div className="flex items-center justify-center h-20">
          <div className="animate-pulse text-sm text-slate-400">載入中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700 py-2 px-2">
      <div className="max-w-7xl mx-auto">
        {/* Connection Status and Pagination */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className={`p-1 rounded transition-colors ${
                    currentPage === 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  aria-label="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-slate-400">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                  className={`p-1 rounded transition-colors ${
                    currentPage === totalPages - 1
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                  aria-label="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${getConnectionColor()}`} />
            <span className="text-slate-400">{getConnectionText()}</span>
          </div>
        </div>

        {/* Indices Grid - Responsive 2-4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {currentIndices.map((index) => {
            const isPositive = index.change >= 0;
            return (
              <div
                key={index.symbol}
                data-symbol={index.symbol}
                className={`index-card px-3 py-2 rounded-lg border ${getBackgroundColor(index.change)} transition-all duration-200`}
              >
                <div className="text-xs font-medium text-slate-300 mb-0.5 truncate">
                  {index.name}
                </div>
                <div className="flex items-baseline justify-between gap-1 mb-0.5">
                  <div className="text-base font-bold text-white">
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
