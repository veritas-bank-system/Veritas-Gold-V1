# Veritas Institutional Ledger — Data Privacy, 10-Year Regulatory Retention & GDPR On-Chain Hashing Architecture

> **Document Version**: 2.4.0 (Production Architecture Specification)  
> **Applicable Regulations**: EU GDPR (Art. 17 Right to Erasure), EU MiFID II (Art. 16(6) Recordkeeping), 5th Anti-Money Laundering Directive (5AMLD), Swiss Banking Act (BankG Art. 899 CO), BIS CPMI-IOSCO Principle 17.

---

## 1. Executive Summary & Core Principle

In institutional financial market infrastructure (FMI), a fundamental tension exists between **blockchain immutability** and **data protection laws** (e.g., GDPR "Right to be Forgotten" / Right to Erasure). 

To achieve 100% regulatory compliance, the Veritas Institutional Ledger strictly enforces a **Dual-Layer Storage Separation Architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       DUAL-LAYER STORAGE & PRIVACY ARCHITECTURE                             │
├───────────────────────────────────────────────┬─────────────────────────────────────────────┤
│ 🌐 ON-CHAIN IMMUTABLE LAYER (ICP Canisters)    │ 🐘 OFF-CHAIN ERASABLE LAYER (PostgreSQL /   │
│                                               │    Encrypted Encrypted Vault)               │
├───────────────────────────────────────────────┼─────────────────────────────────────────────┤
│ • STRICTLY ZERO RAW PII (No names/passports)  │ • Full KYC / KYB Verification Dossiers      │
│ • Salted SHA-256 State & Document Hashes      │ • Ultimate Beneficial Owner (UBO) Registry  │
│ • Ed25519 & Secp256k1 Anonymous Principals    │ • Encrypted Legal Contracts & Prospectuses  │
│ • Exact Decimal Numerical Account Balances    │ • ISO 20022 XML Message Payloads (pacs/camt)│
│ • Immutable Transaction Receipts & Nonces     │ • 10-Year Statutory Audit Archive           │
│ • ACTUS Algorithmic Cash Flow State Machines  │ • GDPR Article 17 Erasure & Key-Shredding   │
└────────────────────────────────────────────────┴─────────────────────────────────────────────┘
```

---

## 2. What Data Can Be Saved on Immutable Canisters vs. What Cannot

### 2.1 🚫 STRICTLY PROHIBITED from On-Chain Immutable Storage
1. **Personally Identifiable Information (PII)**: Real human names, passport numbers, tax IDs, email addresses, phone numbers, facial biometric data.
2. **Raw Identity Documents**: PDF passports, driver's licenses, utility bills, corporate registration extracts.
3. **Unencrypted Free-text Payment Memos**: Customer personal memos that could contain personal names or banking details.

### 2.2 ✅ PERMITTED on On-Chain Immutable Canisters
1. **Salted SHA-256 Hashes**: `SHA256(Document_PDF || Salt_Nonce)` — enables zero-knowledge verification without revealing underlying document contents.
2. **Opaque Principal IDs**: DFINITY 29-byte alphanumeric identifiers (e.g. `2vxsx-yme...`).
3. **Financial State Data**: Exact decimal asset quantities, ISIN codes, DTI codes, maturity timestamps, coupon percentages, and interest rate basis points.
4. **Cryptographic Signatures**: Ed25519 notary witness signatures and Threshold ECDSA public keys.

---

## 3. The 10-Year Mandatory Retention Rule vs. GDPR Right to Erasure

### 3.1 The 10-Year Statutory Recordkeeping Mandate
Under **EU MiFID II Art. 16(6)** and **Swiss Code of Obligations (CO Art. 958f)**, regulated financial institutions have a strict legal duty to retain all transaction records, trade orders, and client identification files for **exactly 10 years** from the date of settlement or account closure.

During this 10-year period:
* **Statutory Overrides Apply**: A client's request for immediate GDPR deletion is legally superseded by mandatory AML/CFT and tax retention laws (GDPR Art. 17(3)(b) "for compliance with a legal obligation").
* **Immutable Audit Trail**: Regulators (FINMA, ECB, BaFin, SEC) can cross-reference the off-chain encrypted records against the on-chain SHA-256 hashes to guarantee that records have never been tampered with or retroactively altered.

### 3.2 Post-10-Year GDPR Deletion & Cryptographic Shredding
Upon the expiration of the 10-year retention period, or upon a legally valid Right to Erasure court order:
1. **Off-Chain Database Purge**: The customer's off-chain encrypted KYC dossier, passport scans, and PII fields in PostgreSQL are permanently overwritten (`shred -u`).
2. **Cryptographic Salt Destruction**: The per-user cryptographic encryption salt is destroyed.
3. **On-Chain Residual**: The on-chain ICP ledger retains only the isolated mathematical SHA-256 hash. Because SHA-256 is a one-way preimage-resistant function and the original off-chain file and salt are destroyed, the on-chain hash is rendered completely anonymous and mathematically impossible to reverse into personal data.

---

## 4. ICP Rust Canister Engineering Standards (`ic-stable-structures`)

All production canisters on the Internet Computer follow these strict privacy rules:

```rust
// Production Data Structure in Rust Canister:
// Notice: No raw PII. Only document hash and verification status.
#[derive(CandidType, Serialize, Deserialize, Clone)]
pub struct IdentityAttestation {
    pub institution_id: Principal,
    pub kyc_document_hash: [u8; 32],      // SHA-256 Hash of KYC Dossier
    pub attestation_timestamp: u64,
    pub compliance_officer_id: Principal,
    pub regulatory_clearance_tier: u8,   // Level 1-5
    pub retention_expiry_timestamp: u64, // 10 Years from issuance
}
```

---

## 5. Web2 to Web3 Verification Flowchart

```text
User / Bank ➔ Submits Passport & LEI ➔ Off-Chain PostgreSQL (AES-256-GCM Encrypted)
                                             │
                                             ├─➔ Calculate SHA-256 Hash + Salt
                                             │
                                             ▼
                                   ICP Rust Canister
                              (Stores ONLY SHA-256 Hash)
                                             │
                                             ▼
                       On-Chain State Verified by 4/5 Notaries
                               (100% GDPR Compliant)
```
