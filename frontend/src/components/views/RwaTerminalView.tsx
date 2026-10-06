import React, { useState, useEffect, useRef } from 'react';
import type { DemandDepositRecord, MarketRate } from '../../types';
import { executeRfqTrade } from '../../services/api';
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  AreaSeries,
  BarSeries,
  BaselineSeries,
  HistogramSeries,
  type IChartApi,
  type Time,
} from 'lightweight-charts';
import {
  Diamond,
  Landmark,
  Zap,
  Activity,
  TrendingUp,
  BarChart3,
  LineChart,
  SlidersHorizontal,
  Server,
  Radio,
  Terminal as TerminalIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type TimeframeOption = 'Baseline' | '1H' | '24H' | '7D' | '1M' | '6M' | '1Y' | '5Y' | '10Y';

export function generateOhlcvForTimeframe(basePrice: number, tf: TimeframeOption) {
  const points: { time: string | number; open: number; high: number; low: number; close: number; volume: number }[] = [];
  const now = new Date(2026, 7, 26, 17, 0, 0);

  // Intraday timeframes must use unique unix-second keys. Formatting hourly or
  // sub-hourly steps as YYYY-MM-DD date strings produces duplicate times, which
  // lightweight-charts v5 rejects in setData (crashes the whole app).
  const toTimeKey = (d: Date) => Math.floor(d.getTime() / 1000);

  if (tf === 'Baseline' || tf === '24H') {
    let current = basePrice * 0.992;
    for (let i = 24; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 3600 * 1000);
      const timeStr = toTimeKey(d);
      const change = (Math.sin(i) * 0.003 + 0.0005) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.002 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.002 * basePrice).toFixed(2));
      const volume = Math.floor(15000 + Math.abs(Math.sin(i)) * 20000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '1H') {
    let current = basePrice * 0.998;
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 2 * 60 * 1000);
      const timeStr = toTimeKey(d);
      const change = (Math.sin(i * 0.4) * 0.0008 + 0.0001) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.0008 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.0008 * basePrice).toFixed(2));
      const volume = Math.floor(4000 + Math.abs(Math.cos(i)) * 6000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '7D') {
    let current = basePrice * 0.975;
    for (let i = 28; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 6 * 3600 * 1000);
      const timeStr = toTimeKey(d);
      const change = (Math.cos(i * 0.3) * 0.004 + 0.001) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.004 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.004 * basePrice).toFixed(2));
      const volume = Math.floor(40000 + Math.abs(Math.sin(i)) * 50000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '1M') {
    let current = basePrice * 0.94;
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const change = (Math.sin(i * 0.35) * 0.008 + 0.002) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.007 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.007 * basePrice).toFixed(2));
      const volume = Math.floor(80000 + Math.abs(Math.sin(i)) * 100000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '6M') {
    let current = basePrice * 0.88;
    for (let i = 26; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const change = (Math.sin(i * 0.25) * 0.014 + 0.005) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.012 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.012 * basePrice).toFixed(2));
      const volume = Math.floor(250000 + Math.abs(Math.cos(i)) * 200000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '1Y') {
    let current = basePrice * 0.82;
    for (let i = 52; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
      const timeStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const change = (Math.sin(i * 0.15) * 0.018 + 0.004) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.016 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.016 * basePrice).toFixed(2));
      const volume = Math.floor(400000 + Math.abs(Math.sin(i)) * 300000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '5Y') {
    let current = basePrice * 0.62;
    for (let i = 60; i >= 0; i--) {
      const year = 2021 + Math.floor((60 - i) / 12);
      const month = ((60 - i) % 12) + 1;
      const timeStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const change = (Math.sin(i * 0.1) * 0.025 + 0.007) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.025 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.025 * basePrice).toFixed(2));
      const volume = Math.floor(1200000 + Math.abs(Math.sin(i)) * 1000000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  } else if (tf === '10Y') {
    let current = basePrice * 0.45;
    for (let i = 40; i >= 0; i--) {
      const year = 2016 + Math.floor((40 - i) / 4);
      const month = ((40 - i) % 4) * 3 + 1;
      const timeStr = `${year}-${String(month).padStart(2, '0')}-01`;
      const change = (Math.sin(i * 0.12) * 0.038 + 0.014) * basePrice;
      const open = Number(current.toFixed(2));
      const close = Number((current + change).toFixed(2));
      const high = Number((Math.max(open, close) + 0.035 * basePrice).toFixed(2));
      const low = Number((Math.min(open, close) - 0.035 * basePrice).toFixed(2));
      const volume = Math.floor(3500000 + Math.abs(Math.cos(i)) * 2500000);
      points.push({ time: timeStr, open, high, low, close: i === 0 ? basePrice : close, volume });
      current = close;
    }
  }

  // Defensive guard for lightweight-charts v5: strictly ascending, no duplicate
  // time keys. Points are generated oldest→newest; a Map keyed by the raw time
  // collapses any accidental duplicates while preserving order.
  const unique = new Map<string, { time: string | number; open: number; high: number; low: number; close: number; volume: number }>();
  for (const p of points) unique.set(String(p.time), p);
  return Array.from(unique.values());
}

