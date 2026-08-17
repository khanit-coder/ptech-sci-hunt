import React, { useState, useEffect, useRef } from 'react';
import { Type, ZoomIn, ZoomOut, RotateCcw, Check, ChevronDown } from 'lucide-react';
import { soundManager } from '@/lib/sound';

export const FONT_SCALE_KEY = 'ptech_dashboard_font_scale';

export const FONT_PRESETS = [
  { label: 'กะทัดรัด (90%)', scale: 0.90, tag: '90%' },
  { label: 'ปกติ (100%)', scale: 1.0, tag: '100%' },
  { label: 'ใหญ่ (110%)', scale: 1.10, tag: '110%' },
  { label: 'ใหญ่พิเศษ (120%)', scale: 1.20, tag: '120%' },
  { label: 'ขยายชัดเจน (130%)', scale: 1.30, tag: '130%' },
];

export const getSavedFontScale = (): number => {
  try {
    const saved = localStorage.getItem(FONT_SCALE_KEY);
    if (saved) {
      const val = parseFloat(saved);
      if (!isNaN(val) && val >= 0.75 && val <= 1.5) {
        return val;
      }
    }
  } catch {
    /* ignore */
  }
  return 1.0;
};

export const applyFontScale = (scale: number) => {
  document.documentElement.style.setProperty('--dashboard-font-scale', scale.toString());
  
  // Set CSS property and remove zoom so layout does not blow up
  const elements = document.querySelectorAll('.dashboard-scalable');
  elements.forEach((el) => {
    (el as HTMLElement).style.setProperty('--dashboard-font-scale', scale.toString());
    (el as HTMLElement).style.removeProperty('zoom');
  });

  try {
    localStorage.setItem(FONT_SCALE_KEY, scale.toString());
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('ptech_font_scale_changed', { detail: { scale } }));
};

interface Props {
  compact?: boolean;
  enableHotkeys?: boolean;
}

export const FontSizeController: React.FC<Props> = ({ compact = false, enableHotkeys = false }) => {
  const [scale, setScale] = useState<number>(getSavedFontScale);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Apply on mount and sync
  useEffect(() => {
    applyFontScale(scale);

    const handleStorageChange = (e: CustomEvent<{ scale: number }>) => {
      if (e.detail?.scale && e.detail.scale !== scale) {
        setScale(e.detail.scale);
      }
    };

    window.addEventListener('ptech_font_scale_changed' as any, handleStorageChange);

    // Close dropdown when clicked outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('ptech_font_scale_changed' as any, handleStorageChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Optional keyboard shortcuts
  useEffect(() => {
    if (!enableHotkeys) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '=' || e.key === '+' || e.key === ']') {
        e.preventDefault();
        changeScale(Math.min(1.35, +(scale + 0.1).toFixed(2)));
      } else if (e.key === '-' || e.key === '_' || e.key === '[') {
        e.preventDefault();
        changeScale(Math.max(0.85, +(scale - 0.1).toFixed(2)));
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        changeScale(1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableHotkeys, scale]);

  const changeScale = (newScale: number) => {
    soundManager.playClick();
    const clean = Math.min(1.35, Math.max(0.85, +(newScale).toFixed(2)));
    setScale(clean);
    applyFontScale(clean);
  };

  const currentPercent = Math.round(scale * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-1 bg-white/95 border-2 border-passport-border rounded-xl p-1 shadow-md backdrop-blur-md">
        <button
          type="button"
          onClick={() => changeScale(scale - 0.1)}
          disabled={scale <= 0.85}
          title="ลดขนาดตัวอักษร (A- / Hotkey: -)"
          className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all font-mono font-bold text-xs flex items-center gap-0.5"
        >
          <ZoomOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">A-</span>
        </button>

        <span
          onClick={() => changeScale(1.0)}
          title="คลิกเพื่อรีเซ็ตขนาดฟอนต์ 100%"
          className="px-2 py-0.5 text-xs font-mono font-black text-slate-900 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200 select-none border border-slate-300"
        >
          {currentPercent}%
        </span>

        <button
          type="button"
          onClick={() => changeScale(scale + 0.1)}
          disabled={scale >= 1.35}
          title="เพิ่มขนาดตัวอักษร (A+ / Hotkey: +)"
          className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all font-mono font-bold text-xs flex items-center gap-0.5"
        >
          <ZoomIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">A+</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center gap-1.5 bg-white/95 border-2 border-passport-border rounded-xl p-1 shadow-md backdrop-blur-md">
        {/* Quick Stepper: Decrease */}
        <button
          type="button"
          onClick={() => changeScale(scale - 0.1)}
          disabled={scale <= 0.85}
          title="ลดขนาดตัวอักษร (A-)"
          className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Dropdown Toggle Button */}
        <button
          type="button"
          onClick={() => {
            soundManager.playClick();
            setIsOpen(!isOpen);
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 flex items-center gap-1.5 border border-slate-300 transition-all font-bold"
        >
          <Type className="w-3.5 h-3.5 text-mario-blue" />
          <span className="text-xs font-mono font-black text-slate-900">{currentPercent}%</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Stepper: Increase */}
        <button
          type="button"
          onClick={() => changeScale(scale + 0.1)}
          disabled={scale >= 1.35}
          title="เพิ่มขนาดตัวอักษร (A+)"
          className="p-1.5 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-30 transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Reset button if not 100% */}
        {scale !== 1.0 && (
          <button
            type="button"
            onClick={() => changeScale(1.0)}
            title="รีเซ็ตเป็นขนาดเริ่มต้น 100%"
            className="p-1.5 rounded-lg text-mario-orange hover:text-mario-red hover:bg-slate-100 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Preset Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border-2 border-passport-border shadow-2xl z-50 p-2 animate-scale-pop backdrop-blur-xl">
          <div className="px-3 py-1.5 border-b border-slate-200 flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-mario-blue" />
              ขนาดตัวอักษร Dashboard
            </span>
            <span className="font-mono text-xs font-black text-mario-blue">{currentPercent}%</span>
          </div>

          <div className="space-y-1">
            {FONT_PRESETS.map((preset) => {
              const isSelected = Math.abs(preset.scale - scale) < 0.04;
              return (
                <button
                  key={preset.scale}
                  type="button"
                  onClick={() => {
                    changeScale(preset.scale);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                    isSelected
                      ? 'passport-badge-blue font-black shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{preset.label}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>

          {/* Stepper Footer */}
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => changeScale(scale - 0.05)}
              className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-mono font-bold"
            >
              -5%
            </button>
            <button
              type="button"
              onClick={() => {
                changeScale(1.0);
                setIsOpen(false);
              }}
              className="px-2 py-1 rounded-lg bg-slate-100 text-mario-orange hover:bg-slate-200 text-[11px] font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>รีเซ็ต</span>
            </button>
            <button
              type="button"
              onClick={() => changeScale(scale + 0.05)}
              className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-mono font-bold"
            >
              +5%
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
