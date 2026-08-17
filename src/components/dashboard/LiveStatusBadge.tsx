import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Database, Radio } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export const LiveStatusBadge: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/80 border border-red-500/80 text-red-300 font-mono text-[11px] font-bold animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-red-400" />
        <span>⚠ CONNECTION LOST</span>
      </div>
    );
  }

  if (isSupabaseConfigured) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 font-mono text-[11px] font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Database className="w-3.5 h-3.5 text-emerald-400" />
        <span>SUPABASE CLOUD (LIVE)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold">
      <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
      <span>LOCAL ENGINE (READY)</span>
    </div>
  );
};
