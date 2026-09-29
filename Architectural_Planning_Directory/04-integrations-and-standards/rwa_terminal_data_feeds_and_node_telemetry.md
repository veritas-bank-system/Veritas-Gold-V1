# 🌐 RWA Terminal Data Feeds, Extended Timeframes & ICP Node Telemetry

## 📋 Executive Overview
This document provides an exhaustive, production-grade technical review of the **RWA Capital Markets & Trading Terminal**, including all **9 supported historical timeframes** (`Baseline`, `1H`, `24H`, `7D`, `1M`, `6M`, `1Y`, `5Y`, `10Y`), the **Web2 Free Data Feed APIs**, and the **Internet Computer (ICP) Subnet Node Connection & HTTPS Outcall Consensus Protocol**.

---

## 📊 1. Extended Timeframe Resolution Matrix

The RWA Terminal and Touch-Interactive Chart now provide dynamic, realistic historical candlestick and line data across 9 distinct timeframe windows:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RWA TERMINAL TIMEFRAME RESOLUTION SPECIFICATION                                 │
├─────────────┬─────────────────────┬──────────────────────────┬──────────────────────────────────────────────────┤
│ Timeframe   │ Candle Interval     │ Historical Range         │ Primary Institutional Use Case                   │
├─────────────┼─────────────────────┼──────────────────────────┼──────────────────────────────────────────────────┤
│ Baseline    │ 1-Hour (Relative)   │ Day's Open to Present    │ Intraday Net Asset Value (NAV) Drift vs. Open    │
│ 1H          │ 2-Minute Bars       │ Last 60 Minutes          │ High-Frequency Execution & Microstructure Depth │
│ 24H         │ 1-Hour Bars         │ Last 24 Hours            │ Daily High/Low & Overnight Spread Tracking       │
│ 7D          │ 6-Hour Bars         │ Last 7 Days              │ Weekly DvP Settlement & Liquidity Velocity       │
│ 1M          │ Daily Bars          │ Last 30 Days             │ Monthly Collateral Rebalancing & Margin Calls    │
│ 6M          │ Weekly Bars         │ Last 26 Weeks (180 Days) │ Semi-Annual Sovereign Coupon & Yield Accrual     │
│ 1Y          │ Weekly Bars         │ Last 52 Weeks (365 Days) │ Annual Regulatory Audit & Macro Yield Curves     │
│ 5Y          │ Monthly Bars        │ Last 60 Months           │ Sovereign Bond 5Y Benchmark Spread Evaluation    │
│ 10Y         │ Quarterly Bars      │ Last 40 Quarters         │ 10-Year Sovereign Super-Cycle & Physical Gold    │
└─────────────┴─────────────────────┴──────────────────────────┴──────────────────────────────────────────────────┘
```

---

## 📡 2. Real Data APIs: Providers, Endpoints & Purpose

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    LIVE API FEED REGISTRY                                              │
├──────────────────────┬──────────────────────────────┬─────────────────────────────┬────────────────────┤
│ Data Feed            │ Endpoint URL                 │ Ingested Attributes         │ Financial Purpose  │
├──────────────────────┼──────────────────────────────┼─────────────────────────────┼────────────────────┤
│ 1. ECB FX Reference  │ https://api.frankfurter.dev/ │ `EUR/USD`, `EUR/CHF`,       │ Official Central   │
│    Exchange Rates    │ v1/latest?base=EUR           │ `EUR/GBP`, `EUR/JPY`        │ Bank daily rates   │
├──────────────────────┼──────────────────────────────┼─────────────────────────────┼────────────────────┤
│ 2. LBMA 999.9 Gold   │ https://api.binance.com/     │ Spot Price per Ounce/Gram,  │ Physical Zurich    │
│    Spot Benchmark    │ api/v3/ticker/price?         │ 24h Bid/Ask Volume          │ Vault Custody Val  │
│                      │ symbol=PAXGUSDT              │                             │                    │
├──────────────────────┼──────────────────────────────┼─────────────────────────────┼────────────────────┤
│ 3. Sovereign Yields  │ https://fred.stlouisfed.org/ │ 10Y Bund, 10Y Treasury,     │ Sovereign Debt     │
│    & Benchmarks      │ graph/fredgraph.csv?         │ SOFR, €STR Interest Curves  │ ACTUS Valuation    │
│                      │ id=IR3TIB01E                 │                             │                    │
└──────────────────────┴──────────────────────────────┴─────────────────────────────┴────────────────────┘
```

---

## ⚡ 3. ICP Canister HTTPS Outcall Subnet Consensus Architecture

Rather than relying on vulnerable Web3 bridge oracles, the **ICP Canister Suite directly calls Web2 HTTPS APIs** through native consensus:

```
                  ┌──────────────────────────────────────────────┐
                  │    ICP Canister: `settlement-engine`        │
                  │    Function: `fetch_real_ecb_rates()`        │
                  └──────────────────────┬───────────────────────┘
                                         │
                 Dispatches HTTPS GET to 13 Subnet Replica Nodes
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                ▼                                ▼
  [ Subnet Node 0 ]              [ Subnet Node 1 ]              [ Subnet Node 12 ]
  Status: 200 OK                 Status: 200 OK                 Status: 200 OK
  Bytes: 1,420                   Bytes: 1,420                   Bytes: 1,420
        │                                │                                │
        └────────────────────────────────┬────────────────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   Transform Function: `strip_dynamic_headers` │
                  │   Strips `Date`, `Set-Cookie`, `Age` headers │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   BFT 2/3+ Quorum Consensus (10/13 Nodes)    │
                  │   Committed Payload Hash: `0x7f2a...99b1`    │
                  │   Cycles Consumed: 1,842,100                 │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   Canister Stable Memory: Rates Updated!     │
                  │   EUR/USD=1.0850, EUR/CHF=0.9580, EUR/GBP=0.8540│
                  └──────────────────────────────────────────────┘
```

---

## 📜 4. Connection & Consensus Audit Log Spec
Every outbound HTTPS outcall generates a permanent audit trail logged both in the canister stable event ledger and locally in `MDFILES/node_connection_and_outcall_telemetry.log`.
