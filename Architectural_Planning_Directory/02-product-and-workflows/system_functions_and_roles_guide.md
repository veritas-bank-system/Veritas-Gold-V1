# Red Broadcast ICP Ledger: Functional Catalog & Role Directory

## 1. Overview & Architectural Blueprint
The Red Broadcast system is a decentralized, high-throughput enterprise financial ledger natively deployed on the **Internet Computer (ICP)** using a clean-slate **Rust backend** and a **TypeScript/React Web UI**.

---

## 2. Categorized Functional Matrix by Actor Role

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  ICP CANISTER SUITE                    │
                                  └────────────────────────────────────────────────────────┘
                                      ▲                  ▲                  ▲
                 RWA Flows            │                  │                  │ Audit & Oversight
         ┌────────────────────────────┘                  │                  └────────────────────────────┐
         │                                               │                                               │
┌─────────────────┐                             ┌─────────────────┐                             ┌─────────────────┐
│   RWA TRADERS   │                             │   OPERATORS &   │                             │   REGULATORS    │
│    & ISSUERS    │                             │ SYSTEM ADMINS   │                             │   & AUDITORS    │
└─────────────────┘                             └─────────────────┘                             └─────────────────┘
 • Issue/Mint Assets                             • Register Entity Profiles                      • Global View Ingestion
 • Split & Move Holdings                         • Inspect Protocol Machine                      • Audit Conservation
 • Cash Wire Transfers                           • Enforce Invariant Gates                       • Double-Spend Detection
 • Blinded Identity Swaps                        • System Upgrade & Config                       • Reserve Proof Check
