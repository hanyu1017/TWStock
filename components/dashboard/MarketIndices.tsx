'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import SettingsModal from '@/components/modals/SettingsModal';

interface MarketIndex {
  symbol: string;
  name: string;
  country: string;
  type?: 'index' | 'futures';
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  history?: number[]; // Intraday history
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

interface CandleData {
  open: number;
  high: number;
  low: number;
  close: number;
}

const DEFAULT_SETTINGS = {
  updateInterval: 5,
  selectedIndices: ['^TWII', '^DJI', '^IXIC', '^GSPC', '^N225', '^KS11', 'ES=F', 'NQ=F', 'YM=F', 'NKD=F'],
};

export default function MarketIndices({ refreshTrigger }: { refreshTrigger: number }) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [flashingIndices, setFlashingIndices] = useState<Set<string>>(new Set());
  const previousValuesRef = useRef<Map<string, number>>(new Map());
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('marketIndexSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setCountdown(parsed.updateInterval);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchIndices();
    // Refresh based on user settings
    const interval = setInterval(fetchIndices, settings.updateInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshTrigger, settings.updateInterval]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return settings.updateInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [settings.updateInterval]);

  // Reset countdown when data updates
  useEffect(() => {
    if (lastUpdate) {
      setCountdown(settings.updateInterval);
    }
  }, [lastUpdate, settings.updateInterval]);

  const fetchIndices = async () => {
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

        if (newFlashingIndices.size > 0) {
          setFlashingIndices(newFlashingIndices);
          // Clear flashing after animation
          setTimeout(() => setFlashingIndices(new Set()), 1000);
        }

        setIndices(fetchedIndices);

        // If no indices returned, try to initialize data
        if (fetchedIndices.length === 0 && !isLoading) {
          console.log('No indices found, attempting to initialize...');
          try {
            const initResponse = await fetch('/api/init-data', { method: 'POST' });
            if (initResponse.ok) {
              console.log('Data initialized, retrying fetch...');
              setTimeout(fetchIndices, 2000);
            }
          } catch (initError) {
            console.error('Error initializing data:', initError);
          }
        }

        setConnectionStatus(fetchedIndices.length > 0 ? 'connected' : 'disconnected');
        setLastUpdate(new Date());
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error fetching market indices:', error);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
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
        return '即時連線';
      case 'disconnected':
        return '連線中斷';
      case 'connecting':
        return '連線中...';
    }
  };

  const handleSaveSettings = (newSettings: { updateInterval: number; selectedIndices: string[] }) => {
    setSettings(newSettings);
    setCountdown(newSettings.updateInterval);
    localStorage.setItem('marketIndexSettings', JSON.stringify(newSettings));
  };

  // Render single candlestick chart (K線圖) with real OHLC data
  const renderCandlestickChart = (index: MarketIndex) => {
    // Use real OHLC data if available
    if (!index.ohlc) return null;

    const { open, high, low, close } = index.ohlc;
    const range = high - low;
    const width = 40;
    const height = 32;
    const candleWidth = 24;

    if (range === 0) return null;

    const x = (width - candleWidth) / 2;
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);

    const highY = height - ((high - low) / range) * height;
    const lowY = height;
    const bodyTopY = height - ((bodyTop - low) / range) * height;
    const bodyBottomY = height - ((bodyBottom - low) / range) * height;

    // 紅漲綠跌 (台灣習慣)
    const isRising = close >= open;
    const color = isRising ? '#ef4444' : '#22c55e'; // 紅色上漲，綠色下跌

    return (
      <svg width={width} height={height} className="inline-block">
        <g>
          {/* 上下影線 */}
          <line
            x1={x + candleWidth / 2}
            y1={highY}
            x2={x + candleWidth / 2}
            y2={lowY}
            stroke={color}
            strokeWidth="2"
          />
          {/* K線實體 */}
          <rect
            x={x}
            y={bodyTopY}
            width={candleWidth}
            height={Math.max(bodyBottomY - bodyTopY, 2)}
            fill={color}
            opacity="0.9"
          />
        </g>
      </svg>
    );
  };

  // 紅漲綠跌顏色
  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-red-600 dark:text-red-400'; // 上漲用紅色
    if (change < 0) return 'text-green-600 dark:text-green-400'; // 下跌用綠色
    return 'text-gray-600 dark:text-gray-400';
  };

  // Filter indices based on user settings
  const filteredIndices = indices.filter(idx => settings.selectedIndices.includes(idx.symbol));

  // Group indices by type and prioritize US indices
  const usIndices = filteredIndices.filter(idx =>
    idx.country === 'US' && (idx.type === 'index' || !idx.type)
  );
  const otherCashIndices = filteredIndices.filter(idx =>
    idx.country !== 'US' && (idx.type === 'index' || !idx.type)
  );
  const futuresIndices = filteredIndices.filter(idx => idx.type === 'futures');

  // Combine with US indices first
  const cashIndices = [...usIndices, ...otherCashIndices];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>全球市場</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🌍 全球市場
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
              <span className="text-gray-600 dark:text-gray-400">{getConnectionText()}</span>
            </div>
            {connectionStatus === 'connected' && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className={`font-mono font-bold ${countdown <= 2 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {countdown}s
                </span>
              </div>
            )}
            {lastUpdate && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                更新: {lastUpdate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="設定"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cash Indices */}
          {cashIndices.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                現貨指數
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {cashIndices.map((index) => (
                  <div
                    key={index.symbol}
                    className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700 ${
                      flashingIndices.has(index.symbol) ? 'animate-pulse ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {index.name}
                    </div>
                    <div className="font-bold text-base mb-1">
                      {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-xs font-medium ${getPriceColor(index.change)}`}>
                        {index.change >= 0 ? '+' : ''}
                        {index.change.toFixed(2)}
                        <span className="ml-1">
                          ({index.change >= 0 ? '+' : ''}
                          {index.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {renderCandlestickChart(index)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Futures */}
          {futuresIndices.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                期貨指數
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {futuresIndices.map((index) => (
                  <div
                    key={index.symbol}
                    className={`p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all border border-blue-200 dark:border-blue-800 ${
                      flashingIndices.has(index.symbol) ? 'animate-pulse ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        {index.name}
                      </div>
                      <div className="text-xs px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-semibold">
                        期貨
                      </div>
                    </div>
                    <div className="font-bold text-lg mb-1">
                      {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-semibold mb-2 ${getPriceColor(index.change)}`}>
                      {index.change >= 0 ? '▲' : '▼'}
                      {' '}
                      {Math.abs(index.change).toFixed(2)}
                      <span className="ml-1 text-xs">
                        ({index.change >= 0 ? '+' : ''}
                        {index.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {renderCandlestickChart(index)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          currentSettings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </Card>
  );
}
