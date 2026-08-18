import React from 'react';
import { ItemType } from '@/types';
import { CheckCircle2 } from 'lucide-react';

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
      className={`rounded-3xl transition-all duration-500 relative overflow-hidden border-2 flex flex-col justify-between h-full backdrop-blur-xl ${
        isLedMode ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'
      } ${
        isComplete
          ? 'bg-emerald-950/40 border-emerald-500 shadow-neon-green'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 hover:scale-[1.02] shadow-xl'
      }`}
    >
      {/* Top Part: Header + Icon + Code */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md border"
              style={{
                backgroundColor: `${itemType.color}25`,
                borderColor: `${itemType.color}80`,
                boxShadow: `0 4px 12px ${itemType.color}30`,
              }}
            >
              {itemType.icon}
            </div>

            <div className="min-w-0 flex-1">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-slate-700">
                {itemType.code}
              </span>
              <h3 className="font-game text-xs sm:text-sm text-white tracking-wide leading-tight mt-1 truncate">
                {itemType.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium truncate">
                {itemType.name_en}
              </p>
            </div>
          </div>

          {isComplete && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 text-[10px] font-bold shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>DONE</span>
            </span>
          )}
        </div>

        {/* Lore Description */}
        {itemType.description && (
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-medium pt-1">
            {itemType.description}
          </p>
        )}
      </div>

      {/* Bottom Part: Counter & Progress */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 relative z-10 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono text-2xl sm:text-3xl font-extrabold"
              style={{ color: itemType.color }}
            >
              {discovered}
            </span>
            <span className="font-mono text-sm text-slate-500 font-bold">
              / {total}
            </span>
            <span className="text-[10px] text-slate-400 font-bold ml-1">ITEMS</span>
          </div>

          <span className="font-mono text-xs font-bold text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-700">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(discovered > 0 ? 8 : 0, percentage)}%`,
              backgroundColor: itemType.color,
              boxShadow: `0 0 8px ${itemType.color}`,
            }}
          />
        </div>

        {/* Discovered Items Pips */}
        <div className="flex items-center gap-1 pt-1">
          {[...Array(total)].map((_, idx) => (
            <div
              key={idx}
              className={`h-2 flex-1 rounded-full transition-all ${
                idx < discovered
                  ? 'opacity-100 shadow-sm'
                  : 'bg-slate-800 opacity-40'
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
