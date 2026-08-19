import React, { useState, useMemo } from 'react';
import { Student } from '@/types';
import { studentService } from '@/services/studentService';
import { exportService } from '@/services/exportService';
import { soundManager } from '@/lib/sound';
import { ExternalStudentRegisterModal } from '@/components/staff/ExternalStudentRegisterModal';
import { StudentQRSheet } from '@/components/admin/StudentQRSheet';
import { 
  Users, 
  Search, 
  Upload, 
  Download, 
  Plus, 
  UserCheck, 
  FileSpreadsheet, 
  Trash2,
  X,
  UserPlus,
  QrCode,
  Printer,
  Building2,
  GraduationCap,
  Filter,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';

interface Props {
  students: Student[];
  onRefresh: () => void;
  onOpenImportWizard: () => void;
}

export const StudentManager: React.FC<Props> = ({ students, onRefresh, onOpenImportWizard }) => {
  // Sub-tabs: 'internal' | 'external' | 'all'
  const [subTab, setSubTab] = useState<'internal' | 'external' | 'all'>('internal');

  // Search & Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  
  const [sortBy, setSortBy] = useState<'student_code' | 'full_name' | 'class_name' | 'department' | 'school_name' | 'created_at'>('student_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [isAdding, setIsAdding] = useState(false);
  const [isRegisterExtOpen, setIsRegisterExtOpen] = useState(false);
  const [qrSheetTarget, setQrSheetTarget] = useState<'internal' | 'external' | null>(null);

  // Form states for single student addition
  const [formCode, setFormCode] = useState('');
  const [formFirst, setFormFirst] = useState('');
  const [formLast, setFormLast] = useState('');
  const [formClass, setFormClass] = useState('ปวช.1/1');
  const [formSchool, setFormSchool] = useState('');
  const [formDept, setFormDept] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Count internal vs external
  const internalCount = useMemo(() => students.filter((s) => s.student_status !== 'external').length, [students]);
  const externalCount = useMemo(() => students.filter((s) => s.student_status === 'external').length, [students]);

  // Extract unique options for dropdown filters
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.class_name) set.add(s.class_name);
      if (s.level) set.add(s.level);
    });
    return Array.from(set).sort();
  }, [students]);

  const deptList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [students]);

  const schoolList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.school_name) set.add(s.school_name);
    });
    return Array.from(set).sort();
  }, [students]);

  // 1. Sub-tab filter
  const tabFiltered = useMemo(() => {
    return students.filter((s) => {
      if (subTab === 'internal') return s.student_status !== 'external';
      if (subTab === 'external') return s.student_status === 'external';
      return true;
    });
  }, [students, subTab]);

  // 2. Multi-field search & category filters
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tabFiltered.filter((s) => {
      const matchesQuery =
        !q ||
        s.student_code.toLowerCase().includes(q) ||
        s.full_name.toLowerCase().includes(q) ||
        (s.nickname && s.nickname.toLowerCase().includes(q)) ||
        (s.school_name && s.school_name.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.qr_token && s.qr_token.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.class_name && s.class_name.toLowerCase().includes(q));

      const matchesClass =
        filterClass === 'all' || s.class_name === filterClass || s.level === filterClass;
      const matchesDept = filterDepartment === 'all' || s.department === filterDepartment;
      const matchesSchool = filterSchool === 'all' || s.school_name === filterSchool;

      return matchesQuery && matchesClass && matchesDept && matchesSchool;
    });
  }, [tabFiltered, searchQuery, filterClass, filterDepartment, filterSchool]);

  // 3. Sorting logic
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let valA = (a[sortBy] || '').toString().toLowerCase();
      let valB = (b[sortBy] || '').toString().toLowerCase();

      if (sortBy === 'full_name') {
        valA = a.full_name || '';
        valB = b.full_name || '';
      }

      const comparison = valA.localeCompare(valB, 'th', { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredStudents, sortBy, sortOrder]);

  // Target lists for QR printing (uses sorted/filtered view)
  const printInternalList = useMemo(
    () => sortedStudents.filter((s) => s.student_status !== 'external'),
    [sortedStudents]
  );
  const printExternalList = useMemo(
    () => sortedStudents.filter((s) => s.student_status === 'external'),
    [sortedStudents]
  );

  const handleDeleteStudent = async (s: Student) => {
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบรายชื่อนักเรียน "${s.full_name}" (รหัส: ${s.student_code})?`)) {
      soundManager.playClick();
      const res = await studentService.deleteStudent(s.id);
      if (res.success) {
        onRefresh();
      } else {
        alert(res.message);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (students.length === 0) return;
    soundManager.playError();
    const confirmed = confirm(`⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบรายชื่อนักเรียนทั้งหมดในระบบจำนวน ${students.length} คน?\n\nการดำเนินการนี้ไม่สามารถย้อนกลับได้!`);
    if (!confirmed) return;

    const userInput = prompt(`โปรดพิมพ์คำว่า "DELETE" เพื่อยืนยันการลบนักเรียนทั้งหมด ${students.length} คน:`);
    if (userInput?.toUpperCase() === 'DELETE') {
      soundManager.playClick();
      const res = await studentService.deleteAllStudents();
      if (res.success) {
        alert('ลบรายชื่อนักเรียนทั้งหมดในระบบเรียบร้อยแล้ว');
        onRefresh();
      } else {
        alert(res.message);
      }
    } else if (userInput !== null) {
      alert('คำยืนยันไม่ถูกต้อง ไม่ได้ลบข้อมูล');
    }
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'json') => {
    soundManager.playClick();
    exportService.exportStudents(format);
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    await studentService.importStudents([
      {
        row_number: 1,
        student_code: formCode.trim(),
        first_name: formFirst.trim(),
        last_name: formLast.trim(),
        class_name: formClass.trim(),
        school_name: formSchool.trim() || undefined,
        department: formDept.trim() || undefined,
        phone: formPhone.trim() || undefined,
        level: 'ปวช.',
        is_valid: true,
      },
    ]);

    setIsAdding(false);
    setFormCode('');
    setFormFirst('');
    setFormLast('');
    setFormSchool('');
    setFormDept('');
    setFormPhone('');
    onRefresh();
  };

  return (
    <div className="space-y-5">
      
      {/* ── Sub-Tabs Switcher (นักเรียนภายใน / นักเรียนภายนอก / ทั้งหมด) ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
          <button
            type="button"
            onClick={() => { soundManager.playClick(); setSubTab('internal'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'internal'
                ? 'bg-mario-blue text-white shadow-neon-blue'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>🏢 นักเรียนภายใน ({internalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { soundManager.playClick(); setSubTab('external'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'external'
                ? 'bg-purple-600 text-white shadow-neon-purple'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>🏫 นักเรียนภายนอก ({externalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => { soundManager.playClick(); setSubTab('all'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === 'all'
                ? 'bg-slate-800 text-mario-yellow border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>👥 ทั้งหมด ({students.length})</span>
          </button>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Print Internal Student QR Sheet */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setQrSheetTarget('internal');
            }}
            disabled={printInternalList.length === 0}
            className="px-3.5 py-2 rounded-xl bg-blue-950/80 border border-blue-500/80 text-blue-300 hover:bg-blue-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            title={`พิมพ์ QR Code นักเรียนภายใน (${printInternalList.length} คน)`}
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>พิมพ์ QR นักเรียนภายใน ({printInternalList.length})</span>
          </button>

          {/* Print External Student QR Sheet */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setQrSheetTarget('external');
            }}
            disabled={printExternalList.length === 0}
            className="px-3.5 py-2 rounded-xl bg-purple-950/80 border border-purple-500/80 text-purple-300 hover:bg-purple-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            title={`พิมพ์ QR Code นักเรียนภายนอก (${printExternalList.length} คน)`}
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>พิมพ์ QR นักเรียนภายนอก ({printExternalList.length})</span>
          </button>

          {/* Register External QR Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsRegisterExtOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 hover:bg-emerald-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5 text-mario-green" />
            <span>ลงทะเบียน QR ภายนอก</span>
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2 flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> EXPORT:
            </span>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="px-2 py-1 rounded bg-slate-700 hover:bg-emerald-800 text-slate-200 hover:text-white text-[11px] font-bold"
            >
              Excel
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="px-2 py-1 rounded bg-slate-700 hover:bg-blue-800 text-slate-200 hover:text-white text-[11px] font-bold"
            >
              CSV
            </button>
          </div>

          {/* Delete All Students Button */}
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={students.length === 0}
            className="px-3.5 py-2 rounded-xl bg-red-950/80 border border-red-600/80 text-red-300 hover:bg-red-900 hover:border-red-500 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40"
            title="ลบรายชื่อนักเรียนทั้งหมดในระบบ"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>ลบนักเรียนทั้งหมด ({students.length})</span>
          </button>

          {/* Import Wizard Button */}
          <button
            type="button"
            onClick={onOpenImportWizard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-mario-orange to-mario-yellow text-slate-950 text-xs font-bold shadow hover:opacity-95 transition-all flex items-center gap-1.5 pixel-btn"
          >
            <Upload className="w-4 h-4" />
            <span>นำเข้าไฟล์นักเรียน (Wizard)</span>
          </button>

          {/* Add Single */}
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="p-2 rounded-xl bg-slate-800 text-mario-yellow hover:bg-slate-700 transition-colors"
            title="เพิ่มรายบุคคล"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Search & Filter & Sort Control Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสนักเรียน, ชื่อ, โรงเรียน, เบอร์โทร..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-mario-orange"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-mario-orange" /> ตัวกรอง:
          </span>

          {/* Class / Level Filter */}
          {classList.length > 0 && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none text-xs"
            >
              <option value="all">ทุกระดับชั้น/ห้องเรียน</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          )}

          {/* Department Filter */}
          {deptList.length > 0 && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none text-xs"
            >
              <option value="all">ทุกแผนกวิชา</option>
              {deptList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* School Filter */}
          {schoolList.length > 0 && (
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none text-xs"
            >
              <option value="all">ทุกโรงเรียน/สถานศึกษา</option>
              {schoolList.map((sch) => (
                <option key={sch} value={sch}>{sch}</option>
              ))}
            </select>
          )}

          {(filterClass !== 'all' || filterDepartment !== 'all' || filterSchool !== 'all' || searchQuery.trim() !== '') && (
            <button
              type="button"
              onClick={() => {
                setFilterClass('all');
                setFilterDepartment('all');
                setFilterSchool('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/80 border border-red-700 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1"
              title="ล้างตัวกรองทั้งหมด"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
          <span className="text-[11px] font-mono font-bold text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-mario-yellow" /> เรียงลำดับ:
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium focus:outline-none text-xs"
          >
            <option value="student_code">รหัสนักเรียน</option>
            <option value="full_name">ชื่อ - นามสกุล</option>
            <option value="class_name">ชั้นเรียน / ห้อง</option>
            <option value="department">แผนกวิชา</option>
            <option value="school_name">โรงเรียน</option>
            <option value="created_at">วันที่ลงทะเบียน</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 hover:text-white font-mono font-bold text-xs flex items-center gap-1 transition-all"
            title="สลับลำดับ น้อยไปมาก / มากไปน้อย"
          >
            <span>{sortOrder === 'asc' ? '⬆️ น้อยไปมาก' : '⬇️ มากไปน้อย'}</span>
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">รหัสนักเรียน</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">โรงเรียน / ห้องเรียน</th>
                <th className="py-3.5 px-4">แผนก / สังกัด</th>
                <th className="py-3.5 px-4">เบอร์โทร / QR Token</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-bold">ไม่พบข้อมูลนักเรียนตามเงื่อนไขที่เลือก</p>
                    <p className="text-[11px] text-slate-600">ลองเปลี่ยนแท็บ ค้นหาใหม่ หรือกดล้างตัวกรอง</p>
                  </td>
                </tr>
              ) : (
                sortedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-mario-yellow">
                      {s.student_code}
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{s.full_name}</span>
                        {s.nickname && <span className="text-slate-400 text-[11px]">({s.nickname})</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.school_name || s.class_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {s.department || s.level || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {s.phone ? (
                        <span className="text-mario-green font-bold block">{s.phone}</span>
                      ) : null}
                      {s.qr_token ? (
                        <span className="text-slate-500 truncate block max-w-[140px]">QR: {s.qr_token}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.student_status === 'external' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/90 text-purple-300 border border-purple-700">
                          EXTERNAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-mario-green/20 text-mario-green">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(s)}
                        className="p-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                        title={`ลบรายชื่อ ${s.full_name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Single Student Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-game text-xs text-mario-yellow">ADD SINGLE STUDENT</h3>
              <button onClick={() => setIsAdding(false)} className="p-1 rounded bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSingle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">รหัสนักเรียน <span className="text-mario-red">*</span></label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="เช่น 66209010099"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อ <span className="text-mario-red">*</span></label>
                  <input
                    type="text"
                    required
                    value={formFirst}
                    onChange={(e) => setFormFirst(e.target.value)}
                    placeholder="เช่น สมศักดิ์"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">นามสกุล <span className="text-mario-red">*</span></label>
                  <input
                    type="text"
                    required
                    value={formLast}
                    onChange={(e) => setFormLast(e.target.value)}
                    placeholder="เช่น ใจดี"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ระดับชั้น / ห้องเรียน <span className="text-mario-red">*</span></label>
                <input
                  type="text"
                  required
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  placeholder="เช่น ปวช.1/1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">สถานศึกษา <span className="text-mario-red">*</span></label>
                <input
                  type="text"
                  required
                  value={formSchool}
                  onChange={(e) => setFormSchool(e.target.value)}
                  placeholder="เช่น วิทยาลัยเทคนิค PTECH"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">สาขาวิชา <span className="text-slate-500 font-normal">(ไม่จำเป็น)</span></label>
                <input
                  type="text"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder="เช่น เทคโนโลยีสารสนเทศ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">เบอร์โทร <span className="text-slate-500 font-normal">(ไม่จำเป็น)</span></label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="เช่น 0812345678"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="text-[10px] text-slate-500 font-medium pt-1">
                <span className="text-mario-red">*</span> ข้อมูลที่จำเป็นต้องกรอก
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-mario-orange text-white font-bold shadow-neon-red mt-2"
              >
                บันทึกรายชื่อ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* External Student Register Modal */}
      {isRegisterExtOpen && (
        <ExternalStudentRegisterModal
          isOpen={isRegisterExtOpen}
          onClose={() => setIsRegisterExtOpen(false)}
          onSuccess={() => {
            setIsRegisterExtOpen(false);
            onRefresh();
          }}
        />
      )}

      {/* Student QR Print Sheet Modal */}
      {qrSheetTarget && (
        <StudentQRSheet
          students={qrSheetTarget === 'internal' ? printInternalList : printExternalList}
          title={qrSheetTarget === 'internal' ? 'นักเรียนภายใน (Internal Students)' : 'นักเรียนภายนอก (External Visitors)'}
          onClose={() => setQrSheetTarget(null)}
        />
      )}
    </div>
  );
};
