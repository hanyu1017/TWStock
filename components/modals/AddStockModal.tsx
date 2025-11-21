'use client';

import { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface StockSearchResult {
  code: string;
  name: string;
}

interface AddStockModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({ onClose, onSuccess }: AddStockModalProps) {
  const [mode, setMode] = useState<'portfolio' | 'watchlist'>('portfolio');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMarginTrading, setIsMarginTrading] = useState(false);
  const [marginType, setMarginType] = useState<'融資' | '融券'>('融資');
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside search results to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for stocks as user types
  useEffect(() => {
    const searchStocks = async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
          setShowSearchResults(true);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
      }
    };

    const timeoutId = setTimeout(searchStocks, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSelectStock = (stock: StockSearchResult) => {
    setSymbol(stock.code);
    setName(stock.name);
    setSearchQuery(`${stock.code} ${stock.name}`);
    setShowSearchResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'portfolio') {
        const response = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            name,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            type: 'BUY',
            fee: parseFloat(fee) || 0,
            tax: parseFloat(tax) || 0,
            notes,
            date: new Date().toISOString(),
            isMarginTrading,
            marginType: isMarginTrading ? marginType : null,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '新增失敗');
        }
      } else {
        const response = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            symbol,
            name,
            notes,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '新增失敗');
        }
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>新增股票</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Mode Selection */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === 'portfolio' ? 'primary' : 'secondary'}
                  className="flex-1"
                  onClick={() => setMode('portfolio')}
                >
                  加入持股
                </Button>
                <Button
                  type="button"
                  variant={mode === 'watchlist' ? 'primary' : 'secondary'}
                  className="flex-1"
                  onClick={() => setMode('watchlist')}
                >
                  加入關注
                </Button>
              </div>

              {/* Stock Search with Autocomplete */}
              <div className="relative" ref={searchRef}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  搜尋股票 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                  placeholder="輸入股票代碼或名稱 (例如: 2330 或 台積電)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />

                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((stock) => (
                      <button
                        key={stock.code}
                        type="button"
                        onClick={() => handleSelectStock(stock)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                      >
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {stock.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {stock.code}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                {/* Show selected stock info */}
                {symbol && name && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          已選擇: {name} ({symbol})
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSymbol('');
                          setName('');
                          setSearchQuery('');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Portfolio-specific Fields */}
              {mode === 'portfolio' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="股數"
                      type="number"
                      step="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="1000"
                      required
                    />

                    <Input
                      label="買入價格"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="500.00"
                      required
                    />
                  </div>

                  {/* Margin Trading Options */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={isMarginTrading}
                        onChange={(e) => setIsMarginTrading(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        融資融券交易
                      </span>
                    </label>

                    {isMarginTrading && (
                      <div className="flex gap-3 ml-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="marginType"
                            checked={marginType === '融資'}
                            onChange={() => setMarginType('融資')}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            融資 (做多)
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="marginType"
                            checked={marginType === '融券'}
                            onChange={() => setMarginType('融券')}
                            className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            融券 (做空)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="手續費"
                      type="number"
                      step="0.01"
                      value={fee}
                      onChange={(e) => setFee(e.target.value)}
                      placeholder="0.00"
                    />

                    <Input
                      label="稅金"
                      type="number"
                      step="0.01"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}

              <Input
                label="備註"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="選填"
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading}
                >
                  確認新增
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
