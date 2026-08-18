import React from 'react';
import { ItemType } from '@/types';
import { CheckCircle2, User, Clock, Award } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface Props {
  itemType: ItemType;
  isLedMode?: boolean;
}

export const ItemTypeCard: React.FC<Props> = ({ itemType, isLedMode = false }) => {
  const total = itemType.total_count || 5;
  const discovered = itemType.discovered_count || 0;
  const percentage = total === 0 ? 0 : Math.round((discovered / total) * 100);
  const isComplete = discovered >= total && total > 0;
  const discoveriesList = itemType.discoveries_list || [];

  return (
    <div
      className={`rounded-2xl transition-all duration-500 relative overflow-hidden border-2 flex flex-col justify-between h-[520px] ${
        isLedMode ? 'p-3' : 'p-4 sm:p-5'
      } ${
        isComplete
          ? 'bg-gradient-to-b from-green-50 via-white to-green-50/30 border-green-500 shadow-md'
          : 'bg-white border-passport-border hover:border-slate-500 hover:scale-[1.01] shadow-passport-frame'
      }`}
    >
      {/* Corner Rivets */}
      <div className="passport-rivet-tl !top-2 !left-2" />
      <div className="passport-rivet-tr !top-2 !right-2" />

      {/* Top Section: Header & Progress */}
      <div className="relative z-10 space-y-2.5">
        {/* Row 1: Icon & Name + Status Badge (No code badge) */}
        <div className="flex items-start justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl shadow-xs border shrink-0"
              style={{
                backgroundColor: `${itemType.color}18`,
                borderColor: `${itemType.color}80`,
                boxShadow: `0 2px 8px ${itemType.color}25`,
              }}
            >
              {itemType.icon}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-game text-xs sm:text-sm text-slate-900 tracking-tight leading-tight truncate">
                {itemType.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {itemType.name_en}
              </p>
            </div>
          </div>

          {isComplete && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full passport-badge-green text-[10px] font-black border shadow-xs shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>DONE</span>
            </span>
          )}
        </div>

        {/* Metric Fraction e.g. 4 / 5 ITEMS RECOVERED 80% */}
        <div className="flex items-baseline justify-between pt-1">
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono text-2xl sm:text-3xl font-black"
              style={{ color: itemType.color }}
            >
              {discovered}
            </span>
            <span className="font-mono text-xs sm:text-sm text-slate-400 font-bold">
              / {total}
            </span>
            <span className="text-[10px] text-slate-500 font-black ml-0.5">ITEMS RECOVERED</span>
          </div>

          <span className="font-mono text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-300 shadow-inner">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(discovered > 0 ? 8 : 0, percentage)}%`,
              backgroundColor: itemType.color,
              boxShadow: `0 0 6px ${itemType.color}`,
            }}
          />
        </div>

        {/* Discovered Items Pips */}
        <div className="flex items-center gap-1 pt-0.5">
          {[...Array(total)].map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-sm transition-all border ${
                idx < discovered
                  ? 'opacity-100 shadow-xs border-slate-900/20'
                  : 'bg-slate-200 border-slate-300 opacity-60'
              }`}
              style={{
                backgroundColor: idx < discovered ? itemType.color : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Discovered Hunters Section (ALWAYS Fixed Height for Exactly 5 Slots) */}
      <div className="mt-3 pt-2.5 border-t-2 border-slate-200/80 relative z-10 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1 text-slate-900 font-black">
            <User className="w-3.5 h-3.5 text-mario-blue" />
            <span>DISCOVERY HUNTERS ({discoveriesList.length}/5)</span>
          </span>
          {discoveriesList.length > 0 && (
            <span className="text-emerald-700 font-bold">LIVE SCANS</span>
          )}
        </div>

        {/* Exactly 5 Slots Rendered for Consistent Uniform Card Height */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
          {[...Array(5)].map((_, slotIdx) => {
            const disc = discoveriesList[slotIdx];

            if (disc) {
              return (
                <div
                  key={disc.discovery_id || slotIdx}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs hover:bg-amber-50/60 transition-colors shadow-2xs h-[42px]"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono font-black text-[10px] px-1.5 py-0.3 rounded bg-slate-900 text-amber-300 border border-slate-700 shrink-0">
                      {disc.item_code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 truncate block leading-tight">
                        {disc.student_display_name}
                      </span>
                      {disc.class_name && (
                        <span className="text-[10px] text-slate-500 font-medium truncate block">
                          {disc.class_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="font-mono text-[10px] text-slate-600 font-bold flex items-center gap-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTimeOnly(disc.discovered_at)}
                    </span>
                    {disc.reward_claimed ? (
                      <span className="text-[9px] text-green-700 font-black flex items-center gap-0.5 mt-0.5">
                        <Award className="w-2.5 h-2.5 text-green-600" /> รับแล้ว
                      </span>
                    ) : (
                      <span className="text-[9px] text-amber-700 font-bold mt-0.5">รอรับรางวัล</span>
                    )}
                  </div>
                </div>
              );
            }

            // Empty Slot Placeholder
            return (
              <div
                key={`empty_${slotIdx}`}
                className="p-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/40 flex items-center justify-center text-[10px] font-mono text-slate-400 h-[42px]"
              >
                <span>SLOT {slotIdx + 1}: ยังไม่ถูกค้นพบ</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
