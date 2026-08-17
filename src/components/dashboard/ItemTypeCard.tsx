import React from 'react';
import { ItemType } from '@/types';
import { Sparkles, CheckCircle2 } from 'lucide-react';

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
      className={`rounded-2xl p-5 sm:p-6 transition-all duration-500 relative overflow-hidden backdrop-blur-md border ${
        isComplete
          ? 'bg-gradient-to-b from-mario-green/15 to-slate-900/90 border-mario-green shadow-neon-green/40'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:scale-[1.02] shadow-lg'
      }`}
    >
      {/* Accent glow corner indicator */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-20"
        style={{ backgroundColor: itemType.color }}
      />

      {/* Header: Icon, Name & Code */}
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border border-white/20 animate-pixel-float"
            style={{ backgroundColor: `${itemType.color}25`, borderColor: `${itemType.color}60` }}
          >
            {itemType.icon}
          </div>
          <div>
            <h3 className="font-game text-xs sm:text-sm text-white tracking-wide">
              {itemType.name}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {itemType.name_en}
            </p>
          </div>
        </div>

        {isComplete && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-mario-green/20 text-mario-green text-[11px] font-bold border border-mario-green/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>COMPLETE</span>
          </span>
        )}
      </div>

      {/* Lore Description */}
      {itemType.description && (
        <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {itemType.description}
        </p>
      )}

      {/* Metric Fraction e.g. 4 / 5 */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-3xl font-extrabold" style={{ color: itemType.color }}>
            {discovered}
          </span>
          <span className="font-mono text-base text-slate-500 font-bold">
            / {total}
          </span>
          <span className="text-xs text-slate-400 ml-1 font-semibold">ITEMS</span>
        </div>

        <span className="font-mono text-sm font-bold text-slate-300">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(discovered > 0 ? 8 : 0, percentage)}%`,
            backgroundColor: itemType.color,
            boxShadow: `0 0 10px ${itemType.color}`,
          }}
        />
      </div>

      {/* Discovered Items Pip Grid */}
      <div className="flex items-center gap-1.5 mt-3">
        {[...Array(total)].map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-sm transition-all ${
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
  );
};
