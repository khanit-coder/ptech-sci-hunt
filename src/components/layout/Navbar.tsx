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
    <header className="sticky top-0 z-40 w-full border-b border-mario-orange/20 bg-mario-deepBg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <Link 
          to="/" 
          onClick={() => soundManager.playClick()}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mario-red via-mario-orange to-mario-yellow p-0.5 shadow-neon-red group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-mario-darkNavy rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-mario-yellow animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-game text-xs text-mario-red tracking-wider">PTECH-Sci</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-mario-orange/20 text-mario-yellow border border-mario-orange/40 font-mono font-bold">
                MARIO WORLD
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Secret Item Hunt</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/dashboard"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              location.pathname === '/dashboard' || location.pathname === '/'
                ? 'bg-mario-red/20 text-mario-yellow border border-mario-red/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Tv className="w-4 h-4 text-mario-yellow" />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/staff"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              location.pathname === '/staff'
                ? 'bg-mario-orange/20 text-mario-orange border border-mario-orange/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ScanLine className="w-4 h-4 text-mario-orange" />
            <span>Staff Check-in</span>
          </Link>

          <Link
            to="/admin"
            onClick={() => soundManager.playClick()}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              location.pathname.startsWith('/admin')
                ? 'bg-mario-purple/20 text-sci-cyan border border-mario-purple/50 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-sci-cyan" />
            <span>Admin</span>
          </Link>

          <Link
            to="/dashboard/led"
            onClick={() => soundManager.playClick()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-mario-green hover:bg-mario-green/10 border border-mario-green/30 ml-2"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>LED MODE</span>
          </Link>
        </nav>

        {/* Action Controls & User Status */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-mario-yellow/10 border-mario-yellow/40 text-mario-yellow shadow-neon-yellow/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all hidden sm:block"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* User Profile Badge or Login */}
          {profile ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-200">{profile.display_name || profile.full_name}</p>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                  profile.role === 'admin' 
                    ? 'bg-mario-red/20 text-mario-red border border-mario-red/30' 
                    : 'bg-mario-orange/20 text-mario-orange border border-mario-orange/30'
                }`}>
                  {profile.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                title="ออกจากระบบ"
                className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 text-red-400 hover:bg-red-900/60 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => soundManager.playClick()}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-mario-red to-mario-orange text-white text-xs font-bold shadow-neon-red hover:opacity-90 transition-opacity"
            >
              เข้าสู่ระบบ
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
