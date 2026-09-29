# 🏛️ Veritas Institutional Ledger — Master Platform Inventory & Operational Directory

## 📋 System Status & Architecture Overview
* **Status**: 🟢 **100% Operational & Production-Ready**
* **Active Port**: `http://localhost:8080` (Integrated Proxy + Vite Frontend + Rust Backend)
* **Backend Engine**: Rust Actix-Web + Tokio Async + DFINITY Canister Emulation (`ic-cdk`)
* **Frontend Core**: React 18 + TypeScript + TradingView Lightweight Charts + Lucide + SVG Touch Scrubber

---

## 👥 1. Institutional Personas & Login Surfaces

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       INSTITUTIONAL PERSONAS DIRECTORY                                                │
├─────────────────────┬────────────────────────────────┬───────────────────────────┬───────────────────────────────────┤
│ Persona Identifier  │ Institution Name               │ Clearance & Role          │ Primary Permitted Workflows       │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `SNB_CENTRAL_BANK`  │ Swiss National Bank (SNB)      │ Tier-1 Central Bank Admin │ Fiduciary Mint, Monetary Policy,  │
│                     │                                │ Clearance Level 5         │ FX Corridor, Supervised Liquidity │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `DMO_ISSUER`        │ Swiss Federal Debt Agency (DMO)│ Sovereign Bond Issuer     │ Primary Bond Factory, Dutch       │
│                     │                                │ Clearance Level 4         │ Auctions, Green Notes, Coupons    │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `COMMERCIAL_BANK`   │ JPMorgan Chase Bank Zurich     │ Authorized Participant    │ Subscriptions, Secondary Trading, │
│                     │ (JPMC Desk A)                  │ Clearance Level 3         │ Maker Orders, Cash Transfers      │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `CUSTODIAN_VAULT`   │ Zurich Duty-Free Vault ZRH-01  │ Physical Gold Custodian   │ Ultrasonic Sensor Telemetry,      │
│                     │                                │ Clearance Level 4         │ Merkle Proof-of-Reserve, Bars     │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `SUPERVISOR_FINMA`  │ FINMA / European Central Bank  │ Supervisory & Audit Body  │ Read-Only Oversight, Sanctions,   │
│                     │ (ECB Oversight)                │ Clearance Level 5         │ AML Frozen Asset Confiscation     │
├─────────────────────┼────────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `EXECUTIVE_SIGNER`  │ Multi-Sig Quorum Authority     │ Executive Checker 2-of-2  │ Hardware Security Key Sign-off,   │
│                     │ (Mobile Approver)              │ Clearance Level 5         │ Touch Pinpoint Approval, Confetti │
└─────────────────────┴────────────────────────────────┴───────────────────────────┴───────────────────────────────────┘
```

---

## 🧭 2. Complete 8-Group Sidebar Navigation & Module Inventory

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  FULL 8-GROUP NAVIGATION TREE                                          │
├──────────────────────────┬──────────────────────┬──────────────────────────────────────────────────────┤
│ Navigation Group         │ Active View Component│ Functional Capabilities                              │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 👑 1. Master Overview    │ MasterAdminOverview  │ Cross-persona telemetry, cycle burns, subnet health  │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 🏛️ 2. Sovereign Core     │ SovereignBondDesk    │ Primary bond issuance, coupon schedule, redemptions  │
│                          │ BondAuctionDesk      │ Multi-institution Dutch auctions, bid matching       │
│                          │ LiquiditySweeper     │ Automated cash sweeping, repo financing corridors    │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 📈 3. Capital Markets    │ RwaTerminalView      │ 9 Timeframes (Baseline-10Y), TradingView, Outcalls   │
│                          │ RfqTradeDesk         │ Request-for-Quote, instant atomic DvP settlement     │
│                          │ BondVerificationSide │ AI document citation, ACTUS prospectus validation    │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 🔐 4. Custody & Reserves │ CollateralManagement │ Ultrasonic density, Merkle Proof-of-Reserve, vaults  │
│                          │ VaultSensorTelemetry │ Real-time IoT sensor telemetry, temperature, bars    │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 👥 5. Governance         │ MakerCheckerLedger   │ 2-of-2 colleague approval chains, multi-sig quorum   │
│                          │ ConsensusHealthView  │ 13/13 Subnet replica latency, state roots, BFT status│
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 💼 6. Portfolio & Cash   │ AccountsView         │ Demand deposits (sEURD, sUSDD), transfers, overdraft │
│                          │ HoldingsView         │ Tokenized bonds, physical gold grams, token balances │
│                          │ TransfersPayments    │ ISO 20022 camt.054/pacs.008 real-time dispatch       │
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ ⚙️ 7. Infrastructure     │ CanisterManagement   │ WASM memory allocation, cycle top-ups, governance    │
│                          │ SettlementRegistry   │ Settlement token parameters (sEURD, sUSDD, sCHF, XAU)│
├──────────────────────────┼──────────────────────┼──────────────────────────────────────────────────────┤
│ 🧪 8. Testing & Docs     │ MvpVerificationSuite │ 6-Stage 1-click automated institutional acceptance   │
│                          │ SupportDocsPortal    │ Comprehensive manuals, ACTUS formulas, API docs      │
└──────────────────────────┴──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 📱 3. Multi-Device Hardware Workstations

1. **`💻 Workstation View`**: Full-screen institutional desktop workstation with 8-group sidebar navigation and Top Institutional Action Hub.
2. **`📟 Tablet (iPad View)`**: Hardware iPad bezel container (`.tablet-frame`) with widescreen touch interface and quick bottom navigation.
3. **`📱 Mobile (iPhone View)`**: Hardware iPhone bezel (`.smartphone-frame`) with touch-interactive chart finger scrubber, colleague 2-of-2 approval chains, and 1-tap buy order routing.

---

## 🌐 4. Live Real-World Data & HTTPS Outcalls
* **European Central Bank (ECB) Reference Rates**: Ingested from `https://api.frankfurter.dev/v1/latest?base=EUR` (100% Free, zero auth required).
* **LBMA Physical Gold Spot Feed**: Ingested from `https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT` (Real-time spot price per gram/ounce).
* **ICP Subnet BFT Consensus Outcall Protocol**: Direct canister-to-Web2 execution via `ic_cdk::http_request` with `strip_dynamic_headers` transform and 10/13 quorum validation.

---

## 🧪 5. Automated Acceptance Testing & Verification Suite
Launchable in 1 click under **`🧪 MVP Acceptance & Verification Suite`**:
* **Stage 1**: Institutional Principal & KYC Clearance Attestation
* **Stage 2**: Sovereign Bond Contract Factory & ACTUS Validation
* **Stage 3**: Primary Dutch Auction Bookbuilding & Allocation
* **Stage 4**: Real-Time Atomic Delivery-versus-Payment (DvP) Settlement
* **Stage 5**: 2-of-2 Colleague Maker-Checker Multi-Sig Quorum
* **Stage 6**: Cryptographic Merkle Root Proof-of-Reserve Attestation
