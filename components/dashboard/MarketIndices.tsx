'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

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
}

export default function MarketIndices({ refreshTrigger }: { refreshTrigger: number }) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [flashingIndices, setFlashingIndices] = useState<Set<string>>(new Set());
  const previousValuesRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    fetchIndices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Reset countdown when data updates
  useEffect(() => {
    if (lastUpdate) {
      setCountdown(60);
    }
  }, [lastUpdate]);

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

  // Generate simple sparkline chart
  const generateSparkline = (index: MarketIndex) => {
    // Generate mock intraday data based on change
    const points = 20;
    const data: number[] = [];
    const start = index.previousClose;
    const end = index.currentValue;
    const volatility = Math.abs(index.change) * 0.3;

    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const trend = start + (end - start) * progress;
      const noise = (Math.random() - 0.5) * volatility;
      data.push(trend + noise);
    }

    return data;
  };

  const renderSparkline = (index: MarketIndex) => {
    const data = generateSparkline(index);
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    const width = 60;
    const height = 20;

    if (range === 0) return null;

    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const color = index.change >= 0 ? '#10b981' : '#ef4444';

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          opacity="0.8"
        />
      </svg>
    );
  };

  // Group indices by type and prioritize US indices
  const usIndices = indices.filter(idx =>
    idx.country === 'US' && (idx.type === 'index' || !idx.type)
  );
  const otherCashIndices = indices.filter(idx =>
    idx.country !== 'US' && (idx.type === 'index' || !idx.type)
  );
  const futuresIndices = indices.filter(idx => idx.type === 'futures');

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
                <span className={`font-mono font-bold ${countdown <= 10 ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {countdown}s
                </span>
              </div>
            )}
            {lastUpdate && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                更新: {lastUpdate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
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
                      flashingIndices.has(index.symbol) ? 'animate-pulse ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {index.name}
                    </div>
                    <div className="font-bold text-base mb-1">
                      {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`text-xs font-medium ${
                          index.change >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {index.change >= 0 ? '+' : ''}
                        {index.change.toFixed(2)}
                        <span className="ml-1">
                          ({index.change >= 0 ? '+' : ''}
                          {index.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      {renderSparkline(index)}
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
                      flashingIndices.has(index.symbol) ? 'animate-pulse ring-2 ring-indigo-500' : ''
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
                    <div
                      className={`text-sm font-semibold mb-2 ${
                        index.change >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {index.change >= 0 ? '▲' : '▼'}
                      {' '}
                      {Math.abs(index.change).toFixed(2)}
                      <span className="ml-1 text-xs">
                        ({index.change >= 0 ? '+' : ''}
                        {index.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {renderSparkline(index)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
