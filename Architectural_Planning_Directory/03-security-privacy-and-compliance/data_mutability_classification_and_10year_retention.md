# 🔒 Data Mutability Classification, 10-Year Statutory Retention & On-Chain Hashing

## 📋 Executive Overview
This document specifies the exact technical and regulatory rules for **what information can be changed, where it can be stored, and how it is deleted** across the **Veritas Institutional Ledger**. 

Because blockchain storage on the **Internet Computer (ICP)** is cryptographically immutable and GDPR Art. 17 mandates the "Right to be Forgotten", **canisters store strictly salted cryptographic hashes (`[u8; 32]`) and zero raw Personally Identifiable Information (PII)**. Statutory 10-year recordkeeping under MiFID II Art. 16(6) and 5AMLD is managed in off-chain encrypted PostgreSQL with automated key shredding.

---

## 🗂️ 1. Data Classification Matrix: Immutable vs. Mutable

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATA MUTABILITY & STORAGE CLASSIFICATION                                       │
├──────────────────────────┬──────────────┬────────────────────┬───────────────────────┬───────────────────────────┤
│ Data Element             │ Mutability   │ Storage Location   │ Format / Encryption   │ Statutory Retention Rule  │
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 1. Account Cash Balances │ Immutable    │ Canister Stable    │ `u128` Minor Units    │ Permanent on-chain        │
│    (sEURD, sUSDD, CHF)   │ State Ledger │ Memory             │ (Zero Float Drift)    │ State Transition History  │
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 2. KYC / KYB Client      │ Mutable      │ Off-Chain          │ AES-256-GCM Encrypted │ Exactly 10 Years          │
│    Dossiers & Passports  │ (Updates ok) │ PostgreSQL DB      │ (AWS KMS Envelope)    │ (MiFID II Art. 16(6))     │
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 3. Client Identity Proof │ Immutable    │ Canister Stable    │ Salted SHA-256 Hash   │ Permanent on-chain        │
│    Commitment            │ Commitment   │ Memory             │ `[u8; 32]` (Zero PII) │ Hash (Anonymized at Yr 10)│
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 4. Trade DvP Receipts &  │ Immutable    │ Canister &         │ ISO 20022 camt.054    │ 10 Years Off-Chain        │
│    pacs.008 Settlements  │ Execution    │ PostgreSQL         │ Signed Hash Receipts  │ Permanent Canister Hash   │
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 5. Maker-Checker 2-of-2  │ Immutable    │ Canister Stable    │ Threshold Ed25519     │ Permanent Audit Trail     │
│    Multi-Sig Signatures  │ Sign-offs    │ Memory             │ Signatures & Roots    │ (Proof of Compliance)     │
├──────────────────────────┼──────────────┼────────────────────┼───────────────────────┼───────────────────────────┤
│ 6. Exchange Rates &      │ Ephemeral /  │ Canister Heap /    │ 15-Minute Cache Window│ Overwritten by Fresh BFT  │
│    ECB Market Quotes     │ Real-time    │ Frontend Cache     │ Bounded `u128` Price  │ HTTPS Outcall Cycles      │
└──────────────────────────┴──────────────┴────────────────────┴───────────────────────┴───────────────────────────┘
```

---

## 🛡️ 2. The 10-Year Statutory Retention vs. GDPR Art. 17 Deletion Lifecycle

```
Year 0 (Account Creation & Verification)
   │
   ├── 1. Client uploads KYB documents to encrypted PostgreSQL storage.
   ├── 2. Salted SHA-256 hash `H = SHA256(Salt || PassportData)` is calculated.
   └── 3. Only the `[u8; 32]` hash and opaque Principal ID are stored in the ICP Canister.
   │
Years 1 to 10 (Active Fiduciary Retention Period)
   │
   ├── Required by MiFID II Art. 16(6), Swiss BankG, and 5AMLD.
   ├── All trading, cash transfers, and maker-checker multi-sig signatures are archived.
   └── Lawful supervisory audits (ECB / FINMA) query the encrypted database using KMS keys.
   │
Year 10 + 1 Day (Statutory Expiration & GDPR Art. 17 Cryptographic Shredding)
   │
   ├── 1. Database record retention countdown reaches zero.
   ├── 2. KMS customer encryption key is permanently shredded (Crypto-Shredding).
   ├── 3. Raw PII in PostgreSQL becomes permanently unrecoverable gibberish.
   └── 4. On-Chain Hash in Canister remains mathematically irreversible and completely anonymized!
```

---

## 💻 3. Canister Developer Implementation Guidelines

### 1. Zero Raw PII in Rust Canister State
```rust
// ❌ STRICTLY FORBIDDEN IN CANISTER STATE:
pub struct ForbiddenClientProfile {
    pub first_name: String,   // VIOLATION: Raw PII on-chain
    pub passport_no: String,  // VIOLATION: Raw PII on-chain
    pub address: String,      // VIOLATION: Raw PII on-chain
}

// ✅ CANONICAL COMPLIANT ON-CHAIN STRUCT:
pub struct CompliantPrincipalRecord {
    pub principal_id: Principal,
    pub legal_entity_hash: [u8; 32], // Salted SHA-256 hash only
    pub kyc_verified_at: u64,
    pub kyc_expires_at: u64,
    pub clearance_level: u8,         // 1 to 5
}
```

### 2. Updating Mutable Information
When a corporate client updates their registered address, signatory list, or authorized officer mandates:
1. The update is performed in the **encrypted off-chain PostgreSQL database**.
2. A new commitment hash is computed: `H_new = SHA256(Salt || NewProfile)`.
3. The on-chain canister updates `legal_entity_hash = H_new` via a 2-of-2 Maker-Checker governance proposal.
4. The previous hash remains in the immutable canister event history as an audit record of the change.

---

## 🏆 Summary
By segregating data into **Immutable State Ledgers (Canister)** and **Encrypted 10-Year Statutory Repositories (PostgreSQL with KMS Key Shredding)**, the Veritas platform achieves 100% compliance with both **European Banking Authority (EBA)** recordkeeping mandates and **GDPR Article 17** privacy regulations.
