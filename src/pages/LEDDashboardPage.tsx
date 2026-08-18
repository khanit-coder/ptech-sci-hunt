import React, { useState, useEffect } from 'react';
import { DashboardStats, ItemType, RecentDiscoveryItem, EventSettings, Discovery } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { WorldRestoredMeter } from '@/components/dashboard/WorldRestoredMeter';
import { ItemTypeCard } from '@/components/dashboard/ItemTypeCard';
import { RecentDiscoveries } from '@/components/dashboard/RecentDiscoveries';
import { DiscoveryAlertModal } from '@/components/dashboard/DiscoveryAlertModal';
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay';
import { getSavedFontScale, applyFontScale } from '@/components/dashboard/FontSizeController';
import { Star } from 'lucide-react';

export const LEDDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_items: 25,
    discovered_items: 0,
    remaining_items: 25,
    world_restored_percentage: 0,
    mission_status: 'ACTIVE',
  });
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<RecentDiscoveryItem[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [alertQueue, setAlertQueue] = useState<Discovery[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const loadData = async () => {
    const [s, types, recent, st] = await Promise.all([
      dashboardService.getDashboardStats(),
      dashboardService.getItemsByTypeProgress(),
      dashboardService.getRecentDiscoveries(6),
      dashboardService.getSettings(),
    ]);
    setStats(s);
    setItemTypes(types);
    setRecentDiscoveries(recent);
    setSettings(st);

    if (s.world_restored_percentage >= 100 && st.celebration_enabled) {
      setShowCelebration(true);
    }
  };

  useEffect(() => {
    loadData();
    dashboardService.initSupabaseRealtime();

    const savedScale = getSavedFontScale();
    applyFontScale(savedScale);

    // Auto-enter fullscreen for pure LED Dome display
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    const unsub = dashboardService.subscribe(() => {
      loadData();
    });

    // Queue new discoveries so no student is ever skipped
    const alertUnsub = dashboardService.onDiscoveryAlert((disc) => {
      setAlertQueue((prev) => {
        if (prev.some((d) => d.id === disc.id)) return prev;
        return [...prev, disc];
      });
      loadData();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsub();
      alertUnsub();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleDismissCurrent = () => {
    setAlertQueue((prev) => prev.slice(1));
  };

  const handleClearAll = () => {
    setAlertQueue([]);
  };

  return (
    <div className="dashboard-scalable w-screen h-screen max-h-screen bg-[#F0F4F8] text-slate-900 p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between select-none overflow-hidden relative">
      
      {/* Top Header: Presentation Banner with Passport Style */}
      <div className="text-center space-y-1 mb-1">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full passport-badge-red text-white font-game text-xs tracking-wider shadow-sm">
          <Star className="w-3.5 h-3.5 text-white fill-white" />
          <span>{settings?.dashboard_title || 'PTECH-Sci SURVIVOR PASSPORT'}</span>
        </div>
        <h1 className="font-game text-base sm:text-lg lg:text-xl text-slate-900 tracking-wide mt-1 drop-shadow-xs">
          {settings?.tagline || 'THE GAME HAS BEGUN. SCIENCE IS YOUR ONLY WAY OUT.'}
        </h1>
      </div>

      {/* Middle Centerpiece: World Restored Reactor Meter */}
      <div className="my-1">
        <WorldRestoredMeter stats={stats} isLedMode={true} />
      </div>

      {/* Bottom Grid: 5 Core Types + Live Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch mt-1">
        
        {/* 5 Item Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-2.5">
          {itemTypes.map((t) => (
            <ItemTypeCard key={t.id} itemType={t} isLedMode={true} />
          ))}
        </div>

        {/* Recent Discovery Radar */}
        <div className="lg:col-span-4 flex flex-col">
          <RecentDiscoveries discoveries={recentDiscoveries} isLedMode={true} />
        </div>
      </div>

      {/* Stacked Discovery Notification Alert Modal */}
      {alertQueue.length > 0 && (
        <DiscoveryAlertModal
          queue={alertQueue}
          onDismissCurrent={handleDismissCurrent}
          onClearAll={handleClearAll}
        />
      )}

      {showCelebration && (
        <CelebrationOverlay onClose={() => setShowCelebration(false)} />
      )}
    </div>
  );
};
