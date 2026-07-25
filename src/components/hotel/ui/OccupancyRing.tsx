import React from 'react';

interface OccupancyRingProps {
  pct: number;
  size?: number;
  strokeWidth?: number;
}

export function OccupancyRing({ pct, size = 80, strokeWidth = 6 }: OccupancyRingProps) {
  const r      = (size - strokeWidth * 2) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  const color  = pct >= 80 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b';
  const cx     = size / 2;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cx} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="text-center relative z-10">
        <p className="text-base font-black text-white leading-none">{pct}%</p>
        <p className="text-[7px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider">OCC</p>
      </div>
    </div>
  );
}
