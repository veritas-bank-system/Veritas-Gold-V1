# Standards Mapping Specification: ISO 20022, ISO 24165 (DTI), OpenAPI, FIX, FpML & ACTUS
### Moneta Web3 — Veritas Gold (v0.1) • Licensed to ICP Moneta
**Date:** 2026-09-01  
**Architecture:** Internet Computer (ICP) Canister Financial Ledger & Multi-Asset RWA Settlement Engine

---

## 1. Executive Overview

This document specifies the institutional integration matrix mapping decentralized on-chain **Internet Computer (ICP) Canister operations** to canonical global financial standards:
- **ISO 20022**: Global financial messaging standard (`pain.001`, `pacs.008`, `camt.053`, `coll.001`, `sese.*`, `setr.*`).
- **ISO 24165**: Digital Token Identifier (DTI) registered for each on-chain tokenized asset (`EURD`, `USDD`, `GOLD`, `USTB`, `PROP_ZH`).
- **OpenAPI 3.0**: Standardized REST / RPC programmatic interface.
- **ACTUS**: Algorithmic Contract Types Unified Standard for cash flows, coupons, and amortization.
- **FIX Protocol**: Financial Information eXchange messaging (`NewOrderSingle (D)`, `ExecutionReport (8)`).
- **FpML**: Financial products Markup Language for derivatives and collateral schedules.
- **SWIFT ON/OFF Ramp Verification Layer**: Deterministic verification bridging traditional SWIFT BIC / IBAN rails to ICP Canister Principals and immutable Update IDs.

---

## 2. Master Standards Matrix

| # | Domain / Function | ISO 20022 Message | ISO 24165 DTI | OpenAPI REST | FIX / FpML | ACTUS Logic | ICP Canister Target | SWIFT / Rail Bridge |
|---|---|---|---|---|---|---|---|---|
| 1 | Customer Payment Initiation | `pain.001.001.11` | `DTI-EURD-9941` | `POST /api/v1/accounts/transfer` | – | – | `position-ledger` | Ingest `pain.001` → Execute on-chain |
| 2 | Bank-to-Bank Wire Settlement | `pacs.008.001.10` | `DTI-EURD-9941` | `POST /api/v1/accounts/transfer` | – | – | `settlement-engine` | Interoperable RTGS/CHIPS/SWIFT |
| 3 | Account Statements & Reconciliation | `camt.053.001.10` | `DTI-EURD-9941` | `GET /api/v1/reporting/export/json` | – | – | `settlement-engine` | Emits ISO XML + JSON/CSV/PDF |
| 4 | Tokenized Deposit (JPMD / EURD) | `pacs.008` / `camt.053` | `DTI-USDD-1024` | `GET/POST /api/v1/accounts` | – | – | `position-ledger` | Multi-currency cash partitions |
| 5 | Live FX Conversion | `pacs.008 (FX)` | `DTI-EURD` / `DTI-USDD` | `GET /api/v1/rates` | – | – | `icp-canister-suite` | Oracle-backed interbank spread |
| 6 | LBMA Physical Gold Spot / RFQ | `sese.023` / `setr.016` | `DTI-GOLD-8821` | `POST /api/v1/rfq/execute` | FIX `NewOrderSingle` | `PAM` (Physical Asset) | `asset-ledger` + `finality-authority` | Swiss vault physical bar receipt |
| 7 | Sovereign Bond Issuance & Trading | `sese.023` + ISIN | `DTI-USTB-3312` | `POST /api/v1/offers/accept` | FIX `ExecReport` | `PAM` (Coupon & Yield) | `asset-ledger` | Direct sovereign debt custody |
| 8 | Tokenized Real Estate Equity | `setr.016` + Title ID | `DTI-PROP-ZH44` | `POST /api/v1/offers` | – | `LAX` (Amortizing) | `asset-ledger` | Canton Zurich notarized deed |
| 9 | Collateral & Repo Intraday Lending | `coll.001` / `coll.002` | `DTI-USTB-3312` | `POST /api/v1/collateral/positions` | FpML Collateral | Margin Haircut Rules | `settlement-engine` | Intraday credit line encumbrance |
| 10 | Regulatory Supervision & Unmasking | `auth.018` (Regulatory) | `DTI-ALL` | `GET /api/v1/admin/supervision` | FpML Audit | Solvency Invariants | `identity-registry` | Dual-key cryptographic unmasking |

---

## 3. SWIFT ON/OFF Ramp Verification & Canister ID Mapping

A critical requirement is the **deterministic separation and verification** between legacy banking identifiers and on-chain Web3 consensus identifiers:

```
┌────────────────────────────────────────────────────────┐  ┌────────────────────────────────────────────────────────┐
│             TRADITIONAL SWIFT / IBAN RAIL              │  │            INTERNET COMPUTER CANISTER RAIL             │
├────────────────────────────────────────────────────────┤  ├────────────────────────────────────────────────────────┤
│ • SWIFT BIC: UBSWCHZH80A                               │  │ • Canister ID: rrkah-fqaaa-aaaaa-aaaaq-cai             │
│ • IBAN: CH93 0000 0000 0000 0000 0                    │  │ • Principal ID: lpmt4-wqbam-aaaaa-aaaaa-cai            │
│ • Clearing System: RTGS / SIC / Fedwire / TARGET2      │  │ • Finality Proof: SHA-256 Notary Attestation           │
│ • ISO 20022 End-to-End ID: E2E-20260901-8841-CH       │  │ • Update ID: 0xc709b69547d556482fb1a6e633258c8db8...   │
└────────────────────────────────────────────────────────┘  └────────────────────────────────────────────────────────┘
```

The system verifies each cross-border transaction with a dual-signature receipt binding the SWIFT End-to-End Reference to the immutable on-chain Canister Notary Receipt.
