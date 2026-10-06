import React, { useState, useRef } from 'react';
import { Crosshair } from 'lucide-react';
import { generateOhlcvForTimeframe, type TimeframeOption } from '../views/RwaTerminalView';

export interface PricePoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
}

interface TouchInteractiveChartProps {
  assetSymbol?: string;
  assetName?: string;
  basePrice?: number;
  currency?: string;
  data?: PricePoint[];
}

export const TouchInteractiveChart: React.FC<TouchInteractiveChartProps> = ({
  assetSymbol = 'XAU/EUR',
  assetName = 'Swiss Allocated 999.9 Gold Bullion',
  basePrice = 84.50,
  currency: _currency = 'EUR',
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('24H');
  const [_isHovering, setIsHovering] = useState<boolean>(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const rawOhlcv = generateOhlcvForTimeframe(basePrice || 84.50, timeframe);
  // Intraday points carry unix-second keys; render them as readable clock labels.
  const timeLabel = (t: string | number) =>
    typeof t === 'number' ? new Date(t * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : t;
  const data: PricePoint[] = rawOhlcv.map((d) => ({
    time: timeLabel(d.time),
    price: d.close,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
    volume: `${(d.volume / 1000).toFixed(0)}k`,
  }));

  const [selectedIndex, setSelectedIndex] = useState<number>(data.length - 1);
  const selectedPoint = data[selectedIndex] || data[data.length - 1] || { time: '', price: basePrice, open: basePrice, high: basePrice, low: basePrice, close: basePrice, volume: '0k' };
  const firstPoint = data[0] || selectedPoint;
  const priceChange = selectedPoint.price - firstPoint.price;
  const priceChangePct = ((priceChange / (firstPoint.price || 1)) * 100);

  // SVG Calculation Helpers
  const minPrice = Math.min(...data.map((d) => d.low)) * 0.998;
  const maxPrice = Math.max(...data.map((d) => d.high)) * 1.002;
  const chartHeight = 180;
  const chartWidth = 500;

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / (maxPrice - minPrice)) * (chartHeight - 30) - 15;
  };

  const getX = (idx: number) => {
    return (idx / (data.length - 1)) * (chartWidth - 40) + 20;
  };

  // Generate Path for SVG Line
  const pointsString = data
    .map((d, i) => `${getX(i)},${getY(d.price)}`)
    .join(' ');

  const areaPathString = `${pointsString} ${getX(data.length - 1)},${chartHeight} ${getX(0)},${chartHeight}`;

  // Handle Touch or Mouse Sliding
  const handlePointerMove = (clientX: number) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const boundedX = Math.max(0, Math.min(relativeX, rect.width));
    const ratio = boundedX / rect.width;
    const targetIndex = Math.round(ratio * (data.length - 1));
    const clampedIndex = Math.max(0, Math.min(targetIndex, data.length - 1));

    setSelectedIndex(clampedIndex);
    setIsHovering(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientX);
  };

  return (
    <div
      style={{
        backgroundColor: '#0c0812',
        border: '1px solid var(--border-subtle)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Top Interactive Readout Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF' }}>{assetSymbol}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{assetName}</span>
          </div>

          {/* Dynamic Pinpointed Price Readout */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              €{selectedPoint.price.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: priceChange >= 0 ? 'var(--green-valid)' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {priceChange >= 0 ? '+' : ''}€{priceChange.toFixed(2)} ({priceChangePct >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Timeframe Selector Pills: Baseline, 1H, 24H, 7D, 1M, 6M, 1Y, 5Y, 10Y */}
        <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', backgroundColor: '#160f1e', padding: '3px', borderRadius: '6px' }}>
          {(['Baseline', '1H', '24H', '7D', '1M', '6M', '1Y', '5Y', '10Y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setSelectedIndex(0);
              }}
              style={{
                padding: '3px 6px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: timeframe === tf ? 'var(--red-primary)' : 'transparent',
                color: timeframe === tf ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '9.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Real-Time Pinpointed OHLC Values Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          backgroundColor: '#120c19',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #23162b',
          fontSize: '10.5px',
          fontFamily: 'var(--font-mono)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-dim)' }}>TIME: </span>
          <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{selectedPoint.time}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>O: </span>
          <span style={{ color: '#FFFFFF' }}>€{selectedPoint.open.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>H: </span>
          <span style={{ color: 'var(--green-valid)' }}>€{selectedPoint.high.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>L: </span>
          <span style={{ color: '#ef4444' }}>€{selectedPoint.low.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>VOL: </span>
          <span style={{ color: 'var(--red-primary)', fontWeight: 700 }}>{selectedPoint.volume}</span>
        </div>
      </div>

      {/* Interactive Touch / Slide Chart Area */}
      <div
        ref={chartRef}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          position: 'relative',
          height: `${chartHeight}px`,
          cursor: 'crosshair',
          touchAction: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGradientRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.35)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0.0)" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="0" y1={getY(minPrice + (maxPrice - minPrice) * 0.75)} x2={chartWidth} y2={getY(minPrice + (maxPrice - minPrice) * 0.75)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1={getY(minPrice + (maxPrice - minPrice) * 0.50)} x2={chartWidth} y2={getY(minPrice + (maxPrice - minPrice) * 0.50)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1={getY(minPrice + (maxPrice - minPrice) * 0.25)} x2={chartWidth} y2={getY(minPrice + (maxPrice - minPrice) * 0.25)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

          {/* Gradient Fill */}
          <polygon points={areaPathString} fill="url(#chartGradientRed)" />

          {/* Main Price Line */}
          <polyline
            fill="none"
            stroke="var(--red-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Pinpoint Crosshair Vertical Line */}
          <line
            x1={getX(selectedIndex)}
            y1="0"
            x2={getX(selectedIndex)}
            y2={chartHeight}
            stroke="rgba(239, 68, 68, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Pinpoint Glow Dot at Exact Finger Position */}
          <circle
            cx={getX(selectedIndex)}
            cy={getY(selectedPoint.price)}
            r="6"
            fill="var(--red-primary)"
            stroke="#FFFFFF"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 8px var(--red-glow))' }}
          />
        </svg>

        {/* Floating Tooltip Follower */}
        <div
          style={{
            position: 'absolute',
            left: `${(selectedIndex / (data.length - 1)) * 90 + 5}%`,
            top: `${Math.max(10, getY(selectedPoint.price) - 35)}px`,
            transform: 'translateX(-50%)',
            backgroundColor: '#1b1022',
            border: '1px solid var(--border-red)',
            padding: '3px 8px',
            borderRadius: '5px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#FFFFFF',
            fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          €{selectedPoint.price.toFixed(2)} • {selectedPoint.time}
        </div>
      </div>

      {/* Finger Slide Instruction Helper */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--text-dim)', paddingTop: '4px' }}>
        <Crosshair size={12} color="var(--red-primary)" />
        <span>Slide finger or mouse across chart to pinpoint real-time OHLC & volume</span>
      </div>
    </div>
  );
};
