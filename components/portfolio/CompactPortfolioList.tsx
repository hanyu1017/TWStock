'use client';

import { useEffect, useState } from 'react';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  cost: number;
  marketValue: number;
  profitLoss: number;
  profitLossPercent: number;
  change: number;
  changePercent: number;
  isMarginTrading?: boolean;
  marginType?: string;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export default function CompactPortfolioList({ refreshTrigger, market }: { refreshTrigger: number; market: 'TW' | 'US' }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHoldings();
    const interval = setInterval(fetchHoldings, 5000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const fetchHoldings = async () => {
    try {
      const response = await fetch('/api/portfolio/summary');
      if (response.ok) {
        const data = await response.json();
        setHoldings(data.holdings || []);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHoldings = market === 'TW'
    ? holdings.filter(h => h.symbol.includes('.TW') || h.symbol.includes('.TWO'))
    : holdings.filter(h => !h.symbol.includes('.TW') && !h.symbol.includes('.TWO'));

  const getPriceColor = (change: number) => {
    if (change > 0) return 'text-red-500';
    if (change < 0) return 'text-green-500';
    return 'text-slate-400';
  };

  const renderKLine = (ohlc?: { open: number; high: number; low: number; close: number }) => {
    if (!ohlc) return null;

    const { open, high, low, close } = ohlc;
    const isRising = close >= open;
    const color = isRising ? '#ef4444' : '#22c55e';

    const range = high - low;
    if (range === 0) return null;

    const height = 40;
    const width = 20;
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);

    const highY = ((high - low) / range) * height;
    const lowY = 0;
    const bodyTopY = ((bodyTop - low) / range) * height;
    const bodyBottomY = ((bodyBottom - low) / range) * height;

    return (
      <svg width={width} height={height} className="inline-block">
        <line
          x1={width / 2}
          y1={height - highY}
          x2={width / 2}
          y2={height - lowY}
          stroke={color}
          strokeWidth="1"
        />
        <rect
          x={2}
          y={height - bodyBottomY}
          width={width - 4}
          height={Math.max(bodyBottomY - bodyTopY, 1)}
          fill={color}
        />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-slate-800 rounded-lg p-3 border border-slate-700 animate-pulse">
            <div className="h-16 bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredHoldings.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center">
        <p className="text-slate-400">
          {market === 'TW' ? '尚無台股持股' : '尚無美股持股'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredHoldings.map((holding) => {
        const isProfitable = holding.profitLoss >= 0;
        return (
          <div
            key={holding.id}
            className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* K線圖 */}
              <div className="flex-shrink-0">
                {renderKLine(holding.ohlc)}
              </div>

              {/* 股票資訊 */}
              <div className="flex-1 min-w-0">
                {/* 第一行：名稱、價格、漲跌 */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm truncate">
                      {holding.name}
                    </h3>
                    {holding.isMarginTrading && (
                      <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                        holding.marginType === '融資'
                          ? 'bg-purple-900/50 text-purple-300'
                          : 'bg-orange-900/50 text-orange-300'
                      }`}>
                        {holding.marginType}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      ${(holding.currentPrice ?? 0).toFixed(2)}
                    </div>
                    <div className={`text-xs font-semibold ${getPriceColor(holding.change ?? 0)}`}>
                      {(holding.change ?? 0) >= 0 ? '+' : ''}{(holding.change ?? 0).toFixed(2)}
                      ({(holding.changePercent ?? 0) >= 0 ? '+' : ''}{(holding.changePercent ?? 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                {/* 第二行：股數、成本、損益 */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div>
                    <div className="text-slate-500">股數</div>
                    <div className="text-white font-medium">{(holding.quantity ?? 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">成本</div>
                    <div className="text-white font-medium">${(holding.averagePrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">即時損益</div>
                    <div className={`font-bold ${getPriceColor(holding.profitLoss ?? 0)}`}>
                      {(holding.profitLoss ?? 0) >= 0 ? '+' : ''}${Math.abs(holding.profitLoss ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">報酬率</div>
                    <div className={`font-bold ${getPriceColor(holding.profitLoss ?? 0)}`}>
                      {(holding.profitLossPercent ?? 0) >= 0 ? '+' : ''}{(holding.profitLossPercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
