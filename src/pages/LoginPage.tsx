import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { Profile } from '@/types';
import { Gamepad2, ShieldAlert, ScanLine, Tv, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

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

  const handleQuickPreset = async (presetUser: 'admin' | 'staff' | 'viewer') => {
    soundManager.playClick();
    setUsername(presetUser);
    setPassword('demo1234');
    setLoading(true);
    const res = await authService.login(presetUser);
    setLoading(false);
    if (res.success && res.profile) {
      soundManager.playDiscovery();
      if (presetUser === 'admin') navigate('/admin', { replace: true });
      else if (presetUser === 'staff') navigate('/staff', { replace: true });
      else navigate('/dashboard', { replace: true });
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

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-mario-orange" />
              <span>ชื่อผู้ใช้ (Username)</span>
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="เช่น admin หรือ staff"
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
              placeholder="กรอกรหัสผ่าน (เช่น 1234 หรือ admin)"
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

        {/* Distinct Quick Demo Login Options */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <span className="text-[10.5px] font-mono text-slate-400 block text-center uppercase font-bold tracking-wider">
            ⚡ เข้าสู่ระบบด่วน (QUICK LOGIN PRESETS)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Admin Quick Login Card */}
            <button
              type="button"
              onClick={() => handleQuickPreset('admin')}
              className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/90 to-purple-900/60 hover:from-purple-900 hover:to-purple-800 border-2 border-purple-600/80 text-left transition-all group shadow-md flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-900/80 border border-purple-500 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform shrink-0">
                <ShieldAlert className="w-5 h-5 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">ADMIN</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-800 text-purple-200 border border-purple-600">
                    user: admin
                  </span>
                </div>
                <p className="text-[11px] text-purple-300 font-medium truncate mt-0.5">
                  ผู้ดูแลระบบ (Central Command)
                </p>
              </div>
            </button>

            {/* Staff Quick Login Card */}
            <button
              type="button"
              onClick={() => handleQuickPreset('staff')}
              className="p-3 rounded-2xl bg-gradient-to-br from-orange-950/90 to-amber-950/60 hover:from-orange-900 hover:to-amber-900 border-2 border-orange-600/80 text-left transition-all group shadow-md flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-900/80 border border-orange-500 flex items-center justify-center text-orange-300 group-hover:scale-110 transition-transform shrink-0">
                <ScanLine className="w-5 h-5 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">STAFF</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-800 text-orange-200 border border-orange-600">
                    user: staff
                  </span>
                </div>
                <p className="text-[11px] text-orange-300 font-medium truncate mt-0.5">
                  เจ้าหน้าที่จุดตรวจ (Scanner)
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
