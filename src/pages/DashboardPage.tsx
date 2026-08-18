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
import { GlitchOverlay } from '@/components/effects/GlitchOverlay';
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

    // Subscribe to live dashboard changes (Supabase Realtime + BroadcastChannel)
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

    // Polling fallback: refresh every 15s in case Supabase Realtime is not configured
    // or the websocket drops silently
    const pollInterval = setInterval(() => {
      loadData();
    }, 15000);

    return () => {
      unsub();
      alertUnsub();
      clearInterval(pollInterval);
    };
  }, []);

  const handleDismissCurrent = () => {
    setAlertQueue((prev) => prev.slice(1));
  };

  const handleClearAll = () => {
    setAlertQueue([]);
  };

  return (
    <div className="dashboard-scalable min-h-screen pb-12 pt-3 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-3 sm:space-y-4 relative">
      
      {/* Cyber Glitch Distortion Overlay */}
      <GlitchOverlay
        restorationPercentage={stats.world_restored_percentage}
        enabled={settings?.glitch_effect_enabled ?? true}
      />
      
      {/* Top Banner & Passport Header Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-3 border-b-2 border-slate-300">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="passport-badge-red text-xs sm:text-sm font-game px-3.5 py-1 rounded-full font-black tracking-wider shadow-xs">
              {settings?.dashboard_title || 'PTECH-Sci SURVIVOR PASSPORT'}
            </span>
            <span className="passport-badge-yellow text-xs font-mono px-2.5 py-0.5 rounded-full font-black shadow-xs">
              MARIO WORLD
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono text-xs font-bold">
              REAL-TIME
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2">
            <span>{settings?.tagline || 'The Game Has Begun. Science Is Your Only Way Out.'}</span>
          </h1>
        </div>

        {/* Action Controls: Font Scale Adjuster + Status */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Font Size Setting Control */}
          <FontSizeController />

          {/* Live Badge */}
          <LiveStatusBadge />
        </div>
      </div>

      {/* 1. Hero World Restored Energy Meter */}
      <WorldRestoredMeter stats={stats} />

      {/* 2. 5 Item Categories Grid & Hunter Discoverers (Expanded 100% Full Width) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="passport-badge-blue px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs">
              <Star className="w-3.5 h-3.5 text-white fill-white" />
              <span>5</span>
            </span>
            <h2 className="font-game text-xs sm:text-sm text-slate-900 tracking-wider">
              SECRET CORE TYPES ({itemTypes.length} CATEGORIES) & DISCOVERY HUNTERS
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-lg border-2 border-passport-border shadow-xs">
            {stats.discovered_items} / {stats.total_items} ITEMS RECOVERED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 w-full items-stretch">
          {itemTypes.map((t) => (
            <ItemTypeCard key={t.id} itemType={t} />
          ))}
        </div>
      </div>

      {/* Stacked Discovery Notification Alert Modal */}
      {alertQueue.length > 0 && (
        <DiscoveryAlertModal
          queue={alertQueue}
          onDismissCurrent={handleDismissCurrent}
          onClearAll={handleClearAll}
          nameMode={settings?.show_student_name_mode}
        />
      )}

      {showCelebration && (
        <CelebrationOverlay onClose={() => setShowCelebration(false)} />
      )}
    </div>
  );
};
