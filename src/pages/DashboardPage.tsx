import React, { useState, useEffect } from 'react';
import { DashboardStats, ItemType, RecentDiscoveryItem, EventSettings, Discovery } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { WorldRestoredMeter } from '@/components/dashboard/WorldRestoredMeter';
import { ItemTypeCard } from '@/components/dashboard/ItemTypeCard';
import { RecentDiscoveries } from '@/components/dashboard/RecentDiscoveries';
import { DiscoveryAlertModal } from '@/components/dashboard/DiscoveryAlertModal';
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay';
import { LiveStatusBadge } from '@/components/dashboard/LiveStatusBadge';
import { FontSizeController, getSavedFontScale, applyFontScale } from '@/components/dashboard/FontSizeController';
import { Radio, Sparkles, Tv, Star, ShieldCheck, MapPin, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
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
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [s, types, recent, st] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getItemsByTypeProgress(),
        dashboardService.getRecentDiscoveries(8),
        dashboardService.getSettings(),
      ]);
      setStats(s);
      setItemTypes(types);
      setRecentDiscoveries(recent);
      setSettings(st);

      // Trigger 100% celebration if completed
      if (s.world_restored_percentage >= 100 && st.celebration_enabled) {
        setShowCelebration(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    dashboardService.initSupabaseRealtime();

    // Re-apply saved scale to ensure zoom applies on navigation
    const savedScale = getSavedFontScale();
    applyFontScale(savedScale);

    // Subscribe to live dashboard changes
    const unsub = dashboardService.subscribe(() => {
      loadData();
    });

    // Subscribe to discovery alert popup (push to queue to avoid skipping any student)
    const alertUnsub = dashboardService.onDiscoveryAlert((disc) => {
      setAlertQueue((prev) => {
        if (prev.some((d) => d.id === disc.id)) return prev;
        return [...prev, disc];
      });
      loadData();
    });

    return () => {
      unsub();
      alertUnsub();
    };
  }, []);

  const handleDismissCurrent = () => {
    setAlertQueue((prev) => prev.slice(1));
  };

  const handleClearAll = () => {
    setAlertQueue([]);
  };

  return (
    <div className="dashboard-scalable min-h-screen pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Top Banner & Passport Header Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b-2 border-slate-300">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="passport-badge-red text-[11px] font-game px-3 py-1 rounded-full font-black tracking-wider shadow-sm">
              {settings?.dashboard_title || 'PTECH-Sci SURVIVOR PASSPORT'}
            </span>
            <span className="passport-badge-yellow text-[10px] font-mono px-2 py-0.5 rounded-full font-black shadow-sm">
              MARIO WORLD
            </span>
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono text-[10px] font-bold">
              REAL-TIME
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>{settings?.tagline || 'The Game Has Begun. Science Is Your Only Way Out.'}</span>
          </h1>
        </div>

        {/* Action Controls: Font Scale Adjuster + Status */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Font Size Setting Control */}
          <FontSizeController />

          {/* Live Badge */}
          <LiveStatusBadge />
        </div>
      </div>

      {/* 1. Hero World Restored Energy Meter (Passport Section) */}
      <WorldRestoredMeter stats={stats} />

      {/* 2. 5 Item Categories Grid (Passport World Map Section) */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="passport-badge-blue px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-sm">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
              <span>3</span>
            </span>
            <h2 className="font-game text-xs sm:text-sm text-slate-900 tracking-wider">
              SECRET CORE TYPES ({itemTypes.length} CATEGORIES)
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border-2 border-passport-border shadow-xs">
            {stats.discovered_items} / {stats.total_items} ITEMS RECOVERED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {itemTypes.map((t) => (
            <ItemTypeCard key={t.id} itemType={t} />
          ))}
        </div>
      </div>

      {/* 3. Recent Discoveries Radar (Passport Live Feed Section) */}
      {settings?.show_recent_discoveries && (
        <RecentDiscoveries discoveries={recentDiscoveries} />
      )}

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
