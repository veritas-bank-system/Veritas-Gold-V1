# Clean Domain Data Dictionary & Candid Specifications
*Standardized Schema Definitions for ICP Rust Canister Suite & TypeScript Frontend*

---

## 1. Value Types & Primitives

```candid
type PrincipalId = principal;
type AccountId = text;
type HoldingId = text;
type ProtocolId = text;
type UpdateId = text;
type TimestampNanos = nat64;
type DecimalString = text;

type CurrencyCode = text;

type RecordPointer = record {
    update_id: UpdateId;
    output_index: nat32;
};

type RecordStatus = variant {
    Unconsumed;
    Consumed: record { consuming_update_id: UpdateId; consumed_at: TimestampNanos };
};
```

---

## 2. Domain Record Types (LedgerRecords)

### 2.1 PositionAccount (`DemandDepositRecord`, `TermDepositRecord`)
```candid
type AccountStatus = variant {
    Active;
    Suspended: record { reason: text; by: PrincipalId; timestamp: TimestampNanos };
    Closed: record { by: PrincipalId; timestamp: TimestampNanos };
};

type DemandDepositRecord = record {
    account_id: AccountId;
    custodian: PrincipalId;
    owner: PrincipalId;
    currency: CurrencyCode;
    balance: DecimalString;
    overdraft_limit: DecimalString;
    daily_withdrawal_limit: DecimalString;
    daily_transfer_limit: DecimalString;
    accumulated_daily_debit: DecimalString;
    status: AccountStatus;
    updated_at: TimestampNanos;
};

type TermDepositRecord = record {
    account_id: AccountId;
    custodian: PrincipalId;
    owner: PrincipalId;
    currency: CurrencyCode;
    principal_amount: DecimalString;
    interest_rate_bps: nat32;
    maturity_date: TimestampNanos;
    is_liquidated: bool;
};
```

### 2.2 Digital Asset Holdings (`FungibleAssetHolding`, `DiscreteAssetHolding`)
```candid
type FungibleAssetHolding = record {
    holding_id: HoldingId;
    asset_symbol: text;
    issuer: PrincipalId;
    holder: PrincipalId;
    amount: DecimalString;
    pointer: RecordPointer;
    status: RecordStatus;
};

type DiscreteAssetHolding = record {
    holding_id: HoldingId;
    asset_class: text;
    unique_identifier: text;
    issuer: PrincipalId;
    holder: PrincipalId;
    metadata_uri: text;
    pointer: RecordPointer;
    status: RecordStatus;
};
```

### 2.3 Blinded Identities
```candid
type BlindedIdentity = record {
    anonymous_principal: PrincipalId;
    well_known_principal: PrincipalId;
    ownership_proof_signature: blob;
    created_at: TimestampNanos;
};
```

---

## 3. Canister Service Interfaces (Candid)

### 3.1 `settlement_engine.did`
```candid
type LedgerUpdateDraft = record {
    consumed_inputs: vec RecordPointer;
    reference_inputs: vec RecordPointer;
    produced_outputs: vec blob;
    command_type: text;
    command_data: blob;
    required_signers: vec PrincipalId;
    signatures: vec record { signer: PrincipalId; signature: blob };
};

type UpdateReceipt = record {
    update_id: UpdateId;
    finality_proof: blob;
    timestamp: TimestampNanos;
};

service : {
    "submit_update": (LedgerUpdateDraft) -> (variant { Ok: UpdateReceipt; Err: text });
    "get_record": (RecordPointer) -> (opt blob) query;
    "get_participant_holdings": (PrincipalId) -> (vec FungibleAssetHolding) query;
    "get_participant_accounts": (PrincipalId) -> (vec DemandDepositRecord) query;
}
```

### 3.2 `finality_authority.did`
```candid
type FinalityProof = record {
    update_id: UpdateId;
    authority_principal: PrincipalId;
    attestation_signature: blob;
    timestamp: TimestampNanos;
};

service : {
    "assert_uniqueness_and_finalize": (vec RecordPointer, text) -> (variant { Ok: FinalityProof; Err: text });
    "is_record_consumed": (RecordPointer) -> (bool) query;
}
```

### 3.3 `protocol_coordinator.did`
```candid
type ProtocolStatus = variant {
    PendingSignatures: record { required: vec PrincipalId; collected: vec PrincipalId };
    AwaitingFinality;
    Completed: record { update_id: UpdateId; timestamp: TimestampNanos };
    Failed: record { reason: text; failed_at: TimestampNanos };
};

service : {
    "start_cash_transfer": (AccountId, AccountId, DecimalString, CurrencyCode) -> (variant { Ok: ProtocolId; Err: text });
    "start_asset_issue": (PrincipalId, DecimalString, text) -> (variant { Ok: ProtocolId; Err: text });
    "sign_protocol_step": (ProtocolId, blob) -> (variant { Ok: ProtocolStatus; Err: text });
    "query_protocol": (ProtocolId) -> (opt ProtocolStatus) query;
}
```
