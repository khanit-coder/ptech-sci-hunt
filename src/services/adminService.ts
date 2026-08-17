import { AuditLog, Profile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { itemService } from './itemService';
import { studentService } from './studentService';
import { discoveryService } from './discoveryService';
import { dashboardService } from './dashboardService';
import { authService } from './authService';

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    user_name: 'Admin Commander',
    action: 'EVENT_INITIALIZED',
    target_type: 'event_settings',
    target_id: '1',
    metadata: { note: 'PTECH-Sci 2026 Secret Item Hunt System initialized' },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'log_2',
    user_name: 'Admin Commander',
    action: 'ITEMS_SEEDED',
    target_type: 'items',
    target_id: '25_items',
    metadata: { count: 25, types: 5 },
    created_at: new Date(Date.now() - 3500000).toISOString(),
  },
];

class AdminService {
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private staffUsers: Profile[] = [];

  constructor() {
    const savedLogs = localStorage.getItem('ptech_audit_logs');
    if (savedLogs) {
      try { this.auditLogs = JSON.parse(savedLogs); } catch { /* ignore */ }
    }
  }

  private saveState() {
    localStorage.setItem('ptech_audit_logs', JSON.stringify(this.auditLogs));
  }

  public async logAction(action: string, targetType?: string, targetId?: string, metadata: Record<string, any> = {}) {
    const user = await authService.getCurrentUser();
    const log: AuditLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      user_id: user?.id,
      user_name: user?.display_name || user?.full_name || 'System',
      user_email: user?.email,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      await supabase.from('audit_logs').insert([log]);
    }

    this.auditLogs.unshift(log);
    this.saveState();
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (data) return data as AuditLog[];
    }
    return this.auditLogs.slice(0, limit);
  }

  async getStaffUsers(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (data) return data as Profile[];
    }

    // Default mock list
    return [
      {
        id: 'usr_admin',
        email: 'admin@ptech.ac.th',
        full_name: 'อาจารย์ผู้ดูแลระบบ PTECH',
        display_name: 'Admin Commander',
        role: 'admin',
        is_active: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr_staff_1',
        email: 'staff1@ptech.ac.th',
        full_name: 'นายพชร บุญส่ง (จุดตรวจโดม 1)',
        display_name: 'Staff Dome A',
        role: 'staff',
        is_active: true,
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr_staff_2',
        email: 'staff2@ptech.ac.th',
        full_name: 'นางสาวกัญญา พงษ์ศิริ (จุดตรวจอาคาร 3)',
        display_name: 'Staff Building 3',
        role: 'staff',
        is_active: true,
        created_at: new Date(Date.now() - 21600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];
  }

  // Emergency controls
  async pauseEvent(): Promise<void> {
    await dashboardService.updateSettings({ status: 'paused' });
    await this.logAction('EVENT_PAUSED', 'event_settings', '1');
  }

  async resumeEvent(): Promise<void> {
    await dashboardService.updateSettings({ status: 'open' });
    await this.logAction('EVENT_RESUMED', 'event_settings', '1');
  }

  async closeEvent(): Promise<void> {
    await dashboardService.updateSettings({ status: 'closed' });
    await this.logAction('EVENT_CLOSED', 'event_settings', '1');
  }

  async resetAllEventData(): Promise<void> {
    await discoveryService.resetAllDiscoveries();
    await this.logAction('EVENT_RESET', 'all_discoveries', 'all', { note: 'Hard reset by admin' });
  }

  // --------------------------------------------------------------------------
  // Dev Simulator Utilities
  // --------------------------------------------------------------------------
  async simulateRandomDiscovery(): Promise<{ success: boolean; message: string }> {
    const items = await itemService.getAllItems();
    const undiscovered = items.filter((i) => i.status === 'active');
    if (undiscovered.length === 0) {
      return { success: false, message: 'ไอเทมทั้งหมดถูกค้นพบครบ 100% แล้ว!' };
    }

    const randomItem = undiscovered[Math.floor(Math.random() * undiscovered.length)];
    const students = await studentService.getAllStudents();
    const randomStudent = students[Math.floor(Math.random() * students.length)];

    const res = await discoveryService.confirmDiscovery({
      qr_token: randomItem.qr_token,
      student_id: randomStudent?.id,
      manual_student_name: randomStudent ? undefined : 'นักเรียนทดสอบระบบ',
      verification_method: 'imported_student',
      notes: 'Simulated via Admin Tool',
    });

    if (res.success) {
      await this.logAction('SIMULATED_DISCOVERY', 'item', randomItem.item_code, { student: randomStudent?.full_name });
    }

    return { success: res.success, message: res.message };
  }

  async simulateBatchDiscoveries(count = 5): Promise<{ total: number; success: number }> {
    let success = 0;
    for (let i = 0; i < count; i++) {
      const r = await this.simulateRandomDiscovery();
      if (r.success) success++;
    }
    return { total: count, success };
  }
}

export const adminService = new AdminService();
