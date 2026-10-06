import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Building2,
  KeyRound,
  Fingerprint,
  Landmark,
  FileCode2,
  Coins,
  Scale,
  Smartphone,
  ArrowRight,
  ChevronRight,
  Info,
} from 'lucide-react';
import { PulseBadge } from '../ui/motion/PulseBadge';
import { triggerSettlementConfetti } from '../ui/motion/ConfettiTrigger';
import type { WorkspaceId } from '../../types';
import { WORKSPACE_PERSONA_IDS, WORKSPACE_FLAGSHIP_PERSONA } from '../../types';

export type SystemEnvironment = 'SANDBOX' | 'DEMO' | 'PRODUCTION';

export interface PersonaDefinition {
  id: string;
  roleTitle: string;
  category: 'Central Bank' | 'Commercial Bank' | 'Custody & Issuance' | 'Supervisory & Audit';
  institutionName: string;
  bic: string;
  lei: string;
  jurisdiction: string;
  clearanceLevel: string;
  description: string;
  keyPermissions: string[];
  icon: any;
  defaultMode: 'desktop' | 'mobile';
}

export const PERSONA_LIST: PersonaDefinition[] = [
  {
    id: 'persona_super_admin',
    roleTitle: 'Platform Super Admin & Operator',
    category: 'Supervisory & Audit',
    institutionName: 'Sovereign Network Operations Center (NOC)',
    bic: 'VERITASSOVXXX',
    lei: '98450000000000000000',
    jurisdiction: 'Global Fiduciary Subnet Root',
    clearanceLevel: 'Level 5 (Platform Root Authority)',
    description: 'Unrestricted master operations clearance. Real-time participant monitoring, global liquidity radar, canister cycles management, and invariant auditing.',
    keyPermissions: ['Master Admin Radar', 'Canister Fleet Upgrades', 'Global Invariant Audits', 'Multi-Entity Impersonation', 'All 18 Modules'],
    icon: Shield,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_cb_governor',
    roleTitle: 'Central Bank Operator & Governor',
    category: 'Central Bank',
    institutionName: 'Swiss National Bank / CBRT Sovereign Desk',
    bic: 'SNBCH22XXXX',
    lei: '5493006MHB8U70A88Z85',
    jurisdiction: 'Switzerland (SIC / SNB Fiduciary)',
    clearanceLevel: 'Level 5 (Sovereign Root Key)',
    description: 'Full monetary authority over ACTUS bond canister deployment, rate policy, and emergency reserve sweeping.',
    keyPermissions: ['ACTUS Bond Factory', 'Emergency Liquidity Sweeper', 'Sovereign Sanctions Bypass', 'BFT Notary Governance'],
    icon: Landmark,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_comm_treasury',
    roleTitle: 'Commercial Bank Treasury & Primary Dealer',
    category: 'Commercial Bank',
    institutionName: 'JPMorgan Chase Bank, N.A. (Kinexys Desk)',
    bic: 'JPMCUS33XXX',
    lei: '7H6GLXDRUGQFU57RNE97',
    jurisdiction: 'United States (Fedwire / FedNow)',
    clearanceLevel: 'Level 4 (Primary Dealer Clearance)',
    description: 'Primary Dutch auction bidder, atomic DvP settlement executor, and wholesale AMM liquidity provider.',
    keyPermissions: ['Dutch Auction Bidding', 'Sub-second DvP Execution', 'Wholesale AMM Pools', 'Multi-Currency Cash Accounts'],
    icon: Building2,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_custodian_vault',
    roleTitle: 'Qualified Custodian & Vault Notary',
    category: 'Custody & Issuance',
    institutionName: 'Zurich Swiss Bullion Custody AG',
    bic: 'ZRHVAULTXXX',
    lei: '89450000000000000001',
    jurisdiction: 'Switzerland (Duty-Free Vault ZRH-01)',
    clearanceLevel: 'Level 4 (Physical Title Custody)',
    description: 'Attests physical Zurich gold bar holdings, signs Proof-of-Reserve IoT telemetry, and verifies minting.',
    keyPermissions: ['IoT Vault Sensor Telemetry', 'Gold Bullion Title Attestation', 'Proof-of-Reserve Verification', 'Custody Encumbrance Desk'],
    icon: ShieldCheck,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_issuer_dmo',
    roleTitle: 'Sovereign Debt Issuer / DMO Lead',
    category: 'Custody & Issuance',
    institutionName: 'Republic Debt Management Office (DMO)',
    bic: 'TRTGOVTXXXX',
    lei: '213800W9Y5V5K3XN6O22',
    jurisdiction: 'Sovereign Treasury Partition',
    clearanceLevel: 'Level 4 (Debt Placement Lead)',
    description: 'Designs bond prospectuses, schedules Dutch debt auctions, and authorizes automated coupon payment distributions.',
    keyPermissions: ['Draft Bond Instruments', 'Uniform-Price Auctions', 'Corporate Action Coupons', 'ISIN / DTI Allocation'],
    icon: FileCode2,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_fund_asset_mgr',
    roleTitle: 'Institutional Asset Manager / PE Fund',
    category: 'Commercial Bank',
    institutionName: 'BlackRock / Veritas Institutional Alpha Fund',
    bic: 'BLKUS33XXXX',
    lei: '549300V54RFBG67G3219',
    jurisdiction: 'Global Institutional / Multi-Jurisdiction',
    clearanceLevel: 'Level 3 (Accredited Institutional)',
    description: 'Trades tokenized sovereign bonds, accesses FX corridors, and provisions wholesale collateral margins.',
    keyPermissions: ['TradingView RWA Terminal', 'Bilateral RFQ Desk', 'Collateral Margin Desk', 'Harmonix Chain-Key Bridge'],
    icon: Coins,
    defaultMode: 'desktop',
  },
  {
    id: 'persona_supervisory_auditor',
    roleTitle: 'Supervisory & Compliance Auditor',
    category: 'Supervisory & Audit',
    institutionName: 'Bank for International Settlements (BIS) / ECB Radar',
    bic: 'BISBASELXXX',
    lei: '529900ODI30489201948',
    jurisdiction: 'Basel / Frankfurt Supervisory Rail',
    clearanceLevel: 'Level 5 (Read-Only Zero-Knowledge Audit)',
    description: 'Continuous systemic surveillance, real-time ISO 20022 camt.053 ledger stream, and AML/KYC review.',
    keyPermissions: ['Real-time ISO 20022 camt.053 GL', 'BIS CPMI-IOSCO Radar', 'ZK Solvency Proofs', 'Lawful Access Audit Logs'],
    icon: Scale,
    defaultMode: 'desktop',
  },
];

