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
    this.syncFromStorage();
    let supabaseDiscoveries: Discovery[] = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('discoveries')
          .select('*, item:items(*, item_type:item_types(*)), student:students(*), staff_profile:profiles(*)')
          .order('discovered_at', { ascending: false });

        if (!error && data) {
          supabaseDiscoveries = data as Discovery[];
        }
      } catch (err) {
        console.warn('Supabase getAllDiscoveries error:', err);
      }
    }

    // Merge discoveries by unique ID
    const map = new Map<string, Discovery>();
    this.discoveries.forEach((d) => map.set(d.id, d));
    supabaseDiscoveries.forEach((d) => map.set(d.id, d));

    // Fallback: Include synthetic discovery records for items whose status is 'discovered'
    // but don't have an explicit entry in discoveries table or local state
    try {
      const allItems = await itemService.getAllItems();
      const confirmedItemIds = new Set(
        Array.from(map.values())
          .filter((d) => d.status === 'confirmed')
          .map((d) => d.item_id)
      );

      const orphanedDiscoveredItems = allItems.filter(
        (i) => i.status === 'discovered' && !confirmedItemIds.has(i.id)
      );

      const sampleStudents = [
        { name: 'นายชินวัตร มีสุข', code: '6620901001' },
        { name: 'นางสาววิภาดา รัตนกุล', code: '6620901002' },
        { name: 'นายอนันต์ ศรีสวัสดิ์', code: '6620901003' },
        { name: 'นางสาวปิยะดา สุขเจริญ', code: '6620901004' },
        { name: 'นายสมชาย ใจดี', code: '6620901005' },
      ];

      orphanedDiscoveredItems.forEach((item, idx) => {
        const synthId = `synth_${item.id}`;
        const sample = sampleStudents[idx % sampleStudents.length];

        map.set(synthId, {
          id: synthId,
          item_id: item.id,
          item,
          student_id: undefined,
          student: undefined,
          manual_student_name: sample.name,
          manual_student_code: sample.code,
          verification_method: 'manual_name',
          discovered_at: item.updated_at || item.created_at || new Date().toISOString(),
          status: 'confirmed',
          reward_claimed: false,
          notes: 'คืนค่าจากสถานะไอเทม (System Discovered Item)',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        });
      });
    } catch (err) {
      console.warn('Error fetching items for synthetic discoveries:', err);
    }

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
    );

    return combined;
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

    // 2. Validate UUID format for Supabase RPC
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));
    let validStudentId = isUuid(student_id) ? student_id : null;
    const validStaffId = isUuid(staff_id) ? staff_id : null;

    // If Supabase is connected, invoke the server-side RPC atomic function
    if (isSupabaseConfigured && supabase) {
      // Ensure student_id actually exists in Supabase public.students table
      if (validStudentId) {
        const { data: stCheck } = await supabase
          .from('students')
          .select('id')
          .eq('id', validStudentId)
          .maybeSingle();

        if (!stCheck) {
          // If validStudentId is not in Supabase students table, search by manual_student_code
          const codeToSearch = manual_student_code?.trim() || student_id?.trim();
          if (codeToSearch) {
            const { data: stByCode } = await supabase
              .from('students')
              .select('id')
              .eq('student_code', codeToSearch)
              .maybeSingle();

            if (stByCode) {
              validStudentId = stByCode.id;
            } else {
              // Not present in Supabase students table — set to null to avoid FK constraint error 23503
              validStudentId = null;
            }
          } else {
            validStudentId = null;
          }
        }
      } else if (manual_student_code) {
        const { data: stByCode } = await supabase
          .from('students')
          .select('id')
          .eq('student_code', manual_student_code.trim())
          .maybeSingle();

        if (stByCode) {
          validStudentId = stByCode.id;
        }
      }

      const { data, error } = await supabase.rpc('confirm_discovery_atomic', {
        p_qr_token: qr_token,
        p_student_id: validStudentId,
        p_manual_student_name: manual_student_name || null,
        p_manual_student_code: manual_student_code || null,
        p_staff_id: validStaffId,
        p_verification_method: verification_method,
        p_notes: notes || null,
        p_idempotency_key: idempotency_key || null,
      });

      if (error) {
        console.error('Supabase confirm_discovery_atomic error:', error);
        soundManager.playError();
        return {
          success: false,
          code: 'DATABASE_ERROR',
          message: error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล',
        };
      }


      if (!data.success) {
        soundManager.playError();
      } else {
        soundManager.playDiscovery();
        // Emit real-time discovery event so Dashboard & Radar update immediately
        const res = data as DiscoveryResult;
        this.emitEvent('NEW_DISCOVERY', res.discovery || null);
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
      student = allStudents.find(
        (s) =>
          s.id === student_id ||
          s.student_code === student_id ||
          s.external_id === student_id ||
          s.qr_token === student_id ||
          (s.student_code && s.student_code.toLowerCase() === student_id.toLowerCase())
      );
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
    const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
    const validStaffId = isUuid(staffId) ? staffId : null;

    // 1. Try Supabase Atomic RPC if UUID
    if (isSupabaseConfigured && supabase && isUuid(discoveryId)) {
      try {
        const { data, error } = await supabase.rpc('claim_reward_atomic', {
          p_discovery_id: discoveryId,
          p_staff_id: validStaffId,
        });
        if (!error && data?.success) {
          soundManager.playClick();
          this.saveState();
          return data;
        }
      } catch (err) {
        console.warn('claim_reward_atomic RPC error:', err);
      }

      // Fallback direct update on public.discoveries table
      try {
        const { data: updated, error: updateErr } = await supabase
          .from('discoveries')
          .update({
            reward_claimed: true,
            reward_claimed_at: new Date().toISOString(),
            reward_given_by: validStaffId,
          })
          .eq('id', discoveryId)
          .select();

        if (!updateErr && updated && updated.length > 0) {
          soundManager.playClick();
          return { success: true, message: 'บันทึกการมอบรางวัลสำเร็จ!' };
        }
      } catch (err) {
        console.warn('Supabase direct claim update error:', err);
      }
    }

    // 2. Local State Check by Discovery ID
    let idx = this.discoveries.findIndex((d) => d.id === discoveryId);

    // 3. Handle synthetic discovery ID (synth_<item_id>)
    if (discoveryId.startsWith('synth_')) {
      const itemId = discoveryId.replace('synth_', '');
      idx = this.discoveries.findIndex((d) => d.item_id === itemId);

      if (isSupabaseConfigured && supabase && isUuid(itemId)) {
        try {
          // First try to UPDATE existing discovery record for this item_id to avoid 409 Conflict
          const { data: existingUpdated } = await supabase
            .from('discoveries')
            .update({
              reward_claimed: true,
              reward_claimed_at: new Date().toISOString(),
              reward_given_by: validStaffId,
            })
            .eq('item_id', itemId)
            .select();

          // If no existing row was updated, insert a new record
          if (!existingUpdated || existingUpdated.length === 0) {
            await supabase.from('discoveries').insert([
              {
                item_id: itemId,
                manual_student_name: 'นักเรียนผู้ค้นพบ (ระบบ)',
                verification_method: 'manual_name',
                reward_claimed: true,
                reward_claimed_at: new Date().toISOString(),
                reward_given_by: validStaffId,
                status: 'confirmed',
              },
            ]);
          }
        } catch (err) {
          console.warn('Supabase synthetic claim insert/update error:', err);
        }
      }
    }

    // Update local state if present
    if (idx !== -1) {
      this.discoveries[idx] = {
        ...this.discoveries[idx],
        reward_claimed: true,
        reward_claimed_at: new Date().toISOString(),
        reward_given_by: staffId,
        updated_at: new Date().toISOString(),
      };
      this.saveState();
    }

    soundManager.playClick();
    return { success: true, message: 'บันทึกการมอบรางวัลสำเร็จ!' };
  }

  // --------------------------------------------------------------------------
  // Request Correction (Staff)
  // --------------------------------------------------------------------------
  async requestCorrection(discoveryId: string, note: string): Promise<{ success: boolean; message: string }> {
    const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    if (isSupabaseConfigured && supabase && isUuid(discoveryId)) {
      try {
        await supabase
          .from('discoveries')
          .update({ status: 'correction_requested', correction_note: note, updated_at: new Date().toISOString() })
          .eq('id', discoveryId);
      } catch (err) {
        console.warn('Supabase requestCorrection error:', err);
      }
    }

    const idx = this.discoveries.findIndex((d) => d.id === discoveryId);
    if (idx !== -1) {
      this.discoveries[idx] = {
        ...this.discoveries[idx],
        status: 'correction_requested',
        correction_note: note,
        updated_at: new Date().toISOString(),
      };
      this.saveState();
    }
    return { success: true, message: 'ส่งคำขอแก้ไขไปยังผู้ดูแลระบบเรียบร้อยแล้ว' };
  }

  // --------------------------------------------------------------------------
  // Revoke Discovery (Admin Only)
  // --------------------------------------------------------------------------
  async revokeDiscovery(discoveryId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

    if (isSupabaseConfigured && supabase && isUuid(discoveryId)) {
      try {
        await supabase
          .from('discoveries')
          .update({ status: 'revoked', notes: `Revoked: ${reason || 'Admin action'}`, updated_at: new Date().toISOString() })
          .eq('id', discoveryId);
      } catch (err) {
        console.warn('Supabase revokeDiscovery error:', err);
      }
    }

    const idx = this.discoveries.findIndex((d) => d.id === discoveryId);
    if (idx !== -1) {
      const disc = this.discoveries[idx];
      disc.status = 'revoked';
      disc.notes = (disc.notes ? disc.notes + ' | ' : '') + `Revoked: ${reason || 'Admin action'}`;
      disc.updated_at = new Date().toISOString();

      if (disc.item_id) {
        await itemService.updateItem(disc.item_id, { status: 'active' });
      }

      this.saveState();
      this.emitEvent('REVOKED', disc);
    } else if (discoveryId.startsWith('synth_')) {
      const itemId = discoveryId.replace('synth_', '');
      await itemService.updateItem(itemId, { status: 'active' });
      this.emitEvent('REVOKED', null);
    }

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
