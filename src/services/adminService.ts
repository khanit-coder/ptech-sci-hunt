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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validUserId = user?.id && isUuid.test(user.id) ? user.id : null;

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
      try {
        await supabase.from('audit_logs').insert([
          {
            user_id: validUserId,
            action,
            target_type: targetType || null,
            target_id: targetId || null,
            metadata: {
              ...metadata,
              user_name: user?.display_name || user?.full_name || 'System',
              user_email: user?.email,
            },
          },
        ]);
      } catch (err) {
        console.warn('Supabase audit log insert error:', err);
      }
    }

    this.auditLogs.unshift(log);
    this.saveState();
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            user_id: d.user_id,
            user_name: d.metadata?.user_name || 'System',
            user_email: d.metadata?.user_email || '',
            action: d.action,
            target_type: d.target_type,
            target_id: d.target_id,
            metadata: d.metadata || {},
            created_at: d.created_at,
          }));
        }
      } catch (err) {
        console.warn('Supabase getAuditLogs error:', err);
      }
    }
    return this.auditLogs.slice(0, limit);
  }

  async getStaffUsers(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (data) return data as Profile[];
    }

    if (this.staffUsers.length > 0) {
      return this.staffUsers;
    }

    // Default mock list
    this.staffUsers = [
      {
        id: 'usr_admin',
        username: 'admin',
        email: 'admin@ptech.ac.th',
        full_name: 'ผู้ดูแลระบบ (Admin)',
        display_name: 'Admin Commander',
        role: 'admin',
        is_active: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr_staff_1',
        username: 'staff_scanner',
        email: 'staff_scanner@ptech.ac.th',
        full_name: 'staff_scanner (สแกนไอเท็ม)',
        display_name: 'Staff - สแกนไอเท็ม',
        role: 'staff',
        staff_duty: 'item_scanner',
        is_active: true,
        created_at: new Date(Date.now() - 43200000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'usr_staff_2',
        username: 'staff_booth1',
        email: 'staff_booth1@ptech.ac.th',
        full_name: 'staff_booth1 (บูทฟิสิกส์)',
        display_name: 'Staff - บูทฟิสิกส์',
        role: 'staff',
        staff_duty: 'booth_staff',
        assigned_booth_name: 'บูทฟิสิกส์',
        is_active: true,
        created_at: new Date(Date.now() - 21600000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    return this.staffUsers;
  }

  async createStaffUser(payload: {
    username: string;
    password?: string;
    role: UserRole;
    staff_duty?: 'item_scanner' | 'booth_staff';
    assigned_booth_id?: string;
    assigned_booth_name?: string;
  }): Promise<{ success: boolean; profile?: Profile; message: string }> {
    const cleanUsername = payload.username.trim().toLowerCase();
    const email = `${cleanUsername}@ptech.ac.th`;

    let displayName = cleanUsername;
    let fullName = cleanUsername;

    if (payload.role === 'staff') {
      if (payload.staff_duty === 'booth_staff' && payload.assigned_booth_name) {
        displayName = `Staff - ${payload.assigned_booth_name}`;
        fullName = `${cleanUsername} (${payload.assigned_booth_name})`;
      } else {
        displayName = `Staff - สแกนไอเท็ม`;
        fullName = `${cleanUsername} (สแกนไอเท็ม)`;
      }
    } else {
      displayName = `${payload.role.toUpperCase()} (${cleanUsername})`;
      fullName = cleanUsername;
    }

    const generateUuid = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');

    const newProfile: Profile = {
      id: generateUuid(),
      username: cleanUsername,
      email,
      full_name: fullName,
      display_name: displayName,
      role: payload.role,
      staff_duty: payload.role === 'staff' ? payload.staff_duty || 'item_scanner' : undefined,
      assigned_booth_id: payload.role === 'staff' && payload.staff_duty === 'booth_staff' ? payload.assigned_booth_id : undefined,
      assigned_booth_name: payload.role === 'staff' && payload.staff_duty === 'booth_staff' ? payload.assigned_booth_name : undefined,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'email' }).select().single();
        if (!error && data) {
          return { success: true, profile: data as Profile, message: 'สร้างบัญชีสตาฟสำเร็จ!' };
        }
        if (error) return { success: false, message: error.message };
      } catch (err: any) {
        console.warn('Supabase createStaffUser error:', err);
      }
    }

    // In-memory mock
    this.staffUsers.unshift(newProfile);
    return { success: true, profile: newProfile, message: 'สร้างบัญชีสตาฟสำเร็จ!' };
  }

  async deleteStaffUser(id: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (!error) return { success: true, message: 'ลบบัญชีผู้ใช้สำเร็จ' };
        return { success: false, message: error.message };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }

    this.staffUsers = this.staffUsers.filter((u) => u.id !== id);
    return { success: true, message: 'ลบบัญชีผู้ใช้สำเร็จ' };
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
