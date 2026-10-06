import React from 'react';
import { Landmark, Building2, ArrowRight, Shield, Lock } from 'lucide-react';
import { PulseBadge } from '../ui/motion/PulseBadge';
import type { WorkspaceId } from '../../types';

interface WorkspaceSelectSurfaceProps {
  onSelectWorkspace: (workspace: WorkspaceId) => void;
}

const WORKSPACES: {
  id: WorkspaceId;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  icon: any;
  accent: string;
  accentSoft: string;
  border: string;
  tag: string;
  members: string;
}[] = [
  {
    id: 'central_bank',
    title: 'Central Bank',
    subtitle: 'Reserve Management & Monetary Operations',
    description:
      'Manage official reserves, monetary gold, sovereign bonds, FX liquidity, settlement, collateral, custody, and policy controls.',
    cta: 'Enter Central Bank Workspace',
    icon: Landmark,
    accent: '#EF4444',
    accentSoft: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.45)',
    tag: 'Reserve, Monetary & Settlement Operations',
    members: 'Governor · Reserve Desk · Policy & Supervision',
  },
  {
    id: 'institutional',
    title: 'Commercial Bank / Agency',
    subtitle: 'Institutional Trading & Settlement',
    description:
      'Trade approved assets, provide liquidity, manage client orders, custody, financing, collateral, and settlement operations.',
    cta: 'Enter Institutional Workspace',
    icon: Building2,
    accent: '#8B5CF6',
    accentSoft: 'rgba(139, 92, 246, 0.14)',
    border: 'rgba(139, 92, 246, 0.45)',
    tag: 'Commercial Bank, Agency & Approved Counterparty Operations',
    members: 'Treasury · Primary Dealer · Trading & Custody',
  },
];

export const WorkspaceSelectSurface: React.FC<WorkspaceSelectSurfaceProps> = ({ onSelectWorkspace }) => {
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
      {/* Ambient glows — same identity for both workspaces */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.10) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Brand header */}
      <div className="fade-in" style={{ textAlign: 'center', marginBottom: '36px', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '11px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--border-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--red-primary)',
              boxShadow: '0 0 15px var(--red-glow)',
            }}
          >
            <Shield size={24} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
            VERITAS <span style={{ color: 'var(--red-primary)', textShadow: '0 0 12px var(--red-glow)' }}>GOLD</span>
          </h1>
        </div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700 }}>
          Institutional Reserve & Asset Network
        </div>
      </div>

      {/* Prompt */}
      <div className="fade-in" style={{ zIndex: 10, marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Lock size={14} color="var(--text-dim)" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>Choose your institutional workspace</span>
        <PulseBadge label="MFA Enforced" variant="green" />
      </div>

      {/* Workspace cards */}
      <div
        className="fade-in"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 460px))',
          gap: '22px',
          zIndex: 10,
          width: '100%',
          maxWidth: '980px',
          justifyContent: 'center',
        }}
      >
        {WORKSPACES.map((ws) => {
          const Icon = ws.icon;
          return (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className="card-interactive"
              style={{
                textAlign: 'left',
                backgroundColor: '#0c0a10',
                border: `1px solid ${ws.border}`,
                borderRadius: '16px',
                padding: '26px 26px 22px',
                cursor: 'pointer',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.85), 0 0 24px ${ws.accentSoft}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.8)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '11px',
                    backgroundColor: ws.accentSoft,
                    border: `1px solid ${ws.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: ws.accent,
                    boxShadow: `0 0 15px ${ws.accentSoft}`,
                  }}
                >
                  <Icon size={24} />
                </div>
                <PulseBadge label={ws.id === 'central_bank' ? 'Sovereign' : 'Wholesale'} variant="gold" />
              </div>

              <div>
                <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.01em' }}>{ws.title}</div>
                <div style={{ fontSize: '12.5px', color: ws.accent, fontWeight: 700, marginTop: '3px' }}>{ws.subtitle}</div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                {ws.description}
              </p>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', fontSize: '10.5px', color: 'var(--text-dim)', fontWeight: 600 }}>
                {ws.members}
              </div>

              <div
                style={{
                  marginTop: '2px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: ws.accentSoft,
                  border: `1px solid ${ws.border}`,
                  color: '#FFFFFF',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {ws.cta}
                <ArrowRight size={16} color={ws.accent} />
              </div>

              <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                {ws.tag}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '30px', fontSize: '11px', color: 'var(--text-dim)', zIndex: 10, textAlign: 'center', maxWidth: '640px', lineHeight: 1.6 }}>
        Both workspaces share the same identity, compliance, custody, settlement, and audit infrastructure —
        selection determines your navigation, permissions, limits, data scope, and approval rules.
      </div>
    </div>
  );
};
