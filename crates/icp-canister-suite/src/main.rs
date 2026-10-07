mod server;

use domain::primitives::{Amount, CurrencyCode, PrincipalId};
use icp_canister_suite::CanisterEnvironment;
use server::{
    short_stateref, BondAuction, BridgeRoute, CanisterStatusInfo, CollateralPosition, CorporateAction,
    InstitutionalTxn, LiquidityPool, PendingApproval, RwaOffer, ServerState, SettlementEvent,
    SovereignBondContract, SweepingRule,
};
use std::net::SocketAddr;
use std::sync::atomic::AtomicU64;
use std::sync::{Arc, RwLock};
use std::time::Instant;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let bank = PrincipalId::new_user(2);
    let alice = PrincipalId::new_user(3);
    let bob = PrincipalId::new_user(4);

    let env = Arc::new(CanisterEnvironment::bootstrap(bank));

    let _ = env.identity_registry.register_profile(
        bank,
        "Sovereign Central Bank Custody (Zurich)".to_string(),
        "CentralBank".to_string(),
        1000,
    );
    let _ = env.identity_registry.register_profile(
        alice,
        "Alice Trading Corp".to_string(),
        "InstitutionalTrader".to_string(),
        1000,
    );
    let _ = env.identity_registry.register_profile(
        bob,
        "Bob Commodities LLC".to_string(),
        "LiquidityProvider".to_string(),
        1000,
    );

    let eurd = CurrencyCode::new("EURD")?;
    let gold = CurrencyCode::new("GOLD")?;
    let ustb = CurrencyCode::new("USTB")?;

    let t0 = Instant::now();
    let _ = env.position_ledger.create_demand_deposit_account(
        bank,
        alice,
        eurd.clone(),
        Amount::from_str_strict("1000.00")?,
        Amount::from_str_strict("5000.00")?,
        1000,
    )?;
    let dur_alice_account = t0.elapsed().as_micros() as u64;

    let t0 = Instant::now();
    let _ = env.position_ledger.create_demand_deposit_account(
        bank,
        bob,
        eurd,
        Amount::from_str_strict("500.00")?,
        Amount::from_str_strict("2000.00")?,
        1000,
    )?;
    let dur_bob_account = t0.elapsed().as_micros() as u64;

    let t0 = Instant::now();
    let _ = env.asset_ledger.issue_fungible_asset(
        bank,
        alice,
        gold,
        Amount::from_str_strict("10.00")?,
        1000,
    )?;
    let dur_gold_issue = t0.elapsed().as_micros() as u64;

    let t0 = Instant::now();
    let _ = env.asset_ledger.issue_fungible_asset(
        bank,
        bob,
        ustb,
        Amount::from_str_strict("100.00")?,
        1000,
    )?;
    let dur_ustb_issue = t0.elapsed().as_micros() as u64;

    let initial_offers = vec![
        RwaOffer {
            offer_id: "OFFER-USTB-901".to_string(),
            seller_principal: "h64fh-eybaq-aaaaa-aaaaa-cai".to_string(),
            seller_legal_name: "Bob Commodities LLC".to_string(),
            asset_symbol: "USTB".to_string(),
            asset_name: "US Treasury 3M Bill (AA+)".to_string(),
            asset_amount: "2.00".to_string(),
            price_per_unit_eur: "914.10".to_string(),
            total_price_eur: "1828.20".to_string(),
            status: "Active".to_string(),
            created_at: 1788238413917,
        },
        RwaOffer {
            offer_id: "OFFER-GOLD-442".to_string(),
            seller_principal: "lpmt4-wqbam-aaaaa-aaaaa-cai".to_string(),
            seller_legal_name: "Alice Trading Corp".to_string(),
            asset_symbol: "GOLD".to_string(),
            asset_name: "LBMA Physical Gold (1 oz Bar)".to_string(),
            asset_amount: "1.00".to_string(),
            price_per_unit_eur: "2540.00".to_string(),
            total_price_eur: "2540.00".to_string(),
            status: "Active".to_string(),
            created_at: 1788238413917,
        },
        RwaOffer {
            offer_id: "OFFER-PROP-108".to_string(),
            seller_principal: "h64fh-eybaq-aaaaa-aaaaa-cai".to_string(),
            seller_legal_name: "Zurich Prime Realty AG".to_string(),
            asset_symbol: "PROP_ZH".to_string(),
            asset_name: "Prime Zurich Commercial Real Estate".to_string(),
            asset_amount: "10.00".to_string(),
            price_per_unit_eur: "46.30".to_string(),
            total_price_eur: "463.00".to_string(),
            status: "Active".to_string(),
            created_at: 1788238413917,
        },
        RwaOffer {
            offer_id: "OFFER-USTB-BLOCK".to_string(),
            seller_principal: "h64fh-eybaq-aaaaa-aaaaa-cai".to_string(),
            seller_legal_name: "Bob Commodities LLC".to_string(),
            asset_symbol: "USTB".to_string(),
            asset_name: "US Treasury 3M Bill (AA+) Block".to_string(),
            asset_amount: "50.00".to_string(),
            price_per_unit_eur: "914.10".to_string(),
            total_price_eur: "45705.00".to_string(),
            status: "Active".to_string(),
            created_at: 1788238413917,
        },
    ];

    let initial_txns = vec![
        InstitutionalTxn {
            txn_id: "TXN-20260901-A109".to_string(),
            booking_date: "2026-09-01 08:12:44 UTC".to_string(),
            value_date: "2026-09-01".to_string(),
            gl_code: "1010-01".to_string(),
            txn_type: "CrossBorderTokenizedWire".to_string(),
            iso20022_msg: "pacs.008.001.10".to_string(),
            iso24165_dti: "DTI-EURD-9941".to_string(),
            actus_contract_type: "PAM".to_string(),
            swift_on_off_ramp_code: "SWIFT-ONRAMP-CH93-UBSWCHZH".to_string(),
            canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
            sender_legal: "Alice Trading Corp (Zurich)".to_string(),
            recipient_legal: "Bob Commodities LLC (Frankfurt)".to_string(),
            amount: "150.00".to_string(),
            currency: "EUR".to_string(),
            debit_credit: "Debit".to_string(),
            memo: "Settlement liquidity injection".to_string(),
            onchain_hash: "0x7f8a91b2c3d4e5f6".to_string(),
            finality_receipt: "RECEIPT-CANISTER-SETTLE-8812".to_string(),
            status: "Finalized".to_string(),
        },
        InstitutionalTxn {
            txn_id: "TXN-20260901-B441".to_string(),
            booking_date: "2026-09-01 07:55:10 UTC".to_string(),
            value_date: "2026-09-01".to_string(),
            gl_code: "1520-03".to_string(),
            txn_type: "AtomicDvPRfqSettlement".to_string(),
            iso20022_msg: "sese.023.001.09".to_string(),
            iso24165_dti: "DTI-GOLD-8821".to_string(),
            actus_contract_type: "PAM".to_string(),
            swift_on_off_ramp_code: "SWIFT-DVP-ZURICH-VAULT".to_string(),
            canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
            sender_legal: "Alice Trading Corp (Zurich)".to_string(),
            recipient_legal: "Swiss Vault Depository".to_string(),
            amount: "2540.00".to_string(),
            currency: "EUR".to_string(),
            debit_credit: "Debit_Cash_Credit_RWA".to_string(),
            memo: "LBMA 1 oz Gold Ingot Allocation".to_string(),
            onchain_hash: "0x3e119cb42d5f88a1".to_string(),
            finality_receipt: "RECEIPT-CANISTER-DVP-9941".to_string(),
            status: "Finalized".to_string(),
        },
    ];

    let initial_collateral = vec![
        CollateralPosition {
            position_id: "COL-USTB-991".to_string(),
            asset_symbol: "USTB".to_string(),
            asset_name: "US Treasury 3M Bill (AA+)".to_string(),
            pledged_amount: "50.00 Units".to_string(),
            market_value_eur: "45705.00".to_string(),
            haircut_percent: "2.0".to_string(),
            borrowing_capacity_eur: "44790.90".to_string(),
            custodian: "Swiss Vault Depository".to_string(),
            pledgee: "Apex Central Reserve Bank".to_string(),
            status: "Active_Pledged".to_string(),
        },
        CollateralPosition {
            position_id: "COL-GOLD-332".to_string(),
            asset_symbol: "GOLD".to_string(),
            asset_name: "LBMA Physical Gold (1 oz Bar)".to_string(),
            pledged_amount: "10.00 oz".to_string(),
            market_value_eur: "25421.00".to_string(),
            haircut_percent: "5.0".to_string(),
            borrowing_capacity_eur: "24149.95".to_string(),
            custodian: "Swiss Vault Depository".to_string(),
            pledgee: "Zurich Liquidity Pool #1".to_string(),
            status: "Active_Pledged".to_string(),
        },
    ];

    let initial_auctions = vec![
        BondAuction {
            auction_id: "AUC-USTB-2026-Q4".to_string(),
            bond_symbol: "USTB-Q4".to_string(),
            bond_name: "US Treasury 3M Bill Primary Issuance".to_string(),
            issuer_legal: "Federal Reserve Bank of New York (Fiscal Agent)".to_string(),
            total_issuance_eur: "50,000,000.00".to_string(),
            min_bid_eur: "10,000.00".to_string(),
            target_yield_pct: "3.85%".to_string(),
            cutoff_yield_pct: "3.89%".to_string(),
            bids_count: 14,
            status: "Open_Bidding".to_string(),
            maturity_date: "2026-12-01".to_string(),
        },
        BondAuction {
            auction_id: "AUC-SWISS-CONFED-2Y".to_string(),
            bond_symbol: "CH-CONFED-2Y".to_string(),
            bond_name: "Swiss Confederation 2-Year Sovereign Green Bond".to_string(),
            issuer_legal: "Swiss Federal Finance Administration (Bern)".to_string(),
            total_issuance_eur: "100,000,000.00".to_string(),
            min_bid_eur: "50,000.00".to_string(),
            target_yield_pct: "1.25%".to_string(),
            cutoff_yield_pct: "1.28%".to_string(),
            bids_count: 28,
            status: "Allocated".to_string(),
            maturity_date: "2028-09-01".to_string(),
        },
    ];

    let initial_bids = vec![
        server::AuctionBid {
            bid_id: "BID-7741".to_string(),
            auction_id: "AUC-USTB-2026-Q4".to_string(),
            bidder_legal: "Alice Trading Corp".to_string(),
            amount_eur: "500,000.00".to_string(),
            bid_yield_pct: "3.84%".to_string(),
            status: "Allocated".to_string(),
        },
    ];

    let initial_corporate_actions = vec![
        CorporateAction {
            action_id: "CA-USTB-COUPON-09".to_string(),
            asset_symbol: "USTB".to_string(),
            asset_name: "US Treasury 3M Bill (AA+)".to_string(),
            action_type: "Quarterly Coupon Distribution".to_string(),
            actus_contract: "PAM (Principal at Maturity)".to_string(),
            rate_or_amount_per_unit: "€9.85 / unit".to_string(),
            record_date: "2026-08-31".to_string(),
            payment_date: "2026-09-01".to_string(),
            total_distributed_eur: "49,250.00".to_string(),
            status: "Scheduled".to_string(),
        },
        CorporateAction {
            action_id: "CA-PROP-DIVIDEND-Q3".to_string(),
            asset_symbol: "PROP_ZH".to_string(),
            asset_name: "Prime Zurich Commercial Real Estate".to_string(),
            action_type: "Commercial Rental Yield Dividend".to_string(),
            actus_contract: "LAX (Linear Amortizing)".to_string(),
            rate_or_amount_per_unit: "€1.45 / share".to_string(),
            record_date: "2026-08-25".to_string(),
            payment_date: "2026-09-01".to_string(),
            total_distributed_eur: "14,500.00".to_string(),
            status: "Scheduled".to_string(),
        },
    ];

    let initial_approvals = vec![
        PendingApproval {
            approval_id: "APPR-WIRE-8891".to_string(),
            maker_principal: "ryjl3-hexae-mc6xm-gopwt-x5jg7-2a".to_string(),
            maker_legal: "Alice Trading Corp (Junior Treasury Officer)".to_string(),
            action_type: "High-Value Cross-Border Wire Transfer".to_string(),
            amount_eur: "2,500,000.00".to_string(),
            details: "Liquidity Settlement via pacs.008 to Bob Commodities LLC".to_string(),
            required_signatures: 2,
            current_signatures: 1,
            signers: vec!["Alice Trading Corp (Junior Treasury Officer)".to_string()],
            status: "Pending_Checker".to_string(),
            created_at: "2026-09-01 08:30:00 UTC".to_string(),
        },
        PendingApproval {
            approval_id: "APPR-MINT-1024".to_string(),
            maker_principal: "h64fh-eybaq-aaaaa-aaaaa-cai".to_string(),
            maker_legal: "Swiss Vault Custody Depository".to_string(),
            action_type: "Primary LBMA Gold Bar Tokenization".to_string(),
            amount_eur: "5,000,000.00".to_string(),
            details: "Minting 2,000 oz Physical Gold Ingots (Audit Attestation #ZH-88)".to_string(),
            required_signatures: 2,
            current_signatures: 1,
            signers: vec!["Swiss Vault Custody Depository".to_string()],
            status: "Pending_Checker".to_string(),
            created_at: "2026-09-01 08:00:00 UTC".to_string(),
        },
    ];

    let initial_sweeping_rules = vec![
        SweepingRule {
            rule_id: "SWEEP-RULES-01".to_string(),
            source_account: "ACC-EUR-ALICE-01".to_string(),
            target_asset: "USTB".to_string(),
            threshold_eur: "1,000,000.00".to_string(),
            frequency: "Daily at 16:30 UTC (EOD Cash Sweep)".to_string(),
            is_active: true,
            total_swept_eur: "250,000.00".to_string(),
        },
    ];

    let initial_bridge_routes = vec![
        BridgeRoute {
            route_id: "BRG-ETH-ICP-01".to_string(),
            source_network: "Ethereum Mainnet (ERC-20)".to_string(),
            target_network: "Internet Computer (Canister UTXO)".to_string(),
            asset_symbol: "EURD / USDC".to_string(),
            estimated_time_sec: 12,
            gas_fee_eur: "€1.20".to_string(),
            threshold_ecdsa_notary: "ECDSA_SECP256K1_VAULT_KEY".to_string(),
            status: "Operational".to_string(),
        },
        BridgeRoute {
            route_id: "BRG-SWIFT-ICP-02".to_string(),
            source_network: "SWIFT Alliance Gateway".to_string(),
            target_network: "ICP Position Ledger Canister".to_string(),
            asset_symbol: "EUR / USD Demand Deposit".to_string(),
            estimated_time_sec: 2,
            gas_fee_eur: "€0.00".to_string(),
            threshold_ecdsa_notary: "ISO_20022_PACS008_NOTARY".to_string(),
            status: "Operational".to_string(),
        },
    ];

    let initial_canisters = vec![
        CanisterStatusInfo {
            canister_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
            canister_name: "position-ledger (Demand Deposits)".to_string(),
            wasm_module_hash: "0x8f2a91...b9e1".to_string(),
            cycles_balance_tc: "4.8 TC".to_string(),
            memory_used_mb: "128.4 MB".to_string(),
            subnet: "System Subnet #1 (High-Throughput)".to_string(),
            status: "Running_Healthy".to_string(),
        },
        CanisterStatusInfo {
            canister_id: "ryjl3-hexae-mc6xm-gopwt-x5jg7-2a".to_string(),
            canister_name: "asset-ledger (RWA Gold & Bonds)".to_string(),
            wasm_module_hash: "0x3e11cb...44a9".to_string(),
            cycles_balance_tc: "5.2 TC".to_string(),
            memory_used_mb: "210.1 MB".to_string(),
            subnet: "European Subnet #2".to_string(),
            status: "Running_Healthy".to_string(),
        },
        CanisterStatusInfo {
            canister_id: "h64fh-eybaq-aaaaa-aaaaa-cai".to_string(),
            canister_name: "identity-registry (KYC / Blinded Keys)".to_string(),
            wasm_module_hash: "0x77ba12...e308".to_string(),
            cycles_balance_tc: "3.9 TC".to_string(),
            memory_used_mb: "64.2 MB".to_string(),
            subnet: "Fiduciary Subnet #3".to_string(),
            status: "Running_Healthy".to_string(),
        },
    ];

    let initial_liquidity_pools = vec![
        LiquidityPool {
            pool_id: "POOL-EURD-GOLD".to_string(),
            pair_name: "EURD / LBMA Gold (1 oz)".to_string(),
            token_a_symbol: "EURD".to_string(),
            token_b_symbol: "GOLD".to_string(),
            reserve_a: "€12,710,500.00".to_string(),
            reserve_b: "5,000.00 oz".to_string(),
            total_liquidity_eur: "€25,421,000.00".to_string(),
            fee_tier_pct: "0.05%".to_string(),
            volume_24h_eur: "€4,850,200.00".to_string(),
            apy_pct: "6.85%".to_string(),
        },
        LiquidityPool {
            pool_id: "POOL-EURD-USTB".to_string(),
            pair_name: "EURD / US Treasury 3M Bill".to_string(),
            token_a_symbol: "EURD".to_string(),
            token_b_symbol: "USTB".to_string(),
            reserve_a: "€45,705,000.00".to_string(),
            reserve_b: "50,000.00 Units".to_string(),
            total_liquidity_eur: "€91,410,000.00".to_string(),
            fee_tier_pct: "0.02%".to_string(),
            volume_24h_eur: "€18,250,000.00".to_string(),
            apy_pct: "4.15%".to_string(),
        },
    ];

    let initial_bond_contracts = vec![
        SovereignBondContract {
            contract_id: "BOND-TR-2036-10Y".to_string(),
            issuer_name: "Central Bank of the Republic of Turkey (CBRT)".to_string(),
            issuer_principal: "cbrt1-gibai-aaaaa-aaaaa-cai".to_string(),
            isin_code: "TRT150836T12".to_string(),
            dti_code: "DTI-TRY-BOND-10Y".to_string(),
            currency: "EURD".to_string(),
            notional_volume_eur: "1,000,000,000.00".to_string(),
            coupon_rate_pct: "4.25%".to_string(),
            coupon_frequency: "Semi-Annual".to_string(),
            actus_contract_type: "Principal At Maturity (PAM)".to_string(),
            maturity_date: "2036-08-15".to_string(),
            auction_mechanism: "Uniform-Price Dutch Auction".to_string(),
            collateral_backing: "Dual Sovereign Guarantee + 500 oz LBMA Gold Pool".to_string(),
            canister_principal_id: "rrkah-fqaaa-aaaaa-aaaaq-cai".to_string(),
            status: "Active_Bidding".to_string(),
            created_at: 1788238413917,
        },
        SovereignBondContract {
            contract_id: "BOND-CH-2035-GREEN".to_string(),
            issuer_name: "Swiss National Bank (SNB)".to_string(),
            issuer_principal: "snb01-hexae-mc6xm-gopwt-x5jg7-2a".to_string(),
            isin_code: "CH0553128914".to_string(),
            dti_code: "DTI-CHF-GREEN-10Y".to_string(),
            currency: "CHFD".to_string(),
            notional_volume_eur: "500,000,000.00".to_string(),
            coupon_rate_pct: "1.85%".to_string(),
            coupon_frequency: "Annual".to_string(),
            actus_contract_type: "Principal At Maturity (PAM)".to_string(),
            maturity_date: "2035-06-30".to_string(),
            auction_mechanism: "Uniform-Price Dutch Auction".to_string(),
            collateral_backing: "Swiss Confederation Direct Guarantee".to_string(),
            canister_principal_id: "ryjl3-hexae-mc6xm-gopwt-x5jg7-2a".to_string(),
            status: "Active_Bidding".to_string(),
            created_at: 1788238413917,
        },
    ];

    // Genesis settlement events: the real bootstrap ledger mutations measured above.
    let started_at_ms = chrono::Utc::now().timestamp_millis() as u64;
    let genesis_events = vec![
        SettlementEvent {
            seq: 3,
            timestamp_ms: started_at_ms,
            operation: "AssetIssuance".to_string(),
            stateref: short_stateref("genesis-ustb-issue"),
            requesting_party: "Sovereign Central Bank Custody (Zurich)".to_string(),
            status: "VALIDATED".to_string(),
            reason: String::new(),
            signatures: format!("{}/{}", server::SUBNET_QUORUM, server::SUBNET_NOTARIES),
            duration_us: dur_ustb_issue,
            detail: "100.00 USTB issued to Bob Commodities LLC".to_string(),
        },
        SettlementEvent {
            seq: 2,
            timestamp_ms: started_at_ms,
            operation: "AssetIssuance".to_string(),
            stateref: short_stateref("genesis-gold-issue"),
            requesting_party: "Sovereign Central Bank Custody (Zurich)".to_string(),
            status: "VALIDATED".to_string(),
            reason: String::new(),
            signatures: format!("{}/{}", server::SUBNET_QUORUM, server::SUBNET_NOTARIES),
            duration_us: dur_gold_issue,
            detail: "10.00 GOLD issued to Alice Trading Corp".to_string(),
        },
        SettlementEvent {
            seq: 1,
            timestamp_ms: started_at_ms,
            operation: "AccountCreation".to_string(),
            stateref: short_stateref("genesis-bob-account"),
            requesting_party: "Bob Commodities LLC".to_string(),
            status: "VALIDATED".to_string(),
            reason: String::new(),
            signatures: format!("{}/{}", server::SUBNET_QUORUM, server::SUBNET_NOTARIES),
            duration_us: dur_bob_account,
            detail: "500.00 EURD demand deposit opened".to_string(),
        },
        SettlementEvent {
            seq: 0,
            timestamp_ms: started_at_ms,
            operation: "AccountCreation".to_string(),
            stateref: short_stateref("genesis-alice-account"),
            requesting_party: "Alice Trading Corp".to_string(),
            status: "VALIDATED".to_string(),
            reason: String::new(),
            signatures: format!("{}/{}", server::SUBNET_QUORUM, server::SUBNET_NOTARIES),
            duration_us: dur_alice_account,
            detail: "1000.00 EURD demand deposit opened".to_string(),
        },
    ];

    let state = ServerState {
        env,
        settlement_events: Arc::new(RwLock::new(genesis_events)),
        event_seq: Arc::new(AtomicU64::new(4)),
        started_at_ms,
        offers: Arc::new(RwLock::new(initial_offers)),
        transactions: Arc::new(RwLock::new(initial_txns)),
        collateral: Arc::new(RwLock::new(initial_collateral)),
        auctions: Arc::new(RwLock::new(initial_auctions)),
        bids: Arc::new(RwLock::new(initial_bids)),
        corporate_actions: Arc::new(RwLock::new(initial_corporate_actions)),
        approvals: Arc::new(RwLock::new(initial_approvals)),
        sweeping_rules: Arc::new(RwLock::new(initial_sweeping_rules)),
        bridge_routes: Arc::new(RwLock::new(initial_bridge_routes)),
        canisters: Arc::new(RwLock::new(initial_canisters)),
        liquidity_pools: Arc::new(RwLock::new(initial_liquidity_pools)),
        bond_contracts: Arc::new(RwLock::new(initial_bond_contracts)),
    };

    let app = server::create_app(state);
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("🚀 ICP Canister Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
