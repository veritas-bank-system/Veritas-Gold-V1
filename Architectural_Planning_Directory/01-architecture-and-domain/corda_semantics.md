# Comprehensive Semantic Analysis & Domain Model Extraction
*Full Architectural Deconstruction of Legacy Corda Subsystems & Pure Domain Model Mapping*

---

## Executive Summary
This document provides the foundational domain analysis across the 7 sub-systems present in the legacy codebase (`accounts`, `confidential-identities`, `corda`, `corda-api`, `reissue-cordapp`, `token-sdk`, and documentation in `MDFILES`). It maps legacy Java/Kotlin Corda concepts directly to clean, domain-driven Rust and TypeScript entities, eliminating all Corda framework branding while strictly preserving the underlying business logic, state invariants, cryptographic security, and multi-party protocols.

---

## 1. Domain Concept Mapping (Legacy → Clean Domain Architecture)

| Subsystem / Area | Legacy Corda Term | Clean Domain Term (Rust / TypeScript) | Semantic Responsibility |
| :--- | :--- | :--- | :--- |
| **Core Ledger** | `ContractState` | `LedgerRecord` / `Position` | Immutable fact or financial position recorded on ledger |
| **Core Ledger** | `StateRef` | `RecordPointer` (`tx_hash`, `output_index`) | Unique pointer to a specific output in the ledger graph |
| **Core Ledger** | `Contract` / `verify()` | `PolicyEngine` / `RuleSet` | Deterministic pure validation function evaluating ledger state transitions |
| **Core Ledger** | `Command` | `OperationIntent` | Action discriminator (e.g. `Issue`, `Transfer`, `Redeem`, `Suspend`) + required signers |
| **Core Ledger** | `TransactionBuilder` | `LedgerUpdateDraft` | Assembly container for consumed inputs, produced outputs, reference inputs, commands |
| **Core Ledger** | `LedgerTransaction` | `ValidatedUpdate` | Resolved ledger update with fully dereferenced inputs and attachments for rule verification |
| **Core Ledger** | `FlowLogic<T>` | `Protocol<T>` / `Workflow` | Async multi-party coordination sequence orchestrating signatures and finality |
| **Core Ledger** | `Vault` / `VaultService` | `LocalLedgerView` / `ParticipantIndex` | Per-participant indexed query engine tracking unconsumed vs consumed records |
| **Consensus** | `Notary` | `FinalityAuthority` / `UniquenessService` | Consensus entity preventing double-spending of records by asserting state uniqueness |
| **Identity** | `Party` | `VerifiedPrincipal` | Publicly identified network participant with verified legal name / credentials |
| **Identity** | `AnonymousParty` | `BlindedIdentity` / `AnonymousPrincipal` | Ephemeral public key without public certificate metadata for counterparty privacy |
| **Identity** | `SwapIdentitiesFlow` | `BlindedIdentityExchangeProtocol` | Dual-key generation and confidential exchange protocol |
| **Accounts** | `AccountInfo` | `PositionAccount` / `BalanceProfile` | Logical sub-ledger container partitioning assets under a single legal entity |
| **Accounts** | `CurrentAccountState` | `DemandDepositProfile` | Operational cash account with overdraft limits and daily velocity limits |
| **Accounts** | `SavingsAccountState` | `TermDepositProfile` | Interest-bearing deposit account with maturity terms and withdrawal restrictions |
| **Accounts** | `LoanAccountState` | `CreditFacilityProfile` | Principal debt position with repayment schedule and collateral link |
| **Tokens** | `FungibleToken` | `FungibleAssetHolding` | Divisible asset balance parameterized by amount, asset symbol, issuer, and holder |
| **Tokens** | `NonFungibleToken` | `DiscreteAssetHolding` | Indivisible unique token / certificate with custom immutable attributes |
| **Tokens** | `EvolvableTokenType` | `AssetTypeSpecification` | Shared evolvable asset definition (e.g., stock share details, commodity grade) |
| **Reissuance** | `ReissueFlow` | `HistoryTruncationProtocol` | Backchain truncation: consumes deep historical chain and issues clean root state |

---

## 2. Deep Subsystem Deconstruction

### 2.1 Accounts Subsystem (`accounts`)
#### Data Models:
1. **`PositionAccount` (formerly `AccountInfo`)**:
   - `id`: `AccountId` (UUID)
   - `tenant_id`: `TenantId`
   - `custodian`: `PrincipalId` (Host legal entity)
   - `status`: `AccountStatus` (`Pending` $\rightarrow$ `Active` $\rightleftharpoons$ `Suspended` $\rightarrow$ `Closed`)
   - `created_at`: UTC Timestamp
2. **`DemandDepositProfile` (formerly `CurrentAccountState`)**:
   - `account_id`: `AccountId`
   - `currency`: `CurrencyCode`
   - `balance`: `Decimal`
   - `overdraft_limit`: `Decimal`
   - `daily_withdrawal_limit`: `Decimal`
   - `daily_transfer_limit`: `Decimal`
   - `accumulated_daily_debit`: `Decimal`
