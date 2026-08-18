import React from 'react';
import { DashboardStats } from '@/types';
import { Sparkles, Zap, Star } from 'lucide-react';

interface Props {
  stats: DashboardStats;
  isLedMode?: boolean;
}

export const WorldRestoredMeter: React.FC<Props> = ({ stats, isLedMode = false }) => {
  const percentage = Math.min(100, Math.max(0, stats.world_restored_percentage));
  const isComplete = percentage >= 100;

  return (
    <div
      className={`w-full rounded-2xl sm:rounded-3xl border-2 transition-all duration-700 relative overflow-hidden ${
        isComplete
          ? 'border-green-500 bg-gradient-to-b from-green-50 via-white to-green-50/40 shadow-lg'
          : 'border-passport-border bg-white shadow-passport-frame'
      } ${isLedMode ? 'p-3 sm:p-4 my-0.5' : 'p-4 sm:p-6 lg:p-7'}`}
    >
      {/* 4 Corner Rivets for Passport Arcade Look */}
      <div className="passport-rivet-tl" />
      <div className="passport-rivet-tr" />
      <div className="passport-rivet-bl" />
      <div className="passport-rivet-br" />

      {/* Background Blueprint/Grid Matrix */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3a607310_1px,transparent_1px),linear-gradient(to_bottom,#3a607310_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-60" />

      {/* Top Status Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 relative z-10 mb-3 sm:mb-4 pb-2 border-b-2 border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl passport-badge-blue flex items-center justify-center text-white animate-bounce shadow-md">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-game text-xs sm:text-sm text-slate-900 tracking-wider">
                WORLD STABILITY CORE
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {stats.mission_status === 'RESTORATION COMPLETE'
                ? '⭐ กู้คืนมิติโลก PTECH สำเร็จ 100% สมบูรณ์แบบ!'
                : 'ระดับพลังงานการฟื้นฟูมิติโลก PTECH จากแกนวิทยาศาสตร์'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`px-3.5 py-1.5 rounded-xl font-mono text-xs font-black tracking-wide uppercase border flex items-center gap-1.5 shadow-md ${
            stats.mission_status === 'RESTORATION COMPLETE'
              ? 'passport-badge-green shadow-sm'
              : stats.mission_status === 'PAUSED'
              ? 'passport-badge-yellow text-slate-900'
              : 'passport-badge-red animate-pulse'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{stats.mission_status}</span>
        </div>
      </div>

      {/* Centerpiece: Super Giant Percentage & Expanded Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10 my-1">
        {/* Super Giant Restored Percentage */}
        <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="flex items-baseline gap-2 sm:gap-4 flex-wrap justify-center md:justify-start">
            <span
              className={`font-game text-8xl sm:text-9xl lg:text-[120px] tracking-tight font-black leading-none transition-all ${
                isComplete ? 'text-green-600' : 'text-mario-blue'
              }`}
            >
              {percentage.toFixed(0)}%
            </span>
            <span className="font-game text-xl sm:text-2xl lg:text-3xl text-slate-800 uppercase tracking-widest self-end pb-1">
              RESTORED
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 mt-1 sm:mt-2 font-semibold">
            ฟื้นคืนมิติแล้ว{' '}
            <span className="text-mario-blue font-black text-lg sm:text-xl font-mono px-1">
              {stats.discovered_items}
            </span>{' '}
            จากเป้าหมาย{' '}
            <span className="text-slate-900 font-black text-lg sm:text-xl font-mono px-1">
              {stats.total_items}
            </span>{' '}
            ชิ้นส่วน
          </p>
        </div>

        {/* Significantly Enlarged Item Counter Metric Pods & Big Numbers */}
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          <div className="passport-card-inner p-4 sm:p-6 lg:p-7 flex flex-col items-center justify-center text-center shadow-md border-2 border-passport-border bg-amber-50/80 hover:bg-amber-50 transition-all rounded-2xl">
            <div className="flex items-center gap-1.5 text-amber-900 mb-1">
              <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                DISCOVERED
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="font-mono text-5xl sm:text-6xl lg:text-7xl font-black text-amber-600">
                {stats.discovered_items}
              </span>
              <span className="text-slate-500 font-mono text-base sm:text-lg font-bold">
                / {stats.total_items}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-green-700 font-extrabold mt-1">
              ค้นพบแล้ว
            </span>
          </div>

          <div className="passport-card-inner p-4 sm:p-6 lg:p-7 flex flex-col items-center justify-center text-center shadow-md border-2 border-passport-border bg-red-50/80 hover:bg-red-50 transition-all rounded-2xl">
            <div className="flex items-center gap-1.5 text-red-900 mb-1">
              <Sparkles className="w-4.5 h-4.5 text-red-500" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                REMAINING
              </span>
            </div>
            <span className="font-mono text-5xl sm:text-6xl lg:text-7xl font-black text-red-600 my-1">
              {stats.remaining_items}
            </span>
            <span className="text-xs sm:text-sm text-slate-700 font-bold mt-1">
              ยังคงซ่อนอยู่
            </span>
          </div>
        </div>
      </div>

      {/* Energy Progress Bar */}
      <div className="relative z-10 mt-4 sm:mt-5">
        <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono font-black text-slate-700 mb-1">
          <span className="flex items-center gap-1.5 text-slate-900 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            DIMENSIONAL ENERGY STABILIZER
          </span>
          <span className="text-green-700 font-mono font-black">
            {stats.discovered_items} / {stats.total_items} RECOVERED
          </span>
        </div>

        <div className="h-5 sm:h-6 w-full bg-slate-100 rounded-xl p-0.5 border-2 border-passport-border relative overflow-hidden shadow-inner">
          <div
            className="h-full rounded-lg energy-bar-fill transition-all duration-1000 ease-out shadow-xs"
            style={{ width: `${Math.max(4, percentage)}%` }}
          />

          {/* Grid lines */}
          <div className="absolute inset-0 flex justify-between px-3 sm:px-4 pointer-events-none opacity-30">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-0.5 h-full bg-slate-900/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
