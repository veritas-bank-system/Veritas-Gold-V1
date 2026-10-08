import React, { useState } from 'react';
import type { AppSection } from '../../types';
import {
  Landmark,
  Key,
  ShieldCheck,
  ArrowLeftRight,
  Scale,
  TrendingUp,
  BarChart2,
  FileCode2,
  Layers,
  HelpCircle,
  FileText,
  X,
  Radio,
  Gavel,
  Coins,
  Bot,
  Activity,
  Cpu,
  Droplets,
  KeyRound,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Briefcase,
  Users,
  Building2,
  MessageSquareLock,
} from 'lucide-react';
import {
  PERSONA_LIST,
  type PersonaDefinition,
} from '../auth/InstitutionalLoginSurface';
import { WORKSPACE_PERSONA_IDS } from '../../types';
import type { WorkspaceId } from '../../types';

interface SidebarProps {
  activeSection: AppSection;
  setActiveSection: (s: AppSection) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  accountCount?: number;
  holdingCount?: number;
  offerCount?: number;
  collateralCount?: number;
  auctionCount?: number;
  approvalCount?: number;
  canisterCount?: number;
  poolCount?: number;
  currentPersona?: PersonaDefinition;
  onSelectPersona?: (p: PersonaDefinition) => void;
  onOpenPersonaModal?: () => void;
  /** Active institutional workspace — drives navigation scope & accent. */
  workspace?: WorkspaceId;
}

