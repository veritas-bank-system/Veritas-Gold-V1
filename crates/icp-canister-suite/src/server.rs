use crate::CanisterEnvironment;
use axum::{
    extract::State,
    http::{header, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use domain::accounts::DemandDepositRecord;
use domain::assets::FungibleAssetHolding;
use domain::identities::{BlindedIdentity, PrincipalProfile};
use domain::primitives::{AccountId, Amount, CurrencyCode, PrincipalId};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, RwLock};
use std::time::Instant;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tower_http::trace::TraceLayer;

#[derive(Clone, Serialize, Deserialize)]
pub struct RwaOffer {
    pub offer_id: String,
    pub seller_principal: String,
    pub seller_legal_name: String,
    pub asset_symbol: String,
    pub asset_name: String,
    pub asset_amount: String,
    pub price_per_unit_eur: String,
    pub total_price_eur: String,
    pub status: String,
    pub created_at: u64,
}

/// Live notary-stream event recorded for every settlement-relevant ledger mutation.
#[derive(Clone, Serialize, Deserialize)]
pub struct SettlementEvent {
    pub seq: u64,
    pub timestamp_ms: u64,
    pub operation: String,
    pub stateref: String,
    pub requesting_party: String,
    pub status: String,
    pub reason: String,
    pub signatures: String,
    pub duration_us: u64,
    pub detail: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct InstitutionalTxn {
    pub txn_id: String,
    pub booking_date: String,
    pub value_date: String,
    pub gl_code: String,
    pub txn_type: String,
    pub iso20022_msg: String,
    pub iso24165_dti: String,
    pub actus_contract_type: String,
    pub swift_on_off_ramp_code: String,
    pub canister_principal_id: String,
    pub sender_legal: String,
    pub recipient_legal: String,
    pub amount: String,
    pub currency: String,
    pub debit_credit: String,
    pub memo: String,
    pub onchain_hash: String,
    pub finality_receipt: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CollateralPosition {
    pub position_id: String,
    pub asset_symbol: String,
    pub asset_name: String,
    pub pledged_amount: String,
    pub market_value_eur: String,
    pub haircut_percent: String,
    pub borrowing_capacity_eur: String,
    pub custodian: String,
    pub pledgee: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct BondAuction {
    pub auction_id: String,
    pub bond_symbol: String,
    pub bond_name: String,
    pub issuer_legal: String,
    pub total_issuance_eur: String,
    pub min_bid_eur: String,
    pub target_yield_pct: String,
    pub cutoff_yield_pct: String,
    pub bids_count: u32,
    pub status: String,
    pub maturity_date: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AuctionBid {
    pub bid_id: String,
    pub auction_id: String,
    pub bidder_legal: String,
    pub amount_eur: String,
    pub bid_yield_pct: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CorporateAction {
    pub action_id: String,
    pub asset_symbol: String,
    pub asset_name: String,
    pub action_type: String,
    pub actus_contract: String,
    pub rate_or_amount_per_unit: String,
    pub record_date: String,
    pub payment_date: String,
    pub total_distributed_eur: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct PendingApproval {
    pub approval_id: String,
    pub maker_principal: String,
    pub maker_legal: String,
    pub action_type: String,
    pub amount_eur: String,
    pub details: String,
    pub required_signatures: u32,
    pub current_signatures: u32,
    pub signers: Vec<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct VaultSensorTelemetry {
    pub vault_location: String,
    pub total_bars_verified: u32,
    pub total_weight_kg: String,
    pub ultrasonic_density_pct: String,
    pub vault_temperature_c: String,
    pub humidity_pct: String,
    pub purity_grade: String,
    pub merkle_root_hash: String,
    pub oracle_attestation_status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SweepingRule {
    pub rule_id: String,
    pub source_account: String,
    pub target_asset: String,
    pub threshold_eur: String,
    pub frequency: String,
    pub is_active: bool,
    pub total_swept_eur: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct BridgeRoute {
    pub route_id: String,
    pub source_network: String,
    pub target_network: String,
    pub asset_symbol: String,
    pub estimated_time_sec: u32,
    pub gas_fee_eur: String,
    pub threshold_ecdsa_notary: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CanisterStatusInfo {
    pub canister_id: String,
    pub canister_name: String,
    pub wasm_module_hash: String,
    pub cycles_balance_tc: String,
    pub memory_used_mb: String,
    pub subnet: String,
    pub status: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct LiquidityPool {
    pub pool_id: String,
    pub pair_name: String,
    pub token_a_symbol: String,
    pub token_b_symbol: String,
    pub reserve_a: String,
    pub reserve_b: String,
    pub total_liquidity_eur: String,
    pub fee_tier_pct: String,
    pub volume_24h_eur: String,
    pub apy_pct: String,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SovereignBondContract {
    pub contract_id: String,
    pub issuer_name: String,
    pub issuer_principal: String,
    pub isin_code: String,
    pub dti_code: String,
    pub currency: String,
    pub notional_volume_eur: String,
    pub coupon_rate_pct: String,
    pub coupon_frequency: String,
    pub actus_contract_type: String,
    pub maturity_date: String,
    pub auction_mechanism: String,
    pub collateral_backing: String,
    pub canister_principal_id: String,
    pub status: String,
    pub created_at: u64,
}

#[derive(Deserialize)]
pub struct CreateSovereignBondRequest {
    pub issuer_name: String,
    pub issuer_principal: String,
    pub isin_code: String,
    pub dti_code: String,
    pub currency: String,
    pub notional_volume_eur: String,
    pub coupon_rate_pct: String,
    pub coupon_frequency: String,
    pub actus_contract_type: String,
    pub maturity_date: String,
    pub auction_mechanism: String,
    pub collateral_backing: String,
}

#[derive(Clone)]
pub struct ServerState {
    pub env: Arc<CanisterEnvironment>,
    pub offers: Arc<RwLock<Vec<RwaOffer>>>,
    pub transactions: Arc<RwLock<Vec<InstitutionalTxn>>>,
    pub collateral: Arc<RwLock<Vec<CollateralPosition>>>,
    pub auctions: Arc<RwLock<Vec<BondAuction>>>,
    pub bids: Arc<RwLock<Vec<AuctionBid>>>,
    pub corporate_actions: Arc<RwLock<Vec<CorporateAction>>>,
    pub approvals: Arc<RwLock<Vec<PendingApproval>>>,
    pub sweeping_rules: Arc<RwLock<Vec<SweepingRule>>>,
    pub bridge_routes: Arc<RwLock<Vec<BridgeRoute>>>,
    pub canisters: Arc<RwLock<Vec<CanisterStatusInfo>>>,
    pub liquidity_pools: Arc<RwLock<Vec<LiquidityPool>>>,
    pub bond_contracts: Arc<RwLock<Vec<SovereignBondContract>>>,
    pub settlement_events: Arc<RwLock<Vec<SettlementEvent>>>,
    pub event_seq: Arc<AtomicU64>,
    pub started_at_ms: u64,
}

/// Configured sandbox subnet topology: 5 notaries, BFT quorum 4.
pub const SUBNET_NOTARIES: u32 = 5;
pub const SUBNET_QUORUM: u32 = 4;

/// Compact "E8F1A2...C9:0"-style state reference derived from any seed string.
pub fn short_stateref(seed: &str) -> String {
    let hex = format!("{:X}", md5::compute(seed));
    format!("{}...{}:0", &hex[..6], &hex[30..])
}

/// Append a settlement event (newest first) to the live notary log, capped at 200 entries.
pub fn record_settlement_event(
    state: &ServerState,
    operation: &str,
    stateref: String,
    requesting_party: &str,
    ok: bool,
    reason: &str,
    duration_us: u64,
    detail: String,
) {
    let seq = state.event_seq.fetch_add(1, Ordering::SeqCst);
    let event = SettlementEvent {
        seq,
        timestamp_ms: chrono::Utc::now().timestamp_millis() as u64,
        operation: operation.to_string(),
        stateref,
        requesting_party: requesting_party.to_string(),
        status: if ok { "VALIDATED" } else { "REJECTED" }.to_string(),
        reason: reason.to_string(),
        signatures: if ok {
            format!("{}/{}", SUBNET_QUORUM, SUBNET_NOTARIES)
        } else {
            format!("0/{}", SUBNET_NOTARIES)
        },
        duration_us,
        detail,
    };
    let mut events = state.settlement_events.write().unwrap();
    events.insert(0, event);
    events.truncate(200);
}

#[derive(Deserialize)]
pub struct CreateAccountRequest {
    pub custodian: String,
    pub owner: String,
    pub currency: String,
    pub overdraft_limit: String,
    pub daily_transfer_limit: String,
}

#[derive(Deserialize)]
pub struct CashTransferRequest {
    pub sender_id: String,
    pub recipient_id: String,
    pub amount: String,
    pub memo: Option<String>,
    pub gl_code: Option<String>,
}

#[derive(Deserialize)]
pub struct IssueAssetRequest {
    pub issuer: String,
    pub holder: String,
    pub currency: String,
    pub amount: String,
}

#[derive(Deserialize)]
pub struct AssetTransferRequest {
    pub sender: String,
    pub recipient: String,
    pub currency: String,
    pub amount: String,
}

#[derive(Deserialize)]
pub struct RegisterIdentityRequest {
    pub principal: String,
    pub legal_name: String,
    pub role: String,
}

#[derive(Deserialize)]
pub struct BlindIdentityRequest {
    pub well_known: String,
    pub anonymous: String,
}

#[derive(Deserialize)]
pub struct RfqExecuteRequest {
    pub account_id: String,
    pub buyer_principal: String,
    pub asset_symbol: String,
    pub asset_amount: String,
    pub cash_amount: String,
}

#[derive(Deserialize)]
pub struct CreateOfferRequest {
    pub seller_principal: String,
    pub seller_legal_name: String,
    pub asset_symbol: String,
    pub asset_name: String,
    pub asset_amount: String,
    pub price_per_unit_eur: String,
}

#[derive(Deserialize)]
pub struct AcceptOfferRequest {
    pub offer_id: String,
    pub buyer_principal: String,
    pub buyer_account_id: String,
}

#[derive(Deserialize)]
pub struct PostCollateralRequest {
    pub asset_symbol: String,
    pub asset_name: String,
    pub amount: String,
    pub market_value_eur: String,
    pub haircut_percent: String,
    pub pledgee: String,
}

#[derive(Deserialize)]
pub struct SubmitBidRequest {
    pub auction_id: String,
    pub bidder_legal: String,
    pub amount_eur: String,
    pub bid_yield_pct: String,
}

#[derive(Deserialize)]
pub struct ExecuteActionRequest {
    pub action_id: String,
}

#[derive(Deserialize)]
pub struct ApproveRequest {
    pub approval_id: String,
    pub checker_signer: String,
}

#[derive(Deserialize)]
pub struct CreateSweepingRuleRequest {
    pub source_account: String,
    pub target_asset: String,
    pub threshold_eur: String,
    pub frequency: String,
}

#[derive(Deserialize)]
pub struct BridgeTransferRequest {
    pub source_network: String,
    pub target_network: String,
    pub asset_symbol: String,
    pub amount: String,
    pub recipient_address: String,
}

#[derive(Deserialize)]
pub struct TopUpCanisterRequest {
    pub canister_id: String,
    pub cycles_to_add_tc: String,
}

#[derive(Deserialize)]
pub struct AddLiquidityRequest {
    pub pool_id: String,
    pub amount_a: String,
    pub amount_b: String,
}

pub fn create_app(state: ServerState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let static_service = ServeDir::new("frontend/dist")
        .not_found_service(ServeFile::new("frontend/dist/index.html"));

    Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/rates", get(get_market_rates))
        .route("/api/v1/accounts", get(list_accounts).post(create_account))
        .route("/api/v1/accounts/transfer", post(transfer_cash))
        .route("/api/v1/holdings", get(list_holdings))
        .route("/api/v1/assets/issue", post(issue_asset))
        .route("/api/v1/assets/transfer", post(transfer_asset))
        .route("/api/v1/identities", get(list_identities).post(register_identity))
        .route("/api/v1/identities/blind", post(issue_blinded_identity))
        .route("/api/v1/rfq/execute", post(execute_rfq_trade))
        .route("/api/v1/offers", get(list_offers).post(create_rwa_offer))
        .route("/api/v1/offers/accept", post(accept_rwa_offer))
        .route("/api/v1/admin/supervision", get(get_admin_supervision))
        .route("/api/v1/reporting/transactions", get(list_transactions))
        .route("/api/v1/reporting/export/csv", get(export_transactions_csv))
        .route("/api/v1/reporting/export/json", get(export_transactions_json))
        .route("/api/v1/standards/mapping", get(get_standards_mapping))
        .route("/api/v1/collateral/positions", get(list_collateral).post(post_collateral))
        // 5 Advanced Extensions Endpoints
        .route("/api/v1/auctions", get(list_auctions))
        .route("/api/v1/auctions/bid", post(submit_auction_bid))
        .route("/api/v1/corporate-actions", get(list_corporate_actions))
        .route("/api/v1/corporate-actions/distribute", post(execute_corporate_action))
        .route("/api/v1/governance/approvals", get(list_approvals))
        .route("/api/v1/governance/approve", post(approve_governance_item))
        .route("/api/v1/vault/telemetry", get(get_vault_telemetry))
        .route("/api/v1/settlement/telemetry", get(get_settlement_telemetry))
        .route("/api/v1/treasury/sweeper", get(list_sweeping_rules).post(create_sweeping_rule))
        // Workspace 2 Stitch Endpoints
        .route("/api/v1/bridge/routes", get(list_bridge_routes))
        .route("/api/v1/bridge/transfer", post(execute_bridge_transfer))
        .route("/api/v1/canisters", get(list_canisters))
        .route("/api/v1/canisters/topup", post(topup_canister))
        .route("/api/v1/liquidity/pools", get(list_liquidity_pools).post(add_liquidity))
        // Smart Contract Maker & Bond Factory Endpoints
        .route("/api/v1/factory/bonds", get(list_sovereign_bonds).post(create_sovereign_bond))
        .fallback_service(static_service)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({ "status": "healthy", "chain": "icp-canister-suite", "version": "0.1.0" })))
}

async fn get_market_rates() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({
        "timestamp": chrono::Utc::now().timestamp_millis(),
        "rates": [
            {
                "symbol": "GOLD",
                "name": "LBMA Physical Gold (1 oz)",
                "category": "Precious Metal",
                "iso24165_dti": "DTI-GOLD-8821",
                "price_usd": "2745.50",
                "price_eur": "2542.10",
                "change_24h": "+1.35%",
                "backing": "Allocated Physical Bar in Zurich Vault",
                "liquidity_depth": "5,000 oz"
            },
            {
                "symbol": "USTB",
                "name": "US Treasury 3M Bill (AA+)",
                "category": "Sovereign Debt Bond",
                "iso24165_dti": "DTI-USTB-3312",
                "price_usd": "987.25",
                "price_eur": "914.10",
                "change_24h": "+0.04%",
                "backing": "Direct US Sovereign Guarantee",
                "liquidity_depth": "$50,000,000"
            },
            {
                "symbol": "EURD",
                "name": "Tokenized Deposit Euro (EURD)",
                "category": "Tokenized Bank Deposit",
                "iso24165_dti": "DTI-EURD-9941",
                "price_usd": "1.08",
                "price_eur": "1.00",
                "change_24h": "0.00%",
                "backing": "Central Bank Settlement Reserve",
                "liquidity_depth": "€100,000,000"
            },
            {
                "symbol": "USDD",
                "name": "Tokenized Deposit Dollar (USDD)",
                "category": "Tokenized Bank Deposit",
                "iso24165_dti": "DTI-USDD-1024",
                "price_usd": "1.00",
                "price_eur": "0.925",
                "change_24h": "0.00%",
                "backing": "Tier-1 Depository Bank",
                "liquidity_depth": "$100,000,000"
            },
            {
                "symbol": "PROP_ZH",
                "name": "Prime Zurich Commercial RE",
                "category": "Real Estate Equity",
                "iso24165_dti": "DTI-PROP-ZH44",
                "price_usd": "50.00",
                "price_eur": "46.30",
                "change_24h": "+0.85%",
                "backing": "Title Deed Notarized in Canton Zurich",
                "liquidity_depth": "10,000 Units"
            },
            {
                "symbol": "ICP",
                "name": "Internet Computer Utility Token",
                "category": "Native Blockchain Compute",
                "iso24165_dti": "DTI-ICP-0001",
                "price_usd": "8.45",
                "price_eur": "7.82",
                "change_24h": "+3.12%",
                "backing": "Decentralized Network Cycles",
                "liquidity_depth": "250,000 ICP"
            }
        ]
    })))
}

async fn list_accounts(State(state): State<ServerState>) -> impl IntoResponse {
    let alice = PrincipalId::new_user(3);
    let bob = PrincipalId::new_user(4);
    let mut all = state.env.settlement_engine.get_participant_accounts(&alice);
    all.extend(state.env.settlement_engine.get_participant_accounts(&bob));
    (StatusCode::OK, Json(all))
}

async fn create_account(
    State(state): State<ServerState>,
    Json(payload): Json<CreateAccountRequest>,
) -> Result<(StatusCode, Json<DemandDepositRecord>), (StatusCode, Json<serde_json::Value>)> {
    let custodian = PrincipalId::from_text(&payload.custodian).unwrap_or_else(|_| PrincipalId::new_user(2));
    let owner = PrincipalId::from_text(&payload.owner).unwrap_or_else(|_| PrincipalId::new_user(3));
    let currency = CurrencyCode::new(&payload.currency).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let overdraft = Amount::from_str_strict(&payload.overdraft_limit).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let daily_limit = Amount::from_str_strict(&payload.daily_transfer_limit).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    let t0 = Instant::now();
    let account = state
        .env
        .position_ledger
        .create_demand_deposit_account(custodian, owner, currency, overdraft, daily_limit, chrono::Utc::now().timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    record_settlement_event(
        &state,
        "AccountCreation",
        short_stateref(&format!("acct-{}-{}", payload.owner, chrono::Utc::now().timestamp_millis())),
        &payload.owner,
        true,
        "",
        t0.elapsed().as_micros() as u64,
        format!("{} demand deposit account opened", payload.currency),
    );

    Ok((StatusCode::CREATED, Json(account)))
}

async fn transfer_cash(
    State(state): State<ServerState>,
    Json(payload): Json<CashTransferRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let sender = AccountId::new(&payload.sender_id);
    let recipient = AccountId::new(&payload.recipient_id);
    let amount = Amount::from_str_strict(&payload.amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    let t0 = Instant::now();
    let op_result = state.env.transfer_cash(&sender, &recipient, &amount, now.timestamp_millis() as u64);
    let duration_us = t0.elapsed().as_micros() as u64;
    let (proto_id, s_acc, r_acc) = match op_result {
        Ok(v) => v,
        Err(e) => {
            // Real ledger rejection (conservation guard / limits): stream it live.
            record_settlement_event(
                &state,
                "CashTransfer",
                short_stateref(&format!("cash-{}-{}", payload.sender_id, now.timestamp_millis())),
                &payload.sender_id,
                false,
                &e.to_string(),
                duration_us,
                format!("{} {} → {} rejected", payload.amount, payload.sender_id, payload.recipient_id),
            );
            return Err((StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": e.to_string() }))));
        }
    };

    record_settlement_event(
        &state,
        "CashTransfer",
        short_stateref(proto_id.to_string().as_str()),
        &payload.sender_id,
        true,
        "",
        duration_us,
        format!("{} {} → {}", payload.amount, s_acc.currency, payload.recipient_id),
    );

    let txn = InstitutionalTxn {
        txn_id: format!("TXN-{}-{}", now.format("%Y%m%d"), &uuid::Uuid::new_v4().to_string()[..6].to_uppercase()),
        booking_date: now.format("%Y-%m-%d %H:%M:%S UTC").to_string(),
        value_date: now.format("%Y-%m-%d").to_string(),
        gl_code: payload.gl_code.unwrap_or_else(|| "1010-01".to_string()),
        txn_type: "CrossBorderTokenizedWire".to_string(),
        iso20022_msg: "pacs.008.001.10".to_string(),
        iso24165_dti: "DTI-EURD-9941".to_string(),
        actus_contract_type: "PAM".to_string(),
        swift_on_off_ramp_code: "SWIFT-ONRAMP-CH93-UBSWCHZH".to_string(),
        canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
        sender_legal: "Alice Trading Corp (Zurich)".to_string(),
        recipient_legal: "Bob Commodities LLC (Frankfurt)".to_string(),
        amount: payload.amount.clone(),
        currency: s_acc.currency.to_string(),
        debit_credit: "Debit".to_string(),
        memo: payload.memo.unwrap_or_else(|| "Corporate Treasury Transfer".to_string()),
        onchain_hash: format!("0x{:x}", md5::compute(proto_id.to_string())),
        finality_receipt: proto_id.to_string(),
        status: "Finalized".to_string(),
    };

    let mut lock = state.transactions.write().unwrap();
    lock.insert(0, txn.clone());

    Ok(Json(json!({
        "protocol_id": proto_id.to_string(),
        "txn_id": txn.txn_id,
        "iso20022_msg": txn.iso20022_msg,
        "iso24165_dti": txn.iso24165_dti,
        "swift_on_off_ramp_code": txn.swift_on_off_ramp_code,
        "canister_principal_id": txn.canister_principal_id,
        "sender": s_acc,
        "recipient": r_acc,
        "status": "Finalized"
    })))
}

async fn list_holdings(State(state): State<ServerState>) -> impl IntoResponse {
    let alice = PrincipalId::new_user(3);
    let bob = PrincipalId::new_user(4);
    let mut all = state.env.settlement_engine.get_participant_holdings(&alice);
    all.extend(state.env.settlement_engine.get_participant_holdings(&bob));
    (StatusCode::OK, Json(all))
}

async fn issue_asset(
    State(state): State<ServerState>,
    Json(payload): Json<IssueAssetRequest>,
) -> Result<(StatusCode, Json<FungibleAssetHolding>), (StatusCode, Json<serde_json::Value>)> {
    let issuer = PrincipalId::from_text(&payload.issuer).unwrap_or_else(|_| PrincipalId::new_user(2));
    let holder = PrincipalId::from_text(&payload.holder).unwrap_or_else(|_| PrincipalId::new_user(3));
    let currency = CurrencyCode::new(&payload.currency).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let amount = Amount::from_str_strict(&payload.amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    let t0 = Instant::now();
    let (holding, _receipt) = state
        .env
        .asset_ledger
        .issue_fungible_asset(issuer, holder, currency, amount, chrono::Utc::now().timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    record_settlement_event(
        &state,
        "AssetIssuance",
        short_stateref(&format!("issue-{}-{}", payload.holder, payload.amount)),
        &payload.holder,
        true,
        "",
        t0.elapsed().as_micros() as u64,
        format!("{} {} issued to {}", payload.amount, payload.currency, payload.holder),
    );

    Ok((StatusCode::CREATED, Json(holding)))
}

async fn transfer_asset(
    State(state): State<ServerState>,
    Json(payload): Json<AssetTransferRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let sender = PrincipalId::from_text(&payload.sender).unwrap_or_else(|_| PrincipalId::new_user(3));
    let recipient = PrincipalId::from_text(&payload.recipient).unwrap_or_else(|_| PrincipalId::new_user(4));
    let currency = CurrencyCode::new(&payload.currency).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let amount = Amount::from_str_strict(&payload.amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    let t0 = Instant::now();
    let op_result = state
        .env
        .transfer_asset(sender, recipient, currency, amount, chrono::Utc::now().timestamp_millis() as u64);
    let duration_us = t0.elapsed().as_micros() as u64;
    let (proto_id, transferred, change, receipt) = match op_result {
        Ok(v) => v,
        Err(e) => {
            record_settlement_event(
                &state,
                "AssetTransfer",
                short_stateref(&format!("asset-{}-{}", payload.sender, chrono::Utc::now().timestamp_millis())),
                &payload.sender,
                false,
                &e.to_string(),
                duration_us,
                format!("{} {} rejected", payload.amount, payload.currency),
            );
            return Err((StatusCode::UNPROCESSABLE_ENTITY, Json(json!({ "error": e.to_string() }))));
        }
    };

    record_settlement_event(
        &state,
        "AssetTransfer",
        short_stateref(proto_id.to_string().as_str()),
        &payload.sender,
        true,
        "",
        duration_us,
        format!("{} {} → {}", payload.amount, payload.currency, payload.recipient),
    );

    Ok(Json(json!({
        "protocol_id": proto_id.to_string(),
        "transferred": transferred,
        "change": change,
        "receipt": receipt,
        "status": "Finalized"
    })))
}

async fn list_identities(State(state): State<ServerState>) -> impl IntoResponse {
    let alice = PrincipalId::new_user(3);
    let bob = PrincipalId::new_user(4);
    let bank = PrincipalId::new_user(2);
    let mut profiles = Vec::new();
    if let Some(p) = state.env.identity_registry.get_profile(&alice) { profiles.push(p); }
    if let Some(p) = state.env.identity_registry.get_profile(&bob) { profiles.push(p); }
    if let Some(p) = state.env.identity_registry.get_profile(&bank) { profiles.push(p); }
    (StatusCode::OK, Json(profiles))
}

async fn register_identity(
    State(state): State<ServerState>,
    Json(payload): Json<RegisterIdentityRequest>,
) -> Result<(StatusCode, Json<PrincipalProfile>), (StatusCode, Json<serde_json::Value>)> {
    let principal = PrincipalId::from_text(&payload.principal).unwrap_or_else(|_| PrincipalId::new_user(3));
    let profile = state
        .env
        .identity_registry
        .register_profile(principal, payload.legal_name, payload.role, chrono::Utc::now().timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    Ok((StatusCode::CREATED, Json(profile)))
}

async fn issue_blinded_identity(
    State(state): State<ServerState>,
    Json(payload): Json<BlindIdentityRequest>,
) -> Result<(StatusCode, Json<BlindedIdentity>), (StatusCode, Json<serde_json::Value>)> {
    let well_known = PrincipalId::from_text(&payload.well_known).unwrap_or_else(|_| PrincipalId::new_user(3));
    let anonymous = PrincipalId::from_text(&payload.anonymous).unwrap_or_else(|_| PrincipalId::new_user(5));

    let (_proto_id, identity) = state
        .env
        .swap_blinded_identity(well_known, anonymous, chrono::Utc::now().timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    Ok((StatusCode::CREATED, Json(identity)))
}

async fn execute_rfq_trade(
    State(state): State<ServerState>,
    Json(payload): Json<RfqExecuteRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let acc_id = AccountId::new(&payload.account_id);
    let cash_amt = Amount::from_str_strict(&payload.cash_amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let asset_symbol = CurrencyCode::new(&payload.asset_symbol).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let asset_amt = Amount::from_str_strict(&payload.asset_amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let buyer = PrincipalId::from_text(&payload.buyer_principal).unwrap_or_else(|_| PrincipalId::new_user(3));
    let vault_custodian = PrincipalId::new_user(2);

    let mut account = state
        .env
        .settlement_engine
        .get_account(&acc_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Account not found" }))))?;

    let t0 = Instant::now();
    if let Err(e) = account.apply_debit(&cash_amt, now.timestamp_millis() as u64) {
        record_settlement_event(
            &state,
            "AtomicDvPSettlement",
            short_stateref(&format!("rfq-{}-{}", payload.account_id, now.timestamp_millis())),
            &payload.buyer_principal,
            false,
            &e.to_string(),
            t0.elapsed().as_micros() as u64,
            format!("RFQ {} {} rejected", payload.cash_amount, payload.asset_symbol),
        );
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))));
    }
    state.env.settlement_engine.register_account(account.clone());

    let (holding, receipt) = state
        .env
        .asset_ledger
        .issue_fungible_asset(vault_custodian, buyer, asset_symbol, asset_amt, now.timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    record_settlement_event(
        &state,
        "AtomicDvPSettlement",
        short_stateref(receipt.update_id.to_string().as_str()),
        &payload.buyer_principal,
        true,
        "",
        t0.elapsed().as_micros() as u64,
        format!("{} {} for {} EUR", payload.asset_amount, payload.asset_symbol, payload.cash_amount),
    );

    let txn = InstitutionalTxn {
        txn_id: format!("TXN-{}-{}", now.format("%Y%m%d"), &uuid::Uuid::new_v4().to_string()[..6].to_uppercase()),
        booking_date: now.format("%Y-%m-%d %H:%M:%S UTC").to_string(),
        value_date: now.format("%Y-%m-%d").to_string(),
        gl_code: "1520-03".to_string(),
        txn_type: "AtomicDvPRfqSettlement".to_string(),
        iso20022_msg: "sese.023.001.09".to_string(),
        iso24165_dti: "DTI-GOLD-8821".to_string(),
        actus_contract_type: "PAM".to_string(),
        swift_on_off_ramp_code: "SWIFT-DVP-ZURICH-VAULT".to_string(),
        canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
        sender_legal: "Alice Trading Corp (Zurich)".to_string(),
        recipient_legal: "Swiss Vault Depository".to_string(),
        amount: payload.cash_amount,
        currency: "EUR".to_string(),
        debit_credit: "Debit_Cash_Credit_RWA".to_string(),
        memo: format!("Guaranteed RFQ Purchase {} {}", payload.asset_amount, payload.asset_symbol),
        onchain_hash: receipt.update_id.to_string(),
        finality_receipt: receipt.update_id.to_string(),
        status: "Finalized".to_string(),
    };

    let mut lock = state.transactions.write().unwrap();
    lock.insert(0, txn.clone());

    Ok(Json(json!({
        "status": "Finalized",
        "trade_type": "AtomicDvPSettlement",
        "txn_id": txn.txn_id,
        "iso20022_msg": txn.iso20022_msg,
        "iso24165_dti": txn.iso24165_dti,
        "canister_principal_id": txn.canister_principal_id,
        "debited_account": account,
        "issued_rwa_holding": holding,
        "receipt": receipt,
        "timestamp": now.timestamp_millis() as u64
    })))
}

async fn list_offers(State(state): State<ServerState>) -> impl IntoResponse {
    let offers = state.offers.read().unwrap().clone();
    (StatusCode::OK, Json(offers))
}

async fn create_rwa_offer(
    State(state): State<ServerState>,
    Json(payload): Json<CreateOfferRequest>,
) -> Result<(StatusCode, Json<RwaOffer>), (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now().timestamp_millis() as u64;
    let qty = payload.asset_amount.parse::<f64>().map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid quantity" }))))?;
    let rate = payload.price_per_unit_eur.parse::<f64>().map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid unit rate" }))))?;
    let total = format!("{:.2}", qty * rate);

    let offer = RwaOffer {
        offer_id: format!("OFFER-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        seller_principal: payload.seller_principal,
        seller_legal_name: payload.seller_legal_name,
        asset_symbol: payload.asset_symbol,
        asset_name: payload.asset_name,
        asset_amount: payload.asset_amount,
        price_per_unit_eur: payload.price_per_unit_eur,
        total_price_eur: total,
        status: "Active".to_string(),
        created_at: now,
    };

    let mut lock = state.offers.write().unwrap();
    lock.insert(0, offer.clone());

    Ok((StatusCode::CREATED, Json(offer)))
}

async fn accept_rwa_offer(
    State(state): State<ServerState>,
    Json(payload): Json<AcceptOfferRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let mut lock = state.offers.write().unwrap();
    let offer = lock
        .iter_mut()
        .find(|o| o.offer_id == payload.offer_id && o.status == "Active")
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Active offer not found" }))))?;

    let acc_id = AccountId::new(&payload.buyer_account_id);
    let cash_amt = Amount::from_str_strict(&offer.total_price_eur).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let asset_symbol = CurrencyCode::new(&offer.asset_symbol).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let asset_amt = Amount::from_str_strict(&offer.asset_amount).map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;
    let buyer = PrincipalId::from_text(&payload.buyer_principal).unwrap_or_else(|_| PrincipalId::new_user(3));
    let seller = PrincipalId::from_text(&offer.seller_principal).unwrap_or_else(|_| PrincipalId::new_user(4));

    let mut buyer_acc = state
        .env
        .settlement_engine
        .get_account(&acc_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Buyer cash account not found" }))))?;

    let t0 = Instant::now();
    if let Err(e) = buyer_acc.apply_debit(&cash_amt, now.timestamp_millis() as u64) {
        record_settlement_event(
            &state,
            "P2POfferExecution",
            short_stateref(&format!("offer-{}-{}", payload.offer_id, now.timestamp_millis())),
            &payload.buyer_principal,
            false,
            &e.to_string(),
            t0.elapsed().as_micros() as u64,
            format!("Offer {} rejected", payload.offer_id),
        );
        return Err((StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))));
    }
    state.env.settlement_engine.register_account(buyer_acc.clone());

    let (holding, receipt) = state
        .env
        .asset_ledger
        .issue_fungible_asset(seller, buyer, asset_symbol, asset_amt, now.timestamp_millis() as u64)
        .map_err(|e| (StatusCode::BAD_REQUEST, Json(json!({ "error": e.to_string() }))))?;

    offer.status = "Filled".to_string();

    record_settlement_event(
        &state,
        "P2POfferExecution",
        short_stateref(receipt.update_id.to_string().as_str()),
        &payload.buyer_principal,
        true,
        "",
        t0.elapsed().as_micros() as u64,
        format!("Offer {} · {} {} for {} EUR", payload.offer_id, offer.asset_amount, offer.asset_symbol, offer.total_price_eur),
    );

    let txn = InstitutionalTxn {
        txn_id: format!("TXN-{}-{}", now.format("%Y%m%d"), &uuid::Uuid::new_v4().to_string()[..6].to_uppercase()),
        booking_date: now.format("%Y-%m-%d %H:%M:%S UTC").to_string(),
        value_date: now.format("%Y-%m-%d").to_string(),
        gl_code: "1530-01".to_string(),
        txn_type: "AtomicP2PDvPTrade".to_string(),
        iso20022_msg: "setr.016.001.04".to_string(),
        iso24165_dti: "DTI-USTB-3312".to_string(),
        actus_contract_type: "PAM".to_string(),
        swift_on_off_ramp_code: "SWIFT-OFFRAMP-FRANKFURT-CLEARING".to_string(),
        canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
        sender_legal: "Alice Trading Corp".to_string(),
        recipient_legal: offer.seller_legal_name.clone(),
        amount: offer.total_price_eur.clone(),
        currency: "EUR".to_string(),
        debit_credit: "Debit_Cash_Credit_RWA".to_string(),
        memo: format!("P2P Settlement Offer {} ({} {})", offer.offer_id, offer.asset_amount, offer.asset_symbol),
        onchain_hash: receipt.update_id.to_string(),
        finality_receipt: receipt.update_id.to_string(),
        status: "Finalized".to_string(),
    };

    let mut t_lock = state.transactions.write().unwrap();
    t_lock.insert(0, txn.clone());

    Ok(Json(json!({
        "status": "Finalized",
        "trade_type": "AtomicP2POfferExecution",
        "txn_id": txn.txn_id,
        "offer_id": offer.offer_id,
        "iso20022_msg": txn.iso20022_msg,
        "iso24165_dti": txn.iso24165_dti,
        "canister_principal_id": txn.canister_principal_id,
        "buyer_account": buyer_acc,
        "transferred_holding": holding,
        "receipt": receipt,
        "timestamp": now.timestamp_millis() as u64
    })))
}

async fn get_admin_supervision(State(_state): State<ServerState>) -> impl IntoResponse {
    let now = chrono::Utc::now().timestamp_millis() as u64;
    (StatusCode::OK, Json(json!({
        "supervision_timestamp": now,
        "radar_status": "Active_Consensus_Audit",
        "double_spend_attempts_intercepted": 0,
        "total_active_canister_partitions": 10,
        "regulatory_unmasking_authority": "CENTRAL_BANK_AUDIT_SUPERUSER",
        "iso20022_compliance_mode": "STRICT_CAMT_PACS_ENFORCED",
        "unmasked_active_flows": [
            {
                "anonymous_id": "ryjl3-hexae-mc6xm-gopwt-x5jg7-2a",
                "unmasked_legal_owner": "Alice Trading Corp (Zurich)",
                "net_exposure_eur": "€24,500.00",
                "rwa_gold_holdings_oz": "5.50 oz",
                "risk_tier": "Low_Compliant"
            },
            {
                "anonymous_id": "h64fh-eybaq-aaaaa-aaaaa-cai",
                "unmasked_legal_owner": "Bob Commodities LLC (Frankfurt)",
                "net_exposure_eur": "€18,200.00",
                "rwa_bond_holdings_usd": "$50,000 USTB",
                "risk_tier": "Low_Compliant"
            }
        ]
    })))
}

async fn list_transactions(State(state): State<ServerState>) -> impl IntoResponse {
    let txns = state.transactions.read().unwrap().clone();
    (StatusCode::OK, Json(txns))
}

async fn export_transactions_csv(State(state): State<ServerState>) -> impl IntoResponse {
    let txns = state.transactions.read().unwrap().clone();
    let mut csv = String::from("Transaction_ID,Booking_Date,Value_Date,GL_Account_Code,ISO20022_Message,ISO24165_DTI,ACTUS_Contract,SWIFT_Ramp_Code,ICP_Canister_Principal,Transaction_Type,Sender_Legal_Entity,Recipient_Legal_Entity,Amount,Currency,Debit_Credit,Memo_Description,OnChain_Notary_Hash,Finality_Proof_ID,Settlement_Status\n");

    for t in txns {
        csv.push_str(&format!(
            "\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\",\"{}\"\n",
            t.txn_id, t.booking_date, t.value_date, t.gl_code, t.iso20022_msg, t.iso24165_dti, t.actus_contract_type, t.swift_on_off_ramp_code, t.canister_principal_id, t.txn_type, t.sender_legal, t.recipient_legal, t.amount, t.currency, t.debit_credit, t.memo, t.onchain_hash, t.finality_receipt, t.status
        ));
    }

    ([(header::CONTENT_TYPE, "text/csv; charset=utf-8"),
      (header::CONTENT_DISPOSITION, "attachment; filename=\"veritas_gold_general_ledger_export.csv\"")],
     csv)
}

async fn export_transactions_json(State(state): State<ServerState>) -> impl IntoResponse {
    let txns = state.transactions.read().unwrap().clone();
    (
        [(header::CONTENT_TYPE, "application/json; charset=utf-8"),
         (header::CONTENT_DISPOSITION, "attachment; filename=\"veritas_gold_iso_accounting_export.json\"")],
        Json(json!({
            "export_schema": "ISO_20022_CAMT053_ACTUS_ERP_INTEGRATION",
            "version": "1.0",
            "licensed_to": "ICP Moneta",
            "timestamp": chrono::Utc::now().timestamp_millis(),
            "records": txns
        }))
    )
}

async fn get_standards_mapping() -> impl IntoResponse {
    (StatusCode::OK, Json(json!({
        "standards_version": "1.0",
        "iso20022_coverage": ["pain.001.001.11", "pain.002.001.12", "pacs.008.001.10", "camt.053.001.10", "sese.023.001.09", "setr.016.001.04", "coll.001.001.04", "coll.002.001.04"],
        "iso24165_dti_registry": {
            "EURD": "DTI-EURD-9941",
            "USDD": "DTI-USDD-1024",
            "GOLD": "DTI-GOLD-8821",
            "USTB": "DTI-USTB-3312",
            "PROP_ZH": "DTI-PROP-ZH44"
        },
        "actus_contract_types": ["PAM", "LAX", "SWAPS"],
        "fix_protocol_coverage": ["NewOrderSingle (D)", "ExecutionReport (8)"],
        "swift_interop_layer": {
            "onramp_gateway": "SWIFT-ONRAMP-CH93-UBSWCHZH",
            "offramp_gateway": "SWIFT-OFFRAMP-FRANKFURT-CLEARING",
            "notary_verification": "ICP_CANISTER_ATT_SHA256"
        }
    })))
}

async fn list_collateral(State(state): State<ServerState>) -> impl IntoResponse {
    let list = state.collateral.read().unwrap().clone();
    (StatusCode::OK, Json(list))
}

async fn post_collateral(
    State(state): State<ServerState>,
    Json(payload): Json<PostCollateralRequest>,
) -> Result<(StatusCode, Json<CollateralPosition>), (StatusCode, Json<serde_json::Value>)> {
    let val = payload.market_value_eur.parse::<f64>().map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid market value" }))))?;
    let haircut = payload.haircut_percent.parse::<f64>().map_err(|_| (StatusCode::BAD_REQUEST, Json(json!({ "error": "Invalid haircut" }))))?;
    let capacity = format!("{:.2}", val * (1.0 - haircut / 100.0));

    let pos = CollateralPosition {
        position_id: format!("COL-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        asset_symbol: payload.asset_symbol,
        asset_name: payload.asset_name,
        pledged_amount: payload.amount,
        market_value_eur: payload.market_value_eur,
        haircut_percent: payload.haircut_percent,
        borrowing_capacity_eur: capacity,
        custodian: "Swiss Vault Depository".to_string(),
        pledgee: payload.pledgee,
        status: "Active_Pledged".to_string(),
    };

    let mut lock = state.collateral.write().unwrap();
    lock.insert(0, pos.clone());

    Ok((StatusCode::CREATED, Json(pos)))
}

// ----------------------------------------------------
// 5 Advanced Extensions Handlers
// ----------------------------------------------------

async fn list_auctions(State(state): State<ServerState>) -> impl IntoResponse {
    let auctions = state.auctions.read().unwrap().clone();
    (StatusCode::OK, Json(auctions))
}

async fn submit_auction_bid(
    State(state): State<ServerState>,
    Json(payload): Json<SubmitBidRequest>,
) -> Result<(StatusCode, Json<AuctionBid>), (StatusCode, Json<serde_json::Value>)> {
    let mut a_lock = state.auctions.write().unwrap();
    let auction = a_lock
        .iter_mut()
        .find(|a| a.auction_id == payload.auction_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Auction not found" }))))?;

    auction.bids_count += 1;

    let bid = AuctionBid {
        bid_id: format!("BID-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        auction_id: payload.auction_id,
        bidder_legal: payload.bidder_legal,
        amount_eur: payload.amount_eur,
        bid_yield_pct: payload.bid_yield_pct,
        status: "Allocated".to_string(),
    };

    let mut b_lock = state.bids.write().unwrap();
    b_lock.insert(0, bid.clone());

    Ok((StatusCode::CREATED, Json(bid)))
}

async fn list_corporate_actions(State(state): State<ServerState>) -> impl IntoResponse {
    let actions = state.corporate_actions.read().unwrap().clone();
    (StatusCode::OK, Json(actions))
}

async fn execute_corporate_action(
    State(state): State<ServerState>,
    Json(payload): Json<ExecuteActionRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut lock = state.corporate_actions.write().unwrap();
    let action = lock
        .iter_mut()
        .find(|a| a.action_id == payload.action_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Corporate action not found" }))))?;

    action.status = "Settled".to_string();

    Ok(Json(json!({
        "status": "Settled",
        "action_id": action.action_id,
        "distributed_eur": action.total_distributed_eur,
        "attestation": format!("0x{:x}", md5::compute(format!("{}-SETTLED", action.action_id)))
    })))
}

async fn list_approvals(State(state): State<ServerState>) -> impl IntoResponse {
    let approvals = state.approvals.read().unwrap().clone();
    (StatusCode::OK, Json(approvals))
}

async fn approve_governance_item(
    State(state): State<ServerState>,
    Json(payload): Json<ApproveRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut lock = state.approvals.write().unwrap();
    let item = lock
        .iter_mut()
        .find(|a| a.approval_id == payload.approval_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Approval item not found" }))))?;

    if !item.signers.contains(&payload.checker_signer) {
        item.signers.push(payload.checker_signer.clone());
        item.current_signatures += 1;
    }

    if item.current_signatures >= item.required_signatures {
        item.status = "Approved".to_string();
        record_settlement_event(
            &state,
            "GovernanceApproval",
            short_stateref(&format!("gov-{}", payload.approval_id)),
            &payload.checker_signer,
            true,
            "",
            0,
            format!("Approval {} fully signed ({}/{})", payload.approval_id, item.current_signatures, item.required_signatures),
        );
    }

    Ok(Json(json!({
        "approval_id": item.approval_id,
        "status": item.status,
        "current_signatures": item.current_signatures,
        "required_signatures": item.required_signatures
    })))
}

async fn get_settlement_telemetry(State(state): State<ServerState>) -> impl IntoResponse {
    let now_ms = chrono::Utc::now().timestamp_millis() as u64;
    let events = state.settlement_events.read().unwrap().clone();

    // Rolling 60s throughput over the real event log.
    let recent = events.iter().filter(|e| now_ms.saturating_sub(e.timestamp_ms) <= 60_000).count();
    let tps_60s = (recent as f64 / 60.0 * 100.0).round() / 100.0;

    // Real measured durations (µs) of validated ledger mutations.
    let mut durations: Vec<u64> = events
        .iter()
        .filter(|e| e.status == "VALIDATED" && e.duration_us > 0)
        .map(|e| e.duration_us)
        .collect();
    durations.sort_unstable();
    let p99_finality_us = durations.last().copied().unwrap_or(0);
    let last_finality_us = events
        .iter()
        .find(|e| e.status == "VALIDATED" && e.duration_us > 0)
        .map(|e| e.duration_us)
        .unwrap_or(0);

    let validated = events.iter().filter(|e| e.status == "VALIDATED").count();
    let rejected = events.len() - validated;

    // Real pending settlement items: open RWA offers + pending governance approvals.
    let open_offers = state
        .offers
        .read()
        .unwrap()
        .iter()
        .filter(|o| o.status == "Active" || o.status == "Open")
        .count();
    let pending_approvals = state.approvals.read().unwrap().iter().filter(|a| a.status == "Pending").count();

    // Leader node latency is the real measured processing time of the last settled op;
    // peer latencies reflect the configured sandbox fabric topology.
    let leader_latency_ms = (last_finality_us / 1000).max(1);
    let avg_latency_ms = (leader_latency_ms + 12 + 8 + 45) / 4;

    (StatusCode::OK, Json(json!({
        "server_time_ms": now_ms,
        "started_at_ms": state.started_at_ms,
        "uptime_s": now_ms.saturating_sub(state.started_at_ms) / 1000,
        "subnet": {
            "notaries": SUBNET_NOTARIES,
            "quorum": SUBNET_QUORUM,
            "algorithm": "Raft",
            "leader": "N-Zurich (L)",
        },
        "nodes": [
            { "id": "1", "name": "N-Frankfurt", "latency_ms": 12, "status": "online" },
            { "id": "2", "name": "N-London", "latency_ms": 8, "status": "online" },
            { "id": "3", "name": "N-Zurich (L)", "latency_ms": leader_latency_ms, "status": "online", "is_leader": true },
            { "id": "4", "name": "N-NewYork", "latency_ms": 45, "status": "online" },
            { "id": "5", "name": "N-Singapore", "latency_ms": 0, "status": "offline" },
        ],
        "metrics": {
            "ops_total": events.len(),
            "validated": validated,
            "rejected": rejected,
            "tps_60s": tps_60s,
            "last_finality_us": last_finality_us,
            "p99_finality_us": p99_finality_us,
            "pending_staterefs": open_offers + pending_approvals,
            "avg_latency_ms": avg_latency_ms,
        },
        "events": events.iter().take(20).cloned().collect::<Vec<_>>(),
    })))
}

async fn get_vault_telemetry() -> impl IntoResponse {
    (StatusCode::OK, Json(VaultSensorTelemetry {
        vault_location: "Zurich Freezone High-Security Vault #4".to_string(),
        total_bars_verified: 1250,
        total_weight_kg: "15,551.75 kg".to_string(),
        ultrasonic_density_pct: "99.992%".to_string(),
        vault_temperature_c: "18.4 °C".to_string(),
        humidity_pct: "42.1%".to_string(),
        purity_grade: "LBMA 999.9 Fine Gold".to_string(),
        merkle_root_hash: "0x98f4e21a8b417c8d9e2231ff01c78491ae6b490f".to_string(),
        oracle_attestation_status: "Verified_Nominal".to_string(),
    }))
}

async fn list_sweeping_rules(State(state): State<ServerState>) -> impl IntoResponse {
    let rules = state.sweeping_rules.read().unwrap().clone();
    (StatusCode::OK, Json(rules))
}

async fn create_sweeping_rule(
    State(state): State<ServerState>,
    Json(payload): Json<CreateSweepingRuleRequest>,
) -> Result<(StatusCode, Json<SweepingRule>), (StatusCode, Json<serde_json::Value>)> {
    let rule = SweepingRule {
        rule_id: format!("SWEEP-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        source_account: payload.source_account,
        target_asset: payload.target_asset,
        threshold_eur: payload.threshold_eur,
        frequency: payload.frequency,
        is_active: true,
        total_swept_eur: "0.00".to_string(),
    };

    let mut lock = state.sweeping_rules.write().unwrap();
    lock.insert(0, rule.clone());

    Ok((StatusCode::CREATED, Json(rule)))
}

// ----------------------------------------------------
// Workspace 2 Stitch Screen Handlers
// ----------------------------------------------------

async fn list_bridge_routes(State(state): State<ServerState>) -> impl IntoResponse {
    let routes = state.bridge_routes.read().unwrap().clone();
    (StatusCode::OK, Json(routes))
}

async fn execute_bridge_transfer(
    State(_state): State<ServerState>,
    Json(payload): Json<BridgeTransferRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let tx_hash = format!("0x{:x}", md5::compute(format!("{}-{}-{}", payload.source_network, payload.target_network, now.timestamp_millis())));

    Ok(Json(json!({
        "status": "Notarized_In_Flight",
        "bridge_tx_id": format!("BRG-{}", &uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
        "source_network": payload.source_network,
        "target_network": payload.target_network,
        "asset_symbol": payload.asset_symbol,
        "amount": payload.amount,
        "recipient_address": payload.recipient_address,
        "threshold_ecdsa_signature": "0x4f82a1...notarized",
        "onchain_hash": tx_hash,
        "timestamp": now.timestamp_millis() as u64
    })))
}

async fn list_canisters(State(state): State<ServerState>) -> impl IntoResponse {
    let canisters = state.canisters.read().unwrap().clone();
    (StatusCode::OK, Json(canisters))
}

async fn topup_canister(
    State(state): State<ServerState>,
    Json(payload): Json<TopUpCanisterRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut lock = state.canisters.write().unwrap();
    let canister = lock
        .iter_mut()
        .find(|c| c.canister_id == payload.canister_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Canister not found" }))))?;

    let current = canister.cycles_balance_tc.trim_end_matches(" TC").parse::<f64>().unwrap_or(4.5);
    let add = payload.cycles_to_add_tc.parse::<f64>().unwrap_or(2.0);
    canister.cycles_balance_tc = format!("{:.1} TC", current + add);

    Ok(Json(json!({
        "canister_id": canister.canister_id,
        "new_cycles_balance": canister.cycles_balance_tc,
        "status": "TopUp_Successful"
    })))
}

async fn list_liquidity_pools(State(state): State<ServerState>) -> impl IntoResponse {
    let pools = state.liquidity_pools.read().unwrap().clone();
    (StatusCode::OK, Json(pools))
}

async fn add_liquidity(
    State(state): State<ServerState>,
    Json(payload): Json<AddLiquidityRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut lock = state.liquidity_pools.write().unwrap();
    let pool = lock
        .iter_mut()
        .find(|p| p.pool_id == payload.pool_id)
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({ "error": "Pool not found" }))))?;

    Ok(Json(json!({
        "pool_id": pool.pool_id,
        "pair_name": pool.pair_name,
        "added_a": payload.amount_a,
        "added_b": payload.amount_b,
        "lp_tokens_minted": "500.00 LP",
        "status": "Liquidity_Provided"
    })))
}

async fn list_sovereign_bonds(State(state): State<ServerState>) -> impl IntoResponse {
    let contracts = state.bond_contracts.read().unwrap().clone();
    (StatusCode::OK, Json(contracts))
}

async fn create_sovereign_bond(
    State(state): State<ServerState>,
    Json(payload): Json<CreateSovereignBondRequest>,
) -> Result<(StatusCode, Json<SovereignBondContract>), (StatusCode, Json<serde_json::Value>)> {
    let now = chrono::Utc::now();
    let contract_id = format!("BOND-{}-{}", payload.isin_code.trim(), &uuid::Uuid::new_v4().to_string()[..6].to_uppercase());
    let canister_id = format!("bnd{}-cai", &uuid::Uuid::new_v4().to_string()[..5].to_lowercase());

    let contract = SovereignBondContract {
        contract_id,
        issuer_name: payload.issuer_name,
        issuer_principal: payload.issuer_principal,
        isin_code: payload.isin_code,
        dti_code: payload.dti_code,
        currency: payload.currency,
        notional_volume_eur: payload.notional_volume_eur,
        coupon_rate_pct: payload.coupon_rate_pct,
        coupon_frequency: payload.coupon_frequency,
        actus_contract_type: payload.actus_contract_type,
        maturity_date: payload.maturity_date,
        auction_mechanism: payload.auction_mechanism,
        collateral_backing: payload.collateral_backing,
        canister_principal_id: canister_id,
        status: "Active_Bidding".to_string(),
        created_at: now.timestamp_millis() as u64,
    };

    let mut lock = state.bond_contracts.write().unwrap();
    lock.insert(0, contract.clone());

    Ok((StatusCode::CREATED, Json(contract)))
}
