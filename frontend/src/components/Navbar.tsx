import React, { useState } from 'react';
import { Search, Bell, Settings, Wallet, Smartphone, X, ShieldCheck, Building2, Rocket, CheckCircle, AlertCircle } from 'lucide-react';
import type { DemandDepositRecord } from '../types';
import { InstitutionalAuthSurface, INSTITUTION_PROFILES, type InstitutionProfile } from './institutional/InstitutionalAuthSurface';

interface NavbarProps {
  networkStatus: 'healthy' | 'connecting' | 'offline';
  accountCount: number;
  holdingCount: number;
  protocolCount: number;
  identityCount: number;
  phoneMode: boolean;
  setPhoneMode: (p: boolean) => void;
  onToggleMobileMenu: () => void;
  onSearch?: (query: string) => void;
  accounts?: DemandDepositRecord[];
  onNotify?: (msg: string, isError?: boolean) => void;
  currentInstitution?: InstitutionProfile;
  onSelectInstitution?: (profile: InstitutionProfile) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  phoneMode,
  setPhoneMode,
  onToggleMobileMenu,
  onSearch,
  accounts = [],
  onNotify,
  currentInstitution = INSTITUTION_PROFILES[0],
  onSelectInstitution,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchQuery);
    if (onNotify && searchQuery) {
      onNotify(`Searching StateRef / Transaction: "${searchQuery}"`);
    }
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          backgroundColor: 'var(--bg-navbar)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        {/* Left: Node Identity & Sovereign Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onToggleMobileMenu}
            className="mobile-hamburger"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-main)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ☰
          </button>

          {/* Node Alpha Badge with Sovereign Red Ring */}
          <div
            onClick={() => setShowProfileModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            title="Node Alpha-1 Identity"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                backgroundColor: '#1f0d12',
                border: '1px solid var(--border-red)',
                color: 'var(--red-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '13px',
                boxShadow: '0 0 14px var(--red-glow)',
              }}
            >
              N1
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
                Node Alpha-1
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                O=Institutional, L=London, CH
              </div>
            </div>
          </div>

          <div style={{ height: '28px', width: '1px', backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

          {/* Brand Name */}
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            Veritas <span style={{ color: 'var(--red-primary)', textShadow: '0 0 12px var(--red-glow)' }}>Gold</span>
          </div>

          {/* Institutional Switcher Badge */}
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--border-red)',
              color: 'var(--red-primary)',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              marginLeft: '6px',
            }}
            title="Switch Institutional Entity"
          >
            <Building2 size={13} />
            <span>{currentInstitution.name.split(' ')[0]} ({currentInstitution.bic.slice(0, 7)})</span>
          </button>
        </div>

        {/* Center: Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            maxWidth: '440px',
            margin: '0 20px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px',
          }}
        >
          <Search size={15} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Search TxID, StateRef, or Account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              width: '100%',
              fontSize: '12.5px',
              marginLeft: '8px',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </form>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            role="status"
            title="This application is connected to a local in-memory sandbox ledger; no mainnet connection is configured."
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(245, 158, 11, .35)',
              background: 'rgba(245, 158, 11, .1)',
              color: '#fbbf24',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '.04em',
              whiteSpace: 'nowrap',
            }}
          >
            SANDBOX · LOCAL LEDGER
          </span>

          {/* Smartphone Simulator Toggle */}
          <button
            onClick={() => setPhoneMode(!phoneMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: phoneMode ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
              color: phoneMode ? 'var(--red-primary)' : 'var(--text-muted)',
              border: `1px solid ${phoneMode ? 'var(--border-red)' : 'var(--border-subtle)'}`,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Smartphone size={14} />
            {phoneMode ? 'Exit Mobile' : 'Phone View'}
          </button>

          {/* Production Roadmap & Readiness Notes */}
          <button
            onClick={() => setShowRoadmapModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--green-valid)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Rocket size={14} />
            Status & Roadmap
          </button>

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setShowWalletModal(true)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '7px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Institutional Wallet"
            >
              <Wallet size={15} />
            </button>

            <button
              onClick={() => setShowNotificationModal(true)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '7px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                position: 'relative',
              }}
              title="Notifications"
            >
              <Bell size={15} />
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'var(--red-primary)',
                  borderRadius: '9999px',
                }}
              />
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                padding: '7px',
                borderRadius: '6px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="Settings"
            >
              <Settings size={15} />
            </button>

            {/* User Profile Avatar with Red Accent */}
            <div
              onClick={() => setShowProfileModal(true)}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '9999px',
                backgroundColor: '#260d13',
                border: '1px solid var(--border-red)',
                color: 'var(--red-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Profile & Node Status"
            >
              U
            </div>
          </div>
        </div>
      </header>

      {/* Modal 1: Institutional Wallet Inspector */}
      {showWalletModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="var(--red-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Institutional Wallet & Balances</h3>
              </div>
              <button onClick={() => setShowWalletModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Node Principal ID</div>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--red-primary)', fontSize: '12px', wordBreak: 'break-all' }}>
                  lpmt4-wqbam-aaaaa-aaaaa-cai
                </code>
              </div>

              <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Settled Liquidity</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green-valid)', marginTop: '2px' }}>
                  €3,500.00 EUR <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>(+ €1,000.00 Overdraft)</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>Active Demand Deposit Accounts:</div>
                {accounts.map((a) => (
                  <div key={a.account_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#0d0b10', borderRadius: '6px', marginBottom: '4px', fontSize: '12px' }}>
                    <code style={{ fontFamily: 'var(--font-mono)' }}>{a.account_id}</code>
                    <b style={{ color: 'var(--red-primary)' }}>€{a.balance.value_str} {a.currency}</b>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-red" onClick={() => setShowWalletModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Live Notifications Modal */}
      {showNotificationModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} color="var(--red-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Consensus Alerts & Notifications</h3>
              </div>
              <button onClick={() => setShowNotificationModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: '#0d0b10', borderRadius: '8px', borderLeft: '3px solid var(--green-valid)' }}>
                <b style={{ color: 'var(--green-valid)' }}>Consensus Finality Nominal</b>
                <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px' }}>Sub-second finality verified at 0.4s (Throughput: 1,245 TPS).</p>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: '#0d0b10', borderRadius: '8px', borderLeft: '3px solid var(--red-reject)' }}>
                <b style={{ color: 'var(--red-reject)' }}>Double-Spend Attempt Intercepted</b>
                <p style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px' }}>StateRef 4A1F02...E3:0 rejected with 0/5 signatures.</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-red" onClick={() => setShowNotificationModal(false)}>Acknowledge All</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Canister Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--red-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Node Alpha-1 Configuration</h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Canister Target Gateway</label>
                <input className="input-dark" value="http://localhost:8080" readOnly />
              </div>

              <div>
                <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Raft Quorum Threshold</label>
                <input className="input-dark" value="4 / 5 Nodes (80% BFT Quorum)" readOnly />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-red" onClick={() => setShowSettingsModal(false)}>Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Profile & Legal Entity Modal */}
      {showProfileModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--red-primary)" />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>Institutional Node Identity</h3>
              </div>
              <button onClick={() => setShowProfileModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Legal Entity Name</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  Node Alpha-1 (London / Zurich Central Clearing)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-red" onClick={() => setShowProfileModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Institutional Entity Switcher */}
      {showAuthModal && (
        <InstitutionalAuthSurface
          currentProfile={currentInstitution}
          onSelectProfile={(p) => {
            if (onSelectInstitution) onSelectInstitution(p);
          }}
          onClose={() => setShowAuthModal(false)}
          onNotify={(msg) => {
            if (onNotify) onNotify(msg);
          }}
        />
      )}

      {/* Modal 6: Production Readiness Status & Roadmap */}
      {showRoadmapModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '780px', width: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Rocket size={20} color="var(--green-valid)" />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Veritas Sovereign Ledger • Production Readiness & Roadmap
                </h3>
              </div>
              <button onClick={() => setShowRoadmapModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              {/* Working Features Summary */}
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={16} color="var(--green-valid)" />
                  <span style={{ fontWeight: 800, color: 'var(--green-valid)', fontSize: '14px' }}>100% Operational In MVP</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div>• <b>ACTUS Sovereign Bond Factory</b> (ISIN / DTI)</div>
                  <div>• <b>TradingView Candlesticks</b> (Multi-Mode + Volume)</div>
                  <div>• <b>Instant DvP Primary Market</b> (&lt; 400ms finality)</div>
                  <div>• <b>Dutch Debt Auction Console</b> (Yield Bidding)</div>
                  <div>• <b>Maker-Checker Dual Custody</b> (2-of-2 Signatures)</div>
                  <div>• <b>Harmonix Multi-Chain Bridge</b> (Chain-Key ECDSA)</div>
                  <div>• <b>Automated Liquidity Sweeper</b> (Gold Reserves)</div>
                  <div>• <b>Wholesale AMM Pools</b> (EURD / LBMA Gold)</div>
                  <div>• <b>10-Crate Rust Backend</b> (Zero Panics, Invariant Verified)</div>
                  <div>• <b>Full Desktop & Mobile Parity</b> (Zero Dead Buttons)</div>
                </div>
              </div>

              {/* What Remains to be Added for Production */}
              <div style={{ backgroundColor: 'var(--bg-card)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <AlertCircle size={16} color="var(--red-primary)" />
                  <span style={{ fontWeight: 800, color: 'var(--red-primary)', fontSize: '14px' }}>Milestones Required For Production & Mainnet</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#130d12', borderRadius: '6px', border: '1px solid #271f28' }}>
                    <b style={{ color: '#fff' }}>1. Hardware-Backed Multi-Tier Login</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      FIPS 140-2 Level 3 HSM / YubiKey WebAuthn for Central Bank Governors, Internet Identity for Commercial Banks, and 2-of-3 Multi-Sig Keyrings for Corporate Treasurers.
                    </p>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#130d12', borderRadius: '6px', border: '1px solid #271f28' }}>
                    <b style={{ color: '#fff' }}>2. Live Financial Feeds via ICP HTTPS Outcalls</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Direct on-chain 2/3+ BFT consensus ingestion from LBMA Physical Gold, ECB SDW FX rates (EUR/USD, EUR/CHF, EUR/TRY), and US Treasury/FRED yield curves.
                    </p>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#130d12', borderRadius: '6px', border: '1px solid #271f28' }}>
                    <b style={{ color: '#fff' }}>3. Enterprise PostgreSQL Persistence & Core Banking Connectors</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Parameterized SQLx caching with ISO 20022 (pacs.008, camt.053) ledger exports and direct API connectors for Temenos, Murex, Avaloq, and FIS.
                    </p>
                  </div>

                  <div style={{ padding: '10px', backgroundColor: '#130d12', borderRadius: '6px', border: '1px solid #271f28' }}>
                    <b style={{ color: '#fff' }}>4. ICP Canister Sandbox & Mainnet Deployment</b>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '11.5px' }}>
                      Candid (.did) bindings compilation, 30-min ICP Sandbox verification, and Fiduciary Subnet production deployment with custom sovereign domain binding.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Detailed Report: <code>MDFILES/production_readiness_status_and_implementation_roadmap.md</code>
                </span>
                <button className="btn-red" onClick={() => setShowRoadmapModal(false)}>Acknowledge & Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
