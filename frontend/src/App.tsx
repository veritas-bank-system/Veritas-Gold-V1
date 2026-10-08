import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/smart/Sidebar';
import { StitchExecutiveDashboard } from './components/views/StitchExecutiveDashboard';
import { ConsensusHealthView } from './components/views/ConsensusHealthView';
import { BankCardSurface } from './components/smart/BankCardSurface';
import { RwaMarketplace } from './components/smart/RwaMarketplace';
import { RwaOfferDesk } from './components/smart/RwaOfferDesk';
import { GoldFxExchange } from './components/smart/GoldFxExchange';
import { RwaTerminalView } from './components/views/RwaTerminalView';
import { SmartContractMakerView } from './components/views/SmartContractMakerView';
import { RfqTradeDesk } from './components/smart/RfqTradeDesk';
import { TreasuryAccountingView } from './components/institutional/TreasuryAccountingView';
import { CollateralManagementView } from './components/institutional/CollateralManagementView';
import { SupervisoryRadar } from './components/views/SupervisoryRadar';
import { RiskDashboardView } from './components/views/RiskDashboardView';
import { ExposureLimitsView } from './components/views/ExposureLimitsView';
import { StressTestingView } from './components/views/StressTestingView';
import { AccessLogsView } from './components/views/AccessLogsView';
import { recordSessionEvent } from './services/sessionAudit';
import { OpsDashboard } from './components/views/OpsDashboard';
import { RegulatorDashboard } from './components/views/RegulatorDashboard';
import { INSTITUTION_PROFILES, type InstitutionProfile } from './components/institutional/InstitutionalAuthSurface';
import { IssuerDashboard } from './components/views/IssuerDashboard';
import { BondAuctionDesk } from './components/views/BondAuctionDesk';
import { CorporateActionsView } from './components/views/CorporateActionsView';
import { MakerCheckerWorkflow } from './components/views/MakerCheckerWorkflow';
import { ProofOfReserveTelemetry } from './components/views/ProofOfReserveTelemetry';
import { LiquiditySweeperView } from './components/views/LiquiditySweeperView';
import { CrossChainBridgeView } from './components/views/CrossChainBridgeView';
import { CanisterManagementView } from './components/views/CanisterManagementView';
import { WholesaleLiquidityView } from './components/views/WholesaleLiquidityView';
import { SupportDocsPortalView } from './components/docs/SupportDocsPortalView';
import { MasterAdminOverview } from './components/admin/MasterAdminOverview';
import { SettlementInstrumentRegistryView } from './components/views/SettlementInstrumentRegistryView';
import { MvpVerificationSuiteView } from './components/views/MvpVerificationSuiteView';
import { TraderDashboard } from './components/views/TraderDashboard';
import { AdminDashboard } from './components/views/AdminDashboard';
import { EnterpriseAdminDashboard } from './components/views/EnterpriseAdminDashboard';
import { SignalEncryptedChatView } from './components/views/SignalEncryptedChatView';
import { WorkspaceSelectSurface } from './components/auth/WorkspaceSelectSurface';
import { LandingSurface } from './components/auth/LandingSurface';
import { CentralBankDashboard, InstitutionalBankDashboard } from './components/views/WorkspaceDashboards';
import { InstitutionalMobileSurface } from './components/mobile/InstitutionalMobileSurface';
import {
  fetchAccounts,
  fetchHoldings,
  fetchIdentities,
  fetchMarketRates,
  fetchFxReferenceRates,
  fetchOffers,
  fetchTransactions,
  fetchCollateralPositions,
  fetchAuctions,
  fetchCorporateActions,
  fetchApprovals,
  fetchSweepingRules,
  fetchBridgeRoutes,
  fetchCanisters,
  fetchLiquidityPools,
  fetchBondContracts,
} from './services/api';
import type {
  AppSection,
  DemandDepositRecord,
  FungibleAssetHolding,
  PrincipalProfile,
  ProtocolLog,
  MarketRate,
  FxReferenceRates,
  RwaOffer,
  InstitutionalTxn,
  CollateralPosition,
  BondAuction,
  CorporateAction,
  PendingApproval,
  SweepingRule,
  SweepingRuleDraft,
  BridgeRoute,
  CanisterStatusInfo,
  LiquidityPool,
  SovereignBondContract,
  WorkspaceId,
} from './types';
import { WORKSPACE_PERSONA_IDS } from './types';
import {
  AlertCircle,
  CheckCircle,
  LogOut,
  Smartphone,
  Tablet,
  Monitor,
  ShieldCheck,
  KeyRound,
  ShoppingBag,
  CheckSquare,
  BarChart2,
  Send,
} from 'lucide-react';
import {
  InstitutionalLoginSurface,
  PERSONA_LIST,
  type PersonaDefinition,
  type SystemEnvironment,
} from './components/auth/InstitutionalLoginSurface';

