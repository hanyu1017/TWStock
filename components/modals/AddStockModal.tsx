'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface AddStockModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStockModal({ onClose, onSuccess }: AddStockModalProps) {
  const [mode, setMode] = useState<'portfolio' | 'watchlist'>('portfolio');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('0');
  const [tax, setTax] = useState('0');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

              {/* Common Fields */}
              <Input
                label="股票代碼"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="例如: 2330"
                required
              />

              <Input
                label="股票名稱"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: 台積電"
                required
              />

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
