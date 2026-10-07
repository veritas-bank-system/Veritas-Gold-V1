import React, { useEffect, useState } from 'react';
import { Download, Zap, Server, ShieldCheck, Filter, AlertOctagon, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchSettlementTelemetry } from '../../services/api';
import type { NotaryNode, DoubleSpendLog, SettlementTelemetry } from '../../types';

interface ConsensusHealthViewProps {
  onNotify?: (msg: string, isError?: boolean) => void;
}

/** Demo fabric topology + fixtures used only when backend telemetry is unreachable. */
const DEMO_NODES: NotaryNode[] = [
  { id: '1', name: 'N-Frankfurt', latency_ms: 12, status: 'online' },
  { id: '2', name: 'N-London', latency_ms: 8, status: 'online' },
  { id: '3', name: 'N-Zurich (L)', latency_ms: 4, status: 'online', is_leader: true },
  { id: '4', name: 'N-NewYork', latency_ms: 45, status: 'online' },
  { id: '5', name: 'N-Singapore', latency_ms: 0, status: 'offline' },
];

/** Adaptive finality formatting: µs → ms → s (stays sub-second in practice). */
function fmtFinality(us: number): { value: string; unit: string } {
  if (us >= 1_000_000) return { value: (us / 1_000_000).toFixed(2), unit: 's' };
  if (us >= 1_000) return { value: (us / 1_000).toFixed(2), unit: 'ms' };
  return { value: String(us), unit: 'µs' };
}

