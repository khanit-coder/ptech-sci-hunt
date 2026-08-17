import React from 'react';
import { RecentDiscoveryItem } from '@/types';
import { Radio, User, Clock, Award, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface Props {
  discoveries: RecentDiscoveryItem[];
  isLedMode?: boolean;
}

export const RecentDiscoveries: React.FC<Props> = ({ discoveries, isLedMode = false }) => {
  const displayedDiscoveries = isLedMode ? discoveries.slice(0, 4) : discoveries;

  return (
    <div className={`w-full rounded-2xl sm:rounded-3xl border-2 border-passport-border bg-white shadow-passport-frame relative ${
      isLedMode ? 'p-2.5 sm:p-3.5' : 'p-4 sm:p-6'
    }`}>
      
      {/* Corner Rivet */}
      <div className="passport-rivet-tl !top-2.5 !left-2.5" />
      <div className="passport-rivet-tr !top-2.5 !right-2.5" />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b-2 border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-mario-red animate-ping" />
          <div className="flex items-center gap-2">
            <h3 className="font-game text-xs sm:text-sm text-slate-900 tracking-wider">
              RECENT DISCOVERY RADAR
            </h3>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded passport-badge-blue text-[10px] font-mono font-bold">
              LIVE RADAR
            </span>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
          ล่าสุด {discoveries.length} รายการ
        </span>
      </div>

      {/* Discovery Items Feed */}
      {discoveries.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl passport-badge-blue flex items-center justify-center text-white mb-1 shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-bold text-slate-800">กำลังสแกนค้นหาสัญญาณมิติ...</p>
          <span className="text-xs text-slate-500">ยังไม่มีรายการค้นพบในขณะนี้ ชิ้นส่วน 25 ชิ้นกำลังรอ Survivor อยู่!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
          {displayedDiscoveries.map((disc, index) => (
            <div
              key={disc.discovery_id || index}
              className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 ${
                index === 0
                  ? 'bg-red-50/70 border-mario-red shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-400 hover:bg-white'
              }`}
            >
              {/* Item Info & Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm border"
                  style={{ 
                    backgroundColor: `${disc.type_color}18`,
                    borderColor: `${disc.type_color}80`,
                    boxShadow: `0 2px 6px ${disc.type_color}25`
                  }}
                >
                  {disc.type_icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-mono font-black px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                      {disc.item_code}
                    </span>
                    <span className="text-xs font-black text-slate-900 truncate">
                      {disc.item_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                    <div className="flex items-center gap-1 text-slate-800 font-bold">
                      <User className="w-3.5 h-3.5 text-mario-blue" />
                      <span className="truncate">{disc.student_display_name}</span>
                    </div>

                    {disc.class_name && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 truncate font-medium">{disc.class_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp & Reward Status */}
              <div className="text-right shrink-0 flex flex-col items-end pl-2">
                <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{formatTimeOnly(disc.discovered_at)}</span>
                </div>

                {disc.reward_claimed ? (
                  <span className="text-[10px] text-green-800 font-black flex items-center gap-1 mt-1 bg-green-100 px-2 py-0.5 rounded border border-green-300">
                    <Award className="w-3 h-3 text-green-700" /> รับรางวัลแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-800 font-bold mt-1 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
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
