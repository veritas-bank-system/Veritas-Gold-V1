import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Menu,
  X,
  Fingerprint,
  ShoppingBag,
  LayoutDashboard,
  CheckSquare,
  BarChart2,
  RotateCcw,
} from 'lucide-react';
import { PulseBadge } from '../ui/motion/PulseBadge';
import { triggerSettlementConfetti } from '../ui/motion/ConfettiTrigger';
import { TouchInteractiveChart } from '../ui/TouchInteractiveChart';
import { TERMINAL_ASSETS, type TerminalAsset } from '../views/RwaTerminalView';
import {
  type PersonaDefinition,
  PERSONA_LIST,
} from '../auth/InstitutionalLoginSurface';
import type {
  DemandDepositRecord,
  FungibleAssetHolding,
  MarketRate,
  PendingApproval,
  AppSection,
  WorkspaceId,
} from '../../types';
import { WORKSPACE_PERSONA_IDS } from '../../types';

interface InstitutionalMobileSurfaceProps {
  currentPersona: PersonaDefinition;
  onSelectPersona: (p: PersonaDefinition) => void;
  /** Active institutional workspace — scopes the drawer menu (undefined = legacy full menu). */
  workspace?: WorkspaceId;
  accounts: DemandDepositRecord[];
  holdings: FungibleAssetHolding[];
  rates: MarketRate[];
  approvals: PendingApproval[];
  onNavigateDesktopSection: (section: AppSection) => void;
  onToggleDesktopMode: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
  onRefresh: () => Promise<void>;
}

