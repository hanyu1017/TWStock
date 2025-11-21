'use client';

import { formatNumber, formatPercent, getPriceChangeColor } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

export default function PriceDisplay({
  price,
  change,
  changePercent,
  size = 'md',
  showAnimation = true,
}: PriceDisplayProps) {
  const [prevPrice, setPrevPrice] = useState(price);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (showAnimation && price !== prevPrice) {
      if (price > prevPrice) {
        setAnimationClass('price-up');
      } else if (price < prevPrice) {
        setAnimationClass('price-down');
      }

      const timer = setTimeout(() => {
        setAnimationClass('');
      }, 500);

      setPrevPrice(price);

      return () => clearTimeout(timer);
    }
  }, [price, prevPrice, showAnimation]);

  const colorClass = getPriceChangeColor(change);

  const sizeClasses = {
    sm: {
      price: 'text-lg',
      change: 'text-sm',
    },
    md: {
      price: 'text-2xl',
      change: 'text-base',
    },
    lg: {
      price: 'text-3xl',
      change: 'text-lg',
    },
  };

  return (
    <div className={`flex flex-col ${animationClass}`}>
      <div className={`font-bold ${sizeClasses[size].price}`}>
        ${formatNumber(price, 2)}
      </div>
      <div className={`${colorClass} ${sizeClasses[size].change} font-semibold`}>
        {change >= 0 ? '+' : ''}
        {formatNumber(change, 2)} ({formatPercent(changePercent, 2)})
      </div>
    </div>
  );
}
