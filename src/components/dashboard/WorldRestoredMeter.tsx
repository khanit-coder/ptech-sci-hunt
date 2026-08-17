import React from 'react';
import { DashboardStats } from '@/types';
import { Sparkles, Shield, Zap } from 'lucide-react';

interface Props {
  stats: DashboardStats;
  isLedMode?: boolean;
}

export const WorldRestoredMeter: React.FC<Props> = ({ stats, isLedMode = false }) => {
  const percentage = Math.min(100, Math.max(0, stats.world_restored_percentage));
  const isComplete = percentage >= 100;

  return (
    <div className={`w-full rounded-2xl sm:rounded-3xl border ${
      isComplete 
        ? 'border-mario-green/80 bg-gradient-to-b from-mario-green/20 via-mario-darkNavy to-mario-deepBg shadow-neon-green' 
        : 'border-mario-orange/40 bg-gradient-to-b from-mario-orange/15 via-mario-darkNavy/90 to-mario-deepBg shadow-2xl'
    } p-6 sm:p-10 relative overflow-hidden backdrop-blur-xl transition-all duration-700`}>
      
      {/* Background Neon Energy Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

      {/* Top Status Header */}
      <div className="flex items-center justify-between relative z-10 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 rounded-xl bg-mario-red/20 border border-mario-red/50 text-mario-yellow animate-bounce">
            <Zap className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="font-game text-xs sm:text-base text-mario-yellow tracking-wider drop-shadow-md">
              WORLD STABILITY CORE
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {stats.mission_status === 'RESTORATION COMPLETE' 
                ? '⭐ ระบบกู้คืนมิติสำเร็จ 100% บริบูรณ์!' 
                : 'ระดับการฟื้นฟูมิติโลก PTECH จากพลังงานแกนวิทยาศาสตร์'}
            </p>
          </div>
        </div>

        {/* Badge Status */}
        <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono text-xs sm:text-sm font-extrabold tracking-wide uppercase border flex items-center gap-2 ${
          stats.mission_status === 'RESTORATION COMPLETE'
            ? 'bg-mario-green/20 text-mario-green border-mario-green shadow-neon-green'
            : stats.mission_status === 'PAUSED'
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
            : 'bg-mario-red/20 text-mario-orange border-mario-red/60 animate-pulse'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
          <span>{stats.mission_status}</span>
        </div>
      </div>

      {/* Centerpiece: Giant Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10 my-4 sm:my-8">
        
        {/* Giant Restored Percentage */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start">
          <div className="flex items-baseline gap-2">
            <span className={`font-game text-5xl sm:text-7xl lg:text-8xl tracking-tight font-black transition-all ${
              isComplete ? 'text-mario-green drop-shadow-[0_0_35px_rgba(0,230,118,0.8)]' : 'text-white drop-shadow-[0_0_25px_rgba(255,215,0,0.6)]'
            }`}>
              {percentage.toFixed(0)}%
            </span>
            <span className="font-game text-xl sm:text-3xl text-mario-yellow uppercase tracking-widest">
              RESTORED
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-300 mt-2 font-medium">
            ฟื้นคืนมิติแล้ว <span className="text-mario-yellow font-bold text-lg font-mono">{stats.discovered_items}</span> จากเป้าหมายทั้งหมด <span className="text-white font-bold text-lg font-mono">{stats.total_items}</span> ชิ้น
          </p>
        </div>

        {/* Item Counter Metric Pods */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 border border-mario-yellow/30 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              DISCOVERED
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-mario-yellow">
                {stats.discovered_items}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ {stats.total_items}</span>
            </div>
            <span className="text-[11px] text-mario-green font-medium mt-1">ค้นพบแล้ว</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center shadow-lg">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              REMAINING
            </span>
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-mario-red">
              {stats.remaining_items}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">ยังคงซ่อนอยู่</span>
          </div>
        </div>
      </div>

      {/* Animated Reactor Energy Progress Bar */}
      <div className="relative z-10 mt-6 sm:mt-8">
        <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5 text-mario-yellow">
            <Sparkles className="w-4 h-4 text-mario-yellow" />
            DIMENSIONAL ENERGY STABILIZER
          </span>
          <span className="text-mario-green font-mono font-bold">
            {stats.discovered_items} / {stats.total_items} RECOVERED
          </span>
        </div>

        <div className="h-6 sm:h-8 w-full bg-slate-950/90 rounded-xl p-1 border-2 border-slate-700/80 relative overflow-hidden shadow-inner">
          <div
            className="h-full rounded-lg energy-bar-fill transition-all duration-1000 ease-out shadow-neon-yellow"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />

          {/* Overlay Grid lines for HUD look */}
          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-30">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-0.5 h-full bg-white/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