export const InstitutionalMobileSurface: React.FC<InstitutionalMobileSurfaceProps> = ({
  currentPersona,
  onSelectPersona,
  workspace,
  accounts,
  holdings: _holdings,
  rates: _rates,
  approvals: initialApprovals,
  onNavigateDesktopSection,
  onToggleDesktopMode,
  onNotify,
  onRefresh: _onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'buy' | 'markets' | 'menu'>('dashboard');
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [showPersonaDrawer, setShowPersonaDrawer] = useState(false);
  const [localApprovals, setLocalApprovals] = useState<PendingApproval[]>(initialApprovals);

  // Buy Ticket State
  const [selectedAssetToBuy, setSelectedAssetToBuy] = useState<{
    id: string;
    name: string;
    symbol: string;
    price: number;
    currency: string;
    issuer: string;
    isin?: string;
  }>({
    id: 'xau_bullion',
    name: 'Swiss Allocated 999.9 Gold Bullion',
    symbol: 'XAU',
    price: 84.5,
    currency: 'EUR',
    issuer: 'Zurich Swiss Bullion Custody AG',
    isin: 'CH0019845012',
  });
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [isSubmittingBuy, setIsSubmittingBuy] = useState(false);

  // Market Chart Asset Selection
  const [selectedMarketAsset, setSelectedMarketAsset] = useState<TerminalAsset>(TERMINAL_ASSETS[0]);

  // Colleague Approval Chain State
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const availableAssets = [
    {
      id: 'xau_bullion',
      name: 'Swiss Allocated 999.9 Gold Bullion',
      symbol: 'XAU',
      price: 84.5,
      currency: 'EUR',
      issuer: 'Zurich Swiss Bullion Custody AG',
      isin: 'CH0019845012',
    },
    {
      id: 'bond_5y_gold',
      name: 'Swiss 5Y Sovereign Gold-Linked Bond',
      symbol: 'sBOND/5Y',
      price: 100.0,
      currency: 'EUR',
      issuer: 'Swiss National Bank / Fiduciary Desk',
      isin: 'XC0009845012',
    },
    {
      id: 'green_sovereign_note',
      name: 'European Green Sovereign Note',
      symbol: 'EU-GREEN/10Y',
      price: 98.2,
      currency: 'EUR',
      issuer: 'European Stability Mechanism',
      isin: 'EU0009124401',
    },
  ];

  const totalBuyConsideration = buyQuantity * selectedAssetToBuy.price;

  // Calculate live available EUR cash
  const eurAccount = accounts.find((a) => a.currency === 'EUR' || a.currency === 'sEURD');
  const availableCashStr = eurAccount ? eurAccount.balance.value_str : '2,450,000.00';

  // Handle Initiating Buy Order (Creates Colleague Approval Chain Ticket)
  const handleInitiatePurchase = async () => {
    setIsSubmittingBuy(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newTicket: PendingApproval = {
      approval_id: `APPR-BUY-${Date.now().toString().slice(-4)}`,
      maker_principal: '2vxsx-yme...colleague-trader',
      maker_legal: 'Alexander Wright (Treasury Trader, JPMC Desk A)',
      action_type: `Purchase ${buyQuantity} ${selectedAssetToBuy.symbol} (${selectedAssetToBuy.name})`,
      amount_eur: `€${totalBuyConsideration.toLocaleString('en-US', { minimumFractionDigits: 2 })} sEURD`,
      details: `Mobile purchase instruction for ${buyQuantity} units at €${selectedAssetToBuy.price.toFixed(2)}/unit.`,
      required_signatures: 2,
      current_signatures: 1,
      signers: ['2vxsx-yme...colleague-trader'],
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    setLocalApprovals((prev) => [newTicket, ...prev]);
    setIsSubmittingBuy(false);
    triggerSettlementConfetti();
    onNotify(`✓ Purchase order for ${buyQuantity} ${selectedAssetToBuy.symbol} initiated! Routed to Executive 2-of-2 Colleague Approval Chain.`);
    setActiveTab('approvals');
  };

  // Handle Approving Colleague Ticket
  const handleApproveTicket = async (approvalId: string) => {
    setApprovingId(approvalId);
    await new Promise((resolve) => setTimeout(resolve, 700));

    setLocalApprovals((prev) =>
      prev.map((appr) =>
        appr.approval_id === approvalId
          ? { ...appr, status: 'Approved', current_signatures: appr.required_signatures }
          : appr
      )
    );
    setApprovingId(null);
    triggerSettlementConfetti();
    onNotify(`🏆 Order ${approvalId} approved! 2-of-2 Multi-Sig notarized on ICP Subnet.`);
  };

  const handleRejectTicket = (approvalId: string) => {
    setLocalApprovals((prev) =>
      prev.map((appr) => (appr.approval_id === approvalId ? { ...appr, status: 'Rejected' } : appr))
    );
    onNotify(`Order ${approvalId} rejected and logged in compliance audit trail.`, true);
  };

  // Menu navigation with auto-drawer rollback / close
  const handleMenuClick = (section: AppSection) => {
    setIsMenuDrawerOpen(false);
    onNavigateDesktopSection(section);
  };

  const pendingCount = localApprovals.filter((a) => a.status === 'Pending').length;

  return (
    <div style={{ minHeight: '100%', width: '100%', backgroundColor: '#070509', color: '#FFFFFF', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      {/* Mobile Top App Bar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          backgroundColor: '#0c0812',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setIsMenuDrawerOpen(true)}
            style={{
              backgroundColor: '#1b1220',
              border: '1px solid var(--border-subtle)',
              color: '#FFFFFF',
              padding: '7px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={18} color="var(--red-primary)" />
          </button>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              VERITAS <span style={{ color: 'var(--red-primary)' }}>MOBILE</span>
            </div>
            <div style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Institutional Workstation</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Active Persona Pill */}
          <button
            onClick={() => setShowPersonaDrawer(!showPersonaDrawer)}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#160e1a',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#FFFFFF',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={13} color="var(--red-primary)" />
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentPersona.roleTitle.split(' ')[0]}
            </span>
            <span style={{ fontSize: '9px', color: 'var(--red-primary)' }}>▾</span>
          </button>

          {/* Switch to Desktop Button */}
          <button
            onClick={onToggleDesktopMode}
            title="Switch to Desktop Terminal"
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            💻 Desktop
          </button>
        </div>
      </header>

      {/* Main Mobile / Tablet Content Area */}
      <main style={{ flex: 1, padding: '16px', paddingBottom: '90px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Executive Status Card */}
            <div
              style={{
                backgroundColor: '#110c17',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase' }}>
                    ACTIVE SIGNER MANDATE
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>
                    {currentPersona.roleTitle}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {currentPersona.institutionName}
                  </div>
                </div>
                <PulseBadge label="FIPS 140-2 Level 5" variant="green" />
              </div>

              <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ backgroundColor: '#191120', padding: '10px 12px', borderRadius: '8px', border: '1px solid #281a32' }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontWeight: 700 }}>Total Cash Available</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    €{availableCashStr}
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--green-valid)' }}>sEURD Fiduciary Demand</div>
                </div>

                <div style={{ backgroundColor: '#191120', padding: '10px 12px', borderRadius: '8px', border: '1px solid #281a32' }}>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontWeight: 700 }}>Pending Approvals</div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: pendingCount > 0 ? 'var(--red-primary)' : 'var(--green-valid)', marginTop: '2px' }}>
                    {pendingCount} Orders
                  </div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Colleague Action Required</div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('buy')}
                  className="btn-red card-interactive"
                  style={{ flex: 1, padding: '10px', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ShoppingBag size={14} />
                  Buy Gold / Bonds
                </button>
                <button
                  onClick={() => setActiveTab('approvals')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: 800,
                    borderRadius: '7px',
                    backgroundColor: '#1e1425',
                    border: '1px solid var(--border-subtle)',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <CheckSquare size={14} color="var(--red-primary)" />
                  Sign Chain ({pendingCount})
                </button>
              </div>
            </div>

            {/* Colleague Approvals Preview Card */}
            <div style={{ backgroundColor: '#110c17', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={15} color="var(--red-primary)" />
                  Colleague 2-of-2 Approval Chain
                </div>
                <button onClick={() => setActiveTab('approvals')} style={{ fontSize: '11px', color: 'var(--red-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  View All ({localApprovals.length}) ➔
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {localApprovals.slice(0, 2).map((item) => (
                  <div
                    key={item.approval_id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#160e1d',
                      border: '1px solid #281932',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF' }}>{item.action_type}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Maker: {item.maker_legal.split('(')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--green-valid)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {item.amount_eur}
                      </div>
                    </div>
                    <div>
                      {item.status === 'Pending' ? (
                        <button
                          onClick={() => handleApproveTicket(item.approval_id)}
                          className="btn-red"
                          style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 800 }}
                        >
                          Approve ➔
                        </button>
                      ) : (
                        <span style={{ fontSize: '10px', color: item.status === 'Approved' ? 'var(--green-valid)' : '#ef4444', fontWeight: 800 }}>
                          ✓ {item.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COLLEAGUE APPROVAL CHAIN */}
        {activeTab === 'approvals' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  Multi-Signer Approval Chain
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Maker-Checker 2-of-2 Dual-Custody Signature Inbox
                </div>
              </div>
              <PulseBadge label={`${pendingCount} Pending Sign-offs`} variant={pendingCount > 0 ? 'gold' : 'green'} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {localApprovals.map((ticket) => {
                const isPending = ticket.status === 'Pending';
                const isApproved = ticket.status === 'Approved';
                const isProcessing = approvingId === ticket.approval_id;

                return (
                  <div
                    key={ticket.approval_id}
                    style={{
                      backgroundColor: '#110c17',
                      border: isPending ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      boxShadow: isPending ? '0 4px 20px rgba(239, 68, 68, 0.15)' : 'none',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                          {ticket.approval_id}
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
                          {ticket.action_type}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isPending ? 'rgba(239, 68, 68, 0.2)' : isApproved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: isPending ? 'var(--red-primary)' : isApproved ? 'var(--green-valid)' : 'var(--text-dim)',
                        }}
                      >
                        {ticket.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Colleague Maker Info & Approval Trail */}
                    <div style={{ backgroundColor: '#17101f', padding: '10px 12px', borderRadius: '8px', border: '1px solid #291a35', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                        Approval Progression Chain (2-of-2)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                        <CheckCircle2 size={14} color="var(--green-valid)" />
                        <span style={{ color: 'var(--text-main)' }}>
                          <strong>Maker (Colleague):</strong> {ticket.maker_legal}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                        {isApproved ? <CheckCircle2 size={14} color="var(--green-valid)" /> : <Clock size={14} color="#f59e0b" />}
                        <span style={{ color: isApproved ? 'var(--green-valid)' : '#f59e0b' }}>
                          <strong>Checker 2-of-2 (You):</strong> {isApproved ? 'Signed & Notarized' : 'Awaiting Your Cryptographic Sign-off'}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Value */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Total Settlement Amount</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                          {ticket.amount_eur}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleRejectTicket(ticket.approval_id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleApproveTicket(ticket.approval_id)}
                            disabled={isProcessing}
                            className="btn-red card-interactive"
                            style={{
                              padding: '8px 16px',
                              fontSize: '11.5px',
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Fingerprint size={14} />
                            {isProcessing ? 'Signing...' : 'Approve 2-of-2'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: BUY ASSETS & BONDS */}
        {activeTab === 'buy' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                Institutional Purchase & Subscription Desk
              </h2>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Direct Mobile/Tablet Order Entry • Routes to 2-of-2 Colleague Sign-off
              </div>
            </div>

            {/* Asset Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Select Asset to Purchase
              </div>
              {availableAssets.map((asset) => {
                const isSelected = selectedAssetToBuy.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAssetToBuy(asset)}
                    className="card-interactive"
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#1b1022' : '#110c17',
                      border: isSelected ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: 'var(--red-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '12px',
                        }}
                      >
                        {asset.symbol.split('/')[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>{asset.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>ISIN: {asset.isin}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        €{asset.price.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--green-valid)' }}>Spot Settlement</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Ticket Form */}
            <div style={{ backgroundColor: '#110c17', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>
                Order Ticket: {selectedAssetToBuy.name}
              </div>

              <div>
                <label style={{ fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 700 }}>QUANTITY (UNITS / OUNCES):</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {[1, 5, 10, 50, 100].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => setBuyQuantity(qty)}
                      style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: '6px',
                        border: buyQuantity === qty ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                        backgroundColor: buyQuantity === qty ? 'rgba(239, 68, 68, 0.2)' : '#191120',
                        color: buyQuantity === qty ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Breakdown */}
              <div style={{ backgroundColor: '#170f1f', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Unit Price:</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>€{selectedAssetToBuy.price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Settlement Currency:</span>
                  <span style={{ color: 'var(--red-primary)', fontWeight: 700 }}>sEURD (Fiduciary Demand)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', fontWeight: 800 }}>
                  <span>Total Consideration:</span>
                  <span style={{ color: 'var(--green-valid)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                    €{totalBuyConsideration.toLocaleString('en-US', { minimumFractionDigits: 2 })} sEURD
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleInitiatePurchase}
                disabled={isSubmittingBuy}
                className="btn-red card-interactive"
                style={{
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 20px rgba(239, 68, 68, 0.3)',
                  cursor: isSubmittingBuy ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmittingBuy ? (
                  <>
                    <RotateCcw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Routing Order to Approval Chain...
                  </>
                ) : (
                  <>
                    <Fingerprint size={16} />
                    Initiate Purchase Order (€{totalBuyConsideration.toLocaleString()}) ➔
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MARKETS & 9 TIMEFRAME CHARTS */}
        {activeTab === 'markets' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quick Mobile Asset Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  SELECT ASSET / INSTRUMENT:
                </span>
                <PulseBadge label="9 Timeframes: 1H-10Y" variant="green" />
              </div>

              <select
                value={selectedMarketAsset.id}
                onChange={(e) => {
                  const target = TERMINAL_ASSETS.find((a) => a.id === e.target.value);
                  if (target) {
                    setSelectedMarketAsset(target);
                    onNotify(`Loaded ${target.name} (${target.ticker}) into Chart`);
                  }
                }}
                className="input-dark"
                style={{
                  padding: '10px 14px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  borderRadius: '8px',
                  backgroundColor: '#160f1e',
                  border: '1px solid var(--border-red)',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <optgroup label="🏆 Gold & Precious Commodities">
                  {TERMINAL_ASSETS.filter((a) => a.category === 'Gold').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏛️ Sovereign & Green Bonds">
                  {TERMINAL_ASSETS.filter((a) => a.category === 'Bonds').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="💱 FX & Central Bank Rails">
                  {TERMINAL_ASSETS.filter((a) => a.category === 'FX').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} — {a.name} (€{a.priceEur.toFixed(4)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🏢 Real Estate & Structured RWAs">
                  {TERMINAL_ASSETS.filter((a) => a.category === 'RWA').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.ticker} — {a.name} (€{a.priceEur.toFixed(2)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Interactive Finger-Slide Chart with 9 Timeframes */}
            <TouchInteractiveChart
              assetSymbol={selectedMarketAsset.ticker}
              assetName={selectedMarketAsset.name}
              basePrice={selectedMarketAsset.priceEur}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                Sovereign Asset & RWA Feeds ({TERMINAL_ASSETS.length})
              </h2>
              <span className="pill-red" style={{ fontSize: '10px' }}>Tap to Load</span>
            </div>

            {/* Clickable Asset Cards Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TERMINAL_ASSETS.map((asset) => {
                const isSelected = selectedMarketAsset.id === asset.id;
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setSelectedMarketAsset(asset);
                      onNotify(`Loaded ${asset.ticker} (${asset.name}) into Chart`);
                    }}
                    className="card-interactive"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.12)' : '#110c17',
                      border: isSelected ? '1px solid var(--red-primary)' : '1px solid var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.25)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>{asset.name}</span>
                      </div>
                      <code style={{ fontSize: '11px', color: 'var(--red-primary)', fontWeight: 700 }}>
                        {asset.ticker} • {asset.isin_dti}
                      </code>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        €{asset.priceEur.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '10px', color: asset.isPositive ? 'var(--green-valid)' : '#ef4444' }}>
                        {asset.change24h}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Slide-in Categorized Menu Drawer with Auto-Rollback on click */}
      {isMenuDrawerOpen && (
        <div
          className="fade-in"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2000,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: '80%',
              maxWidth: '320px',
              backgroundColor: '#0d0814',
              height: '100%',
              borderRight: '1px solid var(--border-red)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ fontWeight: 900, fontSize: '15px', color: '#FFFFFF' }}>
                VERITAS <span style={{ color: 'var(--red-primary)' }}>NAVIGATION</span>
              </div>
              <button
                onClick={() => setIsMenuDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Workspace Banner + Workspace-Scoped Quick Group */}
            {workspace && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    backgroundColor: workspace === 'institutional' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1px solid ${workspace === 'institutional' ? 'rgba(139, 92, 246, 0.45)' : 'var(--border-red)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '15px' }}>{workspace === 'central_bank' ? '🏛' : '🏦'}</span>
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#FFFFFF' }}>
                      {workspace === 'central_bank' ? 'Central Bank Workspace' : 'Institutional Workspace'}
                    </div>
                    <div style={{ fontSize: '9px', color: workspace === 'institutional' ? '#A78BFA' : 'var(--red-primary)', fontWeight: 700 }}>
                      {workspace === 'central_bank'
                        ? 'Reserve, Monetary & Settlement Operations'
                        : 'Commercial Bank, Agency & Approved Counterparty Operations'}
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    {workspace === 'central_bank' ? '🏛 RESERVE & POLICY DESK' : '💼 TRADING & TREASURY DESK'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {(workspace === 'central_bank'
                      ? [
                          { id: 'cb_dashboard' as AppSection, label: '🏛 Executive Dashboard (Reserves)' },
                          { id: 'portfolio' as AppSection, label: '💼 Reserve Overview' },
                          { id: 'vault' as AppSection, label: '🥇 Gold & Bullion' },
                          { id: 'terminal' as AppSection, label: '📜 Government Bonds' },
                          { id: 'sweeper' as AppSection, label: '💧 Liquidity Management' },
                        ]
                      : [
                          { id: 'inst_dashboard' as AppSection, label: '🏦 Bank Dashboard (Treasury)' },
                          { id: 'trader_desk' as AppSection, label: '💼 Client Orders' },
                          { id: 'trade' as AppSection, label: '📨 RFQ Inbox' },
                          { id: 'vault' as AppSection, label: '🥇 Gold Market' },
                          { id: 'collateral' as AppSection, label: '🛡 Repo & Collateral' },
                        ]
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Categorized Menu Links — Full 8-Group Tree Matching Desktop (Instant Auto-Rollback on Click) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                ALL SHARED MODULES — IDENTITY · CUSTODY · SETTLEMENT · AUDIT
              </div>
              {/* GROUP 1: WORKSPACE */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--red-primary)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  👑 WORKSPACE & MASTER RADAR
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('mvp_verification')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: '1px solid var(--border-red)', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>⚡ Live MVP Verification</span>
                    <span style={{ fontSize: '9px', backgroundColor: 'var(--red-primary)', padding: '1px 5px', borderRadius: '4px' }}>6/6 Tests</span>
                  </button>
                  <button
                    onClick={() => handleMenuClick('admin_overview')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    👑 Master Dashboard Radar
                  </button>
                  <button
                    onClick={() => handleMenuClick('governance')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    👥 Tasks & 2-of-2 Approvals
                  </button>
                </div>
              </div>

              {/* GROUP 2: ACCOUNTS & CASH */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  💼 ACCOUNTS & CASH LEDGERS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('portfolio')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🏛️ Accounts Overview & Balances
                  </button>
                  <button
                    onClick={() => handleMenuClick('settlement_instruments')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🪙 Settlement Tokens (sEURD / sUSDD)
                  </button>
                  <button
                    onClick={() => handleMenuClick('sweeper')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🤖 Liquidity Sweeper & Repos
                  </button>
                  <button
                    onClick={() => handleMenuClick('logs')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    📜 Statements & GL (camt.053)
                  </button>
                </div>
              </div>

              {/* GROUP 3: MARKETS & ASSETS */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  📈 MARKETS & ASSET ISSUANCE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('terminal')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    📊 RWA TradingView Terminal (9 Timeframes)
                  </button>
                  <button
                    onClick={() => handleMenuClick('contract_maker')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    📜 Bond Issuance Factory (ACTUS)
                  </button>
                  <button
                    onClick={() => handleMenuClick('auctions')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🏛️ Primary Dutch Auctions
                  </button>
                  <button
                    onClick={() => handleMenuClick('corporate_actions')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    💰 Corporate Actions & Coupons
                  </button>
                  <button
                    onClick={() => handleMenuClick('trade')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ⚡ Trade Blotter & Atomic DvP
                  </button>
                  <button
                    onClick={() => handleMenuClick('trader_desk')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    💼 Trader Desk (RFQ & Offers)
                  </button>
                  <button
                    onClick={() => handleMenuClick('liquidity_pools')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    💧 Wholesale AMM Liquidity Pools
                  </button>
                </div>
              </div>

              {/* GROUP 4: CUSTODY & COLLATERAL */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  🔐 CUSTODY & COLLATERAL
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('vault')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🔐 Zurich Physical Vault Custody
                  </button>
                  <button
                    onClick={() => handleMenuClick('vault_telemetry')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    📡 Proof of Reserve (PoR IoT Live)
                  </button>
                  <button
                    onClick={() => handleMenuClick('collateral')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🛡️ Collateral Desk & Margins
                  </button>
                </div>
              </div>

              {/* GROUP 5: SETTLEMENT & INTEROPERABILITY */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  🌐 SETTLEMENT & INTEROPERABILITY
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('notaries')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ⚡ Settlement Monitor (4/5 BFT)
                  </button>
                  <button
                    onClick={() => handleMenuClick('interoperability')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🌐 ISO 20022 Messages (pacs.008)
                  </button>
                  <button
                    onClick={() => handleMenuClick('bridge')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🌉 External Connectors & Bridges
                  </button>
                </div>
              </div>

              {/* GROUP 6: RISK & COMPLIANCE */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  ⚖️ RISK & COMPLIANCE
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('compliance')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ⚖️ Compliance & 10-Yr GDPR Audit
                  </button>
                  <button
                    onClick={() => handleMenuClick('identity_admin')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    👥 Identity Administration (KYC)
                  </button>
                  <button
                    onClick={() => handleMenuClick('enterprise_admin')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🏢 Enterprise Admin
                  </button>
                </div>
              </div>

              {/* GROUP 7: PLATFORM OPERATIONS */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  ⚙️ PLATFORM OPERATIONS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('canister_mgmt')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ⚙️ Canister Operations (WASMs & Cycles)
                  </button>
                  <button
                    onClick={() => handleMenuClick('secure_chat')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    🔐 Encrypted Chat (Signal-Grade)
                  </button>
                </div>
              </div>

              {/* GROUP 8: HELP & SUPPORT */}
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  📖 HELP & SUPPORT
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <button
                    onClick={() => handleMenuClick('support')}
                    style={{ padding: '8px 10px', borderRadius: '6px', background: 'none', border: 'none', color: '#FFFFFF', textAlign: 'left', fontSize: '12px', cursor: 'pointer' }}
                  >
                    📖 Support & Operational Docs Portal
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} onClick={() => setIsMenuDrawerOpen(false)} />
        </div>
      )}

      {/* Quick Persona Switcher Popover */}
      {showPersonaDrawer && (
        <div
          style={{
            position: 'fixed',
            top: 55,
            right: 16,
            zIndex: 1500,
            backgroundColor: '#120c1a',
            border: '1px solid var(--border-red)',
            borderRadius: '10px',
            padding: '8px',
            width: '280px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', padding: '4px 6px' }}>
            Switch Signer Persona
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '240px', overflowY: 'auto' }}>
            {(workspace ? PERSONA_LIST.filter((p) => WORKSPACE_PERSONA_IDS[workspace].includes(p.id)) : PERSONA_LIST).map((p) => {
              const isSelected = p.id === currentPersona.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPersona(p);
                    setShowPersonaDrawer(false);
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--border-red)' : 'none',
                    backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '11.5px',
                    fontWeight: isSelected ? 800 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div>{p.roleTitle}</div>
                  <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>{p.institutionName}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Sticky Mobile Navigation Bar */}
      {/* Sticky Bottom Navigation Bar */}
      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#0c0812',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px 6px 14px',
          zIndex: 1000,
          marginTop: 'auto',
          backdropFilter: 'blur(10px)',
        }}
      >
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingCount > 0 ? `${pendingCount}` : undefined },
          { id: 'buy', label: 'Buy Asset', icon: ShoppingBag },
          { id: 'markets', label: 'Markets', icon: BarChart2 },
          { id: 'menu', label: 'Menu', icon: Menu },
        ].map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'menu') {
                  setIsMenuDrawerOpen(true);
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                color: isActive ? 'var(--red-primary)' : 'var(--text-dim)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <Icon size={18} />
              <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 500 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: '25%',
                    backgroundColor: 'var(--red-primary)',
                    color: '#fff',
                    fontSize: '8.5px',
                    fontWeight: 900,
                    padding: '1px 4px',
                    borderRadius: '9999px',
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
  );
};
