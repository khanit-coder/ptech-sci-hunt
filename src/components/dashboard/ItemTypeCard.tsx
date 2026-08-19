import React from 'react';
import { ItemType } from '@/types';
import { CheckCircle2, User, Clock } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';

interface Props {
  itemType: ItemType;
  isLedMode?: boolean;
}

export const ItemTypeCard: React.FC<Props> = ({ itemType, isLedMode = false }) => {
  const total = itemType.total_count || 2;
  const discovered = itemType.discovered_count || 0;
  const percentage = total === 0 ? 0 : Math.round((discovered / total) * 100);
  const isComplete = discovered >= total && total > 0;
  const discoveriesList = itemType.discoveries_list || [];
  const slotCount = Math.max(total, discoveriesList.length);

  return (
    <div
      className={`rounded-2xl transition-all duration-500 relative overflow-hidden border-2 flex flex-col justify-between h-[440px] sm:h-[480px] ${
        isLedMode ? 'p-3' : 'p-3.5 sm:p-4'
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
      <div className="relative z-10 space-y-2">
        {/* Row 1: Icon & Name + Status Badge (No code badge) */}
        <div className="flex items-start justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-xs border shrink-0"
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
        <div className="flex items-baseline justify-between pt-0.5">
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
            <span className="text-[10px] text-slate-500 font-black ml-0.5">ITEMS</span>
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

      {/* Discovered Hunters Section (Fills remaining vertical height) */}
      <div className="mt-2.5 pt-2 border-t-2 border-slate-200/80 relative z-10 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-700 mb-1">
          <span className="flex items-center gap-1 text-slate-900 font-black">
            <User className="w-3.5 h-3.5 text-mario-blue" />
            <span>DISCOVERY HUNTERS ({discoveriesList.length}/{total})</span>
          </span>
          {discoveriesList.length > 0 && (
            <span className="text-emerald-700 font-bold">LIVE</span>
          )}
        </div>

        {/* Slots Stretched to Fill Card Height */}
        <div className="flex-1 flex flex-col justify-between gap-1.5">
          {[...Array(slotCount)].map((_, slotIdx) => {
            const disc = discoveriesList[slotIdx];

            if (disc) {
              return (
                <div
                  key={disc.discovery_id || slotIdx}
                  className="flex-1 p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center gap-1 text-xs hover:bg-amber-50/60 transition-colors shadow-2xs min-h-[52px] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="w-5.5 h-5.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        <User className="w-3.5 h-3.5 text-mario-blue" />
                      </div>
                      <span className="font-black text-slate-950 text-sm sm:text-base truncate block leading-snug tracking-tight">
                        {disc.student_display_name}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] sm:text-[10px] text-slate-500 font-bold flex items-center gap-0.5 shrink-0 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {formatTimeOnly(disc.discovered_at)}
                    </span>
                  </div>

                  {disc.class_name && (
                    <div className="text-[10px] sm:text-[11px] text-slate-500 font-bold truncate block pl-7">
                      {disc.class_name}
                    </div>
                  )}
                </div>
              );
            }

            // Empty Slot Placeholder Stretched
            return (
              <div
                key={`empty_${slotIdx}`}
                className="flex-1 p-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 flex items-center justify-center text-[10px] font-mono text-slate-400 min-h-[50px]"
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
