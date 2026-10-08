import React, { useState, useEffect, useCallback } from 'react';
import type { SupervisionData, UnmaskedFlow } from '../../types';
import { fetchSupervisionData } from '../../services/api';
import { Eye, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

/** Fixture flows used only when the backend supervision endpoint is unreachable. */
const DEMO_FLOWS: UnmaskedFlow[] = [
  {
    anonymous_id: 'ryjl3-hexae-mc6xm-gopwt-x5jg7-2a',
    unmasked_legal_owner: 'Alice Trading Corp (Zurich)',
    net_exposure_eur: '€24,500.00',
    rwa_gold_holdings_oz: '5.50 oz',
    risk_tier: 'Low_Compliant',
  },
  {
    anonymous_id: 'h64fh-eybaq-aaaaa-aaaaa-cai',
    unmasked_legal_owner: 'Bob Commodities LLC (Frankfurt)',
    net_exposure_eur: '€18,200.00',
    rwa_bond_holdings_usd: '$50,000 USTB',
    risk_tier: 'Low_Compliant',
  },
];

export const SupervisoryRadar: React.FC = () => {
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loading, setLoading] = useState(false);

  // Silent poll every 2s; on failure the last good snapshot is kept and the
  // view falls back to the demo fixtures below, so the tour capture pipeline
  // and offline demo keep working unchanged.
  const pollRadar = useCallback(async (): Promise<void> => {
    try {
      const res = await fetchSupervisionData();
      setData(res);
    } catch {
      /* keep last good snapshot; UI falls back to demo fixtures */
    }
  }, []);

  const handleManualRefresh = async (): Promise<void> => {
    setLoading(true);
    await pollRadar();
    setLoading(false);
  };

  useEffect(() => {
    void pollRadar();
    const id = window.setInterval(() => { void pollRadar(); }, 2000);
    return () => window.clearInterval(id);
  }, [pollRadar]);

  const live = data !== null;
  const flows: UnmaskedFlow[] = data?.unmasked_active_flows ?? DEMO_FLOWS;
  const intercepted = data?.double_spend_attempts_intercepted ?? 0;
  const partitions = data?.total_active_canister_partitions ?? 10;
  const authority = data?.regulatory_unmasking_authority ?? 'CENTRAL_BANK_SUPERUSER';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-red">Central Bank & Supervisory Radar</span>
            <span
              className={live ? 'pill-valid' : 'pill-reject'}
              style={{ fontSize: '10px' }}
              title={live
                ? `Sandbox ledger · ${intercepted} interceptions · ${partitions} partitions${data?.supervision_timestamp ? ` · scan ${new Date(data.supervision_timestamp).toLocaleTimeString('en-GB', { hour12: false })}` : ''}`
                : 'Backend supervision endpoint unreachable — showing demo fixtures'}
            >
              ● {live ? 'LIVE' : 'DEMO DATA'}
            </span>
            <span style={{ fontSize: '11px', color: '#606060' }}>Complete Unmasked Institutional Supervision</span>
          </div>
          <h2 style={{ fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 700, marginTop: '4px' }}>Global Institutional Oversight & Anonymous Key Unmasking</h2>
        </div>

        <button className="btn-secondary" onClick={() => { void handleManualRefresh(); }} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'pulse-glow' : undefined} /> Refresh Radar
        </button>
      </div>

      <div className="grid-4col" style={{ marginBottom: '20px' }}>
        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#606060' }}>Supervisory Authority</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF0000', marginTop: '4px' }}>
            {authority}
          </div>
          <div style={{ fontSize: '10px', color: '#2BA640', marginTop: '2px' }}>Full Regulatory Access</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#606060' }}>Double-Spend Interceptions</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#2BA640', marginTop: '2px' }}>
            {intercepted} Double-Spend{intercepted === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '10px', color: '#606060', marginTop: '2px' }}>100% Blocked by Notary</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#606060' }}>Active Canister Partitions</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#065FD4', marginTop: '2px' }}>
            {partitions} Canister{partitions === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: '10px', color: '#606060', marginTop: '2px' }}>Wasm Orthogonal Heap</div>
        </div>

        <div className="card" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: '#606060' }}>Dual-Key State</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#7B1FA2', marginTop: '4px' }}>
            Blinded + Audit Proof
          </div>
          <div style={{ fontSize: '10px', color: '#2BA640', marginTop: '2px' }}>Zero Market Manipulation</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #E5E5E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} color="#FF0000" /> Active Anonymous Flows (Unmasked for Regulator Only)
            </h3>
          </div>
          <span className="badge badge-active" style={{ fontSize: '10px' }}>Decrypted</span>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9F9F9', borderBottom: '1px solid #E5E5E5', color: '#606060', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>On-Chain Anonymous Key</th>
                <th style={{ padding: '12px 16px' }}>Unmasked Legal Institution</th>
                <th style={{ padding: '12px 16px' }}>Net Cash Exposure (EUR)</th>
                <th style={{ padding: '12px 16px' }}>RWA Holdings</th>
                <th style={{ padding: '12px 16px' }}>Compliance Tier</th>
              </tr>
            </thead>
            <tbody>
              {flows.map((flow) => (
                <tr key={flow.anonymous_id} style={{ borderBottom: '1px solid #EAEAEA' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} color="#888" />
                      <code style={{ fontSize: '11px' }}>{flow.anonymous_id.slice(0, 14)}...</code>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div
                      title={`Unmasked legal identity under ${authority} authority — regulator-only visibility`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: 'rgba(255, 82, 82, 0.10)',
                        border: '1px solid rgba(255, 82, 82, 0.35)',
                        borderRadius: '6px',
                        color: '#FFB3AB',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Eye size={11} color="#FF5252" />
                      {flow.unmasked_legal_owner}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{flow.net_exposure_eur}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-red">{flow.rwa_gold_holdings_oz || flow.rwa_bond_holdings_usd}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={11} /> {flow.risk_tier}
                    </span>
                  </td>
                </tr>
              ))}
              {flows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '18px 16px', textAlign: 'center', color: '#606060' }}>
                    No active anonymous flows on the ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
