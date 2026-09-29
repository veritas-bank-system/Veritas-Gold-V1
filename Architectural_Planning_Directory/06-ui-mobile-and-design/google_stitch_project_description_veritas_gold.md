# Google Stitch UI/UX & System Specification
## Project: Moneta Web3 — Veritas Gold (v0.1)
### Institutional Enterprise & Central Bank P2P Network for Tokenized Gold, Sovereign Bonds & RWAs
**Date:** 2026-09-01  
**Category:** Enterprise FinTech / Central Bank Digital Settlement & RWA Tokenization  
**License:** Licensed to ICP Moneta • Zurich Financial Center

---

## 1. Project Overview & Pitch

**Moneta Web3 / Veritas Gold** is an enterprise-grade, institutional peer-to-peer (P2P) financial network built on the **Internet Computer (ICP) protocol**, engineered specifically for **Central Banks, Tier-1 Commercial Banks, and Global Corporate Treasuries**. 

The platform bridges traditional financial infrastructure (SWIFT, RTGS, ISO 20022) with next-generation decentralized settlement, enabling 24/7 instant cross-border wire transfers, atomic Delivery-versus-Payment (DvP) trading of Real-World Assets (allocated Swiss physical gold, US Treasury Bills, prime commercial real estate), intraday repo lending, and seamless ERP general ledger integration (SAP S/4HANA, Oracle NetSuite).

---

## 2. Target Personas & User Roles

| Persona | Description & Primary Use Case |
| :--- | :--- |
| **Institutional Corporate Treasurer** | Manages multi-currency demand deposit accounts (EURD, USDD, JPMD), initiates instant cross-border wires, and conducts automated FX conversions. |
| **Fixed Income & Commodities Trader** | Executes atomic P2P trades for sovereign bonds and physical gold, requests 15-second guaranteed RFQ price locks, and manages collateral positions. |
| **Swiss Vault Custodian & RWA Issuer** | Mints and anchors tokenized assets to allocated physical bullion in Swiss vaults, verifying gold bar serial numbers and canton-notarized deeds. |
| **Central Bank Supervisor & Regulator** | Uses dual-key cryptographic unmasking to monitor systemic liquidity, verify zero double-spend notarization, and inspect counterparty solvency. |
| **Operations & SRE Officer** | Monitors decentralized canister partition health, sub-second block latency, and protocol coordinator consensus flows. |

---

## 3. Core Application Surfaces & UI Architecture (Google Stitch Prompts)

### 💳 Surface 1: Tokenized Deposits & Virtual Corporate Card (JPMD Style)
- **Visual Design**: Sleek titanium / obsidian dark-mode corporate card surface with embossed account IDs, currency badges (`EURD`, `USDD`, `ICP`), and dynamic spending power counters (`€4,500.00 EUR`).
- **Functionality**:
  - Sub-ledger cash partitions with real-time balance tracking.
  - Approved intraday overdraft facility and daily velocity withdrawal caps.
  - 1-tap "Quick Pay" transfer modal to verified counterparties (Alice Trading Corp, Bob Commodities LLC, Swiss Vault).

### 🏷️ Surface 2: Bilateral P2P RWA Orderbook & Atomic DvP Desk
- **Visual Design**: High-density Bloomberg-style financial terminal with asset class icons (🏆 LBMA Gold, 🏛️ US Treasuries, 🏢 Swiss Real Estate).
- **Functionality**:
  - Live bilateral bids and offers with standard ticket sizes and institutional block sizes.
  - 1-Click Atomic DvP Execution: Single transaction debiting buyer cash, crediting seller cash, and transferring the RWA UTXO with zero settlement risk.
  - Modal to publish custom institutional sell offers with custom unit prices and quantities.

### ⚡ Surface 3: Institutional RFQ (Request-for-Quote) Trade Desk
- **Visual Design**: High-speed trading terminal featuring a circular 15-second countdown timer, real-time bid/ask spread indicators, and institutional price depth.
- **Functionality**:
  - Instant executable price locks with tight 0.015% interbank spreads.
  - 1-Tap direct execution with sub-second finality and cryptographic SHA-256 notary receipts.

### 🏦 Surface 4: Collateral & Intraday Repo Desk
- **Visual Design**: Risk management matrix displaying encumbered assets, pledgee allocations, and dynamic borrowing power gauges.
- **Functionality**:
  - Collateral encumbrance into smart contract escrow.
  - Dynamic risk-adjusted borrowing capacity calculation: $\text{Borrowing Capacity} = \text{Market Value} \times (1 - \text{Haircut})$ (2% for US Treasuries, 5% for Gold).
  - Direct allocation of collateral to Central Banks or prime broker clearinghouses.

### 📊 Surface 5: Treasury History, ERP GL Accounting & Export Suite
- **Visual Design**: Audited accounting ledger with filterable General Ledger accounts (`GL-1010-01`, `GL-1520-03`, `GL-1530-01`), ISO 20022 message tags, and audit action buttons.
- **Functionality**:
  - **1-Click RFC-4180 CSV Export**: Formatted for direct ingestion into SAP S/4HANA, Oracle NetSuite, and Bloomberg AIM.
  - **1-Click ISO 20022 / ACTUS JSON Export**: Complete programmatic data package for automated accounting pipelines.
  - **Printable Official Bank Statement**: Formal PDF certificate with institutional branding, double-entry legs, and cryptographic notary attestation stamps.

### 🕶️ Surface 6: Central Bank Supervisory Radar (Dual-Key Privacy)
- **Visual Design**: Mission-control radar interface showing encrypted anonymous hashes (`ryjl3-hexae...`) transitioning to unmasked legal entities (`Alice Trading Corp (Zurich)`).
- **Functionality**:
  - Preserves peer-to-peer market privacy while providing Central Banks and regulators with lawful cryptographic unmasking capabilities.
  - Zero double-spend consensus invariant watchdog.

---

## 4. Financial & Blockchain Standards Compliance

- **ISO 20022 Messaging**: `pain.001` (Customer Wire), `pacs.008` (Interbank Wire), `camt.053` (Bank Statement GL), `sese.023` / `setr.016` (Securities Settlement), `coll.001` / `coll.002` (Collateral).
- **ISO 24165 (Digital Token Identifier - DTI)**: `DTI-EURD-9941`, `DTI-GOLD-8821`, `DTI-USTB-3312`, `DTI-PROP-ZH44`.
- **ACTUS Cash-Flow Standards**: `PAM` (Principal at Maturity) & `LAX` (Linear Amortizing).
- **SWIFT On/Off Ramp Verification**: Explicit verification binding traditional SWIFT BIC / IBAN clearance references to Internet Computer Canister Principals.

---

## 5. Technology Stack
- **Backend**: 100% Pure Rust (10 workspace crates) compiling to WebAssembly / Axum HTTP Gateway.
- **Frontend**: TypeScript, React 19, Lucide Icons, Vite, Responsive Grid & Mobile Simulator Frame.
- **Consensus & Notary**: Internet Computer (ICP) Canister State Machine with SHA-256 Attestation.
