'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import PortfolioList from '@/components/portfolio/PortfolioList';
import WatchlistPanel from '@/components/watchlist/WatchlistPanel';
import MarketIndices from '@/components/dashboard/MarketIndices';
import AddStockModal from '@/components/modals/AddStockModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">載入中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                投資組合儀表板
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                歡迎回來，{session.user?.name || session.user?.email}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleRefresh} variant="secondary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新整理
              </Button>
              <Button onClick={() => setShowAddStockModal(true)} size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新增股票
              </Button>
              <Button
                onClick={() => {
                  router.push('/api/auth/signout');
                }}
                variant="ghost"
                size="sm"
              >
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Market Indices */}
          <MarketIndices refreshTrigger={refreshTrigger} />

          {/* Portfolio Summary */}
          <PortfolioSummary refreshTrigger={refreshTrigger} />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Portfolio List */}
            <div className="lg:col-span-2">
              <PortfolioList refreshTrigger={refreshTrigger} />
            </div>

            {/* Watchlist */}
            <div>
              <WatchlistPanel refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </main>

      {/* Add Stock Modal */}
      {showAddStockModal && (
        <AddStockModal
          onClose={() => setShowAddStockModal(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
