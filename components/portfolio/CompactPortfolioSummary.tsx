'use client';

import { useEffect, useState, useCallback } from 'react';

interface PortfolioSummaryData {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  todayProfitLoss: number;
  holdingsCount: number;
}

export default function CompactPortfolioSummary({ refreshTrigger }: { refreshTrigger: number }) {
  const [summary, setSummary] = useState<PortfolioSummaryData>({
    totalValue: 0,
    totalCost: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0,
    todayProfitLoss: 0,
    holdingsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch('/api/portfolio/summary');
      if (response.ok) {
        const data = await response.json();

        // Calculate summary from holdings
        const holdings = data.holdings || [];
        const totalValue = holdings.reduce((sum: number, h: any) => sum + (h.marketValue || 0), 0);
        const totalCost = holdings.reduce((sum: number, h: any) => sum + (h.cost || 0), 0);
        const totalProfitLoss = totalValue - totalCost;
        const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

        setSummary({
          totalValue,
          totalCost,
          totalProfitLoss,
          totalProfitLossPercent,
          todayProfitLoss: data.todayProfitLoss || 0,
          holdingsCount: holdings.length,
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 5000);
    return () => clearInterval(interval);
  }, [fetchSummary, refreshTrigger]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getProfitColor = (value: number) => {
    if (value > 0) return 'text-red-500'; // 紅色獲利
    if (value < 0) return 'text-green-500'; // 綠色虧損
    return 'text-slate-400';
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 bg-slate-700 rounded"></div>
            <div className="h-16 bg-slate-700 rounded"></div>
            <div className="h-16 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-semibold text-slate-400 mb-3">目前庫存 ({summary.holdingsCount} 檔)</h3>
      <div className="grid grid-cols-3 gap-3">
        {/* 股票市值 */}
        <div>
          <div className="text-xs text-slate-500 mb-1">股票市值</div>
          <div className="text-lg font-bold text-white">
            ${formatCurrency(summary.totalValue)}
          </div>
        </div>

        {/* 今日損益 */}
        <div>
          <div className="text-xs text-slate-500 mb-1">今日損益</div>
          <div className={`text-lg font-bold ${getProfitColor(summary.todayProfitLoss)}`}>
            {summary.todayProfitLoss >= 0 ? '+' : ''}
            ${formatCurrency(Math.abs(summary.todayProfitLoss))}
          </div>
        </div>

        {/* 累積損益 */}
        <div>
          <div className="text-xs text-slate-500 mb-1">累積損益</div>
          <div className={`text-lg font-bold ${getProfitColor(summary.totalProfitLoss)}`}>
            {summary.totalProfitLoss >= 0 ? '+' : ''}
            ${formatCurrency(Math.abs(summary.totalProfitLoss))}
          </div>
          <div className={`text-xs font-semibold ${getProfitColor(summary.totalProfitLoss)}`}>
            {summary.totalProfitLossPercent >= 0 ? '+' : ''}
            {summary.totalProfitLossPercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
