import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { LEDDashboardPage } from '@/pages/LEDDashboardPage';
import { StaffPage } from '@/pages/StaffPage';
import { AdminPage } from '@/pages/AdminPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { StudentPortalPage } from '@/pages/StudentPortalPage';

// Layout wrapper: hides Navbar/Footer/BottomNav for kiosk routes like /portal
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isKiosk = location.pathname.startsWith('/portal');
  if (isKiosk) return <>{children}</>;
  return (
    <div className="min-h-screen flex flex-col selection:bg-mario-red selection:text-white">
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/led" element={<LEDDashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Student Self-Service Kiosk — public, no login required, no Navbar */}
          <Route path="/portal" element={<StudentPortalPage />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['staff', 'admin']}>
                <StaffPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
