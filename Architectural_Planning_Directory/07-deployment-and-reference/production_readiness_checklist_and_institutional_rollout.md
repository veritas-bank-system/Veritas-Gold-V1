# 🏛️ Veritas Institutional Ledger — Comprehensive Production-Readiness Specification

## 📌 1. Executive Summary & Legal/Regulatory Boundaries

Veritas Institutional Ledger is engineered as an institutional-grade, permissioned digital-assets workstation on the Internet Computer (ICP). To transition from the current **100% Operational Sandbox / Acceptance Prototype** to **Live Institutional Production**, the following 6 pillars must be addressed:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRODUCTION READINESS 6-PILLAR ROADMAP                                  │
├──────────────────────────┬─────────────────────────────────────┬───────────────────────────────────────┤
│ Pillar                   │ Requirements & Target Architecture  │ Operational Verification Standard     │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 1. Regulatory Licences   │ • DLT Settlement System / MTF / CSD │ FINMA / BaFin / MiCA Regulatory       │
│    & Legal Opinions      │ • Banking Act Art. 37d (Custody)    │ Clearance & Supervisory Sandbox Exit  │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 2. Cryptographic Keys &  │ • FIPS 140-2 Level 4 HSM integration │ Threshold t-ECDSA (secp256k1) +       │
│    Hardware Signers      │ • WebAuthn / FIDO2 Hardware Keys    │ Multi-Party Computation (MPC) 2-of-2  │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 3. ICP Mainnet Subnet    │ • High-performance European Subnet  │ Canister Cycles Automation, SNS DAO   │
│    Deployment            │ • Blackhole Canister / DAO Control  │ Multi-Sig Controller Quorum           │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 4. Institutional Feeds   │ • Dual-Feed: ECB Frankfurter + FIX  │ Deterministic Canister Outcalls with  │
│    & Real Oracles        │ • LBMA Ultrasonic Vault IoT Sensors │ 10/13 BFT Node Replica Quorum Hash    │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 5. G10 FX Matrix         │ • Real-time USD, EUR, JPY, CHF, GBP │ Sub-second atomic DvP cross-currency  │
│                          │ • Wholesale Central Bank Rails      │ settlement and FX arbitrage corridors │
├──────────────────────────┼─────────────────────────────────────┼───────────────────────────────────────┤
│ 6. 10-Year GDPR On-Chain │ • Salted [u8; 32] PII Hashing       │ Zero raw PII in stable memory,        │
│    Data Shredding        │ • Off-Chain KMS Key Expiry (10-Yr)  │ Cryptographic key shredding at epoch  │
└──────────────────────────┴─────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 💱 2. G10 Major FX Currencies in RWA Terminal

The RWA Terminal and Mobile Workstation actively support all major G10 institutional currency corridors:

1. **`EUR/USD`** (€1.00 / $1.0850) — Euro / US Dollar Fiduciary Corridor (ECB Reference API)
2. **`USD/JPY`** (€0.0062 / ¥154.20) — US Dollar / Japanese Yen Wholesale Rail (BOJ-NET Bridge)
3. **`EUR/JPY`** (€1.00 / ¥167.35) — Euro / Japanese Yen Settlement Cross
4. **`EUR/CHF`** (€0.9580) — Euro / Swiss Franc Fiduciary Rail (Swiss National Bank Corridor)
5. **`EUR/GBP`** (€0.8540) — Euro / British Pound Sterling Rail (Bank of England Target2 Bridge)
6. **`USD/CHF`** (€0.8825 / $0.9650) — US Dollar / Swiss Franc Sovereign Corridor
7. **`AUD/USD`** (€0.6540 / $0.7160) — Australian Dollar / US Dollar Reserve Rail
8. **`USD/CAD`** (€0.7310 / $1.3650) — US Dollar / Canadian Dollar Energy Rail

---

## ⚙️ 3. Concrete Production Deployment Checklist

### Phase 1: Canister Controller & Governance Handover
- [ ] Transition canister controllers from individual developer principals to an **ICP Service Nervous System (SNS)** DAO or **N-of-M Multi-Sig Canister**.
- [ ] Top up Canister Cycles balance with a 50 TC reserve (approx. 2 years of autonomous operation).

### Phase 2: Hardware Security Modules (HSM)
- [ ] Replace software mock keys with direct **YubiKey 5 / Nitrokey** WebAuthn FIDO2 attestation.
- [ ] Configure threshold t-ECDSA signing canisters (`ic_cdk::api::management_canister::ecdsa`).

### Phase 3: Institutional Oracle Feeds
- [ ] Connect production FIX protocol feeds (Bloomberg B-PIPE / Refinitiv Elektron) via encrypted HTTPS outcall proxies.
- [ ] Mount ultrasonic density and thermal sensors in Zurich Duty-Free Vault ZRH-01 with automated cryptographic telemetry attestation.
