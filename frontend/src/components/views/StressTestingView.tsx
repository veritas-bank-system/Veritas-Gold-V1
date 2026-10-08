import React, { useState } from 'react';
import type { AppSection } from '../../types';
import { PageContextStrip } from '../smart/PageContextStrip';
import { recordSessionEvent } from '../../services/sessionAudit';
import { Play, FileDown } from 'lucide-react';

/**
 * Stress Testing — scenario library and builder per
 * docs/VERITAS-GOLD-MENU-SPECIFICATIONS.md. The eight reference scenarios are
 * clearly-labelled simulated seeds; the simulation engine does not exist yet
 * (Phase 3 backlog), so running a model produces an honest blocked state —
 * no projected losses are ever fabricated.
 */

interface StressTestingViewProps {
  personaRoleTitle: string;
  institutionName: string;
  environment: string;
  pendingApprovals: number;
  onNavigate: (section: AppSection) => void;
  onNotify: (msg: string, isError?: boolean) => void;
}

interface StressScenario {
  id: string;
  name: string;
  type: string;
  marketShock: string;
  liquidityShock: string;
  counterpartyDefault: string;
  recoveryAssumption: string;
  source: 'Reference seed' | 'Session draft';
  createdAt: number;
}

const STORAGE_KEY = 'veritas-stress-scenarios';

function loadScenarios(): StressScenario[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StressScenario[];
  } catch {
    /* fall through to seeds */
  }
  const seeds: StressScenario[] = [
    { id: 'SCN-GOLD-30', name: 'Gold price decline', type: 'Market', marketShock: 'Gold −30%', liquidityShock: 'None', counterpartyDefault: 'None', recoveryAssumption: 'Re-hedge within 5 business days', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-RATE-200', name: 'Interest-rate shock', type: 'Market', marketShock: 'Yield curve +200bp', liquidityShock: 'Bond liquidity −40%', counterpartyDefault: 'None', recoveryAssumption: 'Collateral substitution', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-FX-15', name: 'Foreign-exchange shock', type: 'Market', marketShock: 'EUR/USD ±15%', liquidityShock: 'FX desk funding squeeze', counterpartyDefault: 'None', recoveryAssumption: 'Swap lines within 48h', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-CPTY-DEF', name: 'Major counterparty default', type: 'Credit', marketShock: 'None', liquidityShock: 'Replacement cost spike', counterpartyDefault: 'Top-1 exposure 100% loss', recoveryAssumption: 'Netting + margin call within 24h', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-RAIL-OUT', name: 'Settlement-rail outage', type: 'Operational', marketShock: 'None', liquidityShock: 'Settlement queue backlog', counterpartyDefault: 'None', recoveryAssumption: 'Failover rail within 4h', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-VAULT-ACC', name: 'Vault access disruption', type: 'Operational', marketShock: 'None', liquidityShock: 'Physical delivery halt', counterpartyDefault: 'None', recoveryAssumption: 'Secondary vault activation', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-SANCTION', name: 'Sanctions-screening failure', type: 'Compliance', marketShock: 'None', liquidityShock: 'Screening queue freeze', counterpartyDefault: 'None', recoveryAssumption: 'Manual review within 24h', source: 'Reference seed', createdAt: 0 },
    { id: 'SCN-LP-WITH', name: 'Liquidity-provider withdrawal', type: 'Liquidity', marketShock: 'None', liquidityShock: 'Primary LP capacity −100%', counterpartyDefault: 'None', recoveryAssumption: 'Backup LP onboarding within 72h', source: 'Reference seed', createdAt: 0 },
  ];
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seeds));
  } catch {
    /* storage unavailable — seeds stay in memory */
  }
  return seeds;
}

const emptyForm = { name: '', type: 'Market', marketShock: '', liquidityShock: '', counterpartyDefault: '', recoveryAssumption: '' };

