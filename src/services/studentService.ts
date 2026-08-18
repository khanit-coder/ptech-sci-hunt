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

  async verifyStudentQr(qrToken: string): Promise<StudentVerificationResult> {
    return this.provider.getStudentByQrToken(qrToken);
  }

  async getStudentByCode(code: string): Promise<StudentVerificationResult> {
    return this.provider.getStudentByCode(code);
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

    const studentRecord: Student = {
      id: 'ext_' + Math.random().toString(36).substring(2, 9),
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
      const { data } = await supabase
        .from('students')
        .select('*')
        .or(`student_code.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%,full_name.ilike.%${q}%,school_name.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(limit);
      if (data) return data as Student[];
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
        .limit(300);
      if (data) return data as Student[];
    }
    const res = await this.provider.searchStudents({ limit: 500 });
    return res.students;
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

  // Validate parsed rows against mapped columns
  validateRows(rows: any[], mapping: Record<string, string>): { preview: ImportPreviewRow[]; validCount: number; errorCount: number } {
    const seenCodes = new Set<string>();
    let validCount = 0;
    let errorCount = 0;

    const preview: ImportPreviewRow[] = rows.map((row, idx) => {
      const code = String(row[mapping.student_code] || '').trim();
      const first = String(row[mapping.first_name] || '').trim();
      const last = String(row[mapping.last_name] || '').trim();
      const className = mapping.class_name ? String(row[mapping.class_name] || '').trim() : '';
      const dept = mapping.department ? String(row[mapping.department] || '').trim() : '';
      const level = mapping.level ? String(row[mapping.level] || '').trim() : '';

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
        is_valid: isValid,
        error,
      };
    });

    return { preview, validCount, errorCount };
  }

  // Commit valid student records into Database
  async importStudents(previewRows: ImportPreviewRow[]): Promise<{ imported: number; updated: number; skipped: number; errors: number }> {
    const validRows = previewRows.filter((r) => r.is_valid);
    const newStudents: Student[] = validRows.map((r) => ({
      id: 'stu_' + Math.random().toString(36).substring(2, 9),
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