/** Both workspaces share one identity/audit fabric; a persona's admission
 *  determines which workspace console it operates. */
const workspaceForPersona = (p: PersonaDefinition): WorkspaceId =>
  WORKSPACE_PERSONA_IDS.central_bank.includes(p.id) ? 'central_bank' : 'institutional';

export function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('notaries');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentInstitution, setCurrentInstitution] = useState<InstitutionProfile>(INSTITUTION_PROFILES[0]);

  // Two-Workspace Selection & Multi-Persona Authentication State.
  // Workspace choice gates persona list, navigation scope, and permissions;
  // both workspaces share the same identity/audit/settlement infrastructure.
  const [workspace, setWorkspace] = useState<WorkspaceId | null>(null);
  const [authenticatedPersona, setAuthenticatedPersona] = useState<PersonaDefinition | null>(null);
  const [systemEnv, setSystemEnv] = useState<SystemEnvironment>('SANDBOX');
  const [runtimeMode, setRuntimeMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Landing gate (veritasbank.org entry). Bare `/` shows the landing desk chooser;
  // every previously published deep link (?entry=gold, ?login=true, ?mode=…)
  // bypasses straight into the Gold flow. Resolved once from the entry URL.
  const [entryGate, setEntryGate] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const routeHash = window.location.hash;
    const routePath = window.location.pathname;
    const hasDeepLink =
      params.get('entry') === 'gold' ||
      params.get('login') === 'true' ||
      params.get('auth') === 'true' ||
      params.get('persona') === 'select' ||
      mode === 'mobile' ||
      mode === 'tablet' ||
      routeHash === '#mobile' ||
      routeHash === '#tablet' ||
      routePath.includes('/mobile') ||
      routePath.includes('/tablet');
    return !hasDeepLink;
  });

  // Check URL parameters for Direct Route Addresses (?mode=mobile, ?mode=tablet, ?login=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const hash = window.location.hash;
    const path = window.location.pathname;

    if (modeParam === 'mobile' || hash === '#mobile' || path.includes('/mobile')) {
      setRuntimeMode('mobile');
    } else if (modeParam === 'tablet' || hash === '#tablet' || path.includes('/tablet')) {
      setRuntimeMode('tablet');
    }

    if (params.get('login') === 'true' || params.get('auth') === 'true' || params.get('persona') === 'select') {
      setShowLoginModal(true);
    }
  }, []);

  const [accounts, setAccounts] = useState<DemandDepositRecord[]>([]);
  const [holdings, setHoldings] = useState<FungibleAssetHolding[]>([]);
  const [identities, setIdentities] = useState<PrincipalProfile[]>([]);
  const [rates, setRates] = useState<MarketRate[]>([]);
  const [fxReferenceRates, setFxReferenceRates] = useState<FxReferenceRates | null>(null);
  const [fxReferenceStatus, setFxReferenceStatus] = useState<'loading' | 'available' | 'stale' | 'unavailable'>('loading');
  const [fxReferenceError, setFxReferenceError] = useState<string | null>(null);
  const [offers, setOffers] = useState<RwaOffer[]>([]);
  const [transactions, setTransactions] = useState<InstitutionalTxn[]>([]);
  const [collateral, setCollateral] = useState<CollateralPosition[]>([]);
  const [auctions, setAuctions] = useState<BondAuction[]>([]);
  const [corporateActions, setCorporateActions] = useState<CorporateAction[]>([]);
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [sweepingRules, setSweepingRules] = useState<SweepingRule[]>([]);
  const [sweepingRulesStatus, setSweepingRulesStatus] = useState<'loading' | 'available' | 'stale' | 'unavailable'>('loading');
  const [sweepingRulesFetchedAt, setSweepingRulesFetchedAt] = useState<number | null>(null);
  const [sweepingRuleDrafts, setSweepingRuleDrafts] = useState<SweepingRuleDraft[]>(() => {
    try {
      const savedDrafts = sessionStorage.getItem('liquidity-sweeper-drafts');
      return savedDrafts ? JSON.parse(savedDrafts) as SweepingRuleDraft[] : [];
    } catch {
      return [];
    }
  });
  const [bridgeRoutes, setBridgeRoutes] = useState<BridgeRoute[]>([]);
  const [canisters, setCanisters] = useState<CanisterStatusInfo[]>([]);
  const [liquidityPools, setLiquidityPools] = useState<LiquidityPool[]>([]);
  const [bondContracts, setBondContracts] = useState<SovereignBondContract[]>([]);

  const [logs] = useState<ProtocolLog[]>([
    {
      id: 'STATEREF-E8F1A2...C9:0',
      type: 'CashTransfer',
      sender: 'O=Bank A, L=NY',
      recipient: 'O=Bank B, L=LN',
      amount: '500,000.00',
      currency: 'EUR',
      status: 'Finalized',
      step: 'ArchivedInSettlement',
      timestamp: '14:22:01.405',
    },
    {
      id: 'STATEREF-7B4D99...1F:1',
      type: 'AtomicDvPTrade',
      sender: 'O=Broker B, L=LN',
      recipient: 'Swiss Gold Vault',
      amount: '50.00',
      currency: 'GOLD',
      status: 'Finalized',
      step: 'NotarizedByFinalityAuthority',
      timestamp: '14:22:01.102',
    },
    {
      id: 'STATEREF-4A1F02...E3:0',
      type: 'AtomicP2POfferExecution',
      sender: 'O=Exchange C, L=HK',
      recipient: 'Double Spend Attempter',
      amount: '1,000,000.00',
      currency: 'USDD',
      status: 'Failed',
      step: 'RejectedByPolicyEngine',
      timestamp: '14:21:59.880',
    },
  ]);

  const [networkStatus, setNetworkStatus] = useState<'healthy' | 'connecting' | 'offline'>('healthy');
  const [accountDataStatus, setAccountDataStatus] = useState<'loading' | 'available' | 'stale' | 'unavailable'>('loading');
  const [accountsFetchedAt, setAccountsFetchedAt] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);
  const fxRefreshStarted = useRef(false);

  const refreshFxReferenceRates = useCallback(async () => {
    try {
      const data = await fetchFxReferenceRates();
      setFxReferenceRates(data);
      setFxReferenceStatus('available');
      setFxReferenceError(null);
    } catch (error) {
      setFxReferenceStatus((previous) => previous === 'available' || previous === 'stale' ? 'stale' : 'unavailable');
      setFxReferenceError(error instanceof Error ? error.message : 'Reference rates could not be loaded.');
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!fxRefreshStarted.current) {
      fxRefreshStarted.current = true;
      void refreshFxReferenceRates();
    }
    const rulesRequest = fetchSweepingRules()
      .then((records) => {
        setSweepingRules(records);
        setSweepingRulesFetchedAt(Date.now());
        setSweepingRulesStatus('available');
      })
      .catch(() => {
        setSweepingRulesStatus((previous) => previous === 'available' || previous === 'stale' ? 'stale' : 'unavailable');
      });

    const accountRequest = fetchAccounts()
      .then((accs) => {
        setAccounts(accs);
        setAccountsFetchedAt(Date.now());
        setAccountDataStatus('available');
      })
      .catch(() => {
        setAccountDataStatus((previous) => previous === 'available' || previous === 'stale' ? 'stale' : 'unavailable');
      });

    try {
      const [holds, ids, rts, ofrs, txns, cols, aucs, acts, apprs, brgs, cans, pools, bonds] = await Promise.all([
        fetchHoldings(),
        fetchIdentities(),
        fetchMarketRates(),
        fetchOffers(),
        fetchTransactions(),
        fetchCollateralPositions(),
        fetchAuctions(),
        fetchCorporateActions(),
        fetchApprovals(),
        fetchBridgeRoutes(),
        fetchCanisters(),
        fetchLiquidityPools(),
        fetchBondContracts(),
      ]);
      await Promise.all([accountRequest, rulesRequest]);
      setHoldings(holds);
      setIdentities(ids);
      setRates(rts);
      setOffers(ofrs);
      setTransactions(txns);
      setCollateral(cols);
      setAuctions(aucs);
      setCorporateActions(acts);
      setApprovals(apprs);
      setBridgeRoutes(brgs);
      setCanisters(cans);
      setLiquidityPools(pools);
      setBondContracts(bonds);
      setNetworkStatus('healthy');
    } catch {
      setNetworkStatus('offline');
    }
  }, [refreshFxReferenceRates]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(refreshFxReferenceRates, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshFxReferenceRates]);

  const showToast = (message: string, isError = false) => {
    setToast({ message, isError });
    if (!isError) {
      loadData();
    }
    setTimeout(() => setToast(null), 4000);
  };

  const renderContent = () => {
    // Canonical section resolver: legacy/alias AppSection values (kept for the
    // mobile prototype contract and future deep links) map onto the canonical
    // desktop sections rendered below — every AppSection value is renderable.
    const SECTION_ALIASES: Partial<Record<AppSection, AppSection>> = {
      accounts_overview: 'portfolio',
      approved_rail_connectors: 'bridge',
      asset_catalogue: 'vault',
      bond_auctions: 'auctions',
      bond_draft_instruments: 'contract_maker',
      canister_operations: 'canister_mgmt',
      collateral_desk: 'collateral',
      compliance_dashboard: 'compliance',
      custody_positions: 'vault',
      help_docs: 'support',
      iso20022_messages: 'interoperability',
      liquidity_management: 'sweeper',
      por_attestations: 'vault_telemetry',
      rwa_terminal: 'terminal',
      settlement_monitor: 'notaries',
      statements_reconciliation: 'logs',
      trading_blotter_dvp: 'trade',
      trading_rfq: 'trade',
      transfers_payments: 'portfolio',
      wholesale_liquidity: 'liquidity_pools',
      workspace_dashboard: 'admin_overview',
      workspace_tasks: 'governance',
      yield_analytics: 'terminal',
      // Workspace-scoped policy navigation (Central Bank / Institutional)
      // resolves onto the shared canonical views:
      // cb_limits / cb_stress / access_logs are now real views (Phase 2 of the
      // menu-build programme); cb_compliance_dash keeps the supervisory radar.
      cb_compliance_dash: 'cb_supervisory_radar',
      statements_gl: 'logs',
      cb_valuation: 'logs',
      cb_reg_reports: 'logs',
      cb_audit: 'logs',
      cb_mandates: 'governance',
      iso20022_bridge: 'interoperability',
      inst_inventory: 'vault',
      inst_repo: 'collateral',
      inst_gold_loans: 'collateral',
      inst_sec_lending: 'collateral',
      inst_limits: 'cb_supervisory_radar',
      inst_margin: 'collateral',
      inst_surveillance: 'cb_supervisory_radar',
      inst_pnl: 'logs',
      inst_client_stmts: 'logs',
      inst_apis: 'canister_mgmt',
    };
    const canonicalSection: AppSection = SECTION_ALIASES[activeSection] ?? activeSection;
    switch (canonicalSection) {
      case 'notaries':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <StitchExecutiveDashboard
              accounts={accounts}
              holdings={holdings}
              rates={rates}
              onOpenTransfer={() => setActiveSection('portfolio')}
              onOpenAudit={() => setActiveSection('logs')}
              onNotify={showToast}
            />
            <ConsensusHealthView onNotify={showToast} />
          </div>
        );
      case 'mvp_verification':
        return <MvpVerificationSuiteView onNotify={showToast} />;
      case 'portfolio':
        return (
          <BankCardSurface
            accounts={accounts}
            accountDataStatus={accountDataStatus}
            accountsFetchedAt={accountsFetchedAt}
            sessionPersona={authenticatedPersona?.roleTitle || 'Unspecified'}
            sessionInstitution={authenticatedPersona?.institutionName || 'Unspecified'}
            selectedInstitutionProfile={currentInstitution.name}
            selectedEnvironment={systemEnv}
            onRefresh={loadData}
            onNotify={showToast}
          />
        );
      case 'settlement_instruments':
        return <SettlementInstrumentRegistryView />;
      case 'terminal':
        return <RwaTerminalView accounts={accounts} rates={rates} onRefresh={loadData} onNotify={showToast} />;
      case 'contract_maker':
        return <SmartContractMakerView contracts={bondContracts} onRefresh={loadData} onNotify={showToast} />;
      case 'vault':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <IssuerDashboard holdings={holdings} onRefresh={loadData} onNotify={showToast} />
            <RwaMarketplace rates={rates} accounts={accounts} onRefresh={loadData} onNotify={showToast} />
          </div>
        );
      case 'trade':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <RwaOfferDesk offers={offers} accounts={accounts} onRefresh={loadData} onNotify={showToast} />
            <RfqTradeDesk rates={rates} accounts={accounts} onRefresh={loadData} onNotify={showToast} />
          </div>
        );
      case 'collateral':
        return <CollateralManagementView positions={collateral} onRefresh={loadData} onNotify={showToast} />;
      case 'auctions':
        return <BondAuctionDesk auctions={auctions} onRefresh={loadData} onNotify={showToast} />;
      case 'corporate_actions':
        return <CorporateActionsView actions={corporateActions} onRefresh={loadData} onNotify={showToast} />;
      case 'governance':
        return <MakerCheckerWorkflow approvals={approvals} onRefresh={loadData} onNotify={showToast} />;
      case 'vault_telemetry':
        return <ProofOfReserveTelemetry onNotify={showToast} />;
      case 'sweeper':
        return (
          <LiquiditySweeperView
            rules={sweepingRules}
            rulesDataStatus={sweepingRulesStatus}
            rulesFetchedAt={sweepingRulesFetchedAt}
            accountsDataStatus={accountDataStatus}
            accountsFetchedAt={accountsFetchedAt}
            accounts={accounts}
            drafts={sweepingRuleDrafts.filter((draft) => authenticatedPersona?.category === 'Central Bank' || draft.creator_persona_id === authenticatedPersona?.id)}
            persona={authenticatedPersona || PERSONA_LIST[0]}
            onSaveDraft={(draft) => setSweepingRuleDrafts((current) => {
              const next = [draft, ...current];
              sessionStorage.setItem('liquidity-sweeper-drafts', JSON.stringify(next));
              return next;
            })}
            onReviewDraft={(draftId, reviewer) => setSweepingRuleDrafts((current) => {
              const next = current.map((draft) => draft.draft_id === draftId ? { ...draft, reviewed_at: Date.now(), reviewed_by: reviewer } : draft);
              sessionStorage.setItem('liquidity-sweeper-drafts', JSON.stringify(next));
              return next;
            })}
            onRefresh={loadData}
            onNotify={showToast}
          />
        );
      case 'bridge':
        return <CrossChainBridgeView routes={bridgeRoutes} onNotify={showToast} />;
      case 'canister_mgmt':
        return <CanisterManagementView canisters={canisters} onRefresh={loadData} onNotify={showToast} />;
      case 'liquidity_pools':
        return <WholesaleLiquidityView pools={liquidityPools} onNotify={showToast} />;
      case 'interoperability':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GoldFxExchange rates={rates} referenceRates={fxReferenceRates} referenceStatus={fxReferenceStatus} referenceError={fxReferenceError} onRefresh={refreshFxReferenceRates} />
            <OpsDashboard logs={logs} onRefresh={loadData} />
          </div>
        );
      case 'admin_overview':
        return (
          <MasterAdminOverview
            accounts={accounts}
            holdings={holdings}
            canisters={canisters}
            onSelectPersona={(p) => {
              setAuthenticatedPersona(p);
              setWorkspace(workspaceForPersona(p));
              const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === p.bic);
              if (matchingInstitution) setCurrentInstitution(matchingInstitution);
              recordSessionEvent({
                actor: p.roleTitle,
                effectiveRole: p.roleTitle,
                institution: p.institutionName,
                action: 'PERSONA_SWITCH',
                object: `${p.id} · effective authority now ${p.roleTitle}`,
                environment: systemEnv,
              });
              showToast(`Switched active session to ${p.roleTitle}`);
            }}
            onNotify={showToast}
            onRefresh={loadData}
          />
        );
      // Risk Dashboard is now its own view (menu-build Phase 2); it no longer
      // doubles as the supervisory radar.
      case 'compliance':
        return (
          <RiskDashboardView
            accounts={accounts}
            holdings={holdings}
            identities={identities}
            accountDataStatus={accountDataStatus}
            accountsFetchedAt={accountsFetchedAt}
            pendingApprovals={approvals.length}
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Unspecified'}
            institutionName={authenticatedPersona?.institutionName || currentInstitution.name}
            environment={systemEnv}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'cb_supervisory_radar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SupervisoryRadar />
            <RegulatorDashboard accounts={accounts} holdings={holdings} onNotify={showToast} />
          </div>
        );
      case 'cb_limits':
        return (
          <ExposureLimitsView
            accounts={accounts}
            holdings={holdings}
            pendingApprovals={approvals}
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Unspecified'}
            personaId={authenticatedPersona?.id || 'unknown'}
            institutionName={authenticatedPersona?.institutionName || currentInstitution.name}
            environment={systemEnv}
            accountDataStatus={accountDataStatus}
            accountsFetchedAt={accountsFetchedAt}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'cb_stress':
        return (
          <StressTestingView
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Unspecified'}
            institutionName={authenticatedPersona?.institutionName || currentInstitution.name}
            environment={systemEnv}
            pendingApprovals={approvals.length}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'access_logs':
        return (
          <AccessLogsView
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Unspecified'}
            institutionName={authenticatedPersona?.institutionName || currentInstitution.name}
            environment={systemEnv}
            pendingApprovals={approvals.length}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'cb_dashboard':
        return (
          <CentralBankDashboard
            accounts={accounts}
            holdings={holdings}
            rates={rates}
            offers={offers}
            auctions={auctions}
            approvals={approvals}
            collateral={collateral}
            workspace="central_bank"
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Central Bank Operator'}
            institutionName={authenticatedPersona?.institutionName || 'Sovereign Reserve Desk'}
            environment={systemEnv}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'inst_dashboard':
        return (
          <InstitutionalBankDashboard
            accounts={accounts}
            holdings={holdings}
            rates={rates}
            offers={offers}
            auctions={auctions}
            approvals={approvals}
            collateral={collateral}
            workspace="institutional"
            personaRoleTitle={authenticatedPersona?.roleTitle || 'Institutional Treasury Operator'}
            institutionName={authenticatedPersona?.institutionName || 'Approved Institutional Desk'}
            environment={systemEnv}
            onNavigate={setActiveSection}
            onNotify={showToast}
          />
        );
      case 'trader_desk':
        return <TraderDashboard accounts={accounts} holdings={holdings} onRefresh={loadData} onNotify={showToast} />;
      case 'identity_admin':
        return <AdminDashboard identities={identities} onRefresh={loadData} onNotify={showToast} />;
      case 'enterprise_admin':
        return (
          <EnterpriseAdminDashboard
            identities={identities}
            accounts={accounts}
            holdings={holdings}
            onRefresh={loadData}
            onNotify={showToast}
          />
        );
      case 'secure_chat':
        return <SignalEncryptedChatView onNotify={showToast} onRefresh={loadData} />;
      case 'logs':
        return <TreasuryAccountingView transactions={transactions} onRefresh={loadData} />;
      case 'support':
        return <SupportDocsPortalView />;
      default:
        return <ConsensusHealthView onNotify={showToast} />;
    }
  };

  // Step 0: veritasbank.org landing gate — login hero + the two desk cards.
  if (entryGate) {
    return (
      <LandingSurface
        onSelectDesk={(desk) => {
          if (desk === 'gold') {
            setEntryGate(false);
          }
        }}
      />
    );
  }

  // Step 1: workspace selection — the two top-level personas of the network.
  if (!workspace) {
    return (
      <WorkspaceSelectSurface
        onSelectWorkspace={(selected) => {
          setWorkspace(selected);
          setActiveSection(selected === 'central_bank' ? 'cb_dashboard' : 'inst_dashboard');
        }}
      />
    );
  }

  // Step 2: workspace-scoped institutional authentication.
  if (!authenticatedPersona || showLoginModal) {
    return (
      <InstitutionalLoginSurface
        workspace={workspace}
        onLoginSuccess={(persona, env, mode) => {
          setAuthenticatedPersona(persona);
          const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === persona.bic);
          if (matchingInstitution) setCurrentInstitution(matchingInstitution);
          setSystemEnv(env);
          setRuntimeMode(mode);
          setShowLoginModal(false);
          setActiveSection(workspace === 'institutional' ? 'inst_dashboard' : 'cb_dashboard');
          recordSessionEvent({
            actor: persona.roleTitle,
            effectiveRole: persona.roleTitle,
            institution: persona.institutionName,
            action: 'LOGIN',
            object: `${workspace ?? 'unknown'} workspace · ${env} · ${mode}`,
            environment: env,
          });
          showToast(`Authenticated as ${persona.roleTitle} (${persona.institutionName})`);
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Institutional Persona Status Ribbon */}
      <div
        style={{
          height: '32px',
          backgroundColor: '#08060b',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-muted)',
          zIndex: 1001,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: workspace === 'institutional' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${workspace === 'institutional' ? 'rgba(139, 92, 246, 0.4)' : 'rgba(239, 68, 68, 0.35)'}`,
              color: workspace === 'institutional' ? '#A78BFA' : 'var(--red-primary)',
              fontSize: '9.5px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            {workspace === 'central_bank' ? '🏛 CENTRAL BANK WORKSPACE' : '🏦 INSTITUTIONAL WORKSPACE'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--red-primary)" />
            <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{authenticatedPersona.roleTitle}</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{authenticatedPersona.institutionName}</span>
          </div>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--red-primary)',
              fontSize: '9.5px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {authenticatedPersona.clearanceLevel}
          </span>
          <span
            style={{
              padding: '1px 6px',
              borderRadius: '3px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              fontSize: '9.5px',
              fontWeight: 800,
            }}
          >
            REQUESTED MODE: {systemEnv} · DATA SOURCE: LOCAL SANDBOX
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 3-Way Device Runtime Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: '#130d19', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-subtle)', gap: '2px' }}>
            <button
              onClick={() => setRuntimeMode('desktop')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: runtimeMode === 'desktop' ? 'var(--red-primary)' : 'transparent',
                color: runtimeMode === 'desktop' ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Monitor size={11} />
              <span>Workstation</span>
            </button>
            <button
              onClick={() => setRuntimeMode('tablet')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: runtimeMode === 'tablet' ? 'var(--red-primary)' : 'transparent',
                color: runtimeMode === 'tablet' ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Tablet size={11} />
              <span>Tablet (iPad)</span>
            </button>
            <button
              onClick={() => setRuntimeMode('mobile')}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: runtimeMode === 'mobile' ? 'var(--red-primary)' : 'transparent',
                color: runtimeMode === 'mobile' ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Smartphone size={11} />
              <span>Mobile (iPhone)</span>
            </button>
          </div>

          {/* Switch Persona / Logout */}
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--red-primary)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <KeyRound size={12} />
            Switch Persona
          </button>

          <button
            onClick={() => {
              setAuthenticatedPersona(null);
              setWorkspace(null);
              setShowLoginModal(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </div>

      {/* Personal / Institutional Action Hub Ribbon (In Desktop View) */}
      {runtimeMode === 'desktop' && (
        <div
          style={{
            backgroundColor: '#0f0a15',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '6px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
              ⚡ INSTITUTIONAL ACTION DESK:
            </span>
            <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{authenticatedPersona.roleTitle}</span>
          </div>

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setActiveSection('trade')}
              className="card-interactive"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--border-red)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShoppingBag size={12} color="var(--red-primary)" />
              Buy / Subscribe Asset
            </button>
            <button
              onClick={() => setActiveSection('governance')}
              className="card-interactive"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#191120',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckSquare size={12} color="var(--green-valid)" />
              2-of-2 Approvals ({approvals.length})
            </button>
            <button
              onClick={() => setActiveSection('terminal')}
              className="card-interactive"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#191120',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BarChart2 size={12} color="var(--red-primary)" />
              Live Markets & Chart
            </button>
            <button
              onClick={() => setActiveSection('portfolio')}
              className="card-interactive"
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#191120',
                border: '1px solid var(--border-subtle)',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Send size={12} color="var(--text-dim)" />
              Data Change & Transfer
            </button>
          </div>
        </div>
      )}

      {runtimeMode === 'desktop' && (
        <Navbar
          networkStatus={networkStatus}
          accountCount={accounts.length}
          holdingCount={holdings.length}
          protocolCount={logs.length}
          identityCount={identities.length}
          phoneMode={false}
          setPhoneMode={(m) => setRuntimeMode(m ? 'mobile' : 'desktop')}
          onToggleMobileMenu={() => setIsMobileMenuOpen((p) => !p)}
          accounts={accounts}
          onNotify={showToast}
          currentInstitution={currentInstitution}
          onSelectInstitution={setCurrentInstitution}
        />
      )}

      {toast && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            backgroundColor: toast.isError ? '#ef4444' : '#140c11',
            border: `1px solid ${toast.isError ? '#dc2626' : 'var(--red-primary)'}`,
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 24px rgba(239, 68, 68, 0.35)',
            zIndex: 3000,
          }}
        >
          {toast.isError ? <AlertCircle size={16} /> : <CheckCircle size={16} color="var(--green-valid)" />}
          {toast.message}
        </div>,
        document.body,
      )}

      {runtimeMode === 'tablet' ? (
        <div style={{ flex: 1, padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050308' }}>
          <div className="tablet-frame">
            <InstitutionalMobileSurface
              currentPersona={authenticatedPersona || PERSONA_LIST[0]}
              workspace={workspace || undefined}
              onSelectPersona={(p) => {
                setAuthenticatedPersona(p);
                setWorkspace(workspaceForPersona(p));
                const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === p.bic);
                if (matchingInstitution) setCurrentInstitution(matchingInstitution);
                showToast(`Switched persona to ${p.roleTitle}`);
              }}
              accounts={accounts}
              holdings={holdings}
              rates={rates}
              approvals={approvals}
              onNavigateDesktopSection={(sec) => {
                setActiveSection(sec);
                setRuntimeMode('desktop');
              }}
              onToggleDesktopMode={() => setRuntimeMode('desktop')}
              onNotify={showToast}
              onRefresh={loadData}
            />
          </div>
        </div>
      ) : runtimeMode === 'mobile' ? (
        <div style={{ flex: 1, padding: '24px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#050308' }}>
          <div className="smartphone-frame">
            <InstitutionalMobileSurface
              currentPersona={authenticatedPersona || PERSONA_LIST[0]}
              workspace={workspace || undefined}
              onSelectPersona={(p) => {
                setAuthenticatedPersona(p);
                setWorkspace(workspaceForPersona(p));
                const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === p.bic);
                if (matchingInstitution) setCurrentInstitution(matchingInstitution);
                showToast(`Switched persona to ${p.roleTitle}`);
              }}
              accounts={accounts}
              holdings={holdings}
              rates={rates}
              approvals={approvals}
              onNavigateDesktopSection={(sec) => {
                setActiveSection(sec);
                setRuntimeMode('desktop');
              }}
              onToggleDesktopMode={() => setRuntimeMode('desktop')}
              onNotify={showToast}
              onRefresh={loadData}
            />
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          <Sidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            workspace={workspace}
            isOpenMobile={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            accountCount={accounts.length}
            holdingCount={holdings.length}
            offerCount={offers.length}
            collateralCount={collateral.length}
            auctionCount={auctions.length}
            approvalCount={approvals.length}
            canisterCount={canisters.length}
            poolCount={liquidityPools.length}
            currentPersona={authenticatedPersona || PERSONA_LIST[0]}
            onSelectPersona={(p) => {
              setAuthenticatedPersona(p);
              setWorkspace(workspaceForPersona(p));
              const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === p.bic);
              if (matchingInstitution) setCurrentInstitution(matchingInstitution);
              showToast(`Switched persona to ${p.roleTitle} (${p.institutionName})`);
            }}
            onOpenPersonaModal={() => setShowLoginModal(true)}
          />

          <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '28px 32px' }}>
            {renderContent()}
          </main>
        </div>
      )}

      <footer style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-navbar)', padding: '12px 20px', textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)' }}>
        Veritas Sovereign Ledger • DFINITY Canister Architecture • Sub-Second DvP Finality • Sandbox EUR & USD Settlement Tokens
      </footer>

      {/* INSTITUTIONAL MULTI-PERSONA LOGIN PORTAL (FULL MODAL / LOGIN GATE) */}
      {(showLoginModal || !authenticatedPersona) && (
        <div
          className="fade-in"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: '#070509',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {authenticatedPersona && (
            <div style={{ position: 'absolute', top: 20, right: 24, zIndex: 10001 }}>
              <button
                onClick={() => setShowLoginModal(false)}
                className="btn-outline"
                style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 800, borderRadius: '8px' }}
              >
                ✕ Close & Return to Workstation
              </button>
            </div>
          )}
          <InstitutionalLoginSurface
            workspace={workspace || undefined}
            onLoginSuccess={(persona, env, mode) => {
              setAuthenticatedPersona(persona);
              const matchingInstitution = INSTITUTION_PROFILES.find((profile) => profile.bic === persona.bic);
              if (matchingInstitution) setCurrentInstitution(matchingInstitution);
              setSystemEnv(env);
              setRuntimeMode(mode);
              setShowLoginModal(false);
              showToast(`Authenticated as ${persona.roleTitle} (${persona.institutionName})`);
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
