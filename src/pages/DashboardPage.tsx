import React, { useState, useEffect } from 'react';
import { DashboardStats, ItemType, RecentDiscoveryItem, EventSettings, Discovery } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { WorldRestoredMeter } from '@/components/dashboard/WorldRestoredMeter';
import { ItemTypeCard } from '@/components/dashboard/ItemTypeCard';
import { RecentDiscoveries } from '@/components/dashboard/RecentDiscoveries';
import { DiscoveryAlertModal } from '@/components/dashboard/DiscoveryAlertModal';
import { CelebrationOverlay } from '@/components/dashboard/CelebrationOverlay';
import { LiveStatusBadge } from '@/components/dashboard/LiveStatusBadge';
import { Radio, Sparkles, Tv, Maximize2 } from 'lucide-react';
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
    <div className="min-h-screen pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Banner & LED Mode Link */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-game text-xs text-mario-red tracking-wider">
              {settings?.dashboard_title || 'PTECH-Sci : SURVIVE IN MARIO WORLD'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-mario-red/20 text-mario-yellow border border-mario-red/40 font-mono text-[10px] font-bold">
              REAL-TIME
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            {settings?.tagline || 'The Game Has Begun. Science Is Your Only Way Out.'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <LiveStatusBadge />
          <Link
            to="/dashboard/led"
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-mario-yellow to-mario-orange text-slate-950 text-xs font-black shadow flex items-center gap-1.5 hover:opacity-95"
          >
            <Tv className="w-4 h-4" />
            <span>เปิดโหมดจอ LED โดม (16:9)</span>
          </Link>
        </div>
      </div>

      {/* 1. Hero World Restored Energy Meter */}
      <WorldRestoredMeter stats={stats} />

      {/* 2. 5 Item Categories Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-mario-yellow" />
            <h2 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              SECRET CORE TYPES ({itemTypes.length} CATEGORIES)
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {stats.discovered_items} / {stats.total_items} ITEMS RECOVERED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {itemTypes.map((t) => (
            <ItemTypeCard key={t.id} itemType={t} />
          ))}
        </div>
      </div>

      {/* 3. Recent Discoveries Radar */}
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
