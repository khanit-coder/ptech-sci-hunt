import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface Props {
  restorationPercentage: number;
  enabled?: boolean;
  compact?: boolean;
}

export const GlitchOverlay: React.FC<Props> = ({
  restorationPercentage,
  enabled = true,
  compact = false,
}) => {
  if (!enabled) return null;

  // Glitch intensity drops from 1 (at 0% restored) down to 0 (at 100% restored)
  const intensity = Math.max(0, Math.min(1, (100 - restorationPercentage) / 100));

  // If 100% restored, glitch is completely gone!
  if (intensity <= 0) return null;

  const scanlineOpacity = intensity * 0.35;
  const chromaticOffset = intensity * 3.5; // in px
  const glitchFlickerOpacity = intensity * 0.15;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden select-none">
      
      {/* 1. CRT Scanlines Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-700 ease-out bg-scanlines"
        style={{
          opacity: scanlineOpacity,
          backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* 2. RGB Shift Noise Flash (Intermittent Glitch Bars) */}
      <div
        className="absolute inset-0 transition-opacity duration-500 mix-blend-screen animate-glitch-bar"
        style={{
          opacity: glitchFlickerOpacity,
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(255, 0, 80, ${intensity * 0.25}) 100%)`,
        }}
      />

      {/* 3. RGB Chromatic Edge Distortion Overlay */}
      <div
        className="absolute inset-0 border-2 border-red-500/20 mix-blend-color-dodge transition-all duration-700"
        style={{
          opacity: intensity * 0.6,
          boxShadow: `inset 0 0 ${intensity * 40}px rgba(255,0,80,${intensity * 0.3}), inset 0 0 ${intensity * 80}px rgba(0,255,255,${intensity * 0.2})`,
          transform: `translate(${Math.sin(Date.now() / 1000) * chromaticOffset}px, ${Math.cos(Date.now() / 800) * chromaticOffset}px)`,
        }}
      />

      {/* 4. Optional Dimension Status Floating Pill (High Intensity Notification) */}
      {!compact && intensity > 0.05 && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 pointer-events-auto animate-pulse">
          <div className="px-3 py-1.5 rounded-xl bg-red-950/80 border border-red-500/60 backdrop-blur-md shadow-neon-red flex items-center gap-2 text-[10px] sm:text-xs font-mono font-bold text-red-300">
            <Zap className="w-3.5 h-3.5 text-mario-yellow animate-bounce" />
            <span>GLITCH DETECTED (มิติผิดปกติ {Math.round(intensity * 100)}%)</span>
          </div>
        </div>
      )}
    </div>
  );
};