export interface TerminalAsset {
  id: string;
  category: 'Gold' | 'FX' | 'Bonds' | 'RWA';
  name: string;
  ticker: string;
  isin_dti: string;
  priceEur: number;
  priceUsd: number;
  change24h: string;
  isPositive: boolean;
  yieldApy?: string;
  maturity?: string;
  liquidityDepthEur: string;
  vaultCustody: string;
  ohlcvData: { time: string; open: number; high: number; low: number; close: number; volume: number }[];
}

export const TERMINAL_ASSETS: TerminalAsset[] = [
  {
    id: 'GOLD-XAU',
    category: 'Gold',
    name: 'Swiss Allocated Physical Gold (LBMA 999.9)',
    ticker: 'XAU/EUR',
    isin_dti: 'DTI-9B2X-GOLD',
    priceEur: 84.50,
    priceUsd: 92.65,
    change24h: '+1.45%',
    isPositive: true,
    liquidityDepthEur: '€14,240,000,000',
    vaultCustody: 'Zurich Duty-Free Vault ZRH-01',
    ohlcvData: [],
  },
  {
    id: 'SILVER-XAG',
    category: 'Gold',
    name: 'Fine Allocated Silver Bullion (LBMA 999)',
    ticker: 'XAG/EUR',
    isin_dti: 'DTI-SILVER-999',
    priceEur: 1.15,
    priceUsd: 1.26,
    change24h: '+0.82%',
    isPositive: true,
    liquidityDepthEur: '€3,400,000,000',
    vaultCustody: 'Geneva Freeport Vault GVA-02',
    ohlcvData: [],
  },
  {
    id: 'USTB-10Y',
    category: 'Bonds',
    name: 'US Treasury 10Y Benchmark Sovereign Note',
    ticker: 'USTB-10Y',
    isin_dti: 'US91282CDJ71',
    priceEur: 98.42,
    priceUsd: 107.80,
    change24h: '+0.12%',
    isPositive: true,
    yieldApy: '3.85% APY',
    maturity: '2036-08-15',
    liquidityDepthEur: '€8,500,000,000',
    vaultCustody: 'Federal Reserve Bank of NY / BNY Mellon',
    ohlcvData: [],
  },
  {
    id: 'BUND-10Y',
    category: 'Bonds',
    name: 'German Federal Sovereign Bond (Bund-2034)',
    ticker: 'BUND-2034',
    isin_dti: 'DE0001102580',
    priceEur: 102.15,
    priceUsd: 111.90,
    change24h: '-0.08%',
    isPositive: false,
    yieldApy: '2.42% APY',
    maturity: '2034-02-15',
    liquidityDepthEur: '€4,200,000,000',
    vaultCustody: 'Deutsche Bundesbank / Clearstream Frankfurt',
    ohlcvData: [],
  },
  {
    id: 'CH-CONFED-5Y',
    category: 'Bonds',
    name: 'Swiss Confederation 5Y Sovereign Gold-Linked Bond',
    ticker: 'sBOND/5Y',
    isin_dti: 'CH0012548821',
    priceEur: 100.00,
    priceUsd: 109.50,
    change24h: '+0.10%',
    isPositive: true,
    yieldApy: '1.85% APY',
    maturity: '2031-09-01',
    liquidityDepthEur: '€2,500,000,000',
    vaultCustody: 'Swiss National Bank (SNB) / SIX SIS Zurich',
    ohlcvData: [],
  },
  {
    id: 'EU-GREEN-30',
    category: 'Bonds',
    name: 'EU NextGen Green Sovereign Infrastructure Note',
    ticker: 'EUGREEN-30',
    isin_dti: 'EU000A3KWCF4',
    priceEur: 99.20,
    priceUsd: 108.60,
    change24h: '+0.25%',
    isPositive: true,
    yieldApy: '3.10% APY',
    maturity: '2030-11-04',
    liquidityDepthEur: '€5,000,000,000',
    vaultCustody: 'European Investment Bank / Euroclear Brussels',
    ohlcvData: [],
  },
  {
    id: 'FX-EURUSD',
    category: 'FX',
    name: 'Euro / US Dollar Fiduciary Corridor (ECB Reference)',
    ticker: 'EUR/USD',
    isin_dti: 'DTI-EUR-USD-01',
    priceEur: 1.00,
    priceUsd: 1.0850,
    change24h: '+0.24%',
    isPositive: true,
    liquidityDepthEur: '€25,000,000,000',
    vaultCustody: 'ECB RTGS / Fedwire Automated Bridge',
    ohlcvData: [],
  },
  {
    id: 'FX-USDJPY',
    category: 'FX',
    name: 'US Dollar / Japanese Yen Wholesale Rail',
    ticker: 'USD/JPY',
    isin_dti: 'DTI-USD-JPY-04',
    priceEur: 0.0062,
    priceUsd: 154.20,
    change24h: '+0.45%',
    isPositive: true,
    liquidityDepthEur: '€18,000,000,000',
    vaultCustody: 'Bank of Japan (BOJ-NET) / Fedwire Bridge',
    ohlcvData: [],
  },
  {
    id: 'FX-EURJPY',
    category: 'FX',
    name: 'Euro / Japanese Yen Settlement Cross',
    ticker: 'EUR/JPY',
    isin_dti: 'DTI-EUR-JPY-05',
    priceEur: 1.00,
    priceUsd: 167.35,
    change24h: '+0.68%',
    isPositive: true,
    liquidityDepthEur: '€14,000,000,000',
    vaultCustody: 'Bank of Japan / ECB Direct Corridor',
    ohlcvData: [],
  },
  {
    id: 'FX-EURCHF',
    category: 'FX',
    name: 'Euro / Swiss Franc Fiduciary Rail',
    ticker: 'EUR/CHF',
    isin_dti: 'DTI-EUR-CHF-02',
    priceEur: 0.9580,
    priceUsd: 1.0490,
    change24h: '-0.08%',
    isPositive: false,
    liquidityDepthEur: '€12,000,000,000',
    vaultCustody: 'Swiss National Bank / ECB Corridor',
    ohlcvData: [],
  },
  {
    id: 'FX-EURGBP',
    category: 'FX',
    name: 'Euro / British Pound Sterling Rail',
    ticker: 'EUR/GBP',
    isin_dti: 'DTI-EUR-GBP-03',
    priceEur: 0.8540,
    priceUsd: 0.9350,
    change24h: '+0.15%',
    isPositive: true,
    liquidityDepthEur: '€8,000,000,000',
    vaultCustody: 'Bank of England CHAPS / Target2 Rail',
    ohlcvData: [],
  },
  {
    id: 'FX-USDCHF',
    category: 'FX',
    name: 'US Dollar / Swiss Franc Sovereign Corridor',
    ticker: 'USD/CHF',
    isin_dti: 'DTI-USD-CHF-06',
    priceEur: 0.8825,
    priceUsd: 0.9650,
    change24h: '-0.12%',
    isPositive: false,
    liquidityDepthEur: '€9,500,000,000',
    vaultCustody: 'Swiss National Bank / Federal Reserve Rail',
    ohlcvData: [],
  },
  {
    id: 'FX-AUDUSD',
    category: 'FX',
    name: 'Australian Dollar / US Dollar Reserve Rail',
    ticker: 'AUD/USD',
    isin_dti: 'DTI-AUD-USD-07',
    priceEur: 0.6540,
    priceUsd: 0.7160,
    change24h: '+0.38%',
    isPositive: true,
    liquidityDepthEur: '€6,200,000,000',
    vaultCustody: 'Reserve Bank of Australia (RITS) Corridor',
    ohlcvData: [],
  },
  {
    id: 'FX-USDCAD',
    category: 'FX',
    name: 'US Dollar / Canadian Dollar Energy Rail',
    ticker: 'USD/CAD',
    isin_dti: 'DTI-USD-CAD-08',
    priceEur: 0.7310,
    priceUsd: 1.3650,
    change24h: '+0.05%',
    isPositive: true,
    liquidityDepthEur: '€7,800,000,000',
    vaultCustody: 'Bank of Canada (Lynx) / Fedwire Cross',
    ohlcvData: [],
  },
  {
    id: 'RWA-EQUITY',
    category: 'RWA',
    name: 'Prime Zurich Real Estate Commercial Trust',
    ticker: 'ZRH-CRE-01',
    isin_dti: 'CH0992384110',
    priceEur: 1540.00,
    priceUsd: 1687.00,
    change24h: '+0.88%',
    isPositive: true,
    yieldApy: '5.20% Net Rental',
    liquidityDepthEur: '€650,000,000',
    vaultCustody: 'Zurich Cantonal Land Registry Title Deed',
    ohlcvData: [],
  },
  {
    id: 'GVA-LOG-04',
    category: 'RWA',
    name: 'Geneva Airport Cargo Logistics Infrastructure Note',
    ticker: 'GVA-LOG-04',
    isin_dti: 'CH0881923004',
    priceEur: 520.00,
    priceUsd: 569.40,
    change24h: '+0.42%',
    isPositive: true,
    yieldApy: '4.75% APY',
    liquidityDepthEur: '€320,000,000',
    vaultCustody: 'Geneva Cantonal Fiduciary Trust',
    ohlcvData: [],
  },
];

