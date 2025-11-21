'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PriceDisplay from '@/components/ui/PriceDisplay';

interface MarketIndex {
  symbol: string;
  name: string;
  country: string;
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

export default function MarketIndices({ refreshTrigger }: { refreshTrigger: number }) {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIndices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchIndices, 60000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchIndices = async () => {
    try {
      const response = await fetch('/api/indices');
      if (response.ok) {
        const data = await response.json();
        setIndices(data.indices || []);
      }
    } catch (error) {
      console.error('Error fetching market indices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>主要市場指數</CardTitle>
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
        <CardTitle>🌏 主要市場指數</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {indices.map((index) => (
            <div key={index.symbol} className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {index.name}
              </div>
              <div className="font-semibold text-lg">
                {index.currentValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
              <div
                className={`text-sm font-medium ${
                  index.change >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {index.change >= 0 ? '+' : ''}
                {index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
