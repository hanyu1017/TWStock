'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface SettingsModalProps {
  onClose: () => void;
  currentSettings: {
    updateInterval: number;
    selectedIndices: string[];
  };
  onSave: (settings: { updateInterval: number; selectedIndices: string[] }) => void;
}

const AVAILABLE_INDICES = [
  { symbol: '^TWII', name: '加權指數', country: 'TW', type: 'index' },
  { symbol: '^DJI', name: '道瓊指數', country: 'US', type: 'index' },
  { symbol: '^IXIC', name: '那斯達克', country: 'US', type: 'index' },
  { symbol: '^GSPC', name: 'S&P 500', country: 'US', type: 'index' },
  { symbol: '^N225', name: '日經指數', country: 'JP', type: 'index' },
  { symbol: '^KS11', name: '韓國綜合', country: 'KR', type: 'index' },
  { symbol: 'ES=F', name: 'S&P期貨', country: 'US', type: 'futures' },
  { symbol: 'NQ=F', name: '那指期貨', country: 'US', type: 'futures' },
  { symbol: 'YM=F', name: '道瓊期貨', country: 'US', type: 'futures' },
  { symbol: 'NKD=F', name: '日經期貨', country: 'JP', type: 'futures' },
];

const UPDATE_INTERVALS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
  { value: 30, label: '30秒' },
  { value: 60, label: '1分鐘' },
  { value: 300, label: '5分鐘' },
];

export default function SettingsModal({ onClose, currentSettings, onSave }: SettingsModalProps) {
  const [updateInterval, setUpdateInterval] = useState(currentSettings.updateInterval);
  const [selectedIndices, setSelectedIndices] = useState<string[]>(currentSettings.selectedIndices);

  const toggleIndex = (symbol: string) => {
    setSelectedIndices((prev) =>
      prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]
    );
  };

  const handleSave = () => {
    onSave({ updateInterval, selectedIndices });
    onClose();
  };

  const selectAll = () => {
    setSelectedIndices(AVAILABLE_INDICES.map((idx) => idx.symbol));
  };

  const deselectAll = () => {
    setSelectedIndices([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ⚙️ 指數顯示設定
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Update Interval */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              更新頻率
            </label>
            <div className="grid grid-cols-5 gap-2">
              {UPDATE_INTERVALS.map((interval) => (
                <button
                  key={interval.value}
                  onClick={() => setUpdateInterval(interval.value)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    updateInterval === interval.value
                      ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>

          {/* Index Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                顯示指數 ({selectedIndices.length}/{AVAILABLE_INDICES.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  全選
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  清除
                </button>
              </div>
            </div>

            {/* Cash Indices */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                現貨指數
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_INDICES.filter((idx) => idx.type === 'index').map((index) => (
                  <label
                    key={index.symbol}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      selectedIndices.includes(index.symbol)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndices.includes(index.symbol)}
                      onChange={() => toggleIndex(index.symbol)}
                      className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {index.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Futures */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                期貨指數
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_INDICES.filter((idx) => idx.type === 'futures').map((index) => (
                  <label
                    key={index.symbol}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                      selectedIndices.includes(index.symbol)
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIndices.includes(index.symbol)}
                      onChange={() => toggleIndex(index.symbol)}
                      className="mr-3 w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {index.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose} variant="secondary" className="flex-1">
              取消
            </Button>
            <Button onClick={handleSave} className="flex-1">
              儲存設定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
