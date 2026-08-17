import { Discovery, RecentDiscoveryItem, VerificationMethod } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { itemService } from './itemService';
import { studentService } from './studentService';
import { authService } from './authService';
import { soundManager } from '@/lib/sound';
import { maskStudentName } from '@/lib/privacy';

export interface DiscoverySubmission {
  qr_token: string;
  student_id?: string;
  manual_student_name?: string;
  manual_student_code?: string;
  staff_id?: string;
  verification_method: VerificationMethod;
  notes?: string;
  idempotency_key?: string;
}

export interface DiscoveryResult {
  success: boolean;
  code: string;
  message: string;
  discovery?: Discovery;
  item_code?: string;
  item_name?: string;
  reward_name?: string;
  student_name?: string;
  discovered_at?: string;
  discovered_by?: string;
  verified_by?: string;
}

class DiscoveryService {
  private discoveries: Discovery[] = [];
  private eventListeners: ((event: { type: 'NEW_DISCOVERY' | 'REVOKED' | 'RESET_ALL'; discovery?: Discovery | null }) => void)[] = [];
  private processedKeys = new Set<string>();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.syncFromStorage();

    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        this.broadcastChannel = new BroadcastChannel('ptech_realtime_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type) {
            this.syncFromStorage();
            this.eventListeners.forEach((cb) => cb(event.data));
          }
        };
      } catch {
        // ignore
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'ptech_discoveries') {
          this.syncFromStorage();
          this.eventListeners.forEach((cb) => cb({ type: 'NEW_DISCOVERY', discovery: this.discoveries[0] }));
        }
      });
    }
  }

  private syncFromStorage() {
    const saved = localStorage.getItem('ptech_discoveries');
    if (saved) {
      try {
        this.discoveries = JSON.parse(saved);
      } catch {
        this.discoveries = [];
      }
    }
  }

  private saveState() {
    localStorage.setItem('ptech_discoveries', JSON.stringify(this.discoveries));
  }

  public onDiscoveryEvent(callback: (event: { type: 'NEW_DISCOVERY' | 'REVOKED' | 'RESET_ALL'; discovery?: Discovery | null }) => void) {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((cb) => cb !== callback);
    };
  }

  private emitEvent(type: 'NEW_DISCOVERY' | 'REVOKED' | 'RESET_ALL', discovery?: Discovery | null) {
    this.eventListeners.forEach((cb) => cb({ type, discovery }));
    
    // Broadcast across browser tabs via permanent BroadcastChannel
    try {
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type, discovery });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ptech_discovery_event', { detail: { type, discovery } }));
      }
    } catch {
      // ignore
    }
  }

  async getAllDiscoveries(): Promise<Discovery[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('discoveries')
        .select('*, item:items(*, item_type:item_types(*)), student:students(*), staff_profile:profiles(*)')
        .order('discovered_at', { ascending: false });
      if (data) return data as Discovery[];
    }
    this.syncFromStorage();
    return this.discoveries;
  }

  async getStaffDiscoveries(staffId: string): Promise<Discovery[]> {
    const all = await this.getAllDiscoveries();
    return all.filter((d) => d.staff_id === staffId);
  }

  // --------------------------------------------------------------------------
  // Atomic Confirm Discovery Method
  // --------------------------------------------------------------------------
  async confirmDiscovery(submission: DiscoverySubmission): Promise<DiscoveryResult> {
    const { qr_token, student_id, manual_student_name, manual_student_code, staff_id, verification_method, notes, idempotency_key } = submission;

    // 1. Idempotency Check (prevent fast double-click from UI)
    if (idempotency_key && this.processedKeys.has(idempotency_key)) {
      return {
        success: false,
        code: 'DUPLICATE_SUBMISSION',
        message: 'คำขอนี้กำลังถูกประมวลผลอยู่แล้ว กรุณาอย่ากดย้ำ',
      };
    }
    if (idempotency_key) {
      this.processedKeys.add(idempotency_key);
    }

    // If Supabase is connected, invoke the server-side RPC atomic function
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('confirm_discovery_atomic', {
        p_qr_token: qr_token,
        p_student_id: student_id || null,
        p_manual_student_name: manual_student_name || null,
        p_manual_student_code: manual_student_code || null,
        p_staff_id: staff_id || null,
        p_verification_method: verification_method,
        p_notes: notes || null,
        p_idempotency_key: idempotency_key || null,
      });

      if (error) {
        soundManager.playError();
        return {
          success: false,
          code: 'DATABASE_ERROR',
          message: 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
        };
      }

      if (!data.success) {
        soundManager.playError();
      } else {
        soundManager.playDiscovery();
      }

      return data as DiscoveryResult;
    }

    // ------------------------------------------------------------------------
    // Local / Dev Mock Atomic Execution Simulation
    // ------------------------------------------------------------------------

    // Lookup item by token or code
    const item = await itemService.getItemByQrToken(qr_token);
    if (!item) {
      soundManager.playError();
      return {
        success: false,
        code: 'INVALID_ITEM',
        message: 'ไม่พบข้อมูลไอเทมนี้ในระบบ หรือ QR Code ไม่ถูกต้อง',
      };
    }

    if (item.status === 'disabled') {
      soundManager.playError();
      return {
        success: false,
        code: 'ITEM_DISABLED',
        message: 'ไอเทมนี้ถูกปิดใช้งานชั่วคราว',
      };
    }

    // Check if item is already claimed
    const existing = this.discoveries.find((d) => d.item_id === item.id && d.status === 'confirmed');
    if (existing) {
      soundManager.playError();
      return {
        success: false,
        code: 'ALREADY_DISCOVERED',
        message: 'ไอเทมนี้ถูกค้นพบไปแล้ว!',
        item_code: item.item_code,
        item_name: item.name,
        discovered_at: existing.discovered_at,
        discovered_by: existing.student?.full_name || existing.manual_student_name || 'Hunter',
        verified_by: existing.staff_profile?.display_name || 'Staff',
      };
    }

    // Retrieve Student
    let student = undefined;
    if (student_id) {
      const allStudents = await studentService.getAllStudents();
      student = allStudents.find((s) => s.id === student_id || s.student_code === student_id);
    }

    const currentProfile = await authService.getCurrentUser();

    // Create New Discovery Record
    const newDiscovery: Discovery = {
      id: 'disc_' + Math.random().toString(36).substring(2, 9),
      item_id: item.id,
      item,
      student_id: student?.id,
      student,
      manual_student_name: manual_student_name || undefined,
      manual_student_code: manual_student_code || undefined,
      staff_id: staff_id || currentProfile?.id,
      staff_profile: currentProfile || undefined,
      verification_method,
      discovered_at: new Date().toISOString(),
      status: 'confirmed',
      reward_claimed: false,
      notes,
      idempotency_key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update Item status
    await itemService.updateItem(item.id, { status: 'discovered' });

    this.discoveries.unshift(newDiscovery);
    this.saveState();

    // Play victory sound and emit real-time event
    soundManager.playDiscovery();
    this.emitEvent('NEW_DISCOVERY', newDiscovery);

    const studentDisplayName = student?.full_name || manual_student_name || 'นักเรียน';

    return {
      success: true,
      code: 'DISCOVERY_CONFIRMED',
      message: 'บันทึกการค้นพบไอเทมสำเร็จ!',
      discovery: newDiscovery,
      item_code: item.item_code,
      item_name: item.name,
      reward_name: item.reward_name,
      student_name: studentDisplayName,
      discovered_at: newDiscovery.discovered_at,
    };
  }

  // --------------------------------------------------------------------------
  // Claim Reward
  // --------------------------------------------------------------------------
  async claimReward(discoveryId: string, staffId: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.rpc('claim_reward_atomic', {
        p_discovery_id: discoveryId,
        p_staff_id: staffId,
      });
      if (error) return { success: false, message: 'เกิดข้อผิดพลาดในการมอบรางวัล' };
      return data;
    }

    const idx = this.discoveries.findIndex((d) => d.id === discoveryId);
    if (idx === -1) return { success: false, message: 'ไม่พบรายการค้นพบ' };

    if (this.discoveries[idx].reward_claimed) {
      return { success: false, message: 'รางวัลสำหรับไอเทมนี้ถูกแจกไปแล้ว' };
    }

    this.discoveries[idx] = {
      ...this.discoveries[idx],
      reward_claimed: true,
      reward_claimed_at: new Date().toISOString(),
      reward_given_by: staffId,
      updated_at: new Date().toISOString(),
    };
    this.saveState();
    soundManager.playClick();
    return { success: true, message: 'บันทึกการมอบรางวัลสำเร็จ!' };
  }

  // --------------------------------------------------------------------------
  // Request Correction (Staff)
  // --------------------------------------------------------------------------
  async requestCorrection(discoveryId: string, note: string): Promise<{ success: boolean; message: string }> {
    const idx = this.discoveries.findIndex((d) => d.id === discoveryId);
    if (idx === -1) return { success: false, message: 'ไม่พบรายการค้นพบ' };

    this.discoveries[idx] = {
      ...this.discoveries[idx],
      status: 'correction_requested',
      correction_note: note,
      updated_at: new Date().toISOString(),
    };
    this.saveState();
    return { success: true, message: 'ส่งคำขอแก้ไขไปยังผู้ดูแลระบบเรียบร้อยแล้ว' };
  }

  // --------------------------------------------------------------------------
  // Revoke Discovery (Admin Only)
  // --------------------------------------------------------------------------
  async revokeDiscovery(discoveryId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const idx = this.discoveries.findIndex((d) => d.id === discoveryId);
    if (idx === -1) return { success: false, message: 'ไม่พบรายการค้นพบ' };

    const disc = this.discoveries[idx];
    disc.status = 'revoked';
    disc.notes = (disc.notes ? disc.notes + ' | ' : '') + `Revoked: ${reason || 'Admin action'}`;
    disc.updated_at = new Date().toISOString();

    // Re-enable item status to 'active'
    if (disc.item_id) {
      await itemService.updateItem(disc.item_id, { status: 'active' });
    }

    this.saveState();
    this.emitEvent('REVOKED', disc);
    return { success: true, message: 'ยกเลิกการค้นพบไอเทมและคืนสถานะไอเทมเรียบร้อยแล้ว' };
  }

  // --------------------------------------------------------------------------
  // Reset All Discoveries (Admin Event Reset with safeguards)
  // --------------------------------------------------------------------------
  async resetAllDiscoveries(): Promise<void> {
    this.discoveries = [];
    this.saveState();

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Delete all discoveries from Supabase
        await supabase.from('discoveries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // 2. Reset all active items status to 'active'
        await supabase.from('items').update({ status: 'active', updated_at: new Date().toISOString() }).neq('status', 'disabled');
        // 3. Clear discovery attempts log
        await supabase.from('discovery_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Supabase reset error:', err);
      }
    }

    const allItems = await itemService.getAllItems();
    for (const it of allItems) {
      await itemService.updateItem(it.id, { status: 'active' });
    }

    this.emitEvent('RESET_ALL', null);
  }
}

export const discoveryService = new DiscoveryService();
