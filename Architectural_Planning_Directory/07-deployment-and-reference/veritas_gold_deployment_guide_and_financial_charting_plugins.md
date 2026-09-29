# Veritas Gold: Enterprise Deployment Guide & React Financial Charting Solutions

## 🚀 Part 1: How to Deploy Veritas Gold

Veritas Gold can be deployed in two enterprise configurations:

---

### Option A: Internet Computer Protocol (ICP) Mainnet Deployment

Deploying Veritas Gold directly onto the ICP global network as autonomous WebAssembly Canisters:

#### 1. Prerequisites
- Install the DFINITY SDK (`dfx`):
  ```bash
  sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
  ```
- Obtain Cycles or an ICP Wallet Identity (`dfx identity new central_bank_admin`).

#### 2. Configure `dfx.json`
```json
{
  "canisters": {
    "veritas_backend": {
      "type": "rust",
      "package": "icp-canister-suite",
      "candid": "crates/icp-canister-suite/src/canister.did"
    },
    "veritas_frontend": {
      "type": "assets",
      "source": ["frontend/dist"]
    }
  },
  "defaults": {
    "build": {
      "packtool": ""
    }
  },
  "networks": {
    "ic": {
      "providers": ["https://ic0.app"],
      "type": "ephemeral"
    }
  }
}
```

#### 3. Build & Deploy Command
```bash
# 1. Compile the React frontend
cd frontend && npm run build && cd ..

# 2. Deploy all canisters to ICP Mainnet
dfx deploy --network ic --with-cycles 2000000000000
```
> **Result**: Your application is live at `https://<canister-id>.icp0.io` with zero cloud server bills, instant HTTPS, and reverse-gas execution.

---

### Option B: Docker / Kubernetes On-Premise & Cloud Deployment (AWS / GCP / Bare-Metal)

For central banks requiring private on-premise infrastructure behind hardware HSM firewalls:

#### 1. Multi-Stage Production `Dockerfile`
```dockerfile
# Stage 1: Build Rust Backend
FROM rust:1.80-slim as backend-builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
RUN cargo build --release -p icp-canister-suite

# Stage 2: Build React Frontend
FROM node:20-slim as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 3: Minimal Production Image
FROM debian:bookworm-slim
WORKDIR /app
COPY --from=backend-builder /app/target/release/icp-canister-suite /app/server
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080

CMD ["/app/server"]
```

#### 2. Run Container
```bash
docker build -t veritas-gold:latest .
docker run -d -p 8080:8080 --name veritas-sovereign-node veritas-gold:latest
```

---

## 📈 Part 2: Top React & TypeScript Financial Charting Solutions

For institutional stock, bond, gold, and crypto trading terminals with **Candlestick (OHLCV)**, **Volume**, and **Order Book Depth** charts:

| Library | Best Use Case | Performance & Technology | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **1. TradingView Lightweight Charts (`lightweight-charts`)** ⭐ **#1 Gold Standard** | Stock, Gold & Crypto Candlesticks, Price Indicators, MA/EMA overlays | High-speed HTML5 Canvas, zero lag, lightweight (~40KB) | Native mobile pinch & swipe gestures |
| **2. Apache ECharts (`echarts` / `echarts-for-react`)** | Complex Macro Curves, Multi-Asset Depth, Yield Curve Surfaces | Canvas & SVG rendering, extensive enterprise financial themes | Smooth touch panning |
| **3. Highcharts Stock (`highcharts-react-official`)** | Traditional Bank Portals, Bloomberg-style technical indicators (RSI, MACD, Bollinger) | High feature density, extensive built-in technical indicators | Touch optimized |

---

### 💡 Recommendation: TradingView Lightweight Charts Example for React

Install via npm:
```bash
npm install lightweight-charts
```

Drop-in React TypeScript Component:
```tsx
import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';

export const GoldCandlestickChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#060608' },
        textColor: '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(239, 68, 68, 0.08)' },
        horzLines: { color: 'rgba(239, 68, 68, 0.08)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 320,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    // Sample Gold XAU/USD OHLCV Data
    candlestickSeries.setData([
      { time: '2026-08-25', open: 2510.0, high: 2525.5, low: 2505.0, close: 2520.0 },
      { time: '2026-08-26', open: 2520.0, high: 2535.0, low: 2515.2, close: 2530.8 },
      { time: '2026-08-27', open: 2530.8, high: 2548.0, low: 2528.0, close: 2542.1 },
    ]);

    return () => chart.remove();
  }, []);

  return <div ref={chartContainerRef} style={{ width: '100%', height: '320px' }} />;
};
```
