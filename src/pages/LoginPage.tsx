import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { Profile } from '@/types';
import { Gamepad2, Lock, User, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fromLocation = (location.state as any)?.from?.pathname;

  const navigateAfterLogin = (profile: Profile) => {
    if (fromLocation) {
      if (profile.role === 'admin') {
        navigate(fromLocation, { replace: true });
        return;
      }
      if (profile.role === 'staff' && !fromLocation.startsWith('/admin')) {
        navigate(fromLocation, { replace: true });
        return;
      }
    }

    if (profile.role === 'admin') navigate('/admin', { replace: true });
    else if (profile.role === 'staff') navigate('/staff', { replace: true });
    else navigate('/dashboard', { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    soundManager.playClick();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.login(username.trim(), password);
      if (res.success && res.profile) {
        soundManager.playDiscovery();
        navigateAfterLogin(res.profile);
      } else {
        soundManager.playError();
        setErrorMsg(res.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-mario-deepBg text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border-2 border-mario-orange/50 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(255,122,0,0.2)] backdrop-blur-xl space-y-6 relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mario-red via-mario-orange to-mario-yellow p-0.5 shadow-neon-red mx-auto flex items-center justify-center animate-bounce">
            <div className="w-full h-full bg-mario-darkNavy rounded-[14px] flex items-center justify-center text-mario-yellow">
              <Gamepad2 className="w-8 h-8" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className="font-game text-xs text-mario-red">PTECH-Sci</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-mario-orange/20 text-mario-orange border border-mario-orange/40">
              PORTAL LOGIN
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
            เข้าสู่ระบบเจ้าหน้าที่ / ผู้ดูแล
          </h2>
          <p className="text-xs text-slate-400">
            ระบบบันทึกการล่าไอเทมลับ วันวิทยาศาสตร์ 2026
          </p>
        </div>

        {/* Unified Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-mario-orange" />
              <span>ชื่อผู้ใช้ (Username)</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้ เช่น admin หรือ staff"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-mario-orange" />
              <span>รหัสผ่าน (Password)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านของคุณ"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange text-xs"
            />
          </div>

          {errorMsg && (
            <p className="text-red-400 text-xs font-semibold">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white font-bold text-xs shadow-neon-red hover:opacity-95 transition-all flex items-center justify-center gap-2 pixel-btn disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
