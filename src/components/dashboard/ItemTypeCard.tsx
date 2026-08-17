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
      className={`rounded-2xl p-4 sm:p-5 transition-all duration-500 relative overflow-hidden backdrop-blur-md border-2 ${
        isComplete
          ? 'bg-gradient-to-b from-mario-green/20 via-slate-900/90 to-slate-950 border-mario-green shadow-neon-green/30'
          : 'bg-slate-900/90 border-passport-border/70 hover:border-passport-lightBorder hover:scale-[1.02] shadow-passport-frame'
      }`}
    >
      {/* Corner Rivet */}
      <div className="passport-rivet-tl !top-2 !left-2" />
      <div className="passport-rivet-tr !top-2 !right-2" />

      {/* Accent glow corner indicator */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-25"
        style={{ backgroundColor: itemType.color }}
      />

      {/* Header: Icon, Name & Code */}
      <div className="flex items-start justify-between relative z-10 mb-3 pt-1">
        <div className="flex items-center gap-2.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shadow-md border animate-pixel-float shrink-0"
            style={{ 
              backgroundColor: `${itemType.color}20`, 
              borderColor: `${itemType.color}70`,
              boxShadow: `0 0 12px ${itemType.color}30`
            }}
          >
            {itemType.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-800 text-mario-yellow border border-slate-700">
                {itemType.code}
              </span>
            </div>
            <h3 className="font-game text-xs text-white tracking-wide truncate mt-0.5">
              {itemType.name}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium truncate">
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
        <p className="text-[11px] sm:text-xs text-slate-300/80 mb-3 line-clamp-2 leading-relaxed font-normal">
          {itemType.description}
        </p>
      )}

      {/* Metric Fraction e.g. 4 / 5 */}
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl sm:text-3xl font-black" style={{ color: itemType.color }}>
            {discovered}
          </span>
          <span className="font-mono text-sm text-slate-500 font-bold">
            / {total}
          </span>
          <span className="text-[10px] text-slate-400 ml-1 font-bold">ITEMS</span>
        </div>

        <span className="font-mono text-xs font-extrabold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-passport-border/70 shadow-inner">
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
      <div className="flex items-center gap-1 mt-2.5">
        {[...Array(total)].map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-sm transition-all border ${
              idx < discovered
                ? 'opacity-100 shadow-sm border-white/30'
                : 'bg-slate-800/60 border-slate-700/50 opacity-40'
            }`}
            style={{
              backgroundColor: idx < discovered ? itemType.color : undefined,
              boxShadow: idx < discovered ? `0 0 6px ${itemType.color}80` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
};
