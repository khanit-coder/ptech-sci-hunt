import React, { useState } from 'react';
import { Student } from '@/types';
import { studentService } from '@/services/studentService';
import { exportService } from '@/services/exportService';
import { soundManager } from '@/lib/sound';
import { ExternalStudentRegisterModal } from '@/components/staff/ExternalStudentRegisterModal';
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
  QrCode
} from 'lucide-react';

interface Props {
  students: Student[];
  onRefresh: () => void;
  onOpenImportWizard: () => void;
}

export const StudentManager: React.FC<Props> = ({ students, onRefresh, onOpenImportWizard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRegisterExtOpen, setIsRegisterExtOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formFirst, setFormFirst] = useState('');
  const [formLast, setFormLast] = useState('');
  const [formClass, setFormClass] = useState('ปวช.1/1');
  const [formDept, setFormDept] = useState('เทคโนโลยีสารสนเทศ');

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.student_code.toLowerCase().includes(q) ||
      s.full_name.toLowerCase().includes(q) ||
      (s.nickname && s.nickname.toLowerCase().includes(q)) ||
      (s.school_name && s.school_name.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.qr_token && s.qr_token.toLowerCase().includes(q)) ||
      s.department?.toLowerCase().includes(q) ||
      s.class_name?.toLowerCase().includes(q)
    );
  });

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
        department: formDept.trim(),
        level: 'ปวช.',
        is_valid: true,
      },
    ]);

    setIsAdding(false);
    setFormCode('');
    setFormFirst('');
    setFormLast('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสนักเรียน, ชื่อ, โรงเรียน, เบอร์โทร..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-mario-orange"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    ไม่พบข้อมูลนักเรียน
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
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
                <label className="block text-slate-300 font-semibold mb-1">รหัสนักเรียน</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">ชื่อ</label>
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
                  <label className="block text-slate-300 font-semibold mb-1">นามสกุล</label>
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
                <label className="block text-slate-300 font-semibold mb-1">ห้องเรียน / ชั้น</label>
                <input
                  type="text"
                  value={formClass}
                  onChange={(e) => setFormClass(e.target.value)}
                  placeholder="เช่น ปวช.1/1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">แผนกวิชา</label>
                <input
                  type="text"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  placeholder="เช่น เทคโนโลยีสารสนเทศ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
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
    </div>
  );
};
