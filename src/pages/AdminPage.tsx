import React, { useState, useEffect } from 'react';
import { 
  DashboardStats, 
  Item, 
  ItemType, 
  Student, 
  Discovery, 
  EventSettings, 
  Profile, 
  AuditLog 
} from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { itemService } from '@/services/itemService';
import { studentService } from '@/services/studentService';
import { discoveryService } from '@/services/discoveryService';
import { adminService } from '@/services/adminService';
import { exportService } from '@/services/exportService';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';

// Admin Components
import { StatsOverview } from '@/components/admin/StatsOverview';
import { ItemManager } from '@/components/admin/ItemManager';
import { QRGeneratorSheet } from '@/components/admin/QRGeneratorSheet';
import { StudentManager } from '@/components/admin/StudentManager';
import { ImportWizard } from '@/components/admin/ImportWizard';
import { DiscoveryManager } from '@/components/admin/DiscoveryManager';
import { StaffManager } from '@/components/admin/StaffManager';
import { EventSettingsForm } from '@/components/admin/EventSettingsForm';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { SystemHealthView } from '@/components/admin/SystemHealthView';
import { SimulatorModal } from '@/components/admin/SimulatorModal';

import { 
  Tv, 
  Layers, 
  Users, 
  Trophy, 
  UserCheck, 
  Settings, 
  FileText, 
  Activity, 
  Gamepad2, 
  Download, 
  Plus, 
  Upload, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminTab = 'overview' | 'items' | 'students' | 'discoveries' | 'staff' | 'settings' | 'audit_logs' | 'health';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  
  // Data State
  const [stats, setStats] = useState<DashboardStats>({
    total_items: 25,
    discovered_items: 0,
    remaining_items: 25,
    world_restored_percentage: 0,
    mission_status: 'ACTIVE',
  });
  const [items, setItems] = useState<Item[]>([]);
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals
  const [isQrSheetOpen, setIsQrSheetOpen] = useState(false);
  const [qrSheetItems, setQrSheetItems] = useState<Item[]>([]);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const loadAllData = async () => {
    const [s, itms, types, stds, discs, stngs, stff, logs] = await Promise.all([
      dashboardService.getDashboardStats(),
      itemService.getAllItems(),
      itemService.getItemTypes(),
      studentService.getAllStudents(),
      discoveryService.getAllDiscoveries(),
      dashboardService.getSettings(),
      adminService.getStaffUsers(),
      adminService.getAuditLogs(100),
    ]);

    setStats(s);
    setItems(itms);
    setItemTypes(types);
    setStudents(stds);
    setDiscoveries(discs);
    setSettings(stngs);
    setStaffList(stff);
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenQRSheet = (selectedItems?: Item[]) => {
    soundManager.playClick();
    setQrSheetItems(selectedItems || items);
    setIsQrSheetOpen(true);
  };

  return (
    <div className="min-h-screen pb-20 pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-game text-xs text-sci-cyan">MISSION CONTROL</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
              ADMINISTRATOR
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">
            PTECH-Sci 2026 : Central Command Hub
          </h1>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { soundManager.playClick(); setIsSimulatorOpen(true); }}
            className="px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-700 text-purple-300 text-xs font-bold hover:bg-purple-900 transition-colors flex items-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>Dev Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => { soundManager.playClick(); exportService.exportFullEventBackup(); }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-mario-yellow" />
            <span>Backup Data</span>
          </button>

          <Link
            to="/dashboard"
            onClick={() => soundManager.playClick()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white text-xs font-bold shadow-neon-red hover:opacity-95 transition-opacity flex items-center gap-1.5 pixel-btn"
          >
            <Tv className="w-4 h-4" />
            <span>เปิด Dashboard จอใหญ่</span>
          </Link>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 font-mono text-xs">
        {[
          { id: 'overview', label: 'Overview (ภาพรวม)', icon: Activity },
          { id: 'items', label: `Items (${items.length})`, icon: Layers },
          { id: 'students', label: `Students (${students.length})`, icon: Users },
          { id: 'discoveries', label: `Discoveries (${discoveries.length})`, icon: Trophy },
          { id: 'staff', label: 'Staff & Accounts', icon: UserCheck },
          { id: 'settings', label: 'Event Settings', icon: Settings },
          { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
          { id: 'health', label: 'System Health', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => { soundManager.playClick(); setActiveTab(tab.id as AdminTab); }}
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-mario-orange text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'overview' && (
        <StatsOverview
          stats={stats}
          itemTypes={itemTypes}
          discoveries={discoveries}
        />
      )}

      {activeTab === 'items' && (
        <ItemManager
          items={items}
          itemTypes={itemTypes}
          onRefresh={loadAllData}
          onOpenQRSheet={handleOpenQRSheet}
        />
      )}

      {activeTab === 'students' && (
        <StudentManager
          students={students}
          onRefresh={loadAllData}
          onOpenImportWizard={() => { soundManager.playClick(); setIsImportWizardOpen(true); }}
        />
      )}

      {activeTab === 'discoveries' && (
        <DiscoveryManager
          discoveries={discoveries}
          onRefresh={loadAllData}
        />
      )}

      {activeTab === 'staff' && (
        <StaffManager
          staffList={staffList}
          onRefresh={loadAllData}
        />
      )}

      {activeTab === 'settings' && settings && (
        <EventSettingsForm
          settings={settings}
          onRefresh={loadAllData}
        />
      )}

      {activeTab === 'audit_logs' && (
        <AuditLogTable logs={auditLogs} />
      )}

      {activeTab === 'health' && (
        <SystemHealthView />
      )}

      {/* Modals */}
      {isQrSheetOpen && (
        <QRGeneratorSheet
          items={qrSheetItems}
          onClose={() => setIsQrSheetOpen(false)}
        />
      )}

      {isImportWizardOpen && (
        <ImportWizard
          onClose={() => setIsImportWizardOpen(false)}
          onSuccess={loadAllData}
        />
      )}

      {isSimulatorOpen && (
        <SimulatorModal
          onClose={() => setIsSimulatorOpen(false)}
          onRefresh={loadAllData}
        />
      )}
    </div>
  );
};
