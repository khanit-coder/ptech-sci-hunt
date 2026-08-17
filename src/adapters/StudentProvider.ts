import { Student } from '@/types';

export interface StudentVerificationResult {
  success: boolean;
  student?: Student;
  code?: 'VALID' | 'STUDENT_QR_EXPIRED' | 'STUDENT_NOT_FOUND' | 'API_OFFLINE' | 'INVALID_FORMAT';
  message: string;
  timestamp: string;
}

export interface StudentSearchFilter {
  query?: string;
  department?: string;
  className?: string;
  limit?: number;
  offset?: number;
}

export interface StudentProvider {
  name: string;
  getStudentByQrToken(qrToken: string): Promise<StudentVerificationResult>;
  getStudentByCode(studentCode: string): Promise<StudentVerificationResult>;
  searchStudents(filter: StudentSearchFilter): Promise<{ students: Student[]; total: number }>;
  isHealthy(): Promise<boolean>;
}
