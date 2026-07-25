'use client';
import React, { useState, useEffect } from 'react';

interface LiveClockProps {
  className?: string;
  showSeconds?: boolean;
}

export function LiveClock({ className = '', showSeconds = true }: LiveClockProps) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' } : {}),
      }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [showSeconds]);

  return (
    <span className={`font-mono font-black tabular-nums ${className}`}>
      {time}
    </span>
  );
}
