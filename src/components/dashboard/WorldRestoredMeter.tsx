import React from 'react';
import { DashboardStats } from '@/types';
import { Sparkles, Zap, ShieldCheck, Star } from 'lucide-react';

interface Props {
  stats: DashboardStats;
  isLedMode?: boolean;
}

export const WorldRestoredMeter: React.FC<Props> = ({ stats, isLedMode = false }) => {
  const percentage = Math.min(100, Math.max(0, stats.world_restored_percentage));
  const isComplete = percentage >= 100;

  return (
    <div className={`w-full rounded-2xl sm:rounded-3xl border-2 transition-all duration-700 relative overflow-hidden ${
      isComplete 
        ? 'border-mario-green bg-gradient-to-b from-green-50 via-white to-green-50/30 shadow-lg' 
        : 'border-passport-border bg-white shadow-passport-frame'
    } ${isLedMode ? 'p-3 sm:p-4 lg:p-5 my-0.5' : 'p-5 sm:p-8 lg:p-10'}`}>
      
      {/* 4 Corner Rivets for Passport Arcade Look */}
      <div className="passport-rivet-tl" />
      <div className="passport-rivet-tr" />
      <div className="passport-rivet-bl" />
      <div className="passport-rivet-br" />

      {/* Background Blueprint/Grid Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3a607312_1px,transparent_1px),linear-gradient(to_bottom,#3a607312_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />

      {/* Top Status Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mb-4 sm:mb-6 pb-3 border-b-2 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl passport-badge-blue flex items-center justify-center text-white animate-bounce shadow-md">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-game text-xs sm:text-sm text-slate-900 tracking-wider">
                WORLD STABILITY CORE
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-mono font-bold">
                PASSPORT MISSION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              {stats.mission_status === 'RESTORATION COMPLETE' 
                ? '⭐ กู้คืนมิติโลก PTECH สำเร็จ 100% สมบูรณ์แบบ!' 
                : 'ระดับพลังงานการฟื้นฟูมิติโลก PTECH จากแกนวิทยาศาสตร์'}
            </p>
          </div>
        </div>

        {/* Badge Status (Pill shaped like Passport Banners) */}
        <div className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-mono text-xs sm:text-sm font-black tracking-wide uppercase border flex items-center gap-2 shadow-md ${
          stats.mission_status === 'RESTORATION COMPLETE'
            ? 'passport-badge-green shadow-sm'
            : stats.mission_status === 'PAUSED'
            ? 'passport-badge-yellow text-slate-900'
            : 'passport-badge-red animate-pulse'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
          <span>{stats.mission_status}</span>
        </div>
      </div>

      {/* Centerpiece: Giant Percentage & Counters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center relative z-10 my-3 sm:my-6">
        
        {/* Giant Restored Percentage */}
        <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap justify-center md:justify-start">
            <span className={`font-game text-5xl sm:text-7xl lg:text-8xl tracking-tight font-black transition-all ${
              isComplete ? 'text-green-600' : 'text-mario-blue'
            }`}>
              {percentage.toFixed(0)}%
            </span>
            <span className="font-game text-lg sm:text-2xl lg:text-3xl text-slate-800 uppercase tracking-widest">
              RESTORED
            </span>
          </div>

          <p className="text-sm sm:text-base text-slate-700 mt-2 font-semibold">
            ฟื้นคืนมิติแล้ว <span className="text-mario-blue font-black text-lg sm:text-xl font-mono">{stats.discovered_items}</span> จากเป้าหมาย <span className="text-slate-900 font-black text-lg sm:text-xl font-mono">{stats.total_items}</span> ชิ้นส่วน
          </p>
        </div>

        {/* Item Counter Metric Pods (Passport Module Cards) */}
        <div className="md:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="passport-card-inner p-3.5 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm border-2 border-passport-border bg-amber-50/50 hover:bg-amber-50 transition-all">
            <div className="flex items-center gap-1.5 text-amber-900 mb-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                DISCOVERED
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-3xl sm:text-4xl font-black text-amber-600">
                {stats.discovered_items}
              </span>
              <span className="text-slate-500 font-mono text-sm">/ {stats.total_items}</span>
            </div>
            <span className="text-[11px] text-green-700 font-bold mt-1">ค้นพบแล้ว</span>
          </div>

          <div className="passport-card-inner p-3.5 sm:p-5 flex flex-col items-center justify-center text-center shadow-sm border-2 border-passport-border bg-red-50/50 hover:bg-red-50 transition-all">
            <div className="flex items-center gap-1.5 text-red-900 mb-1">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider">
                REMAINING
              </span>
            </div>
            <span className="font-mono text-3xl sm:text-4xl font-black text-red-600">
              {stats.remaining_items}
            </span>
            <span className="text-[11px] text-slate-600 font-medium mt-1">ยังคงซ่อนอยู่</span>
          </div>
        </div>
      </div>

      {/* Animated Reactor Energy Progress Bar */}
      <div className="relative z-10 mt-5 sm:mt-7">
        <div className="flex justify-between items-center text-xs font-mono font-black text-slate-700 mb-2">
          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
            DIMENSIONAL ENERGY STABILIZER
          </span>
          <span className="text-green-700 font-mono font-black">
            {stats.discovered_items} / {stats.total_items} RECOVERED
          </span>
        </div>

        <div className="h-6 sm:h-8 w-full bg-slate-100 rounded-xl p-1 border-2 border-passport-border relative overflow-hidden shadow-inner">
          <div
            className="h-full rounded-lg energy-bar-fill transition-all duration-1000 ease-out shadow-sm"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />

          {/* Overlay Grid lines for Retro Passport Matrix Look */}
          <div className="absolute inset-0 flex justify-between px-3 sm:px-4 pointer-events-none opacity-40">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-0.5 h-full bg-slate-900/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
