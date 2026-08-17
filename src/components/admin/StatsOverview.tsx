import React from 'react';
import { DashboardStats, ItemType, Discovery } from '@/types';
import { Sparkles, Trophy, Users, ShieldAlert, Zap, Clock, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface Props {
  stats: DashboardStats;
  itemTypes: ItemType[];
  discoveries: Discovery[];
}

export const StatsOverview: React.FC<Props> = ({ stats, itemTypes, discoveries }) => {
  // Aggregate discovery count by 10-minute time buckets for timeline chart
  const timelineData = React.useMemo(() => {
    const buckets: Record<string, number> = {};
    
    // Sort chronological
    const sorted = [...discoveries].sort(
      (a, b) => new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime()
    );

    sorted.forEach((d) => {
      const time = new Date(d.discovered_at);
      const minutes = Math.floor(time.getMinutes() / 10) * 10;
      const key = `${String(time.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const list = Object.entries(buckets).map(([time, count]) => ({ time, count }));
    if (list.length === 0) {
      return [
        { time: '09:00', count: 0 },
        { time: '10:00', count: 0 },
        { time: '11:00', count: 0 },
      ];
    }
    return list;
  }, [discoveries]);

  // Bar chart data for 5 categories
  const barData = itemTypes.map((t) => ({
    name: t.code,
    discovered: t.discovered_count || 0,
    total: t.total_count || 5,
    color: t.color,
  }));

  return (
    <div className="space-y-6">
      
      {/* 4 Key Metric Pods */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* World Restored */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-mario-red/20 via-slate-900 to-slate-900 border border-mario-red/50 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">WORLD RESTORED</span>
            <Sparkles className="w-4 h-4 text-mario-yellow" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-game text-3xl text-mario-yellow font-bold">
              {stats.world_restored_percentage}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">ความเสถียรภาพมิติ</span>
        </div>

        {/* Discovered / Total Items */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-mario-orange/20 via-slate-900 to-slate-900 border border-mario-orange/50 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">DISCOVERED ITEMS</span>
            <Trophy className="w-4 h-4 text-mario-orange" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-extrabold text-white">
              {stats.discovered_items}
            </span>
            <span className="font-mono text-base text-slate-500 font-bold">
              / {stats.total_items}
            </span>
          </div>
          <span className="text-[11px] text-mario-green mt-1 block">
            เหลืออีก {stats.remaining_items} ชิ้น
          </span>
        </div>

        {/* Total Discoveries Count */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">TOTAL CLAIMS</span>
            <Activity className="w-4 h-4 text-sci-cyan" />
          </div>
          <div className="font-mono text-3xl font-extrabold text-sci-cyan">
            {discoveries.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">บันทึกการเคลมสำเร็จ</span>
        </div>

        {/* Mission Status */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase">EVENT STATUS</span>
            <Zap className="w-4 h-4 text-mario-green" />
          </div>
          <div className="font-mono text-xl font-extrabold text-mario-green truncate">
            {stats.mission_status}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">สถานะกิจกรรมปัจจุบัน</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Timeline Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-game text-xs text-mario-yellow tracking-wider">
                DISCOVERY TIMELINE
              </h3>
              <p className="text-xs text-slate-400">อัตราการค้นพบไอเทมตามช่วงเวลา</p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#FF2A2A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" name="จำนวนไอเทม" stroke="#FF7A00" strokeWidth={2} fillOpacity={1} fill="url(#discGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Item Types Distribution Bar Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-game text-xs text-mario-yellow tracking-wider">
                CATEGORY PROGRESS
              </h3>
              <p className="text-xs text-slate-400">ความคืบหน้าของ 5 ประเภทแกนพลังงาน</p>
            </div>
            <Trophy className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 5]} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="discovered" name="ค้นพบแล้ว" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
