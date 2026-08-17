import React, { useState, useEffect } from 'react';
import { Discovery } from '@/types';
import { Sparkles, Zap, Trophy, X, ChevronRight, Layers, Clock } from 'lucide-react';
import { maskStudentName } from '@/lib/privacy';
import { soundManager } from '@/lib/sound';

interface Props {
  queue: Discovery[];
  onDismissCurrent: () => void;
  onClearAll: () => void;
}

export const DiscoveryAlertModal: React.FC<Props> = ({ queue, onDismissCurrent, onClearAll }) => {
  const [progress, setProgress] = useState(100);
  const displayDuration = 6000; // 6 seconds per discovery in queue

  const activeDiscovery = queue[0] || null;

  useEffect(() => {
    if (!activeDiscovery) return;

    setProgress(100);
    const intervalTime = 50;
    const step = (intervalTime / displayDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismissCurrent();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeDiscovery?.id, onDismissCurrent]);

  if (!activeDiscovery) return null;

  const item = activeDiscovery.item;
  const itemType = item?.item_type;
  const studentName = maskStudentName(
    activeDiscovery.student?.full_name || activeDiscovery.manual_student_name,
    activeDiscovery.student?.first_name,
    activeDiscovery.student?.last_name,
    'masked'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      
      {/* Particle & Glow Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mario-red/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-mario-yellow/30 rounded-full blur-[80px]" />
      </div>

      {/* Main Alert Card */}
      <div className="relative z-10 max-w-xl w-full bg-gradient-to-b from-slate-900 via-mario-darkNavy to-slate-950 border-4 border-mario-yellow rounded-3xl p-6 sm:p-10 shadow-[0_0_80px_rgba(255,215,0,0.6)] text-center animate-scale-pop">
        
        {/* Top Queue / Stack Badge Indicator */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {queue.length > 1 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950 border border-purple-500 text-purple-300 text-xs font-mono font-bold animate-pulse">
              <Layers className="w-3.5 h-3.5" />
              <span>คิวแจ้งเตือน (1 จาก {queue.length} รายการ)</span>
            </div>
          ) : (
            <div />
          )}

          {/* Dismiss buttons */}
          <div className="flex items-center gap-1.5">
            {queue.length > 1 && (
              <button
                type="button"
                onClick={() => { soundManager.playClick(); onDismissCurrent(); }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1"
                title="ข้ามไปรายการถัดไป"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => { soundManager.playClick(); onClearAll(); }}
              className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="ปิดการแจ้งเตือนทั้งหมด"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Header Banner */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-mario-red text-white font-game text-xs sm:text-sm tracking-wider shadow-neon-red mb-4 animate-bounce">
          <Zap className="w-4 h-4 text-mario-yellow" />
          <span>ITEM DISCOVERED!</span>
        </div>

        {/* Big Icon Floating */}
        <div className="relative my-3 flex justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-mario-yellow/30 to-mario-orange/20 border-2 border-mario-yellow flex items-center justify-center text-4xl sm:text-5xl shadow-neon-yellow animate-pixel-float">
            {itemType?.icon || '⭐'}
          </div>
        </div>

        {/* Item Name & Code */}
        <div className="my-3">
          <span className="font-mono text-sm sm:text-base font-bold px-3 py-1 rounded bg-slate-800 text-mario-yellow border border-slate-700">
            {item?.item_code || 'SECRET-ITEM'}
          </span>
          <h2 className="font-game text-base sm:text-xl text-white mt-2.5 drop-shadow-md">
            {item?.name || 'SECRET CORE ITEM'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 font-medium">
            {itemType?.name_en || 'Core Restoration Element'}
          </p>
        </div>

        {/* Discoverer Info */}
        <div className="my-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
            DISCOVERED BY (ผู้ค้นพบ)
          </span>
          <p className="text-base sm:text-lg font-bold text-mario-yellow">
            {studentName}
          </p>
          {activeDiscovery.student?.class_name && (
            <span className="text-xs text-slate-400 mt-0.5">
              {activeDiscovery.student.class_name} • {activeDiscovery.student.department || 'PTECH'}
            </span>
          )}
        </div>

        {/* World Stability Increase Footer */}
        <div className="flex items-center justify-center gap-2 font-mono text-xs sm:text-sm font-extrabold text-mario-green bg-mario-green/10 border border-mario-green/40 py-2 px-3 rounded-xl mb-3">
          <Sparkles className="w-4 h-4 text-mario-green animate-spin" />
          <span>WORLD STABILITY +4% RESTORED</span>
        </div>

        {/* Auto-advance Countdown Timer Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-mario-yellow h-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