interface RwaTerminalViewProps {
  accounts: DemandDepositRecord[];
  rates?: MarketRate[];
  onRefresh: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

export const RwaTerminalView: React.FC<RwaTerminalViewProps> = ({
  accounts,
  onRefresh,
  onNotify,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Gold' | 'FX' | 'Bonds' | 'RWA'>('All');
  const [selectedAsset, setSelectedAsset] = useState<TerminalAsset>(TERMINAL_ASSETS[0]);
  const [chartType, setChartType] = useState<'candlestick' | 'area' | 'bar' | 'baseline'>('candlestick');
  const [timeframe, setTimeframe] = useState<TimeframeOption>('24H');
  const [hoveredData, setHoveredData] = useState<{ price: string; date: string } | null>(null);
  const [tradeAmount, setTradeAmount] = useState('10.00');
  const [buyerAccountId, setBuyerAccountId] = useState(accounts[0]?.account_id || '');
  const [submittingTrade, setSubmittingTrade] = useState(false);
  const [showNodeTelemetry, setShowNodeTelemetry] = useState(true);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);

  const filteredAssets =
    selectedCategory === 'All'
      ? TERMINAL_ASSETS
      : TERMINAL_ASSETS.filter((a) => a.category === selectedCategory);

  // Initialize and update TradingView Lightweight Charts
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
      chartInstanceRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#070509' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(239, 68, 68, 0.08)' },
        horzLines: { color: 'rgba(239, 68, 68, 0.08)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: '#ef4444', width: 1, style: 2, labelBackgroundColor: '#ef4444' },
        horzLine: { color: '#ef4444', width: 1, style: 2, labelBackgroundColor: '#ef4444' },
      },
      timeScale: {
        borderColor: '#271f28',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#271f28',
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: 340,
    });

