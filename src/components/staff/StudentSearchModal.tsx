import React, { useState, useEffect } from 'react';
import { Student, VerificationMethod } from '@/types';
import { studentService } from '@/services/studentService';
import { soundManager } from '@/lib/sound';
import { Search, QrCode, User, UserPlus, AlertTriangle, Check, X, Sparkles, School, ArrowRight } from 'lucide-react';
import { StaffScanner } from './StaffScanner';
import { ExternalStudentRegisterModal } from './ExternalStudentRegisterModal';

interface Props {
  onSelectStudent: (student: { student?: Student; manualName?: string; manualCode?: string; method: VerificationMethod }) => void;
  onCancel: () => void;
}

export const StudentSearchModal: React.FC<Props> = ({ onSelectStudent, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'scan_qr' | 'register_ext' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [unrecognizedQrToken, setUnrecognizedQrToken] = useState<string | null>(null);
  const [isRegisterExtOpen, setIsRegisterExtOpen] = useState(false);

  // Manual fallback fields
  const [manualName, setManualName] = useState('');
  const [manualCode, setManualCode] = useState('');

  // Search debouncing
  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await studentService.searchStudents(searchQuery, 15);
        setStudents(results);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleQrScanSuccess = async (decodedText: string) => {
    setQrError(null);
    setUnrecognizedQrToken(null);

    // 1. Try finding student via studentService (checks dynamic token, external QR token, student code, external_id)
    const foundStudent = await studentService.findStudentByQr(decodedText);
    if (foundStudent) {
      soundManager.playDiscovery();
      onSelectStudent({
        student: foundStudent,
        method: foundStudent.student_status === 'external' ? 'external_qr' : 'imported_student',
      });
      return;
    }

    // 2. Try verification method
    const res = await studentService.verifyStudentQr(decodedText);
    if (res.success && res.student) {
      soundManager.playDiscovery();
      onSelectStudent({
        student: res.student,
        method: 'external_qr',
      });
    } else {
      soundManager.playError();
      setQrError(`ไม่พบข้อมูลนักเรียนสำหรับรหัส "${decodedText}"`);
      setUnrecognizedQrToken(decodedText);
    }
  };

  const handleSelect = (s: Student) => {
    soundManager.playClick();
    onSelectStudent({
      student: s,
      method: s.student_status === 'external' ? 'external_qr' : 'imported_student',
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    soundManager.playClick();
    onSelectStudent({
      manualName: manualName.trim(),
      manualCode: manualCode.trim() || undefined,
      method: 'manual_name',
    });
  };

  const handleExternalRegisterSuccess = (newStudent: Student) => {
    setIsRegisterExtOpen(false);
    onSelectStudent({
      student: newStudent,
      method: 'external_qr',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-mario-yellow" />
            <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              IDENTIFY STUDENT
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-3 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
              activeTab === 'search'
                ? 'bg-mario-orange text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ค้นหาชื่อ/รหัส
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scan_qr')}
            className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
              activeTab === 'scan_qr'
                ? 'bg-mario-orange text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            สแกน QR
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register_ext');
              setIsRegisterExtOpen(true);
            }}
            className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeTab === 'register_ext'
                ? 'bg-mario-green text-slate-950 shadow font-extrabold'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <UserPlus className="w-3 h-3" />
            <span>ลงทะเบียน QR</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 px-2 text-[11px] sm:text-xs font-bold rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-mario-orange text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            กรอกเอง
          </button>
        </div>

        {/* TAB 1: Search by Name / Code */}
        {activeTab === 'search' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อ, นามสกุล, โรงเรียน หรือรหัสนักเรียน..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-yellow"
              />
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loading ? (
                <p className="text-center py-8 text-xs text-slate-500">กำลังค้นหา...</p>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-3">
                  <p className="text-xs">ไม่พบรายชื่อที่ตรงกับคำค้น</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => setIsRegisterExtOpen(true)}
                      className="px-4 py-2 rounded-xl bg-mario-green/20 border border-mario-green text-mario-green font-bold text-xs hover:bg-mario-green/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ลงทะเบียนนักเรียนภายนอกใหม่</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-mario-yellow font-bold text-xs hover:bg-slate-700 transition-all"
                    >
                      กรอกชื่อด้วยตนเอง
                    </button>
                  </div>
                </div>
              ) : (
                students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    className="w-full p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-mario-orange/50 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-mario-yellow">
                          {s.student_code}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-white group-hover:text-mario-yellow transition-colors">
                          {s.full_name} {s.nickname ? `(${s.nickname})` : ''}
                        </span>
                        {s.student_status === 'external' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-950/90 text-purple-300 border border-purple-700">
                            EXTERNAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {s.school_name ? `🏫 ${s.school_name}` : s.class_name} {s.department && `• ${s.department}`} {s.phone && `• 📞 ${s.phone}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-mario-orange opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                      เลือก <Check className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Dynamic / External QR Scan */}
        {activeTab === 'scan_qr' && (
          <div className="flex-1 flex flex-col space-y-4">
            <StaffScanner
              isScanning={true}
              onScanSuccess={handleQrScanSuccess}
              label="สแกน QR Code นักเรียน"
              subLabel="รองรับ QR ภายใน และ QR นักเรียนภายนอก"
            />

            {qrError && (
              <div className="p-4 rounded-2xl bg-red-950/80 border border-red-700 text-red-200 text-xs space-y-3 animate-fade-in">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold">ไม่พบข้อมูลนักเรียน</strong>
                    <span>{qrError}</span>
                  </div>
                </div>

                {unrecognizedQrToken && (
                  <div className="pt-2 border-t border-red-800/80 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRegisterExtOpen(true)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-mario-green to-emerald-500 text-slate-950 font-black text-xs shadow-neon-green hover:opacity-95 transition-all flex items-center justify-center gap-1.5 pixel-btn"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ลงทะเบียน QR นี้เป็นนักเรียนภายนอกทันที</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Register External Student Shortcut Tab */}
        {activeTab === 'register_ext' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-mario-green/20 border-2 border-mario-green flex items-center justify-center text-mario-green text-3xl shadow-neon-green animate-bounce">
              <UserPlus className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-game text-sm text-mario-yellow">
                ลงทะเบียนนักเรียนภายนอกด้วย QR Code
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-sm">
                สแกน QR Code (สายรัดข้อมือ, บัตรผู้ร่วมงาน, ลิงก์) แล้วกรอกข้อมูลเพื่อผูกกับนักเรียน
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterExtOpen(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-mario-green to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-neon-green hover:opacity-95 transition-all flex items-center gap-2 pixel-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>เปิดหน้าต่างลงทะเบียน QR</span>
            </button>
          </div>
        )}

        {/* TAB 4: Manual Fallback */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex-1 space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-700/60 text-yellow-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ใช้กรณีไม่มี QR Code หรือต้องการระบุชื่ออย่างรวดเร็ว</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ชื่อ - นามสกุล นักเรียน <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="เช่น นายสมศักดิ์ รักวิทยา"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-mario-yellow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                รหัสนักเรียน / โรงเรียน (ถ้ามี)
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="เช่น 66209010099 หรือ โรงเรียนมัธยมวิทยา"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-mario-yellow"
              />
            </div>

            <button
              type="submit"
              disabled={!manualName.trim()}
              className="w-full py-3 rounded-xl bg-mario-yellow text-slate-950 font-bold text-xs sm:text-sm shadow hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              ยืนยันชื่อนักเรียน
            </button>
          </form>
        )}
      </div>

      {/* External Student Register Modal */}
      {isRegisterExtOpen && (
        <ExternalStudentRegisterModal
          initialQrToken={unrecognizedQrToken || undefined}
          isOpen={isRegisterExtOpen}
          onClose={() => setIsRegisterExtOpen(false)}
          onSuccess={handleExternalRegisterSuccess}
        />
      )}
    </div>
  );
};

