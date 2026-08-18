import * as XLSX from 'xlsx';
import { itemService } from './itemService';
import { studentService } from './studentService';
import { discoveryService } from './discoveryService';
import { adminService } from './adminService';
import { dashboardService } from './dashboardService';

class ExportService {
  private downloadFile(content: Blob, filename: string) {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Export Discoveries to Excel / CSV / JSON
  async exportDiscoveries(format: 'xlsx' | 'csv' | 'json' = 'xlsx') {
    const discoveries = await discoveryService.getAllDiscoveries();
    const formatted = discoveries.map((d) => ({
      'รหัสไอเทม': d.item?.item_code || '',
      'ชื่อไอเทม': d.item?.name || '',
      'ประเภท': d.item?.item_type?.name || '',
      'รหัสนักเรียน': d.student?.student_code || d.manual_student_code || '',
      'ชื่อ-นามสกุลนักเรียน': d.student?.full_name || d.manual_student_name || '',
      'ชั้นเรียน': d.student?.class_name || '',
      'แผนกวิชา': d.student?.department || '',
      'วิธีตรวจสอบ': d.verification_method,
      'เวลาที่ค้นพบ': d.discovered_at,
      'สถานะการรับรางวัล': d.reward_claimed ? 'รับแล้ว' : 'ยังไม่ได้รับ',
      'เวลาที่รับรางวัล': d.reward_claimed_at || '-',
      'เจ้าหน้าที่': d.staff_profile?.display_name || '-',
      'หมายเหตุ': d.notes || '',
    }));

    const filename = `ptech_discoveries_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(formatted, null, 2)], { type: 'application/json' });
      this.downloadFile(blob, `${filename}.json`);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Discoveries');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' }); // UTF-8 BOM
      this.downloadFile(blob, `${filename}.csv`);
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.downloadFile(blob, `${filename}.xlsx`);
    }
  }

  // Export Students
  async exportStudents(format: 'xlsx' | 'csv' | 'json' = 'xlsx') {
    const students = await studentService.getAllStudents();
    const formatted = students.map((s) => ({
      'รหัสนักเรียน': s.student_code,
      'ชื่อ': s.first_name,
      'นามสกุล': s.last_name,
      'ชื่อเต็ม': s.full_name,
      'ชื่อเล่น': s.nickname || '',
      'โรงเรียน/สถาบัน': s.school_name || '',
      'ชั้นเรียน': s.class_name || '',
      'แผนกวิชา': s.department || '',
      'ระดับชั้น': s.level || '',
      'เบอร์โทรศัพท์': s.phone || '',
      'QR Code Token': s.qr_token || s.external_id || '',
      'สถานะ': s.student_status || 'active',
    }));

    const filename = `ptech_students_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(formatted, null, 2)], { type: 'application/json' });
      this.downloadFile(blob, `${filename}.json`);
      return;
    }

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csv], { type: 'text/csv;charset=utf-8;' });
      this.downloadFile(blob, `${filename}.csv`);
    } else {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      this.downloadFile(blob, `${filename}.xlsx`);
    }
  }

  // Export Full System Event Backup Snapshot
  async exportFullEventBackup() {
    const items = await itemService.getAllItems();
    const itemTypes = await itemService.getItemTypes();
    const students = await studentService.getAllStudents();
    const discoveries = await discoveryService.getAllDiscoveries();
    const settings = await dashboardService.getSettings();
    const auditLogs = await adminService.getAuditLogs(200);

    const snapshot = {
      event_name: 'PTECH-Sci : Survive in Mario World',
      backup_timestamp: new Date().toISOString(),
      version: '1.0.0',
      settings,
      itemTypes,
      items,
      students,
      discoveries,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, `ptech_event_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  }
}

export const exportService = new ExportService();
