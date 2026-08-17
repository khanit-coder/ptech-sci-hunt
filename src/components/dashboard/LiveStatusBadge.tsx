import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

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
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-950/80 border border-red-500/80 text-red-300 font-mono text-xs font-bold animate-pulse">
        <WifiOff className="w-3.5 h-3.5 text-red-400" />
        <span>⚠ CONNECTION LOST — RECONNECTING...</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      <span>SYSTEM ONLINE</span>
    </div>
  );
};
