import React from 'react';
import { RecentDiscoveryItem } from '@/types';
import { Radio, User, Clock, Award, ShieldCheck } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface Props {
  discoveries: RecentDiscoveryItem[];
  isLedMode?: boolean;
}

export const RecentDiscoveries: React.FC<Props> = ({ discoveries, isLedMode = false }) => {
  return (
    <div className="w-full rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-md shadow-xl">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-mario-red animate-ping" />
          <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
            RECENT DISCOVERY RADAR
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400 font-medium">
          LIVE FEED (ล่าสุด {discoveries.length} รายการ)
        </span>
      </div>

      {/* Discovery Items Feed */}
      {discoveries.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-medium flex flex-col items-center gap-2">
          <Radio className="w-8 h-8 text-slate-600 animate-pulse" />
          <p className="text-sm">กำลังสแกนค้นหาสัญญาณ... ยังไม่มีรายการค้นพบในขณะนี้</p>
          <span className="text-xs text-slate-600">ชิ้นส่วน PTECH-Sci Core 25 ชิ้นกำลังรอคุณอยู่</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {discoveries.map((disc, index) => (
            <div
              key={disc.discovery_id || index}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                index === 0
                  ? 'bg-gradient-to-r from-mario-red/20 via-slate-900 to-slate-900 border-mario-red/60 shadow-neon-red/30'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Item Info & Icon */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow border border-white/10"
                  style={{ backgroundColor: `${disc.type_color}25` }}
                >
                  {disc.type_icon}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-mario-yellow border border-slate-700">
                      {disc.item_code}
                    </span>
                    <span className="text-xs font-bold text-white truncate">
                      {disc.item_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <div className="flex items-center gap-1 text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-mario-orange" />
                      <span className="truncate">{disc.student_display_name}</span>
                    </div>

                    {disc.class_name && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 truncate">{disc.class_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Timestamp & Reward Status */}
              <div className="text-right shrink-0 flex flex-col items-end">
                <div className="flex items-center gap-1 text-xs font-mono font-semibold text-mario-yellow">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimeOnly(disc.discovered_at)}</span>
                </div>

                {disc.reward_claimed ? (
                  <span className="text-[10px] text-mario-green font-bold flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3" /> รับรางวัลแล้ว
                  </span>
                ) : (
                  <span className="text-[10px] text-yellow-500 font-medium mt-1">
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