3. **`TermDepositProfile` (formerly `SavingsAccountState`)**:
   - `account_id`: `AccountId`
   - `principal_amount`: `Decimal`
   - `interest_rate_bps`: `u32` (Basis points)
   - `maturity_date`: UTC Timestamp
   - `status`: `TermStatus` (`Accruing`, `Matured`, `Liquidated`)

#### Invariant Rules (`AccountPolicyEngine`):
- Non-negative balances unless approved overdraft limit is active (`balance + overdraft_limit >= 0`).
- Daily debit volume cannot exceed `daily_withdrawal_limit` or `daily_transfer_limit`.
- Account status transitions must follow valid state machine graph (Closed accounts can never be reopened).
- Signatures required from both the Custodian and the Account Holder on debits.

---

### 2.2 Confidential Identities Subsystem (`confidential-identities`)
#### Data Models:
1. **`BlindedKeyAssertion` (formerly `CertificateOwnershipAssertion`)**:
   - `blinded_public_key`: `PublicKey` (Ed25519 / ECDSA)
   - `well_known_principal`: `PrincipalId`
   - `ownership_proof_signature`: Cryptographic signature proving ownership
2. **`BlindedIdentityEnvelope` (formerly `PartyAndCertificate`)**:
   - `blinded_principal`: `AnonymousPrincipal`
   - `disclosure_path`: Selective cryptographic certificate chain

#### Protocol Flow (`BlindedIdentityExchangeProtocol`):
```
Initiator (Node A)                        Responder (Node B)
       |                                          |
       |----- 1. ProposeKeyExchangeRequest ------>|
       |      (Ephemeral PublicKey A)             |
       |                                          |
       |<---- 2. KeyExchangeResponse -------------|
       |      (Ephemeral PublicKey B + Proof)     |
       |                                          |
       |===== 3. Blinded Identities Active =======|
       |      (Used for UTXO output holding)      |
```

---

### 2.3 Token Engine Subsystem (`token-sdk`)
#### Data Models:
1. **`FungibleAssetHolding` (formerly `FungibleToken`)**:
   - `record_id`: `HoldingId`
   - `asset_symbol`: `AssetSymbol` (e.g. `USD`, `EUR`, `GOLD_OZ`)
   - `issuer`: `PrincipalId`
   - `holder`: `AnonymousPrincipal` or `AccountId`
   - `amount`: `Decimal` (Exact minor units / fixed point arithmetic)
   - `status`: `HoldingStatus` (`Unconsumed`, `Consumed`)
2. **`DiscreteAssetHolding` (formerly `NonFungibleToken`)**:
   - `record_id`: `HoldingId`
   - `asset_id`: `UniqueAssetId`
   - `issuer`: `PrincipalId`
   - `holder`: `PrincipalId`
   - `metadata_uri`: `String` / Hash digest
   - `status`: `HoldingStatus`

#### Invariant Rules (`AssetPolicyEngine`):
- **Conservation of Value**:
  $$\sum \text{Input Amounts} = \sum \text{Output Amounts} \quad (\text{for identical AssetSymbol and Issuer})$$
- **Issuance Authorization**: Requires cryptographic signature of the declared `Issuer`.
- **Redemption / Movement Authorization**: Requires cryptographic signature of current `Holder`.

---

### 2.4 Reissuance & Chain Truncation (`reissue-cordapp`)
#### Semantics:
When a token or account record undergoes hundreds of transactions, verification requires traversing the full historical backchain.
1. **Unlock Truncation**: Issuer and current Holder execute a `HistoryTruncationProtocol`.
2. **Atomic Swap**:
   - Input: Historical state $S_n$ (with chain depth $N$)
   - Output: Fresh state $S_0'$ (with chain depth $0$), accompanied by an `IssuanceDeclarationProof`.
3. **Privacy Restoration**: Counterparties down the line cannot see parties prior to $S_0'$.

---

## 3. Reference Protocols in Clean Domain Notation

### 3.1 Intrabank Cash Transfer Protocol
```text
Step 1: Alice selects Unconsumed FungibleAssetHolding records summing >= €100.
Step 2: Calculate change = TotalInputs - €100.
Step 3: Construct LedgerUpdateDraft:
        Inputs:  [Holding_Alice_100]
        Outputs: [Holding_Bob_100, Holding_Alice_Change]
        Command: OperationIntent::Transfer { signers: [Alice, Bob] }
Step 4: Execute PolicyEngine::verify(&draft).
Step 5: Exchange signatures via ProtocolCoordinator.
Step 6: Submit to FinalityAuthority for uniqueness lock.
Step 7: Distribute notarized update and index into Alice & Bob LocalLedgerViews.
```
