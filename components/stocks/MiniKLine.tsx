'use client';

interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MiniKLineProps {
  data: OHLCData[];
  width?: number;
  height?: number;
}

export default function MiniKLine({ data, width = 80, height = 40 }: MiniKLineProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-slate-700/30 rounded"
      >
        <span className="text-xs text-slate-500">--</span>
      </div>
    );
  }

  // Calculate min and max for scaling
  const allValues = data.flatMap(d => [d.high, d.low]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;

  // Avoid division by zero
  if (range === 0) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center bg-slate-700/30 rounded"
      >
        <span className="text-xs text-slate-500">--</span>
      </div>
    );
  }

  const candleWidth = Math.max(2, width / data.length - 1);
  const padding = 2;

  const scaleY = (value: number) => {
    return padding + (1 - (value - minValue) / range) * (height - 2 * padding);
  };

  return (
    <svg width={width} height={height} className="inline-block">
      {data.map((candle, index) => {
        const x = index * (candleWidth + 1) + padding;
        const isRising = candle.close >= candle.open;
        const color = isRising ? '#ef4444' : '#22c55e'; // Red for rising, green for falling

        const highY = scaleY(candle.high);
        const lowY = scaleY(candle.low);
        const openY = scaleY(candle.open);
        const closeY = scaleY(candle.close);

        const bodyTop = Math.min(openY, closeY);
        const bodyBottom = Math.max(openY, closeY);
        const bodyHeight = Math.max(bodyBottom - bodyTop, 0.5);

        return (
          <g key={index}>
            {/* Wick (high-low line) */}
            <line
              x1={x + candleWidth / 2}
              y1={highY}
              x2={x + candleWidth / 2}
              y2={lowY}
              stroke={color}
              strokeWidth="1"
            />
            {/* Body (open-close rectangle) */}
            <rect
              x={x}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}