interface NavGroup {
  groupName: string;
  items: { id: AppSection; label: string; icon: any; badge?: string }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  isOpenMobile,
  onCloseMobile,
  accountCount = 2,
  holdingCount = 3,
  offerCount = 4,
  collateralCount = 2,
  auctionCount = 2,
  approvalCount = 2,
  canisterCount = 3,
  poolCount = 2,
  currentPersona = PERSONA_LIST[0],
  onSelectPersona,
  onOpenPersonaModal,
  workspace,
}) => {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  // Per-workspace accent: deep-red for the Central Bank console, blue-violet
  // for the institutional trading console. Same black/plum foundation.
  const acc = workspace === 'institutional'
    ? { primary: '#8B5CF6', soft: 'rgba(139, 92, 246, 0.16)', border: 'rgba(139, 92, 246, 0.5)', glow: 'rgba(139, 92, 246, 0.25)' }
    : { primary: 'var(--red-primary)', soft: '#2d0f16', border: 'rgba(239, 68, 68, 0.45)', glow: 'rgba(239, 68, 68, 0.2)' };

  // Admitted personas for the current workspace (undefined = legacy full list).
  const selectablePersonas = workspace ? PERSONA_LIST.filter((p) => WORKSPACE_PERSONA_IDS[workspace].includes(p.id)) : PERSONA_LIST;

  // Workspace-scoped navigation. Central bank = reserve-management & monetary
  // operations console; institutional = trading, financing & settlement desk.
  const navigationGroups: NavGroup[] = workspace === 'central_bank' ? [
    {
      groupName: 'WORKSPACE',
      items: [
        { id: 'cb_dashboard', label: 'Executive Dashboard', icon: ShieldCheck, badge: 'Reserves' },
        { id: 'governance', label: 'Tasks & Approvals', icon: CheckSquare, badge: `${approvalCount} Pending` },
        { id: 'support', label: 'Notifications', icon: HelpCircle, badge: 'Portal' },
      ],
    },
    {
      groupName: 'RESERVES & TREASURY',
      items: [
        { id: 'portfolio', label: 'Reserve Overview', icon: Landmark, badge: `${accountCount}` },
        { id: 'vault', label: 'Gold & Bullion', icon: Key, badge: `${holdingCount} Bars` },
        { id: 'terminal', label: 'Government Bonds', icon: BarChart2, badge: 'Portfolio' },
        { id: 'interoperability', label: 'FX & Money Markets', icon: ArrowLeftRight, badge: 'FX Desk' },
        { id: 'liquidity_pools', label: 'Portfolio Management', icon: Droplets, badge: `${poolCount} Pools` },
        { id: 'sweeper', label: 'Liquidity Management', icon: Bot, badge: 'Sweeper' },
        { id: 'settlement_instruments', label: 'Settlement Accounts', icon: Coins, badge: 'sEURD' },
      ],
    },
    {
      groupName: 'CUSTODY & SETTLEMENT',
      items: [
        { id: 'vault_telemetry', label: 'Custody & Vaults', icon: Activity, badge: 'PoR Live' },
        { id: 'notaries', label: 'Settlement Monitor', icon: ShieldCheck, badge: '4/5 BFT' },
        { id: 'iso20022_bridge', label: 'Payments & ISO 20022', icon: ArrowLeftRight, badge: 'pacs.008' },
        { id: 'logs', label: 'Reconciliation', icon: FileText, badge: 'camt.053' },
        { id: 'trade', label: 'Delivery & Transfers', icon: TrendingUp, badge: `${offerCount} Legs` },
      ],
    },
    {
      groupName: 'RISK & POLICY',
      items: [
        { id: 'compliance', label: 'Risk Dashboard', icon: Scale, badge: 'Radar' },
        { id: 'cb_limits', label: 'Exposure & Limits', icon: Scale, badge: 'Policy' },
        { id: 'identity_admin', label: 'Counterparties', icon: Users, badge: 'KYC' },
        { id: 'cb_stress', label: 'Stress Testing', icon: Zap, badge: 'Scenarios' },
        { id: 'cb_compliance_dash', label: 'Compliance Dashboard', icon: Scale, badge: '10-Yr GDPR' },
      ],
    },
    {
      groupName: 'ACCOUNTING & REPORTING',
      items: [
        { id: 'statements_gl', label: 'Statements & GL', icon: FileText, badge: 'GL' },
        { id: 'cb_valuation', label: 'Valuation & P&L', icon: TrendingUp, badge: 'MTM' },
        { id: 'cb_reg_reports', label: 'Regulatory Reports', icon: FileCode2, badge: 'Official' },
        { id: 'cb_audit', label: 'Audit Center', icon: ShieldCheck, badge: 'Immutable' },
      ],
    },
    {
      groupName: 'GOVERNANCE',
      items: [
        { id: 'enterprise_admin', label: 'Institutions', icon: Building2, badge: 'Registry' },
        { id: 'identity_admin', label: 'Users & Roles', icon: Users, badge: 'KYC' },
        { id: 'cb_mandates', label: 'Mandates & Policies', icon: Scale, badge: 'Board' },
        { id: 'access_logs', label: 'Access Logs', icon: MessageSquareLock, badge: 'Audit' },
        { id: 'canister_mgmt', label: 'System Configuration', icon: Cpu, badge: `${canisterCount} WASMs` },
      ],
    },
  ] : workspace === 'institutional' ? [
    {
      groupName: 'WORKSPACE',
      items: [
        { id: 'inst_dashboard', label: 'Bank Dashboard', icon: ShieldCheck, badge: 'Treasury' },
        { id: 'trader_desk', label: 'Client Orders', icon: Briefcase, badge: 'Orders' },
        { id: 'trade', label: 'RFQ Inbox', icon: TrendingUp, badge: `${offerCount} RFQs` },
        { id: 'governance', label: 'Tasks & Approvals', icon: CheckSquare, badge: `${approvalCount} Pending` },
        { id: 'support', label: 'Notifications', icon: HelpCircle, badge: 'Portal' },
      ],
    },
    {
      groupName: 'MARKETS',
      items: [
        { id: 'vault', label: 'Gold Market', icon: Key, badge: 'XAU' },
        { id: 'terminal', label: 'Government Bonds', icon: BarChart2, badge: 'TradingView' },
        { id: 'interoperability', label: 'FX & Money Markets', icon: ArrowLeftRight, badge: 'FX' },
        { id: 'liquidity_pools', label: 'Market Making', icon: Droplets, badge: `${poolCount} Pools` },
        { id: 'auctions', label: 'Auctions', icon: Gavel, badge: `${auctionCount} Live` },
      ],
    },
    {
      groupName: 'TREASURY',
      items: [
        { id: 'portfolio', label: 'Cash & Liquidity', icon: Landmark, badge: `${accountCount}` },
        { id: 'inst_inventory', label: 'Inventory & Positions', icon: Layers, badge: 'Live' },
        { id: 'settlement_instruments', label: 'Settlement Accounts', icon: Coins, badge: 'sEURD' },
        { id: 'sweeper', label: 'Funding', icon: Bot, badge: 'Sweeper' },
      ],
    },
    {
      groupName: 'FINANCING & COLLATERAL',
      items: [
        { id: 'inst_repo', label: 'Repo & Reverse Repo', icon: Layers, badge: 'Term' },
        { id: 'inst_gold_loans', label: 'Gold Loans & Leases', icon: Key, badge: 'Lease' },
        { id: 'inst_sec_lending', label: 'Securities Lending', icon: FileCode2, badge: 'SLB' },
        { id: 'collateral', label: 'Collateral Desk', icon: Layers, badge: `${collateralCount} Pledges` },
      ],
    },
    {
      groupName: 'OPERATIONS',
      items: [
        { id: 'notaries', label: 'Settlement Monitor', icon: ShieldCheck, badge: '4/5 BFT' },
        { id: 'vault_telemetry', label: 'Custody', icon: Activity, badge: 'PoR Live' },
        { id: 'iso20022_bridge', label: 'Payments & ISO 20022', icon: ArrowLeftRight, badge: 'pacs.008' },
        { id: 'logs', label: 'Reconciliation', icon: FileText, badge: 'camt.053' },
        { id: 'corporate_actions', label: 'Delivery & Transfers', icon: Coins, badge: 'Payouts' },
      ],
    },
    {
      groupName: 'RISK & COMPLIANCE',
      items: [
        { id: 'inst_limits', label: 'Risk & Limits', icon: Scale, badge: 'Desk' },
        { id: 'identity_admin', label: 'Counterparties', icon: Users, badge: 'KYC' },
        { id: 'compliance', label: 'Compliance', icon: Scale, badge: 'AML/KYC' },
        { id: 'inst_margin', label: 'Margin & Collateral', icon: Activity, badge: '3.1×' },
        { id: 'inst_surveillance', label: 'Surveillance', icon: ShieldCheck, badge: 'Market Abuse' },
      ],
    },
    {
      groupName: 'REPORTING & ADMIN',
      items: [
        { id: 'inst_pnl', label: 'P&L and Valuation', icon: TrendingUp, badge: 'MTD' },
        { id: 'inst_client_stmts', label: 'Client Statements', icon: FileText, badge: 'Client' },
        { id: 'cb_reg_reports', label: 'Regulatory Reports', icon: FileCode2, badge: 'Official' },
        { id: 'cb_audit', label: 'Audit', icon: ShieldCheck, badge: 'Immutable' },
        { id: 'enterprise_admin', label: 'Users & Roles', icon: Building2, badge: 'Accounts' },
        { id: 'inst_apis', label: 'APIs & Integrations', icon: Cpu, badge: 'FIX/ISO' },
      ],
    },
  ] : [
    // Legacy combined navigation (no workspace selected — direct-login flow).
    {
      groupName: 'WORKSPACE',
      items: [
        { id: 'mvp_verification', label: 'Live MVP Verification', icon: Zap, badge: '⚡ 6/6 Tests' },
        { id: 'admin_overview', label: 'Master Dashboard', icon: ShieldCheck, badge: 'Radar' },
        { id: 'governance', label: 'Tasks & Approvals', icon: CheckSquare, badge: `${approvalCount} Pending` },
      ],
    },
    {
      groupName: 'ACCOUNTS & CASH',
      items: [
        { id: 'portfolio', label: 'Accounts Overview', icon: Landmark, badge: `${accountCount}` },
        { id: 'settlement_instruments', label: 'Settlement Tokens (sEURD)', icon: Coins, badge: 'Registry' },
        { id: 'sweeper', label: 'Liquidity Management', icon: Bot, badge: 'Sweeper' },
        { id: 'logs', label: 'Statements & GL', icon: FileText, badge: 'camt.053' },
      ],
    },
    {
      groupName: 'MARKETS & ASSETS',
      items: [
        { id: 'terminal', label: 'RWA Terminal', icon: BarChart2, badge: 'TradingView' },
        { id: 'contract_maker', label: 'Bond Issuance (ACTUS)', icon: FileCode2, badge: 'Factory' },
        { id: 'auctions', label: 'Primary Dutch Auctions', icon: Gavel, badge: `${auctionCount} Live` },
        { id: 'corporate_actions', label: 'Corporate Actions / Coupons', icon: Coins, badge: 'Payouts' },
        { id: 'trade', label: 'Trade Blotter & DvP', icon: TrendingUp, badge: `${offerCount} Offers` },
        { id: 'liquidity_pools', label: 'Wholesale AMM Pools', icon: Droplets, badge: `${poolCount} Pools` },
        { id: 'trader_desk', label: 'Trader Desk', icon: Briefcase, badge: 'RFQ & Offers' },
      ],
    },
    {
      groupName: 'CUSTODY & COLLATERAL',
      items: [
        { id: 'vault', label: 'Custody Positions', icon: Key, badge: `${holdingCount} Bars` },
        { id: 'vault_telemetry', label: 'Proof of Reserve (PoR)', icon: Activity, badge: 'IoT Live' },
        { id: 'collateral', label: 'Collateral Desk', icon: Layers, badge: `${collateralCount} Pledges` },
      ],
    },
    {
      groupName: 'SETTLEMENT & INTEROPERABILITY',
      items: [
        { id: 'notaries', label: 'Settlement Monitor', icon: ShieldCheck, badge: '4/5 BFT' },
        { id: 'interoperability', label: 'ISO 20022 Messages', icon: ArrowLeftRight, badge: 'pacs.008' },
        { id: 'bridge', label: 'External Connectors', icon: ArrowLeftRight, badge: 'Sandbox' },
      ],
    },
    {
      groupName: 'RISK & COMPLIANCE',
      items: [
        { id: 'compliance', label: 'Compliance Dashboard', icon: Scale, badge: '10-Yr GDPR' },
        { id: 'identity_admin', label: 'Identity Administration', icon: Users, badge: 'KYC Registry' },
        { id: 'enterprise_admin', label: 'Enterprise Admin', icon: Building2, badge: 'Accounts & Holdings' },
      ],
    },
    {
      groupName: 'PLATFORM OPERATIONS',
      items: [
        { id: 'canister_mgmt', label: 'Canister Operations', icon: Cpu, badge: `${canisterCount} WASMs` },
        { id: 'secure_chat', label: 'Encrypted Chat', icon: MessageSquareLock, badge: 'Signal-Grade' },
      ],
    },
    {
      groupName: 'HELP & SUPPORT',
      items: [
        { id: 'support', label: 'Support & Docs Portal', icon: HelpCircle, badge: 'v2.4' },
      ],
    },
  ];

  const handleSelect = (id: AppSection) => {
    setActiveSection(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 4, 8, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 1100,
          }}
        />
      )}

      <aside
        className="desktop-sidebar"
        style={{
          width: '250px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)',
          position: isOpenMobile ? 'fixed' : 'sticky',
          top: isOpenMobile ? 0 : '64px',
          left: isOpenMobile ? 0 : 'auto',
          bottom: isOpenMobile ? 0 : 'auto',
          zIndex: isOpenMobile ? 1200 : 'auto',
          transition: 'transform 0.2s ease',
        }}
      >
        {isOpenMobile && (
          <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--red-primary)' }}>VERITAS GOLD</div>
            <button onClick={onCloseMobile} style={{ backgroundColor: '#260d13', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Top Active Persona Card & Quick Switcher */}
        <div style={{ padding: '12px 10px 8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="card-interactive"
            style={{
              padding: '10px 10px',
              borderRadius: '8px',
              backgroundColor: '#150d14',
              border: '1px solid var(--border-red)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} color="var(--red-primary)" />
                <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ACTIVE PERSONA
                </span>
              </div>
              {showPersonaMenu ? <ChevronUp size={14} color="var(--red-primary)" /> : <ChevronDown size={14} color="var(--text-dim)" />}
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentPersona.roleTitle}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentPersona.institutionName}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '4px' }}>
              <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--green-valid)' }}>
                {currentPersona.clearanceLevel.split(' ')[0]}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--red-primary)', fontWeight: 700 }}>
                Tap to Switch ▾
              </span>
            </div>
          </div>

          {/* Quick Persona Dropdown Popover */}
          {showPersonaMenu && (
            <div
              className="fade-in"
              style={{
                marginTop: '8px',
                backgroundColor: '#100b12',
                border: '1px solid var(--border-red)',
                borderRadius: '8px',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                maxHeight: '260px',
                overflowY: 'auto',
                boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', padding: '2px 6px', textTransform: 'uppercase' }}>
                Switch Institutional Role
              </div>

              {selectablePersonas.map((p) => {
                const isSelected = p.id === currentPersona.id;
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (onSelectPersona) onSelectPersona(p);
                      setShowPersonaMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: isSelected ? '1px solid var(--border-red)' : 'none',
                      backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                      color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                      fontSize: '11px',
                      fontWeight: isSelected ? 800 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={14} color={isSelected ? 'var(--red-primary)' : 'var(--text-dim)'} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.roleTitle}</div>
                    </div>
                  </button>
                );
              })}

              {onOpenPersonaModal && (
                <button
                  onClick={() => {
                    setShowPersonaMenu(false);
                    onOpenPersonaModal();
                  }}
                  style={{
                    marginTop: '4px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: '#1f131a',
                    color: 'var(--red-primary)',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <KeyRound size={12} />
                  Open Full Auth Portal ➔
                </button>
              )}
            </div>
          )}
        </div>

        {/* Categorized Navigation Groups (Section 3.1 Specification) */}
        <div style={{ padding: '10px 10px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {navigationGroups.map((group, gIdx) => (
            <div key={gIdx}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', padding: '0 8px', marginBottom: '4px' }}>
                {group.groupName}
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '7px',
                        backgroundColor: isActive ? acc.soft : 'transparent',
                        color: isActive ? acc.primary : 'var(--text-muted)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '11.5px',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        border: isActive ? `1px solid ${acc.border}` : '1px solid transparent',
                        boxShadow: isActive ? `0 0 14px ${acc.glow}` : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon size={14} color={isActive ? acc.primary : 'var(--text-dim)'} />
                        {item.label}
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '9999px',
                            backgroundColor: isActive ? acc.glow : '#180f14',
                            color: isActive ? acc.primary : 'var(--text-dim)',
                            border: `1px solid ${isActive ? acc.border : '#33161e'}`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Consensus Beacon */}
        <div style={{ marginTop: 'auto', padding: '10px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ backgroundColor: '#140c11', border: '1px solid var(--border-subtle)', padding: '6px 8px', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={13} color="var(--green-valid)" className="pulse-glow" />
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-main)' }}>Subnet Quorum 4/5</div>
              <div style={{ fontSize: '8.5px', color: 'var(--green-valid)' }}>● Zero Double-Spend Active</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
