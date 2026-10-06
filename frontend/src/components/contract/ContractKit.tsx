import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  AlertTriangle,
  CheckSquare,
  Download,
  ChevronDown,
  Lock,
  FileText,
  RefreshCw,
  Inbox,
  Search,
} from 'lucide-react';

/* ======================================================================
 * Veritas Gold — Screen Contract reusable kit
 * Implements docs/VERITAS-GOLD-CENTRAL-BANK-SCREEN-CONTRACT.md
 *   §27 Detail drawer standard
 *   §28 Empty / loading / error / stale states
 *   §30 Frontend component requirements (named exports)
 *   §32 High-value action confirmation
 * Reusable across Central Bank and Institutional workspaces.
 * ====================================================================== */

/* ---------------- §30 InstitutionContextBar ---------------- */

export interface InstitutionContext {
  institution_id: string;
  institution_name: string;
  legal_entity_id: string;
  legal_entity_name: string;
  persona_id: string;
  role_id: string;
  environment: string;
  security_level: string;
  node_id: string;
  region: string;
  base_currency: string;
  last_sync_at: string;
  data_source: string;
  mfa_status: string;
  approval_count: number;
  critical_alert_count: number;
}

export const InstitutionContextBar: React.FC<{ ctx: InstitutionContext; accent?: string }> = ({ ctx, accent = '#EF4444' }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      padding: '8px 12px',
      borderRadius: '10px',
      backgroundColor: '#0c0910',
      border: '1px solid var(--border-subtle)',
      fontSize: '10px',
      color: 'var(--text-muted)',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, color: accent }}>
      <Shield size={12} /> {ctx.institution_name}
    </span>
    <span style={{ color: 'var(--text-dim)' }}>|</span>
    <span>{ctx.legal_entity_name} <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>({ctx.legal_entity_id})</span></span>
    <span style={{ color: 'var(--text-dim)' }}>|</span>
    <span style={{ fontWeight: 800, color: '#FFFFFF' }}>{ctx.role_id}</span>
    <span style={{ padding: '1px 7px', borderRadius: '9999px', backgroundColor: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.4)', color: '#A78BFA', fontWeight: 800 }}>
      {ctx.security_level}
    </span>
    <span style={{ padding: '1px 7px', borderRadius: '9999px', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontWeight: 800 }}>
      {ctx.environment}
    </span>
    <span style={{ color: 'var(--text-dim)' }}>|</span>
    <span>MFA: {ctx.mfa_status}</span>
    <span style={{ color: 'var(--text-dim)' }}>|</span>
    <span>Node {ctx.node_id} · {ctx.region}</span>
    <span style={{ color: 'var(--text-dim)' }}>|</span>
    <span>Base ccy {ctx.base_currency}</span>
    <span style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-mono)' }}>sync {ctx.last_sync_at}</span>
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green-valid)' }}>src: {ctx.data_source}</span>
    </span>
  </div>
);

/* ---------------- §30 badges & counters ---------------- */

export type StatusTone = 'emerald' | 'amber' | 'coral' | 'gold' | 'violet' | 'slate';

const TONE_STYLE: Record<StatusTone, { color: string; bg: string; border: string }> = {
  emerald: { color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.35)' },
  amber: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)' },
  coral: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)' },
  gold: { color: '#D4AF37', bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.35)' },
  violet: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.35)' },
  slate: { color: '#94A3B8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)' },
};