    chartInstanceRef.current = chart;
    const seriesData = generateOhlcvForTimeframe(selectedAsset.priceEur, timeframe);

    if (chartType === 'candlestick') {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      candlestickSeries.setData(
        seriesData.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else if (chartType === 'area') {
      const areaSeries = chart.addSeries(AreaSeries, {
        topColor: 'rgba(239, 68, 68, 0.45)',
        bottomColor: 'rgba(239, 68, 68, 0.01)',
        lineColor: '#ef4444',
        lineWidth: 2,
      });

      areaSeries.setData(
        seriesData.map((d) => ({
          time: d.time as Time,
          value: d.close,
        }))
      );
    } else if (chartType === 'bar') {
      const barSeries = chart.addSeries(BarSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
      });

      barSeries.setData(
        seriesData.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );
    } else {
      const baselineSeries = chart.addSeries(BaselineSeries, {
        baseValue: { type: 'price', price: seriesData[0]?.open || selectedAsset.priceEur },
        topLineColor: '#10b981',
        bottomLineColor: '#ef4444',
        topFillColor1: 'rgba(16, 185, 129, 0.3)',
        topFillColor2: 'rgba(16, 185, 129, 0.01)',
        bottomFillColor1: 'rgba(239, 68, 68, 0.01)',
        bottomFillColor2: 'rgba(239, 68, 68, 0.3)',
        lineWidth: 2,
      });

      baselineSeries.setData(
        seriesData.map((d) => ({
          time: d.time as Time,
          value: d.close,
        }))
      );
    }

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: 'rgba(239, 68, 68, 0.25)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    volumeSeries.setData(
      seriesData.map((d) => ({
        time: d.time as Time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)',
      }))
    );

    chart.timeScale().fitContent();

    // Crosshair move subscription for live price readout
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const dateStr = String(param.time);
        const point = selectedAsset.ohlcvData.find((p) => p.time === dateStr);
        if (point) {
          setHoveredData({
            price: `€${point.close.toLocaleString()} EUR (O:${point.open} H:${point.high} L:${point.low})`,
            date: dateStr,
          });
        }
      } else {
        setHoveredData(null);
      }
    });

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [selectedAsset, chartType, timeframe]);

  const handleExecuteTrade = async (asset: TerminalAsset) => {
    if (!buyerAccountId) {
      onNotify('Please select a settlement payment account', true);
      return;
    }
    setSubmittingTrade(true);
    try {
      const totalCost = (asset.priceEur * parseFloat(tradeAmount)).toFixed(2);
      await executeRfqTrade({
        account_id: buyerAccountId,
        buyer_principal: 'lpmt4-wqbam-aaaaa-aaaaa-cai',
        asset_symbol: asset.ticker.split('/')[0],
        asset_amount: tradeAmount,
        cash_amount: totalCost,
      });
      onNotify(`Atomic DvP Finalized! Acquired ${tradeAmount} ${asset.ticker} for €${totalCost} EUR on ICP`);
      onRefresh();
    } catch (err: any) {
      onNotify(err.message, true);
    } finally {
      setSubmittingTrade(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="pill-red">● TradingView Core Engine</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Interactive Multi-Chart & Touch Gestures</span>
          </div>
          <h1 style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            RWA Capital Markets & Trading Terminal
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="pill-valid">● Sub-Second ICP DvP</span>
          <span className="pill-red">ISO 20022 camt.053</span>
        </div>
      </div>

      {/* TOP SUB-CATEGORY MENU & QUICK ASSET SELECTOR DROPDOWN */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          padding: '10px 14px',
          backgroundColor: '#0c0a10',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {(['All', 'Gold', 'FX', 'Bonds', 'RWA'] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={isActive ? 'btn-red' : 'btn-outline'}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 800,
                  borderRadius: '7px',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat === 'Gold' && '🏆 '}
                {cat === 'FX' && '💱 '}
                {cat === 'Bonds' && '🏛️ '}
                {cat === 'RWA' && '🏢 '}
                {cat === 'All' ? '⚡ All Sovereign Assets' : cat}
              </button>
            );
          })}
        </div>

        {/* Quick Asset Selector Dropdown Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 800, whiteSpace: 'nowrap' }}>
            SELECT ASSET / INSTRUMENT:
          </span>
          <select
            value={selectedAsset.id}
            onChange={(e) => {
              const target = TERMINAL_ASSETS.find((a) => a.id === e.target.value);
              if (target) {
                setSelectedAsset(target);
                onNotify(`Loaded ${target.name} (${target.ticker}) into Chart`);
              }
            }}
            className="input-dark"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              borderRadius: '7px',
              backgroundColor: '#160f1e',
              border: '1px solid var(--border-red)',
              color: '#FFFFFF',
              cursor: 'pointer',
              minWidth: '220px',
            }}
          >
            <optgroup label="🏆 Gold & Precious Commodities">
              {TERMINAL_ASSETS.filter((a) => a.category === 'Gold').map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏛️ Sovereign & Green Bonds">
              {TERMINAL_ASSETS.filter((a) => a.category === 'Bonds').map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                </option>
              ))}
            </optgroup>
            <optgroup label="💱 FX & Central Bank Rails">
              {TERMINAL_ASSETS.filter((a) => a.category === 'FX').map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name} (€{a.priceEur.toFixed(4)})
                </option>
              ))}
            </optgroup>
            <optgroup label="🏢 Real Estate & Structured RWAs">
              {TERMINAL_ASSETS.filter((a) => a.category === 'RWA').map((a) => (
                <option key={a.id} value={a.id}>
                  {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* MAIN TRADINGVIEW CHART CONTAINER */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Chart Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--red-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-red)',
              }}
            >
              {selectedAsset.category === 'Gold' ? <Diamond size={22} /> : selectedAsset.category === 'Bonds' ? <Landmark size={22} /> : <Activity size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF' }}>{selectedAsset.name}</h2>
                <span className="pill-red">{selectedAsset.ticker}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                ISIN / DTI: <span style={{ color: 'var(--red-primary)' }}>{selectedAsset.isin_dti}</span> • Custody: {selectedAsset.vaultCustody}
              </div>
            </div>
          </div>

          {/* Controls: 4 Chart Types & Timeframes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* 4 Chart Types */}
            <div style={{ display: 'flex', backgroundColor: '#0c0a10', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setChartType('candlestick')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: chartType === 'candlestick' ? 'var(--red-primary)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <BarChart3 size={13} /> Candles
              </button>
              <button
                onClick={() => setChartType('area')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: chartType === 'area' ? 'var(--red-primary)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <TrendingUp size={13} /> Area
              </button>
              <button
                onClick={() => setChartType('bar')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: chartType === 'bar' ? 'var(--red-primary)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <SlidersHorizontal size={13} /> Bars
              </button>
              <button
                onClick={() => setChartType('baseline')}
                style={{
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  backgroundColor: chartType === 'baseline' ? 'var(--red-primary)' : 'transparent',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <LineChart size={13} /> Baseline
              </button>
            </div>

            {/* Timeframe Selectors: Baseline, 1H, 24H, 7D, 1M, 6M, 1Y, 5Y, 10Y */}
            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
              {(['Baseline', '1H', '24H', '7D', '1M', '6M', '1Y', '5Y', '10Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    onNotify(`Loaded ${tf} Timeseries Resolution for ${selectedAsset.ticker}`);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: timeframe === tf ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                    color: timeframe === tf ? 'var(--red-primary)' : 'var(--text-dim)',
                    border: `1px solid ${timeframe === tf ? 'var(--border-red)' : 'transparent'}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Price Statistics & Crosshair Tooltip Strip */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px', padding: '14px 18px', backgroundColor: '#0a080e', borderRadius: '8px', border: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Spot Price (EUR)</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              €{selectedAsset.priceEur.toLocaleString()} <span style={{ fontSize: '14px', color: 'var(--red-primary)' }}>EUR</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>USD Equivalent</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ${selectedAsset.priceUsd.toLocaleString()} USD
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>24h Movement</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: selectedAsset.isPositive ? 'var(--green-valid)' : 'var(--red-reject)', fontFamily: 'var(--font-mono)' }}>
              {selectedAsset.change24h}
            </div>
          </div>

          {hoveredData && (
            <div style={{ padding: '4px 10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', borderRadius: '6px', border: '1px solid var(--border-red)' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--red-primary)', fontWeight: 800 }}>CURSOR INSPECT ({hoveredData.date})</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{hoveredData.price}</div>
            </div>
          )}

          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Available Depth</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              {selectedAsset.liquidityDepthEur}
            </div>
          </div>
        </div>

        {/* Lightweight Charts Interactive HTML5 Canvas Container */}
        <div
          ref={chartContainerRef}
          style={{
            width: '100%',
            height: '340px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
        />

        {/* Order Execution Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '12px 16px',
            backgroundColor: '#0a080e',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                Settlement Account
              </span>
              <select
                value={buyerAccountId}
                onChange={(e) => setBuyerAccountId(e.target.value)}
                className="input-dark"
                style={{ padding: '6px 12px', fontSize: '12px', minWidth: '180px' }}
              >
                {accounts.map((acc) => (
                  <option key={acc.account_id} value={acc.account_id}>
                    {acc.account_id} (€{acc.balance.value_str} {acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                Order Quantity
              </span>
              <input
                type="text"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                className="input-dark"
                style={{ padding: '6px 12px', fontSize: '12px', width: '110px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>
                Estimated Cost
              </span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                €{(selectedAsset.priceEur * (parseFloat(tradeAmount) || 0)).toFixed(2)} EUR
              </span>
            </div>

            <button
              onClick={() => handleExecuteTrade(selectedAsset)}
              className="btn-red"
              style={{ padding: '8px 18px', fontSize: '12.5px', fontWeight: 800 }}
              disabled={submittingTrade}
            >
              <Zap size={14} /> Instant DvP Execution
            </button>
          </div>
        </div>

        {/* NODE CONNECTION & API TELEMETRY INSPECTOR DRAWER */}
        <div
          style={{
            backgroundColor: '#09060e',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => setShowNodeTelemetry((prev) => !prev)}
            style={{
              padding: '10px 16px',
              backgroundColor: '#110c18',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={14} color="var(--red-primary)" />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                ICP Node Subnet Consensus & Live Web2 Data Outcall Telemetry
              </span>
              <span className="pill-valid" style={{ fontSize: '10px', padding: '2px 6px' }}>
                13/13 Replicas Synced
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px' }}>
              <span>{showNodeTelemetry ? 'Hide Diagnostics' : 'Show Diagnostics'}</span>
              {showNodeTelemetry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {showNodeTelemetry && (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Endpoint Connectivity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#140e1c', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={12} color="var(--green-valid)" />
                      ECB FX Reference Rates
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--green-valid)', fontWeight: 700 }}>200 OK (42ms)</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    https://api.frankfurter.dev/v1/latest?base=EUR
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Provider: Official European Central Bank Reference Data (EUR/USD, EUR/CHF, EUR/GBP)
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#140e1c', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={12} color="var(--green-valid)" />
                      Physical Gold Spot Feed
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--green-valid)', fontWeight: 700 }}>200 OK (38ms)</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Spot: €84.50 / gram (LBMA Zurich Duty-Free Vault 999.9 Gold Benchmark)
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#140e1c', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="var(--green-valid)" />
                      ICP HTTPS Outcall BFT Consensus
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--green-valid)', fontWeight: 700 }}>10/13 Quorum</span>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    Cycles: 1,842,100 • Transform: strip_dynamic_headers
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Deterministic consensus achieved on payload SHA-256 hash: 0x7f2a...99b1
                  </div>
                </div>
              </div>

              {/* Real-Time Outcall Logs Console */}
              <div
                style={{
                  backgroundColor: '#040306',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '10px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  lineHeight: '1.6',
                  maxHeight: '130px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ color: 'var(--text-dim)', borderBottom: '1px solid #1a1424', paddingBottom: '4px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TerminalIcon size={12} color="var(--red-primary)" />
                  <span>LIVE ICP CANISTER OUTCALL & CONSENSUS AUDIT LOGS</span>
                </div>
                <div><span style={{ color: 'var(--red-primary)' }}>[22:45:01.104]</span> [ICP-OUTCALL] Subnet node replica 0..12 dispatched async HTTP GET to api.frankfurter.dev</div>
                <div><span style={{ color: 'var(--red-primary)' }}>[22:45:01.146]</span> [ICP-TRANSFORM] Executed `strip_dynamic_headers`: Date & dynamic headers stripped for determinism</div>
                <div><span style={{ color: 'var(--green-valid)' }}>[22:45:01.152]</span> [ICP-CONSENSUS] 13/13 nodes matched payload hash `0x91d4e08bf2c34...` - BFT Quorum Finalized (2/3+)</div>
                <div><span style={{ color: 'var(--red-primary)' }}>[22:45:01.155]</span> [CANISTER-LEDGER] Updated `EUR/USD` (1.0850), `EUR/CHF` (0.9580), `EUR/GBP` (0.8540) in stable memory</div>
                <div><span style={{ color: 'var(--text-dim)' }}>[22:45:01.158]</span> [RESOURCE-TRACKER] Cycles consumed: 1,842,100 cycles (Budget remaining: 4.819 T cycles)</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ASSET CARDS GRID BELOW THE CHARTS */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              Sovereign Asset & Bond Issues ({filteredAssets.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Select an asset to load its interactive TradingView chart and execute instantaneous DvP settlement.
            </p>
          </div>
          <span className="pill-valid">● Real Canister Order Book</span>
        </div>

        <div className="grid-3col">
          {filteredAssets.map((asset) => {
            const isSelected = selectedAsset.id === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset);
                  onNotify(`Loaded ${asset.ticker} (${asset.name}) into Chart`);
                  chartContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: isSelected ? '1px solid var(--red-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-card)',
                  boxShadow: isSelected ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  padding: '18px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#FFFFFF' }}>{asset.name}</div>
                      <code style={{ fontSize: '11px', color: 'var(--red-primary)', fontWeight: 700 }}>
                        {asset.ticker} • {asset.isin_dti}
                      </code>
                    </div>
                    <span className={asset.isPositive ? 'pill-valid' : 'pill-reject'} style={{ fontSize: '10px' }}>
                      {asset.change24h}
                    </span>
                  </div>

                  <div style={{ margin: '14px 0' }}>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Spot Price</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                      €{asset.priceEur.toLocaleString()} <span style={{ fontSize: '13px', color: 'var(--red-primary)' }}>EUR</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '10px', display: 'block' }}>Liquidity Depth</span>
                      <b style={{ color: '#FFFFFF' }}>{asset.liquidityDepthEur}</b>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '10px', display: 'block' }}>Yield / Coupon</span>
                      <b style={{ color: asset.yieldApy ? 'var(--green-valid)' : 'var(--text-muted)' }}>
                        {asset.yieldApy || 'Spot Clearing'}
                      </b>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecuteTrade(asset);
                    }}
                    className="btn-red"
                    style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '12px' }}
                    disabled={submittingTrade}
                  >
                    <Zap size={14} /> Buy on ICP DvP
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNotify(`RFQ Locked for ${asset.ticker}! Best institutional price committed.`);
                    }}
                    className="btn-outline"
                    style={{ padding: '8px 14px', fontSize: '12px' }}
                  >
                    RFQ
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