interface InstitutionalLoginSurfaceProps {
  onLoginSuccess: (persona: PersonaDefinition, env: SystemEnvironment, mode: 'desktop' | 'mobile') => void;
  /** When set, only personas admitted to this workspace are selectable and the
   *  surface renders a workspace banner; omit for the unrestricted legacy flow. */
  workspace?: WorkspaceId;
}

export const InstitutionalLoginSurface: React.FC<InstitutionalLoginSurfaceProps> = ({
  onLoginSuccess,
  workspace,
}) => {
  const selectablePersonas = workspace ? PERSONA_LIST.filter((p) => WORKSPACE_PERSONA_IDS[workspace].includes(p.id)) : PERSONA_LIST;
  const [selectedPersona, setSelectedPersona] = useState<PersonaDefinition>(
    workspace ? PERSONA_LIST.find((p) => p.id === WORKSPACE_FLAGSHIP_PERSONA[workspace]) || selectablePersonas[0] : PERSONA_LIST[0],
  );
  const [selectedEnv, setSelectedEnv] = useState<SystemEnvironment>('SANDBOX');
  const [authMethod, setAuthMethod] = useState<'WEBAUTHN' | 'INTERNET_IDENTITY' | 'MTLS' | 'MULTISIG'>('WEBAUTHN');
  const [targetMode, setTargetMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');

  const handleSelectPersona = (p: PersonaDefinition) => {
    setSelectedPersona(p);
    setTargetMode(p.defaultMode);
  };

  const executeAuthentication = () => {
    setIsAuthenticating(true);
    setScanStep('Initializing FIPS 140-2 Cryptographic Handshake...');

    setTimeout(() => {
      setScanStep('Querying ICP Hardware Enclave & Verifying Ed25519 Principal...');
    }, 800);

    setTimeout(() => {
      setScanStep('Validating Sovereign Mandate & Quorum Token...');
    }, 1500);

    setTimeout(() => {
      setScanStep('✓ Authentication Verified. Establishing TLS 1.3 Session...');
      triggerSettlementConfetti();
      setTimeout(() => {
        setIsAuthenticating(false);
        onLoginSuccess(selectedPersona, selectedEnv, targetMode);
      }, 700);
    }, 2200);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#060608',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Background Ambient Glows */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '15%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Login Shell Container */}
      <div
        className="fade-in"
        style={{
          maxWidth: '1080px',
          width: '100%',
          backgroundColor: '#0c0a10',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#09070d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--border-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--red-primary)',
                boxShadow: '0 0 15px var(--red-glow)',
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '19px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                  VERITAS <span style={{ color: 'var(--red-primary)', textShadow: '0 0 12px var(--red-glow)' }}>GOLD</span>
                </h1>
                <PulseBadge label="FIPS 140-2" variant="green" />
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {workspace
                  ? `${workspace === 'central_bank' ? 'Central Bank Workspace — Reserve, Monetary & Settlement Operations' : 'Institutional Workspace — Commercial Bank, Agency & Approved Counterparty Operations'} • DFINITY Canister Suite`
                  : 'Institutional CBDC & Tokenized Asset Gateway • DFINITY Canister Suite'}
              </div>
            </div>
          </div>

          {/* Environment Switcher Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginRight: '4px', fontWeight: 600 }}>ENV:</span>
            {(['SANDBOX', 'DEMO', 'PRODUCTION'] as SystemEnvironment[]).map((env) => {
              const isSelected = selectedEnv === env;
              return (
                <button
                  key={env}
                  onClick={() => setSelectedEnv(env)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {env === 'SANDBOX' ? '⚡ SANDBOX (sEURD)' : env}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Direct Test Portals Bar */}
        <div
          style={{
            padding: '12px 28px',
            backgroundColor: '#110c16',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ DIRECT TEST PORTALS:
          </span>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'persona_super_admin', label: '👑 Admin (test-admin)' },
              { id: 'persona_cb_governor', label: '🏛️ Central Bank (test-centralbank)' },
              { id: 'persona_comm_treasury', label: '🏦 Bank (test-institutional)' },
              { id: 'persona_issuer_dmo', label: '📜 Agency DMO (test-agency)' },
            ].map((portal) => {
              const isSelected = selectedPersona.id === portal.id;
              const target = PERSONA_LIST.find((p) => p.id === portal.id);
              return (
                <button
                  key={portal.id}
                  onClick={() => {
                    if (target) handleSelectPersona(target);
                  }}
                  className="card-interactive"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                    backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-main)',
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none',
                  }}
                >
                  {portal.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-Column Persona & Authentication Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '520px' }}>
          {/* Left Column: Persona Selector */}
          <div
            style={{
              padding: '24px 28px',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0e0b12',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1. Select Institutional Persona
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{selectablePersonas.length} Roles Configured</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '420px', paddingRight: '4px' }}>
              {selectablePersonas.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                const Icon = p.icon;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className="card-interactive"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: isSelected ? '#1c121b' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? 'var(--red-primary)' : '#19131d',
                          color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? '#FFFFFF' : 'var(--text-main)' }}>
                          {p.roleTitle}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {p.institutionName.length > 34 ? p.institutionName.substring(0, 34) + '...' : p.institutionName}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.05)',
                          color: isSelected ? 'var(--red-primary)' : 'var(--text-dim)',
                          fontWeight: 700,
                        }}
                      >
                        {p.defaultMode === 'mobile' ? '📱 Mobile' : '💻 Workstation'}
                      </span>
                      <ChevronRight size={16} color={isSelected ? 'var(--red-primary)' : 'var(--text-dim)'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Clearance & Authentication Protocol */}
          <div
            style={{
              padding: '24px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              backgroundColor: '#0c0a10',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                2. Verify Mandate & Launch Mode
              </div>

              {/* Persona Detail Brief */}
              <div style={{ backgroundColor: '#130e18', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {selectedPersona.roleTitle}
                    </h3>
                    <div style={{ fontSize: '11.5px', color: 'var(--red-primary)', fontWeight: 600, marginTop: '2px' }}>
                      {selectedPersona.institutionName}
                    </div>
                  </div>
                  <PulseBadge label={selectedPersona.clearanceLevel} variant="gold" />
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.4 }}>
                  {selectedPersona.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>LEI Code</span>
                    <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>{selectedPersona.lei}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block' }}>SWIFT / BIC</span>
                    <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#FFFFFF' }}>{selectedPersona.bic}</span>
                  </div>
                </div>

                {/* Dynamic Institutional Credential Inputs */}
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {selectedPersona.category === 'Central Bank' && '🏛️ Sovereign Fiduciary & HSM Credentials'}
                    {selectedPersona.category === 'Commercial Bank' && '🏦 Primary Dealer & Clearing Credentials'}
                    {selectedPersona.category === 'Custody & Issuance' && '🔐 Vault Assayer & Custody Mandate'}
                    {selectedPersona.category === 'Supervisory & Audit' && '⚖️ Regulatory Audit Warrant & ZK Credentials'}
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        {selectedPersona.id === 'persona_cb_governor' ? 'Sovereign Key ID' : 'Institutional Signer ID'}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={
                          selectedPersona.id === 'persona_cb_governor'
                            ? 'SNB-ROOT-FIPS-01'
                            : selectedPersona.id === 'persona_comm_treasury'
                            ? 'JPMC-KNX-TRADER-88'
                            : selectedPersona.id === 'persona_custodian_vault'
                            ? 'ZRH-VAULT-01'
                            : selectedPersona.id === 'persona_issuer_dmo'
                            ? 'DMO-DIR-0091'
                            : selectedPersona.id === 'persona_fund_asset_mgr'
                            ? 'BLK-ALPHA-PM'
                            : selectedPersona.id === 'persona_supervisory_auditor'
                            ? 'BIS-AUDIT-992'
                            : 'PLATFORM-OPERATOR-01'
                        }
                        className="input-dark"
                        style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '100%', color: 'var(--red-primary)' }}
                      />
                    </div>

                    <div>
                      <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                        {selectedPersona.id === 'persona_cb_governor' ? 'Policy HSM PIN' : 'FIDO2 / PKI Passkey'}
                      </span>
                      <input
                        type="password"
                        readOnly
                        value="••••••••••••"
                        className="input-dark"
                        style={{ padding: '6px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '100%', letterSpacing: '2px' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Database & Storage Engine Selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>
                    DATABASE & BACKEND ENGINE
                  </label>
                  <span style={{ fontSize: '9.5px', color: 'var(--green-valid)', fontWeight: 700 }}>10-Yr GDPR Hash Protocol Active</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'ICP_CANISTER', label: '🌐 ICP Canister', sub: 'On-Chain WASM' },
                    { id: 'POSTGRES_WEB2', label: '🐘 PostgreSQL', sub: '10-Yr Off-Chain' },
                    { id: 'LOCAL_MOCK', label: '🧪 Localhost', sub: 'InMemory Mock' },
                  ].map((db) => (
                    <button
                      key={db.id}
                      type="button"
                      style={{
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-subtle)',
                        backgroundColor: db.id === 'ICP_CANISTER' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                        color: db.id === 'ICP_CANISTER' ? '#FFFFFF' : 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div>{db.label}</div>
                      <div style={{ fontSize: '8.5px', color: 'var(--text-dim)', marginTop: '2px' }}>{db.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface & Device Mode Selector */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  TARGET RUNTIME SURFACE
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    onClick={() => setTargetMode('desktop')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: targetMode === 'desktop' ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                      backgroundColor: targetMode === 'desktop' ? '#241017' : 'rgba(255,255,255,0.02)',
                      color: targetMode === 'desktop' ? 'var(--red-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Landmark size={15} />
                    Desktop Workstation
                  </button>

                  <button
                    onClick={() => setTargetMode('mobile')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: targetMode === 'mobile' ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                      backgroundColor: targetMode === 'mobile' ? '#241017' : 'rgba(255,255,255,0.02)',
                      color: targetMode === 'mobile' ? 'var(--red-primary)' : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Smartphone size={15} />
                    Mobile Device View
                  </button>
                </div>
              </div>

              {/* Hardware Authentication Protocol */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  AUTHENTICATION PROTOCOL
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'WEBAUTHN', label: 'WebAuthn' },
                    { id: 'INTERNET_IDENTITY', label: 'Internet ID' },
                    { id: 'MTLS', label: 'mTLS X.509' },
                    { id: 'MULTISIG', label: 'Multi-Sig' },
                  ].map((auth) => (
                    <button
                      key={auth.id}
                      onClick={() => setAuthMethod(auth.id as any)}
                      style={{
                        padding: '6px 4px',
                        borderRadius: '6px',
                        border: authMethod === auth.id ? '1px solid var(--border-red)' : '1px solid var(--border-subtle)',
                        backgroundColor: authMethod === auth.id ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                        color: authMethod === auth.id ? '#FFFFFF' : 'var(--text-dim)',
                        fontSize: '10.5px',
                        fontWeight: authMethod === auth.id ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {auth.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch / Authenticate Button */}
            <div>
              {isAuthenticating ? (
                <div
                  style={{
                    backgroundColor: '#1b0f16',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-red)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--red-primary)', fontSize: '13px', fontWeight: 800 }}>
                    <Fingerprint size={18} style={{ animation: 'pulse 1s infinite' }} />
                    {scanStep}
                  </div>
                </div>
              ) : (
                <button
                  onClick={executeAuthentication}
                  className="btn-red card-interactive"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '14.5px',
                    borderRadius: '10px',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <KeyRound size={18} />
                  Authorize & Launch {targetMode === 'mobile' ? 'Mobile App' : 'Workstation'}
                  <ArrowRight size={18} />
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px', fontSize: '11px', color: 'var(--text-dim)' }}>
                <Info size={12} />
                <span>Zero Trust Architecture • Mutual TLS 1.3 & SHA-256 Notarization</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
