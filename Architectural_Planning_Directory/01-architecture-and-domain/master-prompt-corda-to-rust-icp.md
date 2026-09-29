# 🧠 Master Prompt: Full Corda → Rust + TypeScript/React Rewrite (ICP)
*(New Application, New Names, Rust Backend + TS/React Frontend)*

## Context
You are given a local repository with these top-level folders:

```bash
/BlockchainTest-Rust
├── accounts
├── confidential-identities
├── corda
├── corda-api
├── MDFILES
├── reissue-cordapp
└── token-sdk
```

These folders contain Corda-style business logic, data models, flows, and utilities implemented in Java/Kotlin (Corda ecosystem) for:
- **accounts**: customer accounts, balances, limits, status, deposits/withdrawals, payments.
- **confidential-identities**: anonymous party handling, identity swapping, certificate ownership.
- **corda**: core ledger concepts (states, contracts, transactions, flows, vault, notaries).
- **corda-api**: RPC/flow APIs, orchestration, integration patterns.
- **MDFILES**: Markdown documentation of Corda concepts, examples, and workflows.
- **reissue-cordapp**: reissuance logic for backchain truncation and state re-minting.
- **token-sdk**: fungible and non-fungible tokens, evolvable tokens, issuance, move, redeem.

## Goal
Perform a complete semantic analysis of all these folders and then design and implement a full rewrite of this system as a brand-new application in:
- **Backend**: Rust (ICP canisters / native ledger engines)
- **Frontend**: TypeScript + React (web UI)
- **Target chain**: Internet Computer (ICP) as the base ledger and execution environment

The new system must:
- Preserve Corda’s business semantics (states, contracts, transactions, flows, vault, notaries, accounts, tokens, confidential identities, reissuance).
- **Not preserve any Corda-specific naming, Java/Kotlin idioms, or library names.**
- Be a new application from the ground up, with descriptive, domain-driven names in Rust and TypeScript, free of “corda”, “flow”, “vault”, “notary”, “state” (in the Corda sense) unless redefined in the new domain model with new names.

---

## 0. Naming & Language Migration Policy
This is a full language and naming migration from Java/Kotlin (Corda) to Rust + TypeScript.

### Requirements:
1. **Analyze all existing Java/Kotlin code and .md documentation** to understand:
   - Business concepts.
   - Data models.
   - Invariants and rules.
   - Flow sequences and protocols.
2. **Design a new domain model in Rust/TypeScript** where:
   - Every variable, type, function, module, and canister has a descriptive, domain-specific name.
   - No names directly copy Corda/Java/Kotlin terminology unless semantically redefined.

### Terminology Transformation Table:
| Legacy Corda Concept | New Clean Domain Name (Rust/TypeScript) | Description |
| :--- | :--- | :--- |
| `State` | `LedgerRecord` / `Position` / `Holding` | Immutable ledger facts / UTXO position |
| `Contract` | `RuleSet` / `PolicyEngine` / `ValidationLogic` | Deterministic verification logic |
| `Transaction` | `LedgerUpdate` / `OperationBatch` | Inputs, outputs, commands, signatures |
| `Flow` | `Protocol` / `Workflow` / `NegotiationSequence` | Async multi-party choreography |
| `Vault` | `LocalLedgerView` / `ParticipantIndex` | Per-participant indexed local state |
| `Notary` | `FinalityAuthority` / `UniquenessService` | Double-spend prevention & consensus |
| `ConfidentialIdentity` | `BlindedIdentity` / `AnonymousPrincipal` | Ephemeral cryptographic counterparties |
| `Token` | `DigitalAsset` / `AssetUnit` / `CashHolding` | Fungible & non-fungible digital assets |
| `Account` | `ClientLedger` / `PositionAccount` / `BalanceProfile` | Account partitions and sub-ledgers |

---

## 1. Analysis Phase: Extract Business Syntax & Data Models

### 1.1 Folders to Analyze
- **accounts**:
  - Schemas: Current, Savings, Loan accounts; Balances, limits (daily withdrawal/transfer), overdrafts, interest/terms.
  - Protocols: Customer onboarding, account creation, status transitions, limits configuration, overdraft approval, fiat deposit/withdrawal, intrabank payments, recurring payments.
  - Rules: State machine validations (PENDING, ACTIVE, SUSPENDED, CLOSED), fund sufficiency, overdraft limits, recurring payment references.
- **confidential-identities**:
  - Schemas: Well-known Principal vs Blinded Identity, Certificate ownership assertions.
  - Protocols: Identity exchange (`SwapIdentities`), certificate path synchronization (`IdentitySync`).
  - Rules: Proof of ownership by well-known identity, selective disclosure on need-to-know basis.
- **corda / corda-api**:
  - Core concepts: UTXO consuming/producing, transaction graph, time windows, reference inputs, oracles, attachments, tear-offs.
  - APIs: Asynchronous progress tracking, retry policies, deduplication keys, suspension/resumption.
- **reissue-cordapp**:
  - Reissuance semantics: State re-minting to truncate long backchains, unlock verification latency, and restore counterparty privacy.
- **token-sdk**:
  - Token structures: Fungible (`AssetAmount`), Non-Fungible (`UniqueAsset`), Evolvable definitions.
  - Protocols: Issuance, Split & Move, Redeem, Token selection / coin picking algorithms.
  - Invariants: Conservation of value ($\sum \text{inputs} = \sum \text{outputs}$).

---

## 2. Target Architecture on ICP (Rust Canisters + TS/React UI)

### 2.1 Canister Roles (Rust)
- `settlement_engine` (Record Registry & Global Ledger Core)
- `policy_account`, `policy_asset`, `policy_payment` (Pluggable RuleSets)
- `protocol_coordinator` (Async Multi-Party Workflow Engine)
- `finality_authority` (Uniqueness Consensus & Double-Spend Guard)
- `identity_registry` (Principal Directory & Blinded Identity Manager)
- `asset_ledger` (Fungible & NFT Digital Asset Engine)
- `position_ledger` (Client Ledger & Balance Management Engine)
- `compliance_view` (Audit Trail & Regulatory Query Engine)

### 2.2 Frontend (TypeScript + React)
- **Trader / Client UI**: Balance profiles, asset holdings, transfer initiation, payment scheduling.
- **Operations UI**: Real-time protocol monitor, canister metrics, exception resolution.
- **Regulator / Audit UI**: Exposure metrics, asset breakdown, immutable audit history.
- **Admin UI**: Onboarding, rule configuration, authority keys.

---

## 3. Reference Protocol: Cash Transfer Between Position Accounts
1. **Initiate**: Alice initiates a transfer of €100 from her Current PositionAccount to Bob's.
2. **Assemble**: Construct `LedgerUpdate` with Alice's input record, producing updated Alice record (-€100) and updated Bob record (+€100).
3. **Local Validation**: Execute `PolicyEngine::validate_update(&update)` locally.
4. **Counterparty Signature**: Forward partial update to Bob via `protocol_coordinator` for counter-signing.
5. **Finality & Uniqueness**: Submit to `finality_authority` for uniqueness verification and notarization.
6. **Commit**: Index new records in both Alice's and Bob's `LocalLedgerView`.