```

---

### Category A: USER / TRADER / ISSUER (Handling & Sending RWAs)

Who uses these functions: Institutional Traders, Asset Issuers, Liquidity Providers, Corporate Treasuries.

| Functional Area | Rust Method / Canister Entrypoint | Description & Business Semantics | Pre-conditions & Policies Checked |
| :--- | :--- | :--- | :--- |
| **RWA Issuance / Minting** | `AssetLedger::issue_fungible_asset` | Tokenizes real-world assets (e.g., Gold, Treasury Bills, USD/EUR stable balances) into discrete UTXO records. | Issuer must be a verified institution; amount must be positive decimal. |
| **UTXO Split & Move** | `AssetLedger::transfer_asset` | Transfers RWA tokens to a counterparty using automated coin selection, splitting unspent outputs and generating change. | `AssetConservationPolicy` (Sum of inputs == Sum of outputs + Change). |
| **Discrete RWA Transfer** | `AssetLedger::transfer_discrete_asset` | Transfers non-fungible or uniquely serialized real-world assets (e.g., title deeds, bond certificates). | Serial uniqueness verified; single-owner assignment. |
| **RWA Redemption / Burn** | `AssetLedger::redeem_fungible_asset` | Retires digital tokens when the underlying real-world asset is settled or delivered off-chain. | Input holdings locked and tombstoned by `FinalityAuthority`. |
| **Demand Deposit Debit/Credit** | `PositionLedger::execute_direct_transfer` | Executes high-speed atomic cash wires between multi-currency account sub-ledgers. | `AccountRuleSet` (Balance + Overdraft >= Debit; Velocity limit not exceeded). |
| **Privacy Key Generation** | `ProtocolCoordinator::execute_blinded_identity_exchange_protocol` | Generates single-use anonymous cryptographic addresses with zero-knowledge ownership proofs. | Cryptographic key signature verifiable against well-known legal entity. |

---

### Category B: ADMIN / OPERATIONS / REGULATOR (Watching & Oversight)

Who uses these functions: Compliance Officers, Risk Directors, SRE/DevOps, Central Banks, Auditors.

| Functional Area | Rust Method / Canister Entrypoint | Description & Business Semantics | Monitoring & Security Scope |
| :--- | :--- | :--- | :--- |
| **Participant Onboarding** | `IdentityRegistry::register_profile` | Registers and verifies legal institutions, assigning roles (`Trader`, `Custodian`, `Regulator`, `CentralBank`). | KYC/AML verification gate; permissioned role authorization. |
| **Blinded Ownership Audit** | `IdentityRegistry::verify_blinded_ownership` | Unmasks or verifies whether an anonymous counterparty belongs to a sanctioned or authorized legal institution. | Regulatory subpoena / Compliance audit trails. |
| **Double-Spend Watchdog** | `FinalityAuthority::assert_uniqueness_and_finalize` | Notary consensus engine that checks whether an input record pointer has already been consumed. | Atomic input tombstoning; issues immutable `FinalityProof`. |
| **Global Settlement Observer** | `SettlementEngine::get_participant_holdings` / `get_participant_accounts` | Queries authoritative ledger state with per-participant inverted indexing. | Real-time liquidity tracking and exposure aggregation. |
| **Protocol Orchestrator Monitor** | `ProtocolCoordinator::get_protocol_state` | Observes the live state machine (`Initiated` $\rightarrow$ `InputsLocked` $\rightarrow$ `Validated` $\rightarrow$ `Finalized` $\rightarrow$ `Failed`). | Stuck transaction resolution, timeout compensation, telemetry. |
| **Conservation Invariant Audit** | `PolicyEngine::validate_update` | Deterministic verification rule checker enforcing that no funds can be minted or destroyed out of thin air. | Zero tolerance mathematical conservation check. |

---

## 3. End-to-End Real-World Asset (RWA) Lifecycle

### 🔄 Lifecycle Step 1: Real-World Asset Inception & Custody
1. **Asset Verification**: The physical asset (e.g., Physical Gold bar, Corporate Debt Note, Sovereign Treasury) is deposited with a verified **Custodian**.
2. **Identity Registration**: Admin registers the Custodian via `IdentityRegistry::register_profile`.

### 🔄 Lifecycle Step 2: Digital Tokenization (Issuance)
1. Custodian issues digital representation via `AssetLedger::issue_fungible_asset`.
2. New `FungibleAssetHolding` record is minted with state `RecordStatus::Unconsumed`.
3. `FinalityAuthority` issues an initial genesis receipt.

### 🔄 Lifecycle Step 3: Secondary Market Trading & Settlement (DvP)
1. **Coin Selection**: Sender’s wallet invokes `CoinSelector::select_unconsumed_holdings` to gather exact token inputs.
2. **Policy Verification**: `AssetConservationPolicy` proves that `Inputs == Output + Change`.
3. **Double-Spend Check**: `FinalityAuthority` locks input record pointers atomically.
4. **State Transition**: Old UTXOs marked `RecordStatus::Consumed`, new UTXOs created for recipient and sender change.

### 🔄 Lifecycle Step 4: Redemption & Settlement
1. Asset holder requests off-chain redemption.
2. `AssetLedger` burns the digital holding.
3. Custodian releases the physical asset.

---

## 4. UI Dashboard Capabilities Matrix

| Screen | Primary User | Key Interactive Capabilities |
| :--- | :--- | :--- |
| **Position Accounts** | Institutional Trader | View EUR/USD cash balances, overdraft utilization meter, daily transfer limit gauge, execute instant wire transfers, open new account partitions. |
| **Digital Assets (UTXO)** | Asset Trader / Issuer | View unspent token inventory, trigger split-and-move transfers, mint new RWA tokens, inspect UTXO transaction lineage pointers. |
| **Protocol Coordinator** | Ops / SRE | Real-time multi-party protocol execution log, inspect pending transactions, detect failed steps, monitor protocol lifecycle IDs. |
| **Identities & Privacy** | Compliance / Trader | Institutional directory lookup, legal entity verification, generate ephemeral blinded keys with cryptographic ownership proofs. |
| **Settlement & Finality** | Auditor / Regulator | Inspect global settlement state, verify SHA-256 finality authority proofs, check double-spend protection status, audit orthogonal persistence. |
