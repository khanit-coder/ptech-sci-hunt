import { Booth, BoothCheckin, BoothCheckinResult, Student } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { studentService } from './studentService';

// In-memory mock store for non-Supabase mode
const mockCheckins: BoothCheckin[] = [];

class BoothService {
  // ----------------------------------------------------------------
  // BOOTHS CRUD
  // ----------------------------------------------------------------

  async getBooths(): Promise<Booth[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('booths')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!error && data) return data as Booth[];
    }
    return this.getMockBooths();
  }

  async getBoothById(id: string): Promise<Booth | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('booths')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as Booth;
    }
    return this.getMockBooths().find((b) => b.id === id) || null;
  }

  async createBooth(booth: Omit<Booth, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; booth?: Booth; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('booths')
        .insert({ ...booth })
        .select()
        .single();
      if (error) return { success: false, message: error.message };
      return { success: true, booth: data as Booth, message: 'สร้างบูทสำเร็จ' };
    }
    return { success: false, message: 'ไม่ได้เชื่อมต่อฐานข้อมูล' };
  }

  async updateBooth(id: string, updates: Partial<Omit<Booth, 'id' | 'created_at'>>): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      if (updates.letter_position !== undefined) {
        // Find existing booth that occupies this letter_position
        const { data: conflictBooth } = await client
          .from('booths')
          .select('id, letter_position')
          .eq('letter_position', updates.letter_position)
          .neq('id', id)
          .maybeSingle();

        if (conflictBooth) {
          // Temporarily set conflict booth to negative position to avoid UNIQUE constraint violation (409 Conflict)
          await client.from('booths').update({ letter_position: -9999 }).eq('id', conflictBooth.id);

          // Fetch current booth's old position
          const { data: currentBooth } = await client.from('booths').select('letter_position').eq('id', id).single();
          const oldPos = currentBooth?.letter_position ?? -9998;

          // Perform target update
          const { error } = await client.from('booths').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
          if (error) return { success: false, message: error.message };

          // Move conflicting booth into current booth's old position
          await client.from('booths').update({ letter_position: oldPos }).eq('id', conflictBooth.id);
          return { success: true, message: 'อัปเดตบูทสำเร็จ' };
        }
      }

      const { error } = await client
        .from('booths')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'อัปเดตบูทสำเร็จ' };
    }
    return { success: false, message: 'ไม่ได้เชื่อมต่อฐานข้อมูล' };
  }

  async updateBoothAssignments(updates: { id: string; letter: string; letter_position: number; sort_order?: number }[]): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      try {
        // Pass 1: Assign temporary unique negative positions to all target booths to clear UNIQUE constraint conflicts (409 Conflict)
        const tempPromises = updates.map((u, i) =>
          client
            .from('booths')
            .update({
              letter_position: -1000 - i,
              updated_at: new Date().toISOString(),
            })
            .eq('id', u.id)
        );
        await Promise.all(tempPromises);

        // Pass 2: Assign final target letter, letter_position, and sort_order
        const finalPromises = updates.map((u) =>
          client
            .from('booths')
            .update({
              letter: u.letter,
              letter_position: u.letter_position,
              sort_order: u.sort_order ?? u.letter_position,
              updated_at: new Date().toISOString(),
            })
            .eq('id', u.id)
        );
        await Promise.all(finalPromises);

        return { success: true, message: 'อัปเดตการจัดวางตัวอักษรบูทสำเร็จ' };
      } catch (err: any) {
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการบันทึก' };
      }
    }

    // Mock update
    const mocks = this.getMockBooths();
    updates.forEach((u) => {
      const b = mocks.find((m) => m.id === u.id);
      if (b) {
        b.letter = u.letter;
        b.letter_position = u.letter_position;
        b.sort_order = u.sort_order ?? u.letter_position;
      }
    });
    return { success: true, message: 'อัปเดตการจัดวางตัวอักษรบูทสำเร็จ' };
  }

  async deleteBooth(id: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('booths').delete().eq('id', id);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'ลบบูทสำเร็จ' };
    }
    return { success: false, message: 'ไม่ได้เชื่อมต่อฐานข้อมูล' };
  }

  // ----------------------------------------------------------------
  // CHECK-IN OPERATIONS
  // ----------------------------------------------------------------

  /**
   * Scan student QR (student_code or qr_token) at a booth.
   * Returns letter awarded if successful.
   */
  async checkinStudent(
    boothId: string,
    qrOrCode: string,
    staffId?: string,
  ): Promise<BoothCheckinResult> {
    // 1. Resolve student
    const student = await studentService.findStudentByQr(qrOrCode.trim());
    if (!student) {
      // Try code search fallback
      const byCode = await studentService.getStudentByCode(qrOrCode.trim());
      if (!byCode.success || !byCode.student) {
        return { success: false, code: 'STUDENT_NOT_FOUND', message: 'ไม่พบข้อมูลนักเรียนในระบบ' };
      }
      return this.doCheckin(boothId, byCode.student, staffId);
    }
    return this.doCheckin(boothId, student, staffId);
  }

  private async doCheckin(boothId: string, student: Student, staffId?: string): Promise<BoothCheckinResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('booth_checkin_atomic', {
          p_booth_id: boothId,
          p_student_id: student.id,
          p_staff_id: staffId || null,
        });

        if (!error && data) {
          return { ...(data as BoothCheckinResult), student };
        }

        // Direct table fallback if RPC fails or throws exception
        if (error) {
          console.warn('RPC booth_checkin_atomic error, using direct table fallback:', error);
          const { data: booth } = await supabase.from('booths').select('*').eq('id', boothId).single();
          if (!booth) return { success: false, code: 'BOOTH_NOT_FOUND', message: 'ไม่พบบูทนี้ในระบบ' };

          const { data: existing } = await supabase
            .from('booth_checkins')
            .select('*')
            .eq('booth_id', boothId)
            .eq('student_id', student.id)
            .maybeSingle();

          if (existing) {
            return {
              success: false,
              code: 'ALREADY_CHECKEDIN',
              message: 'นักเรียนเช็คอินบูทนี้แล้ว!',
              letter: booth.letter,
              booth_name: booth.name,
              checked_in_at: existing.checked_in_at,
              student,
            };
          }

          const { data: newCi, error: insertErr } = await supabase
            .from('booth_checkins')
            .insert({
              booth_id: boothId,
              student_id: student.id,
              staff_id: staffId || null,
              letter_awarded: booth.letter,
            })
            .select()
            .single();

          if (!insertErr && newCi) {
            return {
              success: true,
              code: 'CHECKIN_SUCCESS',
              message: `เช็คอินสำเร็จ! ได้รับตัวอักษร ${booth.letter}`,
              letter: booth.letter,
              letter_position: booth.letter_position,
              booth_name: booth.name,
              checkin_id: newCi.id,
              student,
            };
          }

          if (insertErr?.code === '23505') {
            return {
              success: false,
              code: 'ALREADY_CHECKEDIN',
              message: 'นักเรียนเช็คอินบูทนี้แล้ว!',
              letter: booth.letter,
              booth_name: booth.name,
              student,
            };
          }

          return { success: false, code: 'DATABASE_ERROR', message: error.message };
        }
      } catch (err: any) {
        console.error('doCheckin exception:', err);
      }
    }

    // Mock mode
    const booth = this.getMockBooths().find((b) => b.id === boothId);
    if (!booth) return { success: false, code: 'BOOTH_NOT_FOUND', message: 'ไม่พบบูทนี้' };

    const already = mockCheckins.find((c) => c.booth_id === boothId && c.student_id === student.id);
    if (already) {
      return {
        success: false,
        code: 'ALREADY_CHECKEDIN',
        message: 'นักเรียนเช็คอินบูทนี้แล้ว!',
        letter: booth.letter,
        booth_name: booth.name,
        checked_in_at: already.checked_in_at,
        student,
      };
    }

    const newCheckin: BoothCheckin = {
      id: 'mock-' + Math.random().toString(36).substring(2, 9),
      booth_id: boothId,
      student_id: student.id,
      student,
      letter_awarded: booth.letter,
      checked_in_at: new Date().toISOString(),
    };
    mockCheckins.push(newCheckin);

    return {
      success: true,
      code: 'CHECKIN_SUCCESS',
      message: `เช็คอินสำเร็จ! ได้รับตัวอักษร ${booth.letter}`,
      letter: booth.letter,
      letter_position: booth.letter_position,
      booth_name: booth.name,
      student,
    };
  }

  // ----------------------------------------------------------------
  // QUERY CHECKINS
  // ----------------------------------------------------------------

  async getBoothCheckins(boothId: string, limitToday = false): Promise<BoothCheckin[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('booth_checkins')
        .select('*, student:students(id, student_code, first_name, last_name, full_name, class_name, department)')
        .eq('booth_id', boothId)
        .order('checked_in_at', { ascending: false });

      if (limitToday) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('checked_in_at', startOfDay.toISOString());
      }

      const { data, error } = await query.limit(200);
      if (!error && data) return data as BoothCheckin[];
    }
    return mockCheckins.filter((c) => c.booth_id === boothId);
  }

  async getStudentCheckins(studentId: string): Promise<BoothCheckin[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('booth_checkins')
        .select('*, booth:booths(*)')
        .eq('student_id', studentId)
        .order('checked_in_at', { ascending: false });
      if (!error && data) return data as BoothCheckin[];
    }
    return mockCheckins.filter((c) => c.student_id === studentId);
  }

  async getAllCheckins(): Promise<BoothCheckin[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('booth_checkins')
        .select('*, booth:booths(*), student:students(id, student_code, first_name, last_name, full_name, class_name)')
        .order('checked_in_at', { ascending: false })
        .limit(500);
      if (!error && data) return data as BoothCheckin[];
    }
    return mockCheckins;
  }

  async deleteCheckin(checkinId: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('booth_checkins').delete().eq('id', checkinId);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'ลบการเช็คอินสำเร็จ' };
    }
    return { success: false, message: 'ไม่ได้เชื่อมต่อฐานข้อมูล' };
  }

  async resetAllBoothCheckins(): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('booth_checkins')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'ลบข้อมูลการเช็คอินบูททั้งหมดสำเร็จ' };
      } catch (err: any) {
        return { success: false, message: err.message };
      }
    }
    mockCheckins.length = 0;
    return { success: true, message: 'ลบข้อมูลการเช็คอินบูททั้งหมดสำเร็จ' };
  }

  // ----------------------------------------------------------------
  // MOCK DATA
  // ----------------------------------------------------------------

  private getMockBooths(): Booth[] {
    const word = 'SAVEPTECHWORLD';
    const names = [
      'บูทฟิสิกส์', 'บูทเคมี', 'บูทชีววิทยา', 'บูทคณิตศาสตร์',
      'บูทดาราศาสตร์', 'บูทเทคโนโลยี', 'บูทสิ่งแวดล้อม', 'บูทหุ่นยนต์',
      'บูทพลังงาน', 'บูทสุขภาพ', 'บูทวัสดุศาสตร์', 'บูทอวกาศ',
      'บูทนวัตกรรม', 'บูทเกษตร',
    ];
    const colors = [
      '#EF4444', '#F97316', '#EAB308', '#22C55E',
      '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899',
      '#14B8A6', '#F59E0B', '#84CC16', '#6366F1',
      '#D946EF', '#10B981',
    ];
    return Array.from(word).map((letter, i) => ({
      id: `mock-booth-${i}`,
      name: names[i] || `บูทที่ ${i + 1}`,
      letter: letter.toUpperCase(),
      letter_position: i,
      icon: '🏛️',
      color: colors[i] || '#3B82F6',
      is_active: true,
      sort_order: i,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
  }
}

export const boothService = new BoothService();
