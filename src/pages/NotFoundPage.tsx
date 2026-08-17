import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import { soundManager } from '@/lib/sound';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="w-24 h-24 rounded-3xl bg-red-950/60 border-2 border-red-600 flex items-center justify-center text-5xl animate-bounce">
        👾
      </div>

      <div className="space-y-2">
        <h1 className="font-game text-4xl text-mario-red">404 NOT FOUND</h1>
        <p className="text-sm text-slate-400">
          มิติที่คุณกำลังค้นหาถูกกลืนหายไปในหลุมดำของไวรัสมาริโอ้
        </p>
      </div>

      <Link
        to="/dashboard"
        onClick={() => soundManager.playClick()}
        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-bold text-xs shadow-neon-red flex items-center gap-2 pixel-btn"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>กลับสู่แดชบอร์ดหลัก</span>
      </Link>
    </div>
  );
};
