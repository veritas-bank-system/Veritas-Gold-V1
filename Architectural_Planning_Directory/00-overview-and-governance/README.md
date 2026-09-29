# Moneta Web3 — Veritas Gold (v0.1)
### Enterprise & Blockchain-Based Real-World Asset (RWA) Market for Central Banks and Enterprises
*A subsidiary of **ICP Moneta** • Licensed to **ICP Moneta***

---

## 🌟 Executive Summary

**Veritas Gold (v0.1)** is an institutional-grade, standalone **Rust-based** financial ledger and Real-World Asset (RWA) exchange engine architected natively for the **Internet Computer (ICP)** and sovereign decentralized networks. 

Engineered specifically for **Central Banks, Institutional Liquidity Desks, Sovereign Wealth Funds, and Enterprise Treasuries**, Veritas Gold provides a high-throughput, mathematically verifiable infrastructure to tokenize, custody, transfer, and trade real-world financial assets—including **LBMA Physical Gold, Sovereign Government Debt Bonds (US Treasuries), Noble Metals, Commercial Real Estate, and tokenized fiat settlement reserves (ckUSD, ckEUR, EUR, USD)**.

---

## 🏗️ Core Architecture & Tech Stack

Veritas Gold is written from the ground up in **100% pure Rust** with strict non-panicking code paths, exact decimal financial precision (`rust_decimal`), orthogonal stable persistence, and high-performance WebAssembly (`wasm32-unknown-unknown`) compilation for ICP canisters.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VERITAS GOLD CANISTER SUITE                                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
  │                                               │                                               │
  ▼                                               ▼                                               ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐  ┌────────────────────────────────┐
│      SETTLEMENT ENGINE         │  │       FINALITY AUTHORITY       │  │        POLICY ENGINE           │
│   Global UTXO & State Store    │  │  Double-Spend Notary Consensus │  │  Conservation of Value Gates  │
└────────────────────────────────┘  └────────────────────────────────┘  └────────────────────────────────┘
  │                                               │                                               │
  ▼                                               ▼                                               ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐  ┌────────────────────────────────┐
