import React, { useMemo, useState } from 'react';
import type { DemandDepositRecord, SweepingRule, SweepingRuleDraft } from '../../types';
import { AlertCircle, ArrowDownToLine, Bot, CheckCircle2, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import type { PersonaDefinition } from '../auth/InstitutionalLoginSurface';

interface LiquiditySweeperViewProps {
  rules: SweepingRule[];
  accounts: DemandDepositRecord[];
  drafts: SweepingRuleDraft[];
  rulesDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  rulesFetchedAt: number | null;
  accountsDataStatus: 'loading' | 'available' | 'stale' | 'unavailable';
  accountsFetchedAt: number | null;
  persona: PersonaDefinition;
  onSaveDraft: (draft: SweepingRuleDraft) => void;
  onReviewDraft: (draftId: string, reviewer: string) => void;
  onRefresh: () => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

const isActive = (status: DemandDepositRecord['status']) => status === 'Active';
const amountValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const formatted = (value: number, currency: string) => `${new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${currency}`;

export const LiquiditySweeperView: React.FC<LiquiditySweeperViewProps> = ({
  rules,
  accounts,
  drafts,
  rulesDataStatus,
  rulesFetchedAt,
  accountsDataStatus,
  accountsFetchedAt,
  persona,
  onSaveDraft,
  onReviewDraft,
  onRefresh,
  onNotify,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sourceAccount, setSourceAccount] = useState('');
  const [targetAsset, setTargetAsset] = useState('sEURD');
  const [reserveFloor, setReserveFloor] = useState('');
  const [threshold, setThreshold] = useState('');
  const [sweepCap, setSweepCap] = useState('');
  const [frequency, setFrequency] = useState('Daily · sandbox schedule only');
  const [submitting, setSubmitting] = useState(false);
  const centralBank = persona.category === 'Central Bank';
  const eligibleAccounts = useMemo(() => accounts.filter((account) => isActive(account.status)), [accounts]);
  const selectedAccount = eligibleAccounts.find((account) => account.account_id === sourceAccount);
  const currency = selectedAccount?.currency || '—';
  const balance = amountValue(selectedAccount?.balance.value_str || '0');
  const floor = amountValue(reserveFloor);
  const trigger = amountValue(threshold);
  const cap = amountValue(sweepCap);
  const illustrativeAmount = balance > trigger ? Math.max(0, Math.min(balance - floor, cap)) : 0;
  const canSaveDraft = accountsDataStatus === 'available' && !!selectedAccount && Number.isFinite(floor) && Number.isFinite(trigger) && Number.isFinite(cap) && floor >= 0 && floor <= balance && trigger > floor && cap > 0;

  const openDraftForm = () => {
    const firstAccount = eligibleAccounts[0];
    setSourceAccount(firstAccount?.account_id || '');
    setReserveFloor(firstAccount?.balance.value_str || '');
    setThreshold('');
    setSweepCap('');
    setTargetAsset(firstAccount?.currency === 'USD' ? 'sUSDD' : 'sEURD');
    setFrequency('Daily · sandbox schedule only');
    setShowCreateModal(true);
  };

  const submitDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSaveDraft || !selectedAccount) {
      onNotify('Select an available active account and enter a valid reserve floor, higher trigger, and positive cap.', true);
      return;
    }
    setSubmitting(true);
    try {
      const now = Date.now();
      const draft: SweepingRuleDraft = {
        draft_id: `SWEEP-DRAFT-${now}`,
        source_account: selectedAccount.account_id,
        currency: selectedAccount.currency,
        reserve_floor: reserveFloor,
        trigger_threshold: threshold,
        sweep_cap: sweepCap,
        target_asset: targetAsset,
        frequency,
        created_at: now,
        creator_persona_id: persona.id,
        creator_persona_name: persona.roleTitle,
        institution_name: persona.institutionName,
      };
      onSaveDraft(draft);
      setShowCreateModal(false);
      onNotify('Draft saved in this browser session only. Nothing was sent to the ledger or executed.');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewDraft = (draft: SweepingRuleDraft) => {
    if (draft.creator_persona_id === persona.id) {
      onNotify('A different persona must review this draft in the demo workflow.', true);
      return;
    }
    onReviewDraft(draft.draft_id, persona.roleTitle);
    onNotify('Sandbox draft marked reviewed. This does not activate or execute a liquidity rule.');
  };

  const inputStyle: React.CSSProperties = { width: '100%', marginTop: '5px', padding: '9px 11px', border: '1px solid var(--border-subtle)', borderRadius: '7px', color: 'var(--text-main)', background: '#0b0910', fontSize: '12px' };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}><Bot size={19} color="var(--red-primary)" /><span style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>Liquidity Management · Sandbox</span></div>
          <h1 style={{ fontSize: '29px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-.02em' }}>{centralBank ? 'Liquidity Policy & Sweep Review' : 'Institutional Liquidity Rules'}</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{centralBank ? 'Review institution-proposed liquidity rules and policy thresholds. No central-bank funds are moved by this demo.' : 'Prepare a session-only draft for eligible demo accounts and review its indicative effect before submission.'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!centralBank && <button className="btn-cyan" onClick={openDraftForm} disabled={accountsDataStatus !== 'available' || eligibleAccounts.length === 0} title={accountsDataStatus !== 'available' ? 'Current account records are required to prepare a draft' : eligibleAccounts.length === 0 ? 'No active accounts returned by the shared demo API' : 'Prepare a non-executing draft'}><Plus size={15} /> Draft a Liquidity Rule</button>}
          <button className="btn-outline" onClick={onRefresh} disabled={rulesDataStatus === 'loading' || accountsDataStatus === 'loading'}><RefreshCw size={14} /> Refresh data</button>
        </div>
      </div>

      <div role="note" style={{ display: 'flex', gap: '10px', padding: '12px 14px', border: '1px solid rgba(245,158,11,.35)', borderRadius: '8px', background: 'rgba(245,158,11,.08)', color: 'var(--text-muted)', fontSize: '11.5px', lineHeight: 1.55 }}>
        <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} /><div><strong style={{ color: '#fbbf24' }}>Simulation only — no automatic investment or funds movement.</strong> Rule drafts are stored in this browser session; the current API does not support reserve floors, sweep caps, approval, pause, or execution history. Existing API rules, if returned, are displayed as service records and are not created from this draft form.</div>
      </div>

      <section aria-label="Liquidity data context" className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: '14px', padding: '14px 16px' }}>
        <div><div className="eyebrow">Active persona</div><div className="context-value">{persona.roleTitle}</div></div>
        <div><div className="eyebrow">Institution context</div><div className="context-value">{persona.institutionName}</div></div>
        <div><div className="eyebrow">Account scope</div><div className="context-value">Shared API · no institution filter</div></div>
        <div><div className="eyebrow">Rules API status / as of</div><div className="context-value">{rulesDataStatus === 'available' && rulesFetchedAt ? `Response · ${new Date(rulesFetchedAt).toLocaleTimeString()}` : rulesDataStatus === 'loading' ? 'Loading' : rulesDataStatus === 'stale' ? 'Unavailable · last data retained' : 'Unavailable · no response'}</div></div>
        <div><div className="eyebrow">Account data as of</div><div className="context-value">{accountsDataStatus === 'available' && accountsFetchedAt ? new Date(accountsFetchedAt).toLocaleTimeString() : accountsDataStatus === 'loading' ? 'Loading' : accountsDataStatus === 'stale' ? 'Stale · last data retained' : 'Unavailable'}</div></div>
      </section>

      {(rulesDataStatus === 'loading' || rulesDataStatus === 'unavailable' || rulesDataStatus === 'stale' || accountsDataStatus !== 'available') && (
        <div role={rulesDataStatus === 'unavailable' || rulesDataStatus === 'stale' || accountsDataStatus === 'unavailable' || accountsDataStatus === 'stale' ? 'alert' : 'status'} style={{ padding: '11px 13px', borderRadius: '8px', background: 'rgba(127,29,29,.12)', border: '1px solid rgba(248,113,113,.3)', color: 'var(--text-muted)', fontSize: '11px', lineHeight: 1.5 }}>
          {rulesDataStatus === 'loading' && 'Loading configured rule records… '}
          {(rulesDataStatus === 'unavailable' || rulesDataStatus === 'stale') && 'The rules service is unavailable. A service error is not an empty rule list. '}
          {accountsDataStatus !== 'available' && `Account data is ${accountsDataStatus}; available accounts and eligibility cannot be confirmed. `}
          <button type="button" onClick={onRefresh} style={{ color: '#fca5a5', background: 'none', border: 'none', padding: 0, textDecoration: 'underline', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {centralBank && <section className="card" style={{ padding: '16px 18px' }}><h2 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px' }}>Policy review checklist</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '9px', color: 'var(--text-muted)', fontSize: '11px' }}>{['Minimum operating reserve is explicit', 'Trigger is above the reserve floor', 'Destination asset is eligible under mandate', 'Rule has institution owner and review trail'].map((item) => <div key={item} style={{ display: 'flex', gap: '7px', alignItems: 'center' }}><ShieldCheck size={13} color="var(--red-primary)" />{item}</div>)}</div><p style={{ color: 'var(--text-dim)', fontSize: '10px', marginTop: '10px' }}>Policy checklist is guidance only. The demo does not validate mandates or impose central-bank policy.</p></section>}

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Bot size={17} color="var(--red-primary)" /><h2 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0 }}>Service-reported sweeping rules</h2></div><span className={rules.length > 0 && rulesDataStatus === 'available' ? 'pill-valid' : 'pill-gold'}>{rulesDataStatus === 'available' ? `${rules.length} returned` : rulesDataStatus === 'stale' ? `${rules.length} cached · stale` : 'Status unconfirmed'}</span></div>
        <div className="table-responsive"><table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '11px' }}>
          <thead><tr style={{ background: '#09101f', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '9px' }}>{['Rule ID', 'Source account', 'Target asset', 'Trigger', 'Frequency', 'Reported swept', 'Service status'].map((label) => <th key={label} style={{ padding: '11px 13px' }}>{label}</th>)}</tr></thead>
          <tbody>
            {(rulesDataStatus === 'available' || rulesDataStatus === 'stale') && rules.map((rule) => <tr key={rule.rule_id} style={{ borderTop: '1px solid var(--border-subtle)' }}><td style={{ padding: '12px 13px', fontFamily: 'var(--font-mono)' }}>{rule.rule_id}</td><td style={{ padding: '12px 13px', fontFamily: 'var(--font-mono)' }}>{rule.source_account}</td><td style={{ padding: '12px 13px' }}>{rule.target_asset}</td><td style={{ padding: '12px 13px' }}>{rule.threshold_eur} EUR (legacy API field)</td><td style={{ padding: '12px 13px' }}>{rule.frequency}</td><td style={{ padding: '12px 13px' }}>{rule.total_swept_eur} (service record)</td><td style={{ padding: '12px 13px' }}><span className={rule.is_active ? 'pill-valid' : 'pill-gold'}>{rule.is_active ? rulesDataStatus === 'stale' ? 'Cached · reported active' : 'Reported active' : rulesDataStatus === 'stale' ? 'Cached · reported inactive' : 'Reported inactive'}</span></td></tr>)}
            {rulesDataStatus === 'available' && rules.length === 0 && <tr><td colSpan={7} style={{ padding: '25px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>No configured rules were returned by the service.</td></tr>}
            {rulesDataStatus === 'stale' && rules.length === 0 && <tr><td colSpan={7} style={{ padding: '25px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>No cached rules are available; current rule state is unknown.</td></tr>}
            {rulesDataStatus !== 'available' && <tr><td colSpan={7} style={{ padding: '25px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>{rulesDataStatus === 'loading' ? 'Loading service rules…' : 'Rule availability cannot be confirmed.'}</td></tr>}
          </tbody>
        </table></div>
      </section>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}><h2 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0 }}>{centralBank ? 'Institution-submitted drafts · review queue' : 'Session-only rule drafts'}</h2><span className="pill-gold">{drafts.length} draft{drafts.length === 1 ? '' : 's'} · session only</span></div>
        {drafts.length === 0 ? <div style={{ padding: '22px 18px', color: 'var(--text-muted)', fontSize: '11px' }}>{centralBank ? 'No demo drafts are awaiting review. No rules are configured from this session.' : 'No rule drafts created in this session. Drafting will not activate or execute a rule.'}</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', padding: '12px' }}>{drafts.map((draft) => <article key={draft.draft_id} style={{ border: '1px solid var(--border-subtle)', borderRadius: '9px', padding: '13px', background: '#100d14' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}><div><strong style={{ color: 'var(--text-main)', fontSize: '12px' }}>{draft.target_asset} draft · {draft.institution_name}</strong><div style={{ color: 'var(--text-dim)', fontSize: '10px', marginTop: '4px' }}>Draft {draft.draft_id} · by {draft.creator_persona_name} · {new Date(draft.created_at).toLocaleString()}</div></div><span className={draft.reviewed_at ? 'pill-valid' : 'pill-gold'}>{draft.reviewed_at ? `Reviewed by ${draft.reviewed_by}` : 'Needs separate review'}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '10px', color: 'var(--text-muted)', fontSize: '10px' }}><span>Source {draft.source_account}</span><span>Reserve floor {formatted(amountValue(draft.reserve_floor), draft.currency)}</span><span>Trigger {formatted(amountValue(draft.trigger_threshold), draft.currency)}</span><span>Max draft cap {formatted(amountValue(draft.sweep_cap), draft.currency)}</span><span>{draft.frequency}</span></div>{centralBank && !draft.reviewed_at && <button className="btn-outline" onClick={() => reviewDraft(draft)} disabled={draft.creator_persona_id === persona.id} title={draft.creator_persona_id === persona.id ? 'A different persona must review this draft' : 'Mark as reviewed; does not activate the rule'} style={{ marginTop: '11px' }}><CheckCircle2 size={13} /> Mark reviewed (demo only)</button>}</article>)}</div>}
      </section>

      <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Threshold preview uses only the selected account’s returned settled balance and draft values. It does not predict market yield, system liquidity, or transaction execution.</div>

      {showCreateModal && <div className="modal-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target && !submitting) setShowCreateModal(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="sweeper-draft-title" style={{ width: 'min(100%, 590px)', maxHeight: '90vh', overflowY: 'auto' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}><div><h2 id="sweeper-draft-title" style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>Draft liquidity rule</h2><p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>Create a local draft and preview its trigger. This form cannot activate or run it.</p></div><button className="btn-outline" type="button" onClick={() => setShowCreateModal(false)}>Close</button></div><form onSubmit={submitDraft} style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginTop: '14px' }}>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>ELIGIBLE ACTIVE DEMO ACCOUNT<select required value={sourceAccount} onChange={(event) => { const account = eligibleAccounts.find((item) => item.account_id === event.target.value); setSourceAccount(event.target.value); if (account) setReserveFloor(account.balance.value_str); }} style={inputStyle}><option value="">Select account</option>{eligibleAccounts.map((account) => <option key={account.account_id} value={account.account_id}>{account.account_id} · {account.currency} · settled {account.balance.value_str}</option>)}</select></label>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>MINIMUM RESERVE FLOOR ({currency})<input required type="number" min="0" step="0.01" value={reserveFloor} onChange={(event) => setReserveFloor(event.target.value)} style={inputStyle} /></label>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>TRIGGER WHEN SETTLED BALANCE EXCEEDS ({currency})<input required type="number" min="0.01" step="0.01" value={threshold} onChange={(event) => setThreshold(event.target.value)} style={inputStyle} /></label>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>MAXIMUM DRAFT SWEEP CAP ({currency})<input required type="number" min="0.01" step="0.01" value={sweepCap} onChange={(event) => setSweepCap(event.target.value)} style={inputStyle} /></label>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>SANDBOX TARGET<select value={targetAsset} onChange={(event) => setTargetAsset(event.target.value)} style={inputStyle}><option value="sEURD">sEURD · simulated, non-redeemable</option><option value="sUSDD">sUSDD · simulated, non-redeemable</option><option value="XAU">XAU · target not executed or verified here</option></select></label>
        <label style={{ color: 'var(--text-dim)', fontSize: '10px', fontWeight: 700 }}>PROPOSED REVIEW WINDOW<select value={frequency} onChange={(event) => setFrequency(event.target.value)} style={inputStyle}><option>Daily · sandbox schedule only</option><option>Manual review only</option><option>End of day · sandbox schedule only</option></select></label>          <div className="card" style={{ padding: '12px', fontSize: '11px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-main)', fontWeight: 700 }}><ArrowDownToLine size={14} color="var(--red-primary)" /> Indicative effect · {currency}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '9px' }}><div><div style={{ color: 'var(--text-dim)' }}>Current settled balance</div><strong>{formatted(balance, currency)}</strong></div><div><div style={{ color: 'var(--text-dim)' }}>Illustrative amount above trigger, after floor and cap</div><strong>{formatted(illustrativeAmount, currency)}</strong></div></div><p style={{ color: 'var(--text-dim)', fontSize: '9px', marginTop: '8px' }}>Calculated only if the returned demo balance exceeds the trigger. This arithmetic does not imply an investment recommendation.</p></div>
        {floor > balance && <div role="alert" style={{ color: '#f87171', fontSize: '10px' }}>Reserve floor cannot exceed the selected account’s returned settled balance.</div>}
        {trigger > 0 && floor >= trigger && <div role="alert" style={{ color: '#f87171', fontSize: '10px' }}>Trigger must be greater than the minimum reserve floor.</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}><button className="btn-outline" type="button" onClick={() => setShowCreateModal(false)}>Cancel</button><button className="btn-cyan" type="submit" disabled={submitting || !canSaveDraft}>{submitting ? 'Saving draft…' : 'Save session-only draft'}</button></div>
      </form></section></div>}

      <style>{`.eyebrow{font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em}.context-value{font-size:11px;color:var(--text-main);font-weight:700;margin-top:4px}`}</style>
    </div>
  );
};
