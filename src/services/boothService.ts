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
      const { error } = await supabase
        .from('booths')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return { success: false, message: error.message };
      return { success: true, message: 'อัปเดตบูทสำเร็จ' };
    }
    return { success: false, message: 'ไม่ได้เชื่อมต่อฐานข้อมูล' };
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
      const { data, error } = await supabase.rpc('booth_checkin_atomic', {
        p_booth_id: boothId,
        p_student_id: student.id,
        p_staff_id: staffId || null,
      });
      if (error) return { success: false, code: 'DATABASE_ERROR', message: error.message };
      return { ...(data as BoothCheckinResult), student };
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
      '#EF4444','#F97316','#EAB308','#22C55E',
      '#06B6D4','#3B82F6','#8B5CF6','#EC4899',
      '#14B8A6','#F59E0B','#84CC16','#6366F1',
      '#D946EF','#10B981',
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
