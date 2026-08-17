import React, { useState, useEffect } from 'react';
import { DashboardStats, ItemType, RecentDiscoveryItem, EventSettings, Discovery } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { WorldRestoredMeter } from '@/components/dashboard/WorldRestoredMeter';
import { ItemTypeCard } from '@/components/dashboard/ItemTypeCard';
import { RecentDiscoveries } from '@/components/dashboard/RecentDiscoveries';
import { DiscoveryAlertModal } from '@/components/dashboard/DiscoveryAlertModal';
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay';
import { LiveStatusBadge } from '@/components/dashboard/LiveStatusBadge';
import { soundManager } from '@/lib/sound';
import { Volume2, VolumeX, Maximize2, Minimize2, ArrowLeft, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [soundEnabled, setSoundEnabled] = useState(soundManager.getIsEnabled());
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

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

    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
          toggleFullscreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsub();
      alertUnsub();
      document.removeEventListener('fullscreenchange', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
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

  const handleDismissCurrent = () => {
    setAlertQueue((prev) => prev.slice(1));
  };

  const handleClearAll = () => {
    setAlertQueue([]);
  };

  return (
    <div className="w-screen h-screen max-h-screen bg-mario-deepBg text-white p-2.5 sm:p-4 lg:p-5 flex flex-col justify-between select-none overflow-hidden relative led-scanlines">
      
      {/* Floating HUD Controls in Corner: Hidden completely when in Fullscreen as requested */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <LiveStatusBadge />

          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${
              soundEnabled ? 'bg-mario-yellow/20 border-mario-yellow/50 text-mario-yellow' : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'ปิดเสียง' : 'เปิดเสียง'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white transition-all backdrop-blur-md"
            title="เต็มจอ (Fullscreen)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <Link
            to="/dashboard"
            className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-400 hover:text-white transition-all backdrop-blur-md"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Top Header: 16:9 Presentation Banner */}
      <div className="text-center space-y-1 mb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-mario-red/20 border border-mario-red/50 text-mario-yellow font-game text-xs tracking-wider shadow-neon-red">
          <Radio className="w-3.5 h-3.5 text-mario-red animate-ping" />
          <span>{settings?.dashboard_title || 'PTECH-Sci : SURVIVE IN MARIO WORLD'}</span>
        </div>
        <h1 className="font-game text-base sm:text-xl lg:text-2xl text-white tracking-wide mt-1.5 drop-shadow-md">
          {settings?.tagline || 'THE GAME HAS BEGUN. SCIENCE IS YOUR ONLY WAY OUT.'}
        </h1>
      </div>

      {/* Middle Centerpiece: World Restored Reactor Meter */}
      <div className="my-1">
        <WorldRestoredMeter stats={stats} isLedMode={true} />
      </div>

      {/* Bottom Grid: 5 Core Types + Live Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch mt-2">
        
        {/* 5 Item Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-5 gap-2.5 sm:gap-3">
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