export const StatusBadge: React.FC<{ label: string; tone: StatusTone }> = ({ label, tone }) => {
  const s = TONE_STYLE[tone];
  return (
    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '9999px', backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
};

export const EnvironmentBadge: React.FC<{ environment: string }> = ({ environment }) => (
  <StatusBadge label={environment === 'PRODUCTION' ? 'PRODUCTION' : `${environment} · SIMULATED`} tone={environment === 'PRODUCTION' ? 'coral' : 'amber'} />
);

export const SecurityLevelBadge: React.FC<{ level: string }> = ({ level }) => (
  <StatusBadge label={level} tone="violet" />
);

export const ApprovalCounter: React.FC<{ count: number; onClick?: () => void }> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="card-interactive"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '9999px', backgroundColor: count > 0 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.08)', border: `1px solid ${count > 0 ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.3)'}`, color: count > 0 ? '#f59e0b' : '#10B981', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
  >
    <CheckSquare size={11} /> {count} approval{count === 1 ? '' : 's'}
  </button>
);

export const CriticalAlertCounter: React.FC<{ count: number; onClick?: () => void }> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    className="card-interactive"
    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '9999px', backgroundColor: count > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.08)', border: `1px solid ${count > 0 ? 'rgba(239,68,68,0.45)' : 'rgba(16,185,129,0.3)'}`, color: count > 0 ? '#EF4444' : '#10B981', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}
  >
    <AlertTriangle size={11} /> {count} critical alert{count === 1 ? '' : 's'}
  </button>
);

/* ---------------- §30 FilterBar ---------------- */

export const FilterBar: React.FC<{
  onSearch?: (q: string) => void;
  onExport?: () => void;
  selects?: { label: string; options: string[] }[];
  placeholder?: string;
}> = ({ onSearch, onExport, selects = [], placeholder = 'Search records…' }) => {
  const [q, setQ] = useState('');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
      <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '320px' }}>
        <Search size={12} color="var(--text-dim)" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            onSearch?.(e.target.value);
          }}
          placeholder={placeholder}
          className="input-dark"
          style={{ width: '100%', padding: '7px 10px 7px 26px', fontSize: '11px', borderRadius: '7px' }}
        />
      </div>
      {selects.map((s) => (
        <select key={s.label} className="input-dark" style={{ padding: '7px 10px', fontSize: '11px', borderRadius: '7px', color: 'var(--text-muted)' }} defaultValue="">
          <option value="" disabled>{s.label}</option>
          {s.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      ))}
      {onExport && (
        <button onClick={onExport} className="card-interactive" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '7px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
          <Download size={12} /> Export
        </button>
      )}
    </div>
  );
};

/* ---------------- §30 MetricCard (contract schema) ---------------- */

export const MetricCard: React.FC<{
  title: string;
  value: string;
  unit?: string;
  detail?: string[];
  change?: { text: string; tone: 'up' | 'down' | 'flat' };
  target?: string;
  status?: { label: string; tone: StatusTone };
  updated?: string;
  source?: string;
  icon?: any;
  tone?: StatusTone;
}> = ({ title, value, unit, detail, change, target, status, updated, source, icon: Icon, tone = 'slate' }) => {
  const color = TONE_STYLE[tone].color;
  return (
    <div style={{ backgroundColor: '#0e0a12', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
        {Icon && <Icon size={14} color={color} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>{unit}</span>}
      </div>
      {detail && detail.length > 0 && (
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
          {detail.map((d, i) => (
            <span key={i} style={{ fontFamily: 'var(--font-mono)' }}>{d}</span>
          ))}
        </div>
      )}
      {change && (
        <div style={{ fontSize: '10.5px', fontWeight: 800, color: change.tone === 'up' ? '#10B981' : change.tone === 'down' ? '#EF4444' : 'var(--text-dim)' }}>
          {change.tone === 'up' ? '▲' : change.tone === 'down' ? '▼' : '■'} {change.text}
        </div>
      )}
      {target && <div style={{ fontSize: '9.5px', color: 'var(--text-dim)' }}>Policy target: {target}</div>}
      {status && <StatusBadge label={status.label} tone={status.tone} />}
      {(updated || source) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '5px', marginTop: '2px', fontSize: '8.5px', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {updated && <div>Updated: {updated}</div>}
          {source && <div>Source: {source}</div>}
        </div>
      )}
    </div>
  );
};

/* ---------------- §27 DetailDrawer ---------------- */

export interface DrawerSection {
  title: string;
  lines: { label: string; value: React.ReactNode }[];
}

export const DetailDrawer: React.FC<{
  open: boolean;
  onClose: () => void;
  objectType: string;
  objectId: string;
  status?: { label: string; tone: StatusTone };
  classification?: string;
  sections: DrawerSection[];
  actions?: { label: string; onClick?: () => void; primary?: boolean }[];
}> = ({ open, onClose, objectType, objectId, status, classification = 'Confidential — Institutional', sections, actions = [] }) => {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2500, backgroundColor: 'rgba(4,3,7,0.72)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          width: 'min(520px, 94vw)',
          height: '100%',
          backgroundColor: '#0d0a12',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {objectType} · {classification}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginTop: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{objectId}</span>
              {status && <StatusBadge label={status.label} tone={status.tone} />}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }} aria-label="Close detail drawer">
            <X size={17} />
          </button>
        </div>

        {/* Sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sections.map((sec) => (
            <div key={sec.title}>
              <div style={{ fontSize: '9.5px', fontWeight: 800, color: 'var(--red-primary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>
                {sec.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 14px', backgroundColor: '#120d18', border: '1px solid var(--border-subtle)', borderRadius: '9px', padding: '11px 13px' }}>
                {sec.lines.map((l, i) => (
                  <div key={i} style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '8.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{l.label}</div>
                    <div style={{ fontSize: '11.5px', color: '#FFFFFF', fontWeight: 600, overflowWrap: 'anywhere' }}>{l.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="card-interactive"
                style={{
                  padding: '8px 13px',
                  borderRadius: '8px',
                  backgroundColor: a.primary ? 'rgba(239,68,68,0.16)' : '#191120',
                  border: a.primary ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-subtle)',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- §32 ApprovalDialog (high-value confirmation) ---------------- */

export const ApprovalDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  fields: { label: string; value: React.ReactNode }[];
  requiredApprovals: string;
}> = ({ open, onClose, onConfirm, action, fields, requiredApprovals }) => {
  const [confirmed, setConfirmed] = useState('');
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2600, backgroundColor: 'rgba(4,3,7,0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{ width: 'min(560px, 96vw)', maxHeight: '88vh', overflowY: 'auto', backgroundColor: '#0d0a12', border: '1px solid rgba(239,68,68,0.45)', borderRadius: '14px', padding: '20px 22px', boxShadow: '0 24px 70px rgba(0,0,0,0.8)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
          <Lock size={15} color="#EF4444" />
          <span style={{ fontSize: '10px', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            High-Value Action Confirmation
          </span>
        </div>
        <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', marginBottom: '12px' }}>{action}</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 14px', backgroundColor: '#120d18', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '13px 15px', marginBottom: '12px' }}>
          {fields.map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: '8.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>{f.label}</div>
              <div style={{ fontSize: '11.5px', color: '#FFFFFF', fontWeight: 700, overflowWrap: 'anywhere' }}>{f.value}</div>
            </div>
          ))}
          <div>
            <div style={{ fontSize: '8.5px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Required approvals</div>
            <div style={{ fontSize: '11.5px', color: '#f59e0b', fontWeight: 800 }}>{requiredApprovals}</div>
          </div>
        </div>

        <div style={{ padding: '10px 13px', borderRadius: '9px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', color: '#EF4444', fontSize: '10.5px', fontWeight: 700, marginBottom: '12px', lineHeight: 1.5 }}>
          ⚠ Irreversibility warning: approved actions execute on the ledger and cannot be undone. Any change to amount, counterparty, asset, account, or settlement date requires a new approval.
        </div>

        <label style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 800, display: 'block', marginBottom: '5px', textTransform: 'uppercase' }}>
          Type EXECUTE to confirm this exact action
        </label>
        <input
          value={confirmed}
          onChange={(e) => setConfirmed(e.target.value)}
          placeholder="EXECUTE"
          className="input-dark"
          style={{ width: '100%', padding: '9px 11px', fontSize: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', marginBottom: '14px' }}
        />

        <div style={{ display: 'flex', gap: '9px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="card-interactive" style={{ padding: '9px 15px', borderRadius: '8px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={() => {
              if (confirmed.trim().toUpperCase() === 'EXECUTE') {
                onConfirm();
                setConfirmed('');
              }
            }}
            disabled={confirmed.trim().toUpperCase() !== 'EXECUTE'}
            style={{
              padding: '9px 17px',
              borderRadius: '8px',
              backgroundColor: confirmed.trim().toUpperCase() === 'EXECUTE' ? 'rgba(239,68,68,0.85)' : '#241019',
              border: '1px solid rgba(239,68,68,0.55)',
              color: confirmed.trim().toUpperCase() === 'EXECUTE' ? '#FFFFFF' : 'var(--text-dim)',
              fontSize: '11.5px',
              fontWeight: 900,
              cursor: confirmed.trim().toUpperCase() === 'EXECUTE' ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} /> Confirm & Approve
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- §28 Data states ---------------- */

export const EmptyState: React.FC = () => (
  <div style={{ padding: '26px 18px', borderRadius: '11px', border: '1px dashed rgba(148,163,184,0.3)', backgroundColor: 'rgba(148,163,184,0.04)', textAlign: 'center' }}>
    <Inbox size={20} color="#94A3B8" style={{ marginBottom: '8px' }} />
    <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>No records found for the selected scope.</div>
    <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginTop: '4px' }}>Check institution, date, currency, status, or environment filters.</div>
  </div>
);

export const LoadingState: React.FC<{ source?: string; requestId?: string }> = ({ source = 'Local Sandbox API', requestId = 'req_sandbox' }) => (
  <div style={{ padding: '20px 18px', borderRadius: '11px', border: '1px solid var(--border-subtle)', backgroundColor: '#120d18', display: 'flex', alignItems: 'center', gap: '10px' }}>
    <RefreshCw size={15} color="#8B5CF6" className="pulse-glow" />
    <div>
      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#FFFFFF' }}>Loading verified data…</div>
      <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Source: {source} · Request ID: {requestId}</div>
    </div>
  </div>
);

export const ErrorState: React.FC<{ code?: string; source?: string; onRetry?: () => void }> = ({ code = 'E_DATA_UNAVAILABLE', source = 'Local Sandbox API', onRetry }) => (
  <div style={{ padding: '18px', borderRadius: '11px', border: '1px solid rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
      <AlertTriangle size={15} color="#EF4444" />
      <span style={{ fontSize: '12px', fontWeight: 900, color: '#EF4444' }}>Data unavailable.</span>
    </div>
    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.7 }}>
      Source: {source}<br />Error code: {code}<br />Last successful response: see integration monitor
    </div>
    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
      {onRetry && (
        <button onClick={onRetry} className="card-interactive" style={{ padding: '6px 12px', borderRadius: '7px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
          Retry
        </button>
      )}
      <button className="card-interactive" style={{ padding: '6px 12px', borderRadius: '7px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
        Open incident
      </button>
      <button className="card-interactive" style={{ padding: '6px 12px', borderRadius: '7px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
        Use last verified snapshot
      </button>
    </div>
  </div>
);

export const StaleDataBanner: React.FC<{ asOf: string }> = ({ asOf }) => (
  <div style={{ padding: '9px 13px', borderRadius: '9px', backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', fontSize: '10.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
    <AlertTriangle size={13} />
    Data is older than the permitted freshness window (as of {asOf}). Do not use for live approval until refreshed.
  </div>
);

/* ---------------- §30 ExportMenu ---------------- */

export const ExportMenu: React.FC<{ onExport?: (format: string) => void }> = ({ onExport }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(!open)} className="card-interactive" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 11px', borderRadius: '7px', backgroundColor: '#191120', border: '1px solid var(--border-subtle)', color: '#FFF', fontSize: '10.5px', fontWeight: 800, cursor: 'pointer' }}>
        <Download size={12} /> Export <ChevronDown size={11} />
      </button>
      {open && (
        <div className="fade-in" style={{ position: 'absolute', right: 0, top: '110%', zIndex: 1500, backgroundColor: '#120c16', border: '1px solid var(--border-subtle)', borderRadius: '9px', padding: '6px', minWidth: '210px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          {['PDF — with approver & version', 'CSV — raw records', 'XBRL — regulatory', 'Signed evidence bundle'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setOpen(false);
                onExport?.(f);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', width: '100%', padding: '7px 9px', borderRadius: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, textAlign: 'left', cursor: 'pointer' }}
            >
              <FileText size={12} color="var(--text-dim)" /> {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
