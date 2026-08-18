import React from 'react';
import { ItemType } from '@/types';
import { Sparkles, CheckCircle2, Star } from 'lucide-react';

interface Props {
  itemType: ItemType;
  isLedMode?: boolean;
}

export const ItemTypeCard: React.FC<Props> = ({ itemType, isLedMode = false }) => {
  const total = itemType.total_count || 5;
  const discovered = itemType.discovered_count || 0;
  const percentage = total === 0 ? 0 : Math.round((discovered / total) * 100);
  const isComplete = discovered >= total && total > 0;

  return (
    <div
      className={`rounded-2xl transition-all duration-500 relative overflow-hidden border-2 flex flex-col justify-between h-full ${
        isLedMode ? 'p-2.5 sm:p-3' : 'p-3.5 sm:p-4 lg:p-4.5'
      } ${
        isComplete
          ? 'bg-gradient-to-b from-green-50 to-white border-green-500 shadow-md'
          : 'bg-white border-passport-border hover:border-slate-600 hover:scale-[1.02] shadow-passport-frame'
      }`}
    >
      {/* Corner Rivets */}
      <div className="passport-rivet-tl !top-2 !left-2" />
      <div className="passport-rivet-tr !top-2 !right-2" />

      {/* Top Part: Header + Lore */}
      <div className="relative z-10">
        {/* Header: Icon, Name & Code */}
        <div className="flex items-start justify-between gap-2 mb-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm border animate-pixel-float shrink-0"
              style={{ 
                backgroundColor: `${itemType.color}18`, 
                borderColor: `${itemType.color}80`,
                boxShadow: `0 2px 8px ${itemType.color}30`
              }}
            >
              {itemType.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="font-mono text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 border border-slate-700">
                  {itemType.code}
                </span>
              </div>
              <h3 className="font-game text-[11px] sm:text-xs text-slate-900 tracking-tight leading-snug mt-0.5 break-words">
                {itemType.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                {itemType.name_en}
              </p>
            </div>
          </div>

          {isComplete && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full passport-badge-green text-[10px] font-black border shadow-sm shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">DONE</span>
            </span>
          )}
        </div>

        {/* Lore Description */}
        {itemType.description && (
          <p className="text-[11px] text-slate-600 my-2 line-clamp-2 leading-relaxed font-medium">
            {itemType.description}
          </p>
        )}
      </div>

      {/* Bottom Part: Metrics & Progress Bar */}
      <div className="mt-auto pt-2 border-t border-slate-100 relative z-10">
        {/* Metric Fraction e.g. 4 / 5 */}
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl sm:text-3xl font-black" style={{ color: itemType.color }}>
              {discovered}
            </span>
            <span className="font-mono text-sm text-slate-400 font-bold">
              / {total}
            </span>
            <span className="text-[10px] text-slate-500 ml-1 font-black">ITEMS</span>
          </div>

          <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
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

        {/* Discovered Items Pip Grid */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(total)].map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 flex-1 rounded-sm transition-all border ${
                idx < discovered
                  ? 'opacity-100 shadow-sm border-slate-900/30'
                  : 'bg-slate-200 border-slate-300 opacity-60'
              }`}
              style={{
                backgroundColor: idx < discovered ? itemType.color : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
