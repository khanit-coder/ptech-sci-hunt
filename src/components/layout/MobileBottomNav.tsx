import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, ScanLine, ShieldAlert } from 'lucide-react';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { Profile } from '@/types';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const unsub = authService.subscribe(setProfile);
    return unsub;
  }, []);

  if (location.pathname === '/dashboard/led') return null;

  const isAdmin = profile?.role === 'admin';
  const isStaff = profile?.role === 'staff' || isAdmin;

  const tabs = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: Tv,
      active: location.pathname === '/dashboard' || location.pathname === '/',
      colorClass: 'text-blue-400',
      activeBg: 'bg-blue-950/80 border-blue-500',
      dotBg: 'bg-blue-400',
      show: true,
    },
    {
      to: '/staff',
      label: 'Staff',
      icon: ScanLine,
      active: location.pathname === '/staff',
      colorClass: 'text-orange-400',
      activeBg: 'bg-orange-950/80 border-orange-500',
      dotBg: 'bg-orange-400',
      show: isStaff,
    },
    {
      to: '/admin',
      label: 'Admin',
      icon: ShieldAlert,
      active: location.pathname.startsWith('/admin'),
      colorClass: 'text-purple-400',
      activeBg: 'bg-purple-950/80 border-purple-500',
      dotBg: 'bg-purple-400',
      show: isAdmin,
    },
  ].filter(t => t.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-slate-950/95 backdrop-blur-xl border-t-2 border-slate-800 shadow-2xl">
        <div className="flex items-stretch justify-around px-2 pb-1 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                onClick={() => soundManager.playClick()}
                className={`flex flex-col items-center justify-center py-2.5 px-4 rounded-2xl flex-1 mx-1 transition-all duration-200 ${
                  tab.active
                    ? `${tab.activeBg} border`
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mb-0.5 transition-transform ${
                    tab.active ? `${tab.colorClass} scale-110` : 'text-slate-500'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold font-mono tracking-wider ${
                    tab.active ? tab.colorClass : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </span>
                {tab.active && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${tab.dotBg}`} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
