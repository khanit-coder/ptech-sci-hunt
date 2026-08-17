import { Student } from '@/types';
import { StudentProvider, StudentSearchFilter, StudentVerificationResult } from './StudentProvider';

export class ExternalStudentProvider implements StudentProvider {
  name = 'College External Student API Provider';
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_EXTERNAL_STUDENT_API_URL || '';
    this.apiKey = import.meta.env.VITE_EXTERNAL_STUDENT_API_KEY || '';
  }

  async getStudentByQrToken(qrToken: string): Promise<StudentVerificationResult> {
    if (!this.apiUrl) {
      return {
        success: false,
        code: 'API_OFFLINE',
        message: 'STUDENT API OFFLINE — กรุณาใช้ระบบค้นหาด้วยชื่อหรือรหัสนักเรียน',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/verify-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ qr_token: qrToken }),
      });

      if (response.status === 410) {
        return {
          success: false,
          code: 'STUDENT_QR_EXPIRED',
          message: 'STUDENT QR EXPIRED — QR Code หมดอายุแล้ว (เปลี่ยนทุก 5 วินาที)',
          timestamp: new Date().toISOString(),
        };
      }

      if (!response.ok) {
        return {
          success: false,
          code: 'STUDENT_NOT_FOUND',
          message: 'ไม่พบข้อมูลนักเรียนจากระบบวิทยาลัย',
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return {
        success: true,
        code: 'VALID',
        student: data.student,
        message: 'ยืนยันตัวตนนักเรียนสำเร็จ',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error('External student API error:', err);
      return {
        success: false,
        code: 'API_OFFLINE',
        message: 'STUDENT API OFFLINE — ไม่สามารถเชื่อมต่อระบบนักเรียนภายนอกได้',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getStudentByCode(studentCode: string): Promise<StudentVerificationResult> {
    if (!this.apiUrl) {
      return {
        success: false,
        code: 'API_OFFLINE',
        message: 'STUDENT API OFFLINE',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/students/${encodeURIComponent(studentCode)}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          code: 'STUDENT_NOT_FOUND',
          message: `ไม่พบข้อมูลนักเรียนรหัส ${studentCode}`,
          timestamp: new Date().toISOString(),
        };
      }

      const data = await response.json();
      return {
        success: true,
        code: 'VALID',
        student: data.student,
        message: 'พบข้อมูลนักเรียน',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: false,
        code: 'API_OFFLINE',
        message: 'STUDENT API OFFLINE',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async searchStudents(filter: StudentSearchFilter): Promise<{ students: Student[]; total: number }> {
    if (!this.apiUrl) {
      return { students: [], total: 0 };
    }

    try {
      const params = new URLSearchParams();
      if (filter.query) params.set('q', filter.query);
      if (filter.department) params.set('department', filter.department);
      if (filter.limit) params.set('limit', String(filter.limit));
      if (filter.offset) params.set('offset', String(filter.offset));

      const res = await fetch(`${this.apiUrl}/students/search?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });

      if (!res.ok) return { students: [], total: 0 };
      const data = await res.json();
      return { students: data.students || [], total: data.total || 0 };
    } catch {
      return { students: [], total: 0 };
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.apiUrl) return false;
    try {
      const res = await fetch(`${this.apiUrl}/health`, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}
