'use client';

import { useEffect, useState } from 'react';
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
}

export default function MarketIndices({ refreshTrigger }: { refreshTrigger: number }) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchIndices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchIndices = async () => {
    try {
      setConnectionStatus('connecting');
      const response = await fetch('/api/indices');
      if (response.ok) {
        const data = await response.json();
        const fetchedIndices = data.indices || [];
        setIndices(fetchedIndices);

        // If no indices returned, try to initialize data
        if (fetchedIndices.length === 0 && !isLoading) {
          console.log('No indices found, attempting to initialize...');
          try {
            const initResponse = await fetch('/api/init-data', { method: 'POST' });
            if (initResponse.ok) {
              console.log('Data initialized, retrying fetch...');
              // Retry fetch after initialization
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
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${getConnectionColor()}`} />
            <span className="text-gray-600 dark:text-gray-400">{getConnectionText()}</span>
            {lastUpdate && (
              <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                更新: {lastUpdate.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
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
                    className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {index.name}
                    </div>
                    <div className="font-bold text-base mb-1">
                      {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
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
                    className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-colors border border-blue-200 dark:border-blue-800"
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
                      className={`text-sm font-semibold ${
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
