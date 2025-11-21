'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  notes?: string;
}

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWatchlist();
      // Refresh every 5 seconds
      const interval = setInterval(fetchWatchlist, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist');
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要從關注名單中移除嗎？')) return;

    try {
      const response = await fetch(`/api/watchlist/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchWatchlist();
      }
    } catch (error) {
      console.error('Error deleting from watchlist:', error);
    }
  };

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
                ⭐ 關注名單
              </h1>
            </div>
            <button
              onClick={fetchWatchlist}
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
          {watchlist.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">
                尚無關注股票
              </p>
              <p className="text-xs text-gray-400 mt-2">
                點擊下方按鈕新增股票到關注名單
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {watchlist.map((item) => {
                const change = item.change || 0;
                const changePercent = item.changePercent || 0;
                return (
                  <div
                    key={item.id}
                    className={`p-4 ${getBackgroundColor(change)} border-l-4`}
                  >
                    {/* 股票資訊 */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">
                          {item.symbol.replace('.TW', '').replace('.TWO', '')}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-gray-900">
                          ${item.currentPrice?.toFixed(2) || '--'}
                        </div>
                      </div>
                    </div>

                    {/* 漲跌資訊 */}
                    {item.currentPrice && (
                      <div className="flex items-center justify-between mb-3">
                        <div className={`text-sm font-semibold ${getPriceColor(change)}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}
                        </div>
                        <div className={`text-sm font-semibold ${getPriceColor(change)}`}>
                          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                        </div>
                      </div>
                    )}

                    {/* 備註 */}
                    {item.notes && (
                      <div className="text-xs text-gray-600 mb-2 p-2 bg-gray-100 rounded">
                        {item.notes}
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      移除
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 浮動新增按鈕 */}
      <button
        onClick={() => router.push('/dashboard?action=add')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-40"
        title="新增關注"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
