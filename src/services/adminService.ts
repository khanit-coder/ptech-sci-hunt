import { AuditLog, Profile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { itemService } from './itemService';
import { studentService } from './studentService';
import { discoveryService } from './discoveryService';
import { dashboardService } from './dashboardService';
import { authService } from './authService';
import { boothService } from './boothService';

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
      if (data) {
        return data.map((d: any) => {
          let staff_duty = d.staff_duty;
          let assigned_booth_name = d.assigned_booth_name;

          if (!staff_duty && d.full_name) {
            if (d.full_name.includes('ประจำบูธ') || d.full_name.includes('บูท') || d.display_name?.includes('บูท')) {
              staff_duty = 'booth_staff';
              const match = d.full_name.match(/ประจำบูธ:\s*([^)]+)/) || d.full_name.match(/\(([^)]+)\)/);
              if (match) assigned_booth_name = match[1];
            } else if (d.full_name.includes('สแกนไอเท็ม')) {
              staff_duty = 'item_scanner';
            }
          }

          return {
            ...d,
            username: d.username || d.email?.split('@')[0] || d.display_name,
            staff_duty: staff_duty || (d.role === 'staff' ? 'item_scanner' : undefined),
            assigned_booth_name,
          } as Profile;
        });
      }
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
        fullName = `${cleanUsername} (ประจำบูธ: ${payload.assigned_booth_name})`;
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
      password: payload.password?.trim() || undefined,
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
        // 1. Check if profile with this email or username already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.eq.${email},username.eq.${cleanUsername}`)
          .maybeSingle();

        const targetId = existingProfile?.id || newProfile.id;

        const dbPayload: any = {
          id: targetId,
          email: newProfile.email,
          username: cleanUsername,
          password: newProfile.password || null,
          full_name: newProfile.full_name,
          display_name: newProfile.display_name,
          role: newProfile.role,
          staff_duty: newProfile.staff_duty || null,
          assigned_booth_id: newProfile.assigned_booth_id || null,
          assigned_booth_name: newProfile.assigned_booth_name || null,
          is_active: newProfile.is_active,
          created_at: existingProfile?.created_at || newProfile.created_at,
          updated_at: new Date().toISOString(),
        };

        let resultData: any = null;
        let resultError: any = null;

        if (existingProfile) {
          // Update existing account
          const { data, error } = await supabase
            .from('profiles')
            .update(dbPayload)
            .eq('id', existingProfile.id)
            .select()
            .single();
          resultData = data;
          resultError = error;
        } else {
          // Insert new account
          const { data, error } = await supabase
            .from('profiles')
            .insert([dbPayload])
            .select()
            .single();

          if (error && (error.code === '409' || error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('conflict'))) {
            // Fallback: update existing row by email
            const { data: fbData, error: fbError } = await supabase
              .from('profiles')
              .update(dbPayload)
              .eq('email', email)
              .select()
              .single();
            resultData = fbData;
            resultError = fbError;
          } else {
            resultData = data;
            resultError = error;
          }
        }

        if (!resultError && resultData) {
          // Update in-memory cache
          this.staffUsers = this.staffUsers.filter((u) => u.email !== email && u.username !== cleanUsername);
          const finalProfile = { ...newProfile, ...resultData } as Profile;
          this.staffUsers.unshift(finalProfile);

          return { success: true, profile: finalProfile, message: 'สร้าง/อัปเดตบัญชีสตาฟสำเร็จ!' };
        }

        if (resultError) {
          console.warn('Supabase createStaffUser error:', resultError);
          // If Supabase table schema missing columns, retry with basic payload
          const basicPayload = {
            id: targetId,
            email: newProfile.email,
            full_name: newProfile.full_name,
            display_name: newProfile.display_name,
            role: newProfile.role,
            is_active: newProfile.is_active,
            updated_at: new Date().toISOString(),
          };
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .upsert(basicPayload, { onConflict: 'email' })
            .select()
            .single();

          if (!retryError && retryData) {
            this.staffUsers = this.staffUsers.filter((u) => u.email !== email);
            const finalProfile = { ...newProfile, ...retryData } as Profile;
            this.staffUsers.unshift(finalProfile);
            return { success: true, profile: finalProfile, message: 'สร้าง/อัปเดตบัญชีสตาฟสำเร็จ!' };
          }
          return { success: false, message: resultError.message || 'เกิดข้อผิดพลาดในการบันทึกบัญชีสตาฟ' };
        }
      } catch (err: any) {
        console.warn('Supabase createStaffUser exception:', err);
      }
    }

    // In-memory mock
    this.staffUsers = this.staffUsers.filter((u) => u.email !== email && u.username !== cleanUsername);
    this.staffUsers.unshift(newProfile);
    return { success: true, profile: newProfile, message: 'สร้างบัญชีสตาฟสำเร็จ!' };
  }

  async batchCreateStaffUsers(params: {
    prefixUsername: string;
    prefixPassword: string;
    startIndex: number;
    count: number;
    staffDuty: 'item_scanner' | 'booth_staff';
    autoLinkBooths?: boolean;
  }): Promise<{ success: boolean; createdCount: number; message: string; createdList: Profile[] }> {
    const booths = await boothService.getBooths();
    const createdList: Profile[] = [];

    for (let i = 0; i < params.count; i++) {
      const num = params.startIndex + i;
      const padNum = String(num).padStart(2, '0');
      const username = `${params.prefixUsername.trim()}${padNum}`;
      const password = `${params.prefixPassword.trim()}${padNum}`;

      let assignedBoothId: string | undefined;
      let assignedBoothName: string | undefined;

      if (params.staffDuty === 'booth_staff' && params.autoLinkBooths && booths.length > 0) {
        const booth = booths[i % booths.length];
        if (booth) {
          assignedBoothId = booth.id;
          assignedBoothName = booth.name;
        }
      }

      const res = await this.createStaffUser({
        username,
        password,
        role: 'staff',
        staff_duty: params.staffDuty,
        assigned_booth_id: assignedBoothId,
        assigned_booth_name: assignedBoothName,
      });

      if (res.success && res.profile) {
        createdList.push(res.profile);
      }
    }

    const startTag = `${params.prefixUsername.trim()}${String(params.startIndex).padStart(2, '0')}`;
    const endTag = `${params.prefixUsername.trim()}${String(params.startIndex + params.count - 1).padStart(2, '0')}`;

    return {
      success: true,
      createdCount: createdList.length,
      message: `สร้างบัญชีสตาฟแบบกลุ่มสำเร็จจำนวน ${createdList.length} บัญชี (${startTag} ถึง ${endTag})`,
      createdList,
    };
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
    await boothService.resetAllBoothCheckins();
    await this.logAction('EVENT_RESET', 'all_discoveries_and_booths', 'all', { note: 'Hard reset by admin' });
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
