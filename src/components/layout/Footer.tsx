import React from 'react';
import { useLocation } from 'react-router-dom';
import { ShieldCheck, Cpu } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

export const Footer: React.FC = () => {
  const location = useLocation();

  // Hide footer on LED presentation mode for 100% clean full screen without scrollbars
  if (location.pathname === '/dashboard/led') {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-800/80 bg-mario-deepBg/80 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        
        {/* Activity Tagline */}
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-mario-yellow animate-spin" style={{ animationDuration: '8s' }} />
          <span>
            <strong className="text-slate-300">PTECH-Sci 2026</strong> : Survive in Mario World
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-500 italic">"The Game Has Begun. Science Is Your Only Way Out."</span>
        </div>

        {/* System & Architecture Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-mario-green animate-pulse' : 'bg-mario-orange animate-pulse'}`} />
            <span className="font-mono text-[11px]">
              {isSupabaseConfigured ? 'SUPABASE CLOUD READY' : 'LOCAL ENGINE READY'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-mario-green" />
            <span>500 Concurrent Capable</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