export const StressTestingView: React.FC<StressTestingViewProps> = ({
  personaRoleTitle,
  institutionName,
  environment,
  pendingApprovals,
  onNavigate,
  onNotify,
}) => {
  const [scenarios, setScenarios] = useState<StressScenario[]>(() => loadScenarios());
  const [form, setForm] = useState(emptyForm);
  const [runState, setRunState] = useState<{ id: string; name: string; at: number } | null>(null);

  const addScenario = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!form.name || !form.marketShock) {
      onNotify('Scenario name and market shock assumption are required', true);
      return;
    }
    const scn: StressScenario = {
      id: `SCN-${Date.now().toString(36).toUpperCase()}`,
      name: form.name,
      type: form.type,
      marketShock: form.marketShock,
      liquidityShock: form.liquidityShock || 'None',
      counterpartyDefault: form.counterpartyDefault || 'None',
      recoveryAssumption: form.recoveryAssumption || 'Unspecified',
      source: 'Session draft',
      createdAt: Date.now(),
    };
    const next = [scn, ...loadScenarios()];
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setScenarios(next);
    setForm(emptyForm);
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'STRESS_SCENARIO_CREATED',
      object: `${scn.id} ${scn.name}`,
      environment,
    });
    onNotify(`Scenario ${scn.id} saved (client-side draft)`);
  };

  const runScenario = (scn: StressScenario): void => {
    // Honest blocked state: there is no simulation engine on the ledger, so no
    // loss projection may be produced — not even a synthetic one.
    setRunState({ id: scn.id, name: scn.name, at: Date.now() });
    recordSessionEvent({
      actor: personaRoleTitle,
      effectiveRole: personaRoleTitle,
      institution: institutionName,
      action: 'STRESS_RUN_ATTEMPTED',
      object: `${scn.id} ${scn.name}`,
      environment,
      reason: 'Simulation engine not connected — run refused, no results fabricated',
    });
    onNotify('Simulation engine not connected — run recorded as refused, no results fabricated', true);
  };

  const exportScenario = (scn: StressScenario): void => {
    const blob = new Blob([JSON.stringify(scn, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scn.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Scenario ${scn.id} exported`);
  };

  return (
    <div className="fade-in">
      <PageContextStrip
        pageName="Stress Testing"
        auditPrefix="CB-STRESS"
        personaRoleTitle={personaRoleTitle}
        institutionName={institutionName}
        environment={environment}
        permissionScope="Scenario library read · scenario builder · run refused until engine exists"
        dataStatus="no-source"
        pendingApprovals={pendingApprovals}
        onNavigateApprovals={() => onNavigate('governance')}
        onNotify={onNotify}
      />

      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '4px' }}>
          Scenario library
        </h3>
        <div style={{ fontSize: '10.5px', color: 'var(--text-dim)', marginBottom: '12px' }}>
          Reference seeds are simulated definitions; session drafts are yours. No run produces results until a deterministic simulation engine is connected (Phase 3).
        </div>
        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ color: 'var(--text-dim)', fontSize: '10px', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Scenario</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Assumptions</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{s.id}</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>
                    {s.name}
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 500 }}>{s.source}</div>
                  </td>
                  <td style={{ padding: '8px' }}>{s.type}</td>
                  <td style={{ padding: '8px', color: 'var(--text-muted)' }}>
                    {s.marketShock} · liq: {s.liquidityShock} · cpty: {s.counterpartyDefault} · recovery: {s.recoveryAssumption}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button onClick={() => runScenario(s)} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px', marginRight: '6px' }} title="Run model">
                      <Play size={11} /> Run
                    </button>
                    <button onClick={() => exportScenario(s)} className="btn-secondary" style={{ fontSize: '11px', padding: '4px 8px' }} title="Export scenario definition">
                      <FileDown size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {runState && (
          <div style={{ marginTop: '12px', border: '1px solid rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#FCD34D' }}>
            <b>Run refused — {runState.name} ({runState.id}).</b> The simulation engine is not connected (Phase 3 backlog), so no projected
            loss, reserve impact, or recovery time can be produced. No results were fabricated; the attempt is recorded in the session audit trail.
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, marginBottom: '10px' }}>
          Scenario builder
        </h3>
        <form onSubmit={addScenario} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '12px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-flat" placeholder="e.g. Gold price decline" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-flat">
              <option>Market</option>
              <option>Credit</option>
              <option>Liquidity</option>
              <option>Operational</option>
              <option>Compliance</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Market shock
            <input value={form.marketShock} onChange={(e) => setForm({ ...form, marketShock: e.target.value })} className="input-flat" placeholder="e.g. Gold −30%" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Liquidity shock
            <input value={form.liquidityShock} onChange={(e) => setForm({ ...form, liquidityShock: e.target.value })} className="input-flat" placeholder="None" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Counterparty default
            <input value={form.counterpartyDefault} onChange={(e) => setForm({ ...form, counterpartyDefault: e.target.value })} className="input-flat" placeholder="None" />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            Recovery assumption
            <input value={form.recoveryAssumption} onChange={(e) => setForm({ ...form, recoveryAssumption: e.target.value })} className="input-flat" placeholder="e.g. Failover rail within 4h" />
          </label>
          <button type="submit" className="btn-primary" style={{ alignSelf: 'end' }}>
            Save scenario (client-side draft)
          </button>
        </form>
      </div>
    </div>
  );
};
