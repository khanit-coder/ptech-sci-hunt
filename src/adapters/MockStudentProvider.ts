import { Student } from '@/types';
import { StudentProvider, StudentSearchFilter, StudentVerificationResult } from './StudentProvider';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's1',
    student_code: '66209010001',
    first_name: 'สมชาย',
    last_name: 'สายวิทย์',
    full_name: 'สมชาย สายวิทย์',
    class_name: 'ปวช.1/1',
    department: 'เทคโนโลยีสารสนเทศ',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's2',
    student_code: '66209010002',
    first_name: 'วิภาดา',
    last_name: 'ใจมั่นคง',
    full_name: 'วิภาดา ใจมั่นคง',
    class_name: 'ปวช.1/1',
    department: 'เทคโนโลยีสารสนเทศ',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's3',
    student_code: '66209010003',
    first_name: 'ธนพล',
    last_name: 'สุขสวัสดิ์',
    full_name: 'ธนพล สุขสวัสดิ์',
    class_name: 'ปวช.1/2',
    department: 'คอมพิวเตอร์ธุรกิจ',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's4',
    student_code: '66209010004',
    first_name: 'กานต์ดา',
    last_name: 'ประเสริฐยิ่ง',
    full_name: 'กานต์ดา ประเสริฐยิ่ง',
    class_name: 'ปวช.2/1',
    department: 'อิเล็กทรอนิกส์',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's5',
    student_code: '66209010005',
    first_name: 'ณัฐวุฒิ',
    last_name: 'ทองคำ',
    full_name: 'ณัฐวุฒิ ทองคำ',
    class_name: 'ปวช.2/2',
    department: 'ช่างยนต์',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's6',
    student_code: '66209010006',
    first_name: 'ปวีณา',
    last_name: 'รุ่งเรือง',
    full_name: 'ปวีณา รุ่งเรือง',
    class_name: 'ปวช.3/1',
    department: 'เทคโนโลยีสารสนเทศ',
    level: 'ปวช.',
    student_status: 'active',
  },
  {
    id: 's7',
    student_code: '66309010007',
    first_name: 'จิรภัทร',
    last_name: 'เก่งกาจ',
    full_name: 'จิรภัทร เก่งกาจ',
    class_name: 'ปวส.1/1',
    department: 'เทคโนโลยีคอมพิวเตอร์',
    level: 'ปวส.',
    student_status: 'active',
  },
  {
    id: 's8',
    student_code: '66309010008',
    first_name: 'สิริพร',
    last_name: 'งามวิไล',
    full_name: 'สิริพร งามวิไล',
    class_name: 'ปวส.1/2',
    department: 'การตลาดดิจิทัล',
    level: 'ปวส.',
    student_status: 'active',
  },
  {
    id: 's9',
    student_code: '66309010009',
    first_name: 'พงศกร',
    last_name: 'เดชารัตน์',
    full_name: 'พงศกร เดชารัตน์',
    class_name: 'ปวส.2/1',
    department: 'แมคคาทรอนิกส์และหุ่นยนต์',
    level: 'ปวส.',
    student_status: 'active',
  },
  {
    id: 's10',
    student_code: '66309010010',
    first_name: 'อารียา',
    last_name: 'พิทักษ์ธรรม',
    full_name: 'อารียา พิทักษ์ธรรม',
    class_name: 'ปวส.2/2',
    department: 'เทคโนโลยีสารสนเทศ',
    level: 'ปวส.',
    student_status: 'active',
  },
];

export class MockStudentProvider implements StudentProvider {
  name = 'Mock Local Student Provider';
  private students: Student[] = [...INITIAL_STUDENTS];

  constructor() {
    const saved = localStorage.getItem('ptech_mock_students');
    if (saved) {
      try {
        this.students = JSON.parse(saved);
      } catch {
        this.students = [...INITIAL_STUDENTS];
      }
    }
  }

  private save() {
    localStorage.setItem('ptech_mock_students', JSON.stringify(this.students));
  }

  public setStudents(students: Student[]) {
    this.students = students;
    this.save();
  }

