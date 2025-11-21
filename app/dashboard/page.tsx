'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MarketIndicesBanner from '@/components/dashboard/MarketIndicesBanner';
import TabbedPortfolioList from '@/components/portfolio/TabbedPortfolioList';
import AddStockModal from '@/components/modals/AddStockModal';
import SettingsModal from '@/components/modals/SettingsModal';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [settings, setSettings] = useState({
    updateInterval: 5,
    selectedIndices: ['^TWII', '^DJI', '^IXIC', '^GSPC', '^N225', '^KS11', 'ES=F', 'NQ=F', 'YM=F', 'NKD=F'],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleSaveSettings = (newSettings: { updateInterval: number; selectedIndices: string[] }) => {
    setSettings(newSettings);
    localStorage.setItem('marketIndexSettings', JSON.stringify(newSettings));
  };

  if (status === 'loading') {
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
            {/* Logo/標題 */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">
                📊 投資儀表板
              </h1>
            </div>

            {/* 右側按鈕組 */}
            <div className="flex items-center gap-2">
              {/* 重新整理按鈕 */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="重新整理"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* 設定按鈕 */}
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="設定"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* 選單按鈕 */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="選單"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 下拉選單 */}
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 mr-4 overflow-hidden">
            <button
              onClick={() => {
                setShowAddStockModal(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-gray-700">新增股票</span>
            </button>
            <button
              onClick={() => {
                router.push('/after-market');
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100"
            >
              <span className="text-gray-600">📊</span>
              <span className="text-sm font-medium text-gray-700">盤後法人</span>
            </button>
            <button
              onClick={() => {
                signOut({ callbackUrl: '/login' });
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">登出</span>
            </button>
          </div>
        )}
      </header>

      {/* 市場指數橫幅 */}
      <MarketIndicesBanner />

      {/* 主要內容 */}
      <main className="pb-6">
        {/* 持股列表（帶標籤頁） */}
        <div className="mt-4 mx-4">
          <TabbedPortfolioList refreshTrigger={refreshTrigger} />
        </div>

        {/* 浮動新增按鈕 */}
        <button
          onClick={() => setShowAddStockModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 z-40"
          title="新增股票"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </main>

      {/* 新增股票Modal */}
      {showAddStockModal && (
        <AddStockModal
          onClose={() => setShowAddStockModal(false)}
          onSuccess={() => {
            handleRefresh();
            setShowAddStockModal(false);
          }}
        />
      )}

      {/* 設定Modal */}
      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          currentSettings={settings}
          onSave={(newSettings) => {
            handleSaveSettings(newSettings);
            setShowSettingsModal(false);
          }}
        />
      )}
    </div>
  );
}
