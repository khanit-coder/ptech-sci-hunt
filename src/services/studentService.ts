import { Student, ImportPreviewRow, RegisterExternalStudentInput } from '@/types';
import { StudentProvider, StudentVerificationResult } from '@/adapters/StudentProvider';
import { MockStudentProvider } from '@/adapters/MockStudentProvider';
import { ExternalStudentProvider } from '@/adapters/ExternalStudentProvider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

class StudentService {
  private provider: StudentProvider;

  constructor() {
    // Pick active provider based on environment config
    const useExternal = Boolean(import.meta.env.VITE_EXTERNAL_STUDENT_API_URL);
    this.provider = useExternal ? new ExternalStudentProvider() : new MockStudentProvider();
  }

  public getProvider(): StudentProvider {
    return this.provider;
  }

  public setProvider(provider: StudentProvider) {
    this.provider = provider;
  }

  // Helper to query Supabase for a student by code, qr_token, external_id, or id
  private async findStudentInSupabase(term: string): Promise<Student | null> {
    if (!isSupabaseConfigured || !supabase) return null;
    const clean = term.trim();
    if (!clean) return null;

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
      let query = supabase
        .from('students')
        .select('*');

      if (isUuid) {
        query = query.or(`id.eq.${clean},student_code.eq.${clean},external_id.eq.${clean}`);
      } else {
        query = query.or(`student_code.eq.${clean},external_id.eq.${clean}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return data as Student;
      }

      // Case insensitive match on student_code
      const { data: dataCase, error: errCase } = await supabase
        .from('students')
        .select('*')
        .ilike('student_code', clean)
        .maybeSingle();

      if (!errCase && dataCase) {
        return dataCase as Student;
      }
    } catch (err) {
      console.warn('findStudentInSupabase error:', err);
    }
    return null;
  }

  // Helper to ensure a student record exists in Supabase (upserts if missing)
  async ensureStudentInSupabase(student: Student): Promise<Student> {
    if (!isSupabaseConfigured || !supabase) return student;

    const existing = await this.findStudentInSupabase(student.student_code);
    if (existing) {
      return existing;
    }

    try {
      const generateUuid = () =>
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');

      const isMockUuid = student.id.startsWith('00000000-0000-4000-8000-0000000000');
      const studentId = (!isMockUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(student.id))
        ? student.id
        : generateUuid();

      const recordToInsert = {
        id: studentId,
        student_code: student.student_code,
        first_name: student.first_name,
        last_name: student.last_name,
        class_name: student.class_name || null,
        department: student.department || null,
        level: student.level || null,
        student_status: student.student_status || 'active',
        external_id: student.external_id || null,
      };

      const { data, error } = await supabase
        .from('students')
        .upsert(recordToInsert, { onConflict: 'student_code' })
        .select()
        .single();

      if (!error && data) {
        return data as Student;
      }
    } catch (err) {
      console.warn('ensureStudentInSupabase error:', err);
    }

    return student;
  }

  async verifyStudentQr(qrToken: string): Promise<StudentVerificationResult> {
    const cleanToken = qrToken.trim();
    if (!cleanToken) {
      return { success: false, code: 'INVALID_FORMAT', message: 'กรุณาระบุรหัส QR Code', timestamp: new Date().toISOString() };
    }

    let targetCode = cleanToken;

    if (cleanToken.startsWith('PTECH_STU:') || cleanToken.startsWith('STU:')) {
      const parts = cleanToken.split(':');
      targetCode = parts[1] || '';
      const timestamp = parseInt(parts[2], 10);
      if (!isNaN(timestamp)) {
        const ageMs = Date.now() - timestamp;
        if (ageMs > 8000) {
          return {
            success: false,
            code: 'STUDENT_QR_EXPIRED',
            message: 'STUDENT QR EXPIRED — กรุณาให้นักเรียนเปิด QR Code ใหม่อีกครั้ง (หมดอายุหลัง 5 วินาที)',
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    if (isSupabaseConfigured && supabase) {
      const supaStudent = await this.findStudentInSupabase(targetCode);
      if (supaStudent) {
        return {
          success: true,
          code: 'VALID',
          student: supaStudent,
          message: 'ยืนยันตัวตนนักเรียนสำเร็จ',
          timestamp: new Date().toISOString(),
        };
      }
    }

    const providerResult = await this.provider.getStudentByQrToken(qrToken);
    if (providerResult.success && providerResult.student && isSupabaseConfigured && supabase) {
      const syncedStudent = await this.ensureStudentInSupabase(providerResult.student);
      return {
        ...providerResult,
        student: syncedStudent,
      };
    }

    return providerResult;
  }

  async getStudentByCode(code: string): Promise<StudentVerificationResult> {
    const cleanCode = code.trim();
    if (isSupabaseConfigured && supabase) {
      const supaStudent = await this.findStudentInSupabase(cleanCode);
      if (supaStudent) {
        return {
          success: true,
          code: 'VALID',
          student: supaStudent,
          message: 'ยืนยันตัวตนนักเรียนสำเร็จ',
          timestamp: new Date().toISOString(),
        };
      }
    }

    const providerResult = await this.provider.getStudentByCode(cleanCode);
    if (providerResult.success && providerResult.student && isSupabaseConfigured && supabase) {
      const syncedStudent = await this.ensureStudentInSupabase(providerResult.student);
      return {
        ...providerResult,
        student: syncedStudent,
      };
    }

    return providerResult;
  }

  async findStudentByQr(token: string): Promise<Student | null> {
    const res = await this.verifyStudentQr(token);
    if (res.success && res.student) {
      return res.student;
    }
    const all = await this.getAllStudents();
    const clean = token.trim().toLowerCase();
    const found = all.find(
      (s) =>
        s.student_code.toLowerCase() === clean ||
        (s.external_id && s.external_id.toLowerCase() === clean) ||
        (s.qr_token && s.qr_token.toLowerCase() === clean)
    );
    if (found && isSupabaseConfigured && supabase) {
      return await this.ensureStudentInSupabase(found);
    }
    return found || null;
  }

  async registerExternalStudent(input: RegisterExternalStudentInput): Promise<{ success: boolean; student?: Student; message: string }> {
    const cleanToken = input.qr_token.trim();
    if (!cleanToken) {
      return { success: false, message: 'กรุณาระบุรหัส QR Code' };
    }
    if (!input.first_name.trim()) {
      return { success: false, message: 'กรุณาระบุชื่อนักเรียน' };
    }

    const shortId = cleanToken.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedCode = input.student_code?.trim() || `EXT-${shortId}`;
    const generateUuid = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');

    const studentRecord: Student = {
      id: generateUuid(),
      student_code: generatedCode,


      first_name: input.first_name.trim(),
      last_name: input.last_name?.trim() || '',
      full_name: `${input.first_name.trim()} ${input.last_name?.trim() || ''}`.trim(),
      nickname: input.nickname?.trim() || undefined,
      school_name: input.school_name?.trim() || 'ภายนอก (External)',
      class_name: input.class_name?.trim() || input.level?.trim() || 'นักเรียนภายนอก',
      department: input.department?.trim() || input.school_name?.trim() || 'ภายนอก',
      level: input.level?.trim() || 'ภายนอก',
      student_status: 'external',
      external_id: cleanToken,
      qr_token: cleanToken,
      phone: input.phone?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('students').upsert(studentRecord, { onConflict: 'student_code' }).select().single();
        if (!error && data) {
          return { success: true, student: data as Student, message: 'ลงทะเบียนนักเรียนภายนอกสำเร็จ!' };
        }
      } catch (err) {
        console.warn('Supabase registerExternalStudent error:', err);
      }
    }

    // In-memory / localStorage Mock
    if (this.provider instanceof MockStudentProvider) {
      const saved = this.provider.upsertStudent(studentRecord);
      return { success: true, student: saved, message: 'ลงทะเบียนนักเรียนภายนอกสำเร็จ!' };
    }

    return { success: true, student: studentRecord, message: 'ลงทะเบียนนักเรียนภายนอกสำเร็จ!' };
  }

  async searchStudents(query: string, limit = 15): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const q = query.trim();
      // Only query columns that exist in the Supabase students table
      // school_name, phone, nickname, qr_token are local-only fields for now
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`student_code.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,full_name.ilike.%${q}%`)
        .limit(limit);
      if (!error && data) return data as Student[];
      // If Supabase query fails, fall through to local provider
    }

    const res = await this.provider.searchStudents({ query, limit });
    return res.students;
  }

  async getAllStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('student_code', { ascending: true })
        .limit(1000);
      if (data) return data as Student[];
    }
    const res = await this.provider.searchStudents({ limit: 1000 });
    return res.students;
  }

  async deleteStudent(studentId: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('students').delete().eq('id', studentId);
        if (error) {
          return { success: false, message: error.message || 'ไม่สามารถลบนักเรียนได้' };
        }
        return { success: true, message: 'ลบรายชื่อนักเรียนสำเร็จ' };
      } catch (err: any) {
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการลบ' };
      }
    }

    if (this.provider instanceof MockStudentProvider) {
      this.provider.deleteStudent(studentId);
    }
    return { success: true, message: 'ลบรายชื่อนักเรียนสำเร็จ' };
  }

  async deleteAllStudents(): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          return { success: false, message: error.message || 'ไม่สามารถลบนักเรียนทั้งหมดได้' };
        }
        return { success: true, message: 'ลบรายชื่อนักเรียนทั้งหมดสำเร็จ' };
      } catch (err: any) {
        return { success: false, message: err.message || 'เกิดข้อผิดพลาดในการลบ' };
      }
    }

    if (this.provider instanceof MockStudentProvider) {
      this.provider.clearAllStudents();
    }
    return { success: true, message: 'ลบรายชื่อนักเรียนทั้งหมดสำเร็จ' };
  }

  // --------------------------------------------------------------------------
  // Student Import Wizard Processors
  // --------------------------------------------------------------------------

  // Step 2: Auto-detect column mappings for Thai and English headers
  detectColumnMapping(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {
      student_code: '',
      first_name: '',
      last_name: '',
      class_name: '',
      department: '',
      level: '',
      school_name: '',
    };

    headers.forEach((h) => {
      const clean = h.trim().toLowerCase();

      // Student Code / ID detection
      if (
        clean.includes('รหัส') ||
        clean.includes('student_code') ||
        clean.includes('studentid') ||
        clean.includes('student_id') ||
        clean.includes('code') ||
        clean === 'id'
      ) {
        if (!mapping.student_code) mapping.student_code = h;
      }
      // First Name
      else if (
        clean.includes('ชื่อจริง') ||
        clean.includes('ชื่อ') ||
        clean.includes('first_name') ||
        clean.includes('firstname') ||
        clean === 'fname'
      ) {
        if (!mapping.first_name && !clean.includes('สกุล')) mapping.first_name = h;
      }
      // Last Name
      else if (
        clean.includes('นามสกุล') ||
        clean.includes('สกุล') ||
        clean.includes('last_name') ||
        clean.includes('lastname') ||
        clean === 'lname'
      ) {
        if (!mapping.last_name) mapping.last_name = h;
      }
      // Class Name
      else if (
        clean.includes('ห้อง') ||
        clean.includes('ชั้น') ||
        clean.includes('class') ||
        clean.includes('classroom') ||
        clean.includes('grade')
      ) {
        if (!mapping.class_name) mapping.class_name = h;
      }
      // Department
      else if (
        clean.includes('สาขา') ||
        clean.includes('แผนก') ||
        clean.includes('department') ||
        clean.includes('major')
      ) {
        if (!mapping.department) mapping.department = h;
      }
      // Level
      else if (
        clean.includes('ระดับ') ||
        clean.includes('level') ||
        clean.includes('degree')
      ) {
        if (!mapping.level) mapping.level = h;
      }
      // School Name
      else if (
        clean.includes('โรงเรียน') ||
        clean.includes('สถาบัน') ||
        clean.includes('school') ||
        clean.includes('college')
      ) {
        if (!mapping.school_name) mapping.school_name = h;
      }
    });

    return mapping;
  }

  // Parse uploaded raw file (CSV, XLSX, JSON, TXT)
  async parseRawFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'json') {
      const text = await file.text();
      const rows = JSON.parse(text);
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers, rows };
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers, rows };
    }

    // CSV or TXT (PapaParse)
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          const headers = results.meta.fields || [];
          resolve({ headers, rows: results.data });
        },
        error: (err) => reject(err),
      });
    });
  }

  // Validate parsed rows against mapped columns or fixed custom text values
  validateRows(
    rows: any[],
    mapping: Record<string, string>,
    customValues: Record<string, string> = {}
  ): { preview: ImportPreviewRow[]; validCount: number; errorCount: number } {
    const seenCodes = new Set<string>();
    let validCount = 0;
    let errorCount = 0;

    const preview: ImportPreviewRow[] = rows.map((row, idx) => {
      const getValue = (fieldKey: string) => {
        const mappedCol = mapping[fieldKey];
        if (mappedCol && mappedCol !== '__CUSTOM__' && row[mappedCol] !== undefined) {
          const rawVal = String(row[mappedCol]).trim();
          if (rawVal) return rawVal;
        }
        return customValues[fieldKey]?.trim() || '';
      };

      const code = getValue('student_code');
      const first = getValue('first_name');
      const last = getValue('last_name');
      const className = getValue('class_name');
      const dept = getValue('department');
      const level = getValue('level');
      const schoolName = getValue('school_name');

      let isValid = true;
      let error = '';

      if (!code) {
        isValid = false;
        error = 'ไม่มีรหัสนักเรียน';
      } else if (!first) {
        isValid = false;
        error = 'ไม่มีชื่อ';
      } else if (seenCodes.has(code)) {
        isValid = false;
        error = `รหัสนักเรียน ${code} ซ้ำในไฟล์`;
      }

      if (isValid) {
        seenCodes.add(code);
        validCount++;
      } else {
        errorCount++;
      }

      return {
        row_number: idx + 1,
        student_code: code,
        first_name: first,
        last_name: last,
        class_name: className,
        department: dept,
        level,
        school_name: schoolName,
        is_valid: isValid,
        error,
      };
    });

    return { preview, validCount, errorCount };
  }

  // Commit valid student records into Database
  async importStudents(previewRows: ImportPreviewRow[]): Promise<{ imported: number; updated: number; skipped: number; errors: number }> {
    const validRows = previewRows.filter((r) => r.is_valid);
    const generateUuid = () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padStart(12, '0');

    const newStudents: Student[] = validRows.map((r) => ({
      id: generateUuid(),
      student_code: r.student_code,

      first_name: r.first_name,
      last_name: r.last_name,
      full_name: `${r.first_name} ${r.last_name}`,
      class_name: r.class_name,
      department: r.department,
      level: r.level,
      student_status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('students').upsert(newStudents, { onConflict: 'student_code' });
      if (error) throw error;
      return {
        imported: validRows.length,
        updated: 0,
        skipped: previewRows.length - validRows.length,
        errors: previewRows.filter((r) => !r.is_valid).length,
      };
    }

    // In-memory mock import
    if (this.provider instanceof MockStudentProvider) {
      this.provider.addStudents(newStudents);
    }

    return {
      imported: validRows.length,
      updated: 0,
      skipped: previewRows.length - validRows.length,
      errors: previewRows.filter((r) => !r.is_valid).length,
    };
  }
}

export const studentService = new StudentService();