│         ASSET LEDGER           │  │        POSITION LEDGER         │  │       IDENTITY REGISTRY        │
│  UTXO Coin Selection & Split   │  │   Demand Deposits & Limits     │  │   Blinded Keys & KYC Profiles  │
└────────────────────────────────┘  └────────────────────────────────┘  └────────────────────────────────┘
```

### 🦀 Rust Crate Topology
1. **`crates/domain`**: Foundational value objects (`Amount`, `CurrencyCode`, `PrincipalId`, `AccountId`, `HoldingId`, `RecordPointer`), rich entities (`DemandDepositRecord`, `FungibleAssetHolding`, `DiscreteAssetHolding`, `BlindedIdentity`), and typed domain errors.
2. **`crates/policy-engine`**: Deterministic verification policies (`AssetConservationPolicy`, `AccountRuleSet`, `SignaturePolicy`, `PolicyEngine`).
3. **`crates/finality-authority`**: Atomic consensus notary preventing double-spends and issuing cryptographic SHA-256 `FinalityProof` attestations.
4. **`crates/settlement-engine`**: Authoritative record state machine with inverted participant indexing (`LocalLedgerView`).
5. **`crates/identity-registry`**: Enterprise directory for verified legal entities and zero-knowledge `BlindedIdentity` generation with ownership proofs.
6. **`crates/position-ledger`**: Multi-currency cash partitions, demand deposits, approved overdraft facilities, and daily velocity checks.
7. **`crates/asset-ledger`**: Digital asset issuance (minting), split-and-move mechanics, and automated UTXO coin selection.
8. **`crates/protocol-coordinator`**: Asynchronous multi-party state machine orchestrator for wire transfers, asset movements, and blinded identity swaps.
9. **`crates/icp-canister-suite`**: ICP Canister environment, Candid interface bindings, and high-performance JSON-RPC gateway.
10. **`crates/shared-testkit`**: Comprehensive integration and property-based test harness verifying 100% invariant preservation.

### 💻 Frontend Tech Stack
- **React 19 + TypeScript + Vite**
- **Red Broadcast Design System**: High-contrast, institutional dark/light surfaces, 9999px pill components, flat financial input borders, and responsive layouts.
- **Lucide Icons** & **Roboto / Roboto Mono** typography.

---

## ⚡ Key Platform Features

### 1. 🥇 RWA Tokenization & Buyable Asset Catalog
Directly issue, evaluate, and trade tokenized real-world assets:
- **🏆 LBMA Physical Gold (1 oz Bar)**: 99.99% pure allocated physical bars secured in Swiss vaults.
- **🏛️ Sovereign Government Debt (US Treasury 3M Bills - AA+)**: Direct sovereign yield guarantees.
- **🏢 Commercial Real Estate Equity**: Fractionalized prime commercial property equity notarized on-chain.
- **🪙 Tokenized Settlement Reserves**: Institutional cash reserves including **ckUSD**, **ckEUR**, **EUR**, and **USD**.

### 2. 🕶️ Dual-Key Institutional Privacy & Regulatory Supervision
- **Peer-to-Peer Commercial Privacy**: Market participants trade using ephemeral **`BlindedIdentity`** addresses (`ryjl3-hexae...`), protecting trade strategies, volume, and portfolio balances from competitor observation and front-running.
- **100% Central Bank & Admin Oversight**: The **Supervisory Radar** enables authorized regulatory authorities to unmask legal entity ownership, monitor concentration limits, and verify systemic solvency invariants in real time with cryptographic attestation proofs.

### 3. 🤝 Peer-to-Peer RWA Trade Book & Atomic DvP Settlement
- **Institutional Orderbook**: Create and publish custom sell offers for tokenized government bonds, physical gold, and real estate.
- **Atomic Delivery-versus-Payment (DvP)**: 1-click offer acceptance atomically debits buyer cash, credits seller cash, and transfers the RWA UTXO in a single atomic transaction with zero counterparty default risk.

### 4. ⚡ Request-for-Quote (RFQ) Trade Desk
- Request guaranteed price quotes for physical gold and bonds with a live **15-second countdown timer**.
- **Best Execution Advisory**: Institutional spread transparency and instant one-tap settlement.

### 5. 🏛️ Digital Banking Card & Wire Surface
- **Virtual Titanium Corporate Card**: Real-time spending power calculation (Settled Balance + Overdraft Facility).
- **Instant Wire Payments**: Sub-second inter-account transfers with daily velocity caps.
- **Quick Pay Contacts**: Instant settlement to pre-approved institutional counterparties.

---

## 🚀 Quickstart & Local Deployment

### 1. Prerequisites
- **Rust Toolchain**: `rustc >= 1.80` with target `wasm32-unknown-unknown`
- **Node.js**: `node >= 20.0` and `npm >= 10.0`

### 2. Build & Test Rust Backend
```bash
# Run full workspace unit and integration test suite
cargo test --workspace

# Verify WebAssembly target compilation for ICP canisters
cargo check --target wasm32-unknown-unknown --workspace --lib

# Run strict linter and formatting checks
cargo clippy --workspace --all-targets -- -D warnings
cargo fmt --check
```

### 3. Start Local Backend Gateway
```bash
cargo run -p icp-canister-suite
# Backend running at: http://localhost:8080
# Health Check: http://localhost:8080/health
```

### 4. Launch Frontend Web Application
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
# Frontend running at: http://localhost:5173
```

---

## 📜 Versioning & Legal Notice

- **System Version**: `v0.1`
- **Entity**: **Veritas Gold**, a subsidiary of **ICP Moneta**.
- **License**: Proprietary License to **ICP Moneta**. All rights reserved.