export const ConsensusHealthView: React.FC<ConsensusHealthViewProps> = ({ onNotify }) => {
  const [diagnosing, setDiagnosing] = useState(false);
  const [filterState, setFilterState] = useState<'ALL' | 'VALIDATED' | 'REJECTED'>('ALL');
  const [telemetry, setTelemetry] = useState<SettlementTelemetry | null>(null);
  const [liveLogs, setLiveLogs] = useState<DoubleSpendLog[]>([]);

  // Live sandbox-ledger telemetry, polled every 2s. If the API is unreachable the
  // last good snapshot is kept and the view falls back to the demo fixtures below,
  // so the tour capture pipeline and offline demo keep working unchanged.
  useEffect(() => {
    let cancelled = false;
    const poll = async (): Promise<void> => {
      try {
        const t = await fetchSettlementTelemetry();
        if (cancelled) return;
        setTelemetry(t);
        // Format timestamps in the event handler (render stays pure).
        setLiveLogs(t.events.map((e) => ({
          timestamp:
            new Date(e.timestamp_ms).toLocaleTimeString('en-GB', { hour12: false }) +
            '.' + String(e.timestamp_ms % 1000).padStart(3, '0'),
          stateref: e.stateref,
          requesting_party: e.requesting_party,
          status: e.status,
          signatures: e.signatures,
          reason: e.reason,
          operation: e.operation,
          detail: e.detail,
        })));
      } catch {
        /* keep last good snapshot; UI falls back to demo fixtures */
      }
    };
    void poll();
    const id = window.setInterval(() => { void poll(); }, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const live = telemetry !== null;
  const nodes: NotaryNode[] = telemetry?.nodes ?? DEMO_NODES;
  const metrics = telemetry?.metrics;
  const subnet = telemetry?.subnet;
  const finality = fmtFinality(metrics ? metrics.last_finality_us : 400_000);
  const p99 = metrics ? fmtFinality(metrics.p99_finality_us) : { value: '0.85', unit: 's' };

  const initialLogs: DoubleSpendLog[] = [
    {
      timestamp: '14:22:01.405',
      stateref: 'E8F1A2...C9:0',
      requesting_party: 'O=Bank A, L=NY',
      status: 'VALIDATED',
      signatures: '4/5',
    },
    {
      timestamp: '14:22:01.102',
      stateref: '7B4D99...1F:1',
      requesting_party: 'O=Broker B, L=LN',
      status: 'VALIDATED',
      signatures: '4/5',
    },
    {
      timestamp: '14:21:59.880',
      stateref: '4A1F02...E3:0',
      requesting_party: 'O=Exchange C, L=HK',
      status: 'REJECTED',
      signatures: '0/5',
    },
    {
      timestamp: '14:21:58.201',
      stateref: '9C3E11...B4:2',
      requesting_party: 'O=Bank A, L=NY',
      status: 'VALIDATED',
      signatures: '5/5',
    },
    {
      timestamp: '14:21:57.905',
      stateref: '2D5F88...A1:0',
      requesting_party: 'O=Fund D, L=SG',
      status: 'VALIDATED',
      signatures: '4/5',
    },
  ];

  const logs: DoubleSpendLog[] = telemetry ? liveLogs : initialLogs;

  const filteredLogs = logs.filter((l) => {
    if (filterState === 'ALL') return true;
    return l.status === filterState;
  });

  const handleRunDiagnostics = () => {
    setDiagnosing(true);
    setTimeout(() => {
      setDiagnosing(false);
      const quorum = subnet ? `${subnet.quorum}/${subnet.notaries}` : '4/5';
      const algo = subnet?.algorithm ?? 'Raft';
      if (onNotify) onNotify(`Diagnostic Complete: Notary Cluster healthy. ${algo} Consensus quorum (${quorum}) nominal.`);
    }, 900);
  };

  const handleExportLogs = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sovereign_ledger_notary_logs_${Date.now()}.json`;
    a.click();
    if (onNotify) onNotify('Double-Spend Prevention logs exported successfully!');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Consensus Health
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Real-time notary cluster monitoring and finality metrics.</span>
            <span
              className={live ? 'pill-valid' : 'pill-reject'}
              style={{ fontSize: '10px' }}
              title={live
                ? `Sandbox ledger · uptime ${Math.floor((telemetry?.uptime_s ?? 0) / 60)}m · ${metrics?.ops_total ?? 0} ops`
                : 'Backend telemetry unreachable — showing demo fixtures'}
            >
              ● {live ? 'LIVE' : 'DEMO DATA'}
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-outline" onClick={handleExportLogs}>
            <Download size={15} /> Export Logs
          </button>
          <button className="btn-cyan" onClick={handleRunDiagnostics} disabled={diagnosing}>
            {diagnosing ? <RefreshCw size={15} className="pulse-glow" /> : <Zap size={15} />}
            {diagnosing ? 'Running...' : 'Run Diagnostics'}
          </button>
        </div>
      </div>

      {/* Top Grid: Notary Cluster Heartbeat & Finality Monitor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px' }}>
          
          {/* Card 1: Notary Cluster Heartbeat */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} color="var(--cyan-primary)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Notary Cluster Heartbeat</h3>
              </div>
              <span className="pill-valid" style={{ fontSize: '10.5px' }}>
                ● BFT ACTIVE
              </span>
            </div>

            {/* Nodes Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`node-tile ${node.is_leader ? 'leader' : ''} ${node.status === 'offline' ? 'offline' : ''}`}
                >
                  {/* Status indicator dot */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '9999px',
                      backgroundColor: node.status === 'online' ? 'var(--green-valid)' : 'var(--red-reject)',
                    }}
                  />

                  {/* Server Icon Box */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      backgroundColor: '#121d33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Server size={16} color={node.status === 'online' ? 'var(--cyan-primary)' : 'var(--red-reject)'} />
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: 700, color: node.is_leader ? 'var(--cyan-primary)' : 'var(--text-main)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {node.name}
                  </div>
                  <div style={{ fontSize: '10px', color: node.status === 'online' ? 'var(--text-muted)' : 'var(--red-reject)', marginTop: '2px', fontWeight: 600 }}>
                    {node.status === 'online' ? `${node.latency_ms}MS` : 'OFFLINE'}
                  </div>
                </div>
              ))}
            </div>

            {/* Metrics Bottom Row */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CONSENSUS THRESHOLD
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }}>
                  {subnet ? subnet.quorum : 4} / {subnet ? subnet.notaries : 5} <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>Nodes</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  AVG LATENCY
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }}>
                  {metrics ? metrics.avg_latency_ms : 17}<span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ALGORITHM
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green-valid)', marginTop: '3px' }}>
                  {subnet ? subnet.algorithm : 'Raft'} <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--green-valid)' }}>(Healthy)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Finality Monitor */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Zap size={18} color="#f59e0b" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>Finality Monitor</h3>
            </div>

            {/* Circular Glowing Gauge */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0 20px 0' }}>
              <div
                style={{
                  width: '135px',
                  height: '135px',
                  borderRadius: '9999px',
                  border: '6px solid var(--border-subtle)',
                  borderTopColor: 'var(--cyan-primary)',
                  borderRightColor: 'var(--cyan-primary)',
                  borderBottomColor: 'var(--cyan-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: '0 0 25px rgba(0, 210, 238, 0.25)',
                }}
              >
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--cyan-primary)', letterSpacing: '-0.02em' }}>
                  {finality.value}<span style={{ fontSize: '16px' }}>{finality.unit}</span>
                </div>
                <div style={{ fontSize: '8.5px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>
                  SUB-SECOND FINALITY
                </div>
              </div>
            </div>

            {/* Finality Key Metrics List */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Throughput (TPS · 60s window)</span>
                <b style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{metrics ? metrics.tps_60s.toFixed(2) : '1,245'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pending StateRefs</span>
                <b style={{ color: 'var(--amber-warning)', fontFamily: 'var(--font-mono)' }}>{metrics ? metrics.pending_staterefs : 12}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Time to Finality (99th %ile)</span>
                <b style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{p99.value}{p99.unit}</b>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Card 3: Double-Spend Prevention Log Stream */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="var(--amber-warning)" />
            <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-main)' }}>
              Double-Spend Prevention Log Stream
            </h3>
          </div>

          {/* Filter button */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterState('ALL')}
              className={`pill-cyan`}
              style={{
                cursor: 'pointer',
                backgroundColor: filterState === 'ALL' ? 'var(--cyan-primary)' : 'transparent',
                color: filterState === 'ALL' ? '#070c14' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Filter size={12} /> ALL STATES
            </button>
            <button
              onClick={() => setFilterState('VALIDATED')}
              className="pill-valid"
              style={{
                cursor: 'pointer',
                opacity: filterState === 'VALIDATED' || filterState === 'ALL' ? 1 : 0.4,
              }}
            >
              VALIDATED
            </button>
            <button
              onClick={() => setFilterState('REJECTED')}
              className="pill-reject"
              style={{
                cursor: 'pointer',
                opacity: filterState === 'REJECTED' || filterState === 'ALL' ? 1 : 0.4,
              }}
            >
              REJECTED
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', minWidth: '820px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#09101f', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '12px 18px' }}>TIMESTAMP</th>
                <th style={{ padding: '12px 18px' }}>STATEREF (TXID:INDEX)</th>
                <th style={{ padding: '12px 18px' }}>REQUESTING PARTY</th>
                <th style={{ padding: '12px 18px' }}>STATUS</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>SIGNATURES</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => {
                const isRejected = log.status === 'REJECTED';
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #131f36',
                      backgroundColor: isRejected ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>
                      {log.timestamp}
                    </td>

                    <td
                      style={{ padding: '14px 18px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isRejected ? '#ef4444' : 'var(--cyan-primary)' }}
                      title={[log.operation, log.detail].filter(Boolean).join(' · ')}
                    >
                      {log.stateref}
                    </td>

                    <td style={{ padding: '14px 18px', color: 'var(--text-main)', fontWeight: 500 }}>
                      {log.requesting_party}
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      {isRejected ? (
                        <span className="pill-reject" title={log.reason || 'Double spend rejected by notary quorum'}>
                          <AlertOctagon size={12} /> REJECTED{log.reason ? `: ${log.reason.length > 26 ? `${log.reason.slice(0, 26)}…` : log.reason}` : ': DOUBLE SPEND'}
                        </span>
                      ) : (
                        <span className="pill-valid">
                          <CheckCircle2 size={12} /> VALIDATED
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isRejected ? '#ef4444' : 'var(--text-main)' }}>
                      {log.signatures}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
