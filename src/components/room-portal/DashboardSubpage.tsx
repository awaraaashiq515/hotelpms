'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

interface DashboardSubpageProps {
  title: string;
  emoji: string;
  accentColor: string;
  children: React.ReactNode;
}

export default function DashboardSubpage({ title, emoji, accentColor, children }: DashboardSubpageProps) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-header */}
      <header style={{
        background: 'rgba(5,10,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => router.push('/room-portal/dashboard')}
              style={{
                width: '44px', height: '44px', borderRadius: '14px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'rgb(99,102,241)',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>{emoji}</span>
              <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 900, margin: 0 }}>{title}</h1>
            </div>
          </div>
          <button
            onClick={() => router.push('/room-portal/dashboard')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgb(148,163,184)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Home size={16} /> Home
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{
        flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%',
        padding: '28px', boxSizing: 'border-box',
      }}>
        {children}
      </main>
    </div>
  );
}
