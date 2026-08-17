import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Star, ShieldCheck, X } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  onClose: () => void;
}

export const CelebrationOverlay: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    soundManager.playVictory();

    // Launch celebratory confetti cannon
    const duration = 6 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF2A2A', '#FFD700', '#00E676', '#00B0FF', '#E040FB'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FF2A2A', '#FFD700', '#00E676', '#00B0FF', '#E040FB'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in">
      
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient from-mario-green/30 via-mario-yellow/10 to-transparent pointer-events-none" />

      {/* Main Celebration Card */}
      <div className="relative z-10 max-w-3xl w-full bg-gradient-to-b from-slate-900 via-mario-darkNavy to-slate-950 border-4 border-mario-green rounded-3xl p-8 sm:p-14 text-center shadow-[0_0_100px_rgba(0,230,118,0.7)] animate-scale-pop">
        
        {/* Dismiss button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Floating Grand Trophy */}
        <div className="relative my-4 flex justify-center">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-mario-yellow via-mario-orange to-mario-red p-1 shadow-neon-yellow animate-bounce">
            <div className="w-full h-full bg-mario-darkNavy rounded-[22px] flex items-center justify-center text-6xl sm:text-7xl">
              🏆
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-game text-2xl sm:text-4xl text-mario-yellow tracking-wider mt-6 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]">
          PTECH WORLD RESTORED!
        </h1>
        
        <div className="font-game text-5xl sm:text-7xl text-mario-green my-4 tracking-tight drop-shadow-[0_0_30px_rgba(0,230,118,0.9)]">
          100% COMPLETE
        </div>

        {/* Subtitle */}
        <p className="font-game text-xs sm:text-sm text-white tracking-widest uppercase my-2">
          ALL 25 SECRET CORE ITEMS RECOVERED
        </p>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
          ขอแสดงความยินดีกับผู้กล้าชาว PTECH ทุกท่าน! พลังงานวิทยาศาสตร์ได้ฟื้นคืนความเสถียรภาพของมิติอย่างสมบูรณ์แบบ
        </p>

        {/* Footer Tag */}
        <div className="mt-8 inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-mario-green/20 border border-mario-green/60 text-mario-green font-mono font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-mario-green" />
          <span>MISSION STATUS: RESTORATION COMPLETE</span>
        </div>
      </div>
    </div>
  );
};
