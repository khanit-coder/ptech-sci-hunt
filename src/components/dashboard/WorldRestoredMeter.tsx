import React from 'react';
import { DashboardStats } from '@/types';
import { Sparkles, Zap, Trophy, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  stats: DashboardStats;
  isLedMode?: boolean;
}

export const WorldRestoredMeter: React.FC<Props> = ({ stats, isLedMode = false }) => {
  const percentage = Math.min(100, Math.max(0, stats.world_restored_percentage));
  const isComplete = percentage >= 100;

  return (
    <div
      className={`w-full rounded-3xl transition-all duration-700 relative overflow-hidden border-2 shadow-2xl ${
        isComplete
          ? 'border-emerald-500 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white shadow-neon-green'
          : 'border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100'
      } ${isLedMode ? 'p-3 sm:p-4 lg:p-5' : 'p-6 sm:p-8 lg:p-10'}`}
    >
      {/* Glow aura */}
      <div
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25"
        style={{
          background: isComplete
            ? 'radial-gradient(circle, #00E676 0%, transparent 70%)'
            : 'radial-gradient(circle, #00F0FF 0%, transparent 70%)',
        }}
      />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-lg ${
              isComplete
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-neon-green'
                : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
            }`}
          >
            {isComplete ? <CheckCircle2 className="w-6 h-6 animate-bounce" /> : <Zap className="w-6 h-6 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
                WORLD STABILITY REACTOR
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300">
                MISSION CORE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              {isComplete
                ? '⭐ กู้คืนมิติโลก PTECH สำเร็จ 100% สมบูรณ์แบบ!'
                : 'ระดับพลังงานการฟื้นฟูมิติโลก PTECH จากแกนวิทยาศาสตร์'}
            </p>
          </div>
        </div>

        {/* Mission Status Badge */}
        <div
          className={`px-4 py-2 rounded-2xl font-mono text-xs sm:text-sm font-black tracking-wider uppercase border flex items-center gap-2 shadow-lg ${
            stats.mission_status === 'RESTORATION COMPLETE'
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-neon-green'
              : stats.mission_status === 'PAUSED'
              ? 'bg-yellow-500 text-slate-950 border-yellow-400'
              : 'bg-red-950/80 text-red-400 border-red-800 animate-pulse'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
          <span>{stats.mission_status}</span>
        </div>
      </div>

      {/* Main Center Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center relative z-10 my-2">
        {/* Giant Restored Percentage */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-baseline gap-3 flex-wrap justify-center md:justify-start">
            <span
              className={`font-game text-6xl sm:text-7xl lg:text-8xl tracking-tight font-black transition-all drop-shadow-md ${
                isComplete ? 'text-emerald-400' : 'text-cyan-400'
              }`}
            >
              {percentage.toFixed(0)}%
            </span>
            <span className="font-game text-xl sm:text-2xl lg:text-3xl text-slate-200 uppercase tracking-widest">
              RESTORED
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-300 mt-2 font-semibold">
            ฟื้นคืนมิติแล้ว{' '}
            <strong className="text-mario-yellow text-lg sm:text-xl font-mono px-1">
              {stats.discovered_items}
            </strong>{' '}
            จากเป้าหมาย{' '}
            <strong className="text-white text-lg sm:text-xl font-mono px-1">
              {stats.total_items}
            </strong>{' '}
            ชิ้นส่วน
          </p>
        </div>

        {/* 2 Metric Pods */}
        <div className="md:col-span-5 grid grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-amber-500/40 flex flex-col items-center justify-center text-center shadow-xl hover:border-amber-500 transition-all">
            <div className="flex items-center gap-1.5 text-amber-400 mb-1 font-bold text-xs">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>DISCOVERED</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl sm:text-4xl font-extrabold text-amber-400">
                {stats.discovered_items}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ {stats.total_items}</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold mt-1">ค้นพบแล้ว</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border-2 border-red-500/40 flex flex-col items-center justify-center text-center shadow-xl hover:border-red-500 transition-all">
            <div className="flex items-center gap-1.5 text-red-400 mb-1 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-red-400" />
              <span>REMAINING</span>
            </div>
            <span className="font-mono text-3xl sm:text-4xl font-extrabold text-red-400">
              {stats.remaining_items}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-1">ยังคงซ่อนอยู่</span>
          </div>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="relative z-10 mt-6 sm:mt-8">
        <div className="flex justify-between items-center text-xs font-mono font-bold text-slate-300 mb-2">
          <span className="flex items-center gap-1.5 text-white">
            <Sparkles className="w-4 h-4 text-mario-yellow animate-spin" />
            DIMENSIONAL ENERGY STABILIZER
          </span>
          <span className="text-emerald-400 font-mono font-bold">
            {stats.discovered_items} / {stats.total_items} RECOVERED
          </span>
        </div>

        <div className="h-6 sm:h-7 w-full bg-slate-950 rounded-2xl p-1 border border-slate-800 relative overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-xl transition-all duration-1000 ease-out shadow-lg ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-green-400 shadow-neon-green'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
            }`}
            style={{ width: `${Math.max(4, percentage)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
