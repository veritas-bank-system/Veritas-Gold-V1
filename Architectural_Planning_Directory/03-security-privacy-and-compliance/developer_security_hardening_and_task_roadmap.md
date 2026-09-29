# 🛠️ Veritas Institutional Ledger — Developer Security Hardening & Task Roadmap

## 📋 Executive Overview
This document provides the canonical security hardening specification, architectural review, and prioritized developer task backlog for the **Veritas Institutional Ledger** on the **Internet Computer (ICP)**, integrating native HTTPS Outcalls for real-world market data (ECB FX & Gold) and enforcing strict institutional compliance.

---

## 🔒 1. Core Security Hardening Rules for Developers

### 1.1 Reentrancy & Asynchronous Await Protection (`CallerGuard`)
* **Invariant**: Canister state can mutate across asynchronous await boundaries (`.await` on inter-canister calls or `http_request` outcalls).
* **Mandate**: All state-modifying update methods must acquire an in-flight execution lock (`CallerGuard`) before calling `await` and release it upon completion. Concurrent reentrant invocations from the same principal must trap immediately.

### 1.2 Resource Exhaustion & Cycle Draining Defense
* **Invariant**: Unbounded external HTTP calls or large payloads can rapidly deplete canister cycles and subnet memory.
* **Mandate**:
  * Enforce `max_response_bytes: 2048` on all HTTPS outcalls.
  * Implement a 15-minute response cache on market rate queries to avoid redundant network outcalls.
  * Set a maximum cycle allocation cap per HTTP request (e.g. `2_000_000_000` cycles).

### 1.3 Zero-Trust Access Control (RBAC + ABAC)
* **Invariant**: Anonymous callers must never access non-public state or execute transactions.
* **Mandate**:
  * Explicitly reject `Principal::anonymous()` on all update methods:
    ```rust
    if ic_cdk::caller() == Principal::anonymous() {
        ic_cdk::trap("Anonymous caller unauthorized");
    }
    ```
  * Enforce `Maker ≠ Checker` for all operations above €100,000 nominal value.

### 1.4 Dual-Layer Data Privacy: 10-Year Statutory Retention vs. GDPR Art. 17
* **Invariant**: Blockchain immutability conflicts with GDPR "Right to be Forgotten", while MiFID II Art. 16(6) and Swiss BankG mandate 10-year statutory record retention.
* **Mandate**:
  * **On-Chain Rust Canisters**: Store strictly `[u8; 32]` salted SHA-256 hashes of client dossiers and opaque Principal IDs (strictly **zero raw PII**).
  * **Off-Chain PostgreSQL**: Retains AES-256-GCM encrypted dossiers with an immutable 10-year countdown.
  * **Cryptographic Key Shredding**: Upon statutory expiration (Year 10 + 1 day), KMS keys are deleted, rendering on-chain hashes permanently irreversible and cryptographically anonymized.

---

## 🌐 2. Live Free Real-World Data API Integration

Developers must connect to the following free, zero-license endpoints via native ICP HTTPS outcalls:
1. **European Central Bank (ECB) Reference FX Rates**:
   * Endpoint: `https://api.frankfurter.dev/v1/latest?base=EUR`
   * Provides daily official rates for `EUR/USD`, `EUR/CHF`, `EUR/GBP`, `EUR/JPY`.
2. **Physical Gold Spot Benchmark (LBMA 999.9 Gold)**:
   * Endpoint: `https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT`
   * Provides real-time market spot price per Fine Troy Ounce.

---

## 📋 3. Prioritized Developer Task Checklist

### Phase 1: Security Hardening & Canister Invariants
- [x] Integrate `CallerGuard` pattern on all async update endpoints in `settlement-engine` and `account-ledger`.
- [x] Enforce `u128` integer minor unit decimal math (0 floating-point operations) across balance calculations.
- [x] Implement `strip_dynamic_headers` transform function for BFT consensus on HTTPS outcalls.
- [x] Configure cycle monitoring and auto-top-up thresholds in `ops-governance`.

### Phase 2: Real Data Feeds & Oracle Subnet Integration
- [x] Integrate Frankfurter ECB live rate fetcher with local cache fallback in `frontend/src/services/api.ts`.
- [x] Add real-time TradingView candlestick chart with touch/slide value pinpointing in `TouchInteractiveChart.tsx`.
- [ ] Connect FRED API / Eurostat for sovereign 10Y benchmark yield curve ingestion.

### Phase 3: Governance, Multi-Sig & Mobile Approvals
- [x] Build 2-of-2 maker-checker approval chain with colleague progression tracking.
- [x] Deploy responsive mobile/tablet workstation (`InstitutionalMobileSurface.tsx`) with auto-closing categorized menu.
- [x] Implement in-app 6-stage automated acceptance test runner (`MvpVerificationSuiteView.tsx`).

### Phase 4: Production Authorizations & Audit Readiness
- [ ] Implement WebAuthn / Passkey FIDO2 cryptographic signature verification canister.
- [ ] Connect off-chain PostgreSQL with KMS automated key-shredding cron job for GDPR compliance.
- [ ] Perform independent external smart-contract security audit and penetration testing.

---

## 🏆 Summary
With these security controls and task guidelines in place, developers can ensure maximum operational resilience, regulatory compliance, and zero-drift settlement finality across the Veritas platform.
