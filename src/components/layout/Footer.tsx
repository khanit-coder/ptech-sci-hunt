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
    <footer className="w-full border-t-2 border-slate-300 bg-white/80 py-5 px-4 sm:px-6 lg:px-8 mt-auto backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        
        {/* Activity Tagline */}
        <div className="flex items-center gap-2 flex-wrap">
          <Cpu className="w-4 h-4 text-mario-blue animate-spin" style={{ animationDuration: '8s' }} />
          <span>
            <strong className="text-slate-900 font-bold">PTECH-Sci Survivor Passport</strong> • Mario World Hunt
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-500 italic font-medium">"The Game Has Begun. Science Is Your Only Way Out."</span>
        </div>

        {/* System & Architecture Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="font-mono text-[11px] font-bold text-slate-800">
              {isSupabaseConfigured ? 'SUPABASE CLOUD LIVE' : 'LOCAL ENGINE LIVE'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-600 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>PTECH-Sci 2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
