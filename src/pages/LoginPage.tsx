import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { Profile } from '@/types';
import { Gamepad2, ShieldAlert, ScanLine, Tv, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
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
    if (!email.trim()) return;

    soundManager.playClick();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authService.login(email.trim(), password);
      if (res.success && res.profile) {
        soundManager.playDiscovery();
        navigateAfterLogin(res.profile);
      } else {
        soundManager.playError();
        setErrorMsg(res.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = async (presetEmail: string) => {
    soundManager.playClick();
    setEmail(presetEmail);
    setPassword('demo1234');
    setLoading(true);
    const res = await authService.login(presetEmail);
    setLoading(false);
    if (res.success && res.profile) {
      soundManager.playDiscovery();
      navigateAfterLogin(res.profile);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-mario-deepBg text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border-2 border-mario-orange/50 rounded-3xl p-8 shadow-[0_0_60px_rgba(255,122,0,0.2)] backdrop-blur-xl space-y-6 relative overflow-hidden">
        
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

          <h2 className="text-lg font-black text-white tracking-wide">
            เข้าสู่ระบบเจ้าหน้าที่ / ผู้ดูแล
          </h2>
          <p className="text-xs text-slate-400">
            ระบบบันทึกการล่าไอเทมลับ วันวิทยาศาสตร์ 2026
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-mario-orange" />
              <span>อีเมล (Email)</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="เช่น admin@ptech.ac.th หรือ staff@ptech.ac.th"
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white font-bold text-xs shadow-neon-red hover:opacity-95 transition-all flex items-center justify-center gap-2 pixel-btn disabled:opacity-50"
          >
            <span>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Preset Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-center">
          <span className="text-[11px] font-mono text-slate-500 block uppercase font-bold">
            ⚡ QUICK DEMO LOGIN (คลิกเพื่อเข้าสู่ระบบทดสอบทันที)
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset('admin@ptech.ac.th')}
              className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-700 text-purple-300 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('staff@ptech.ac.th')}
              className="p-2 rounded-xl bg-mario-orange/10 hover:bg-mario-orange/20 border border-mario-orange/40 text-mario-orange text-[11px] font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <ScanLine className="w-4 h-4 text-mario-orange" />
              <span>Staff</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickPreset('viewer@ptech.ac.th')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold flex flex-col items-center gap-1 transition-colors"
            >
              <Tv className="w-4 h-4 text-mario-yellow" />
              <span>Viewer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
