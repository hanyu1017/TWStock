'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatNumber, getPriceChangeColor } from '@/lib/utils';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

export default function WatchlistPanel({ refreshTrigger }: { refreshTrigger: number }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWatchlist();
    const interval = setInterval(fetchWatchlist, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchWatchlist = async () => {
    try {
      // Fetch watchlist with current prices
      const response = await fetch('/api/watchlist/prices');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.prices || []);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWatchlist(watchlist.filter((item) => item.id !== id));
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>關注名單</CardTitle>
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
        <CardTitle>⭐ 關注名單</CardTitle>
      </CardHeader>
      <CardContent>
        {watchlist.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              尚無關注的股票
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((item) => {
              const colorClass = item.change
                ? getPriceChangeColor(item.change)
                : 'text-gray-600';

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.symbol}
                    </div>
                  </div>
                  <div className="text-right mr-3">
                    {item.currentPrice && (
                      <>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${formatNumber(item.currentPrice, 2)}
                        </div>
                        {item.change !== undefined && (
                          <div className={`text-sm font-medium ${colorClass}`}>
                            {item.change >= 0 ? '+' : ''}
                            {formatNumber(item.change, 2)} (
                            {formatNumber(item.changePercent || 0, 2)}%)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(item.id)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    移除
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
