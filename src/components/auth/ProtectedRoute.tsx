import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Profile, UserRole } from '@/types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(() => authService.getProfile());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check
    authService.getCurrentUser().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });

    // Subscribe to ongoing changes
    const unsub = authService.subscribe((p) => {
      setProfile(p);
    });

    return () => unsub();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mario-deepBg flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-mario-orange border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-300">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
      </div>
    );
  }

  // Not logged in -> Redirect to login page immediately with return location
  if (!profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role authorization check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return (
      <div className="min-h-screen bg-mario-deepBg text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-red-950/80 border-2 border-red-600 flex items-center justify-center text-red-400 text-4xl shadow-neon-red animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-md">
          <h1 className="font-game text-xl text-red-500">ACCESS DENIED (สิทธิ์ไม่เพียงพอ)</h1>
          <p className="text-sm text-slate-300">
            บัญชีของคุณ (<span className="text-mario-yellow font-bold">{profile.display_name || profile.email}</span>, สิทธิ์: <span className="font-mono uppercase font-bold text-mario-orange">{profile.role}</span>) ไม่มีสิทธิ์เข้าถึงหน้านี้
          </p>
        </div>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            to={profile.role === 'staff' ? '/staff' : '/dashboard'}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้าหลักของคุณ</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
