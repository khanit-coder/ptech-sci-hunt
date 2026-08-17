import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Gamepad2, 
  Tv, 
  ScanLine, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  LogOut, 
  User, 
  Sparkles,
  Layers,
  Radio
} from 'lucide-react';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { Profile } from '@/types';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.getIsEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribe(setProfile);
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleSound = () => {
    const next = soundManager.toggleSound();
    setSoundEnabled(next);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleLogout = async () => {
    soundManager.playClick();
    await authService.logout();
    navigate('/login');
  };

  // Hide standard navbar on pure LED mode for clean presentation
  if (location.pathname === '/dashboard/led') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-passport-border bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link 
          to="/" 
          onClick={() => soundManager.playClick()}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl passport-badge-red p-0.5 shadow-neon-red group-hover:scale-105 transition-transform flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-mario-yellow animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-game text-xs text-mario-yellow tracking-wider drop-shadow-sm">PTECH-Sci</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded passport-badge-yellow text-slate-950 font-mono font-black">
                PASSPORT
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">Secret Item Hunt • Mario World</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/dashboard"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              location.pathname === '/dashboard' || location.pathname === '/'
                ? 'passport-badge-blue shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4 text-mario-yellow" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/staff"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              location.pathname === '/staff'
                ? 'passport-badge-orange shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Staff Check-in</span>
          </Link>

          <Link
            to="/admin"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              location.pathname.startsWith('/admin')
                ? 'passport-badge-purple shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Admin</span>
          </Link>

          <Link
            to="/dashboard/led"
            onClick={() => soundManager.playClick()}
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 text-mario-green hover:bg-mario-green/20 border border-mario-green/50 ml-2 shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LED DOME (16:9)</span>
          </Link>
        </nav>

        {/* Action Controls & User Status */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'passport-badge-yellow text-slate-900 shadow-sm border-mario-yellow'
                : 'bg-slate-800/80 border-passport-border text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
            className="p-2 rounded-xl bg-slate-800/80 border border-passport-border text-slate-300 hover:text-white hover:border-slate-500 transition-all hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* User Profile Badge or Login */}
          {profile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-passport-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{profile.display_name || profile.full_name}</p>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  profile.role === 'admin' 
                    ? 'passport-badge-red text-[9px]' 
                    : 'passport-badge-orange text-[9px]'
                }`}>
                  {profile.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="p-2 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => soundManager.playClick()}
              className="px-3.5 py-1.5 rounded-xl passport-badge-red text-white text-xs font-black shadow-neon-red hover:opacity-90 transition-opacity"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