  public addStudents(newStudents: Student[]) {
    const existingCodes = new Set(this.students.map((s) => s.student_code));
    newStudents.forEach((ns) => {
      if (!existingCodes.has(ns.student_code)) {
        this.students.push(ns);
        existingCodes.add(ns.student_code);
      }
    });
    this.save();
  }

  public upsertStudent(student: Student): Student {
    const idx = this.students.findIndex(
      (s) => s.id === student.id || s.student_code === student.student_code || (student.qr_token && s.qr_token === student.qr_token)
    );
    if (idx >= 0) {
      this.students[idx] = { ...this.students[idx], ...student, updated_at: new Date().toISOString() };
      this.save();
      return this.students[idx];
    } else {
      this.students.unshift(student);
      this.save();
      return student;
    }
  }

  // Handle dynamic QR format e.g. "STU:66209010001:1710000000" or raw student code or external QR token
  async getStudentByQrToken(qrToken: string): Promise<StudentVerificationResult> {
    const now = Date.now();
    const token = qrToken.trim();

    // 1. Check if token is a timed dynamic QR e.g., "PTECH_STU:66209010001:1710123456789"
    if (token.startsWith('PTECH_STU:') || token.startsWith('STU:')) {
      const parts = token.split(':');
      const studentCode = parts[1];
      const timestamp = parseInt(parts[2], 10);

      // Check 5-second expiration rule
      if (!isNaN(timestamp)) {
        const ageMs = now - timestamp;
        if (ageMs > 8000) { // 5-8s window for network tolerance
          return {
            success: false,
            code: 'STUDENT_QR_EXPIRED',
            message: 'STUDENT QR EXPIRED — กรุณาให้นักเรียนเปิด QR Code ใหม่อีกครั้ง (หมดอายุหลัง 5 วินาที)',
            timestamp: new Date().toISOString(),
          };
        }
      }

      return this.getStudentByCode(studentCode);
    }

    // 2. Check if token matches registered external student or QR token
    const extStudent = this.students.find(
      (s) =>
        s.qr_token === token ||
        s.external_id === token ||
        (s.qr_token && s.qr_token.toLowerCase() === token.toLowerCase()) ||
        (s.external_id && s.external_id.toLowerCase() === token.toLowerCase())
    );

    if (extStudent) {
      return {
        success: true,
        code: 'VALID',
        student: extStudent,
        message: `ยืนยันตัวตนน${extStudent.student_status === 'external' ? 'ักเรียนภายนอก' : 'ักเรียน'}สำเร็จ`,
        timestamp: new Date().toISOString(),
      };
    }

    // 3. Direct student code QR
    return this.getStudentByCode(token);
  }

  async getStudentByCode(studentCode: string): Promise<StudentVerificationResult> {
    const cleanCode = studentCode.trim();
    const student = this.students.find((s) => s.student_code === cleanCode || s.student_code.toLowerCase() === cleanCode.toLowerCase());

    if (!student) {
      return {
        success: false,
        code: 'STUDENT_NOT_FOUND',
        message: `ไม่พบข้อมูลนักเรียนรหัส ${cleanCode} ในระบบ`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      code: 'VALID',
      student,
      message: 'ยืนยันตัวตนนักเรียนสำเร็จ',
      timestamp: new Date().toISOString(),
    };
  }

  async searchStudents(filter: StudentSearchFilter): Promise<{ students: Student[]; total: number }> {
    let result = [...this.students];
    const q = filter.query?.toLowerCase().trim();

    if (q) {
      result = result.filter(
        (s) =>
          s.student_code.toLowerCase().includes(q) ||
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          (s.nickname && s.nickname.toLowerCase().includes(q)) ||
          (s.school_name && s.school_name.toLowerCase().includes(q)) ||
          (s.phone && s.phone.includes(q)) ||
          (s.qr_token && s.qr_token.toLowerCase().includes(q)) ||
          s.department?.toLowerCase().includes(q) ||
          s.class_name?.toLowerCase().includes(q)
      );
    }

    if (filter.department) {
      result = result.filter((s) => s.department === filter.department);
    }

    const total = result.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 20;
    const paged = result.slice(offset, offset + limit);

    return { students: paged, total };
  }

  async isHealthy(): Promise<boolean> {
    return true;
  }
}
