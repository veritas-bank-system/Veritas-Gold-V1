# Architecture & Mapping Specification: Clean Rust & Internet Computer (ICP)
*Canister Topologies, Inter-Canister Asynchronous Protocols & Storage Architecture*

---

## 1. System Architecture on Internet Computer (ICP)

On the Internet Computer, the legacy node-and-network architecture is redesigned as high-performance actor canisters communicating through asynchronous inter-canister calls with deterministic execution, orthogonal persistence (stable memory), and cryptographic threshold signatures.

```
                  +-----------------------------------+
                  |   TypeScript / React Web UI       |
                  | (Trader / Ops / Regulator / Admin)|
                  +-----------------+-----------------+
                                    |
                           HTTPS / @dfinity/agent
                                    |
                                    v
+-----------------------------------------------------------------------------+
|                          ICP CANISTER ECOSYSTEM                             |
|                                                                             |
|  +------------------------+             +--------------------------------+  |
|  |  protocol_coordinator  | <---------> |      identity_registry         |  |
|  |  (Async Workflow Svc)  |             | (Principals & Blinded Keys)    |  |
|  +-----------+------------+             +---------------+----------------+  |
|              |                                          |                   |
|              | Inter-Canister                           |                   |
|              v                                          v                   |
|  +------------------------+             +--------------------------------+  |
|  |    position_ledger     |             |         asset_ledger           |  |
|  | (Accounts & Profiles)  |             | (Fungible / NFT Digital Assets)|  |
|  +-----------+------------+             +---------------+----------------+  |
|              |                                          |                   |
|              +-------------------+----------------------+                   |
|                                  |                                          |
|                                  v                                          |
|                     +--------------------------+                            |
|                     |    settlement_engine     |                            |
|                     | (Global Record Registry) |                            |
|                     +------------+-------------+                            |
|                                  |                                          |
|                     +------------+-------------+                            |
|                     |                          |                            |
|                     v                          v                            |
|        +-------------------------+  +----------------------+                |
|        |    finality_authority   |  |   policy_engine_*    |                |
|        | (Uniqueness Consensus)  |  | (Deterministic Rules)|                |
|        +-------------------------+  +----------------------+                |
|                                                                             |
+-----------------------------------------------------------------------------+
```

---

## 2. Canister Role Specifications

### 2.1 `settlement_engine` (Record Registry & Global Ledger Core)
- **Role**: Maintains the authoritative global index of all immutable `LedgerRecord` entries.
- **State Management**:
  - `record_store`: Key-value index of `RecordPointer -> LedgerRecord`
  - `unconsumed_index`: Set of currently active, spendable `RecordPointer`s.
  - `participant_views`: Inverted index mapping `PrincipalId -> Vec<RecordPointer>`.
- **Canister Methods**:
  - `submit_update(update: LedgerUpdateDraft) -> Result<UpdateReceipt, EngineError>`
  - `query_participant_view(participant: PrincipalId, filter: RecordFilter) -> Vec<LedgerRecord>`
  - `fetch_record(pointer: RecordPointer) -> Option<LedgerRecord>`

### 2.2 `finality_authority` (Uniqueness Consensus & Double-Spend Guard)
- **Role**: Replaces the Corda Notary. Enforces single-spend invariants across all concurrent updates.
- **Validation**:
  - Atomically verifies that none of the input `RecordPointer`s in a proposed `LedgerUpdate` have been marked as consumed.
  - Atomically writes a consumption tombstone for each input.
  - Generates a cryptographic threshold signature or canister certificate over the final `UpdateHash`.
- **Canister Methods**:
  - `assert_uniqueness_and_finalize(inputs: Vec<RecordPointer>, update_hash: Blob) -> Result<FinalityProof, FinalityError>`

### 2.3 `protocol_coordinator` (Workflow & Multi-Party Orchestrator)
- **Role**: Replaces Corda `FlowLogic` execution. Acts as a durable state machine for multi-step protocols.
- **Features**:
  - Collects counterparty signatures asynchronously.
  - Suspends and resumes workflows across inter-canister calls.
  - Idempotency and timeout recovery for long-running negotiations.
- **Canister Methods**:
  - `initiate_protocol(protocol_type: ProtocolType, payload: Blob) -> ProtocolId`
  - `dispatch_step_response(protocol_id: ProtocolId, step: u32, signature: Blob) -> ProtocolStatus`
  - `get_protocol_status(protocol_id: ProtocolId) -> ProtocolStatus`

### 2.4 `identity_registry` (Principal Directory & Blinded Identity Engine)
- **Role**: Replaces Corda `confidential-identities`.
- **Features**:
  - Resolves well-known network entities (Financial Institutions, Corporates, Regulators).
  - Issues and validates Blinded Identities (`AnonymousPrincipal`) for selective counterparty privacy.
  - Manages cryptographic proof-of-possession assertions.

### 2.5 `position_ledger` & `asset_ledger`
- **`position_ledger`**: Specialized business sub-ledger for Demand Deposits, Term Deposits, Overdraft facilities, and Credit Lines.
- **`asset_ledger`**: Specialized ledger for Fungible tokens (fiat currency, commodity tokens) and Non-Fungible discrete tokens.

---

## 3. Storage & Concurrency Architecture

1. **Orthogonal Persistence**:
   - In-memory data structures are automatically persisted by ICP runtime.
   - High-volume transaction histories utilize `ic-stable-structures` for upgrades without serialization overhead.
2. **Deterministic Time**:
   - `ic_cdk::api::time()` provides nanosecond deterministic consensus timestamps across all replicas.
3. **Double-Spend Prevention**:
   - Guaranteed by atomic canister execution on `finality_authority`.
