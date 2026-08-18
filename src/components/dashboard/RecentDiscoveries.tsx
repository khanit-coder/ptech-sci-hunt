import React from 'react';
import { RecentDiscoveryItem } from '@/types';
import { Radio, User, Clock, Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface Props {
  discoveries: RecentDiscoveryItem[];
  isLedMode?: boolean;
}

export const RecentDiscoveries: React.FC<Props> = ({ discoveries, isLedMode = false }) => {
  const displayedDiscoveries = isLedMode ? discoveries.slice(0, 4) : discoveries;

  return (
    <div
      className={`w-full rounded-3xl border-2 border-slate-800 bg-slate-900/90 shadow-2xl relative backdrop-blur-xl ${
        isLedMode ? 'p-3.5 sm:p-4' : 'p-5 sm:p-6'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
          <div className="flex items-center gap-2">
            <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              RECENT DISCOVERY RADAR
            </h3>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
              LIVE RADAR
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400 font-bold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
          ล่าสุด {discoveries.length} รายการ
        </span>
      </div>

      {/* Discovery Feed */}
      {discoveries.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 mb-1 shadow-inner">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-300">กำลังสแกนค้นหาสัญญาณมิติ...</p>
          <span className="text-xs text-slate-500">
            ยังไม่มีรายการค้นพบในขณะนี้ ชิ้นส่วน 25 ชิ้นกำลังรอ Survivor อยู่!
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedDiscoveries.map((disc, index) => (
            <div
              key={disc.discovery_id || index}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                index === 0
                  ? 'bg-gradient-to-r from-red-950/40 via-slate-950 to-slate-950 border-red-500/80 shadow-neon-red animate-scale-pop'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
              }`}
            >
              {/* Item Info & Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md border"
                  style={{
                    backgroundColor: `${disc.type_color}25`,
                    borderColor: `${disc.type_color}80`,
                    boxShadow: `0 2px 8px ${disc.type_color}30`,
                  }}
                >
                  {disc.type_icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-700">
                      {disc.item_code}
                    </span>
                    <span className="text-xs font-extrabold text-white truncate">
                      {disc.item_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1 text-slate-200 font-bold">
                      <User className="w-3.5 h-3.5 text-mario-yellow" />
                      <span className="truncate">{disc.student_display_name}</span>
                    </div>

                    {disc.class_name && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate font-medium">
                          {disc.class_name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp & Status */}
              <div className="text-right shrink-0 flex flex-col items-end pl-2">
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTimeOnly(disc.discovered_at)}</span>
                </div>

                {disc.reward_claimed ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-1 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> รับแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 font-bold mt-1 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700">
                    รอรับรางวัล
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
