import React, { useState, useEffect } from 'react';
import { Student, VerificationMethod } from '@/types';
import { studentService } from '@/services/studentService';
import { soundManager } from '@/lib/sound';
import { Search, QrCode, User, UserPlus, AlertTriangle, Check, X, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface Props {
  onSelectStudent: (student: { student?: Student; manualName?: string; manualCode?: string; method: VerificationMethod }) => void;
  onCancel: () => void;
}

export const StudentSearchModal: React.FC<Props> = ({ onSelectStudent, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'scan_qr' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Manual fallback fields
  const [manualName, setManualName] = useState('');
  const [manualCode, setManualCode] = useState('');

  // Search debouncing
  useEffect(() => {
    if (activeTab !== 'search') return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await studentService.searchStudents(searchQuery, 10);
        setStudents(results);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Handle QR scanning for dynamic student QR
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerContainerId = 'student-qr-scanner-element';

  const startStudentQrScanner = async () => {
    setQrError(null);
    try {
      const html5Qr = new Html5Qrcode(scannerContainerId);
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          soundManager.playClick();
          try {
            await html5Qr.stop();
          } catch { /* ignore */ }
          setIsCameraActive(false);

          // Verify with Student Provider
          const res = await studentService.verifyStudentQr(decodedText);
          if (res.success && res.student) {
            onSelectStudent({
              student: res.student,
              method: 'external_qr',
            });
          } else {
            soundManager.playError();
            setQrError(res.message || 'QR Code นักเรียนไม่ถูกต้อง');
          }
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch {
      setQrError('ไม่สามารถเปิดกล้องได้');
    }
  };

  const handleSelect = (s: Student) => {
    soundManager.playClick();
    onSelectStudent({
      student: s,
      method: 'imported_student',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-mario-yellow" />
            <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              IDENTIFY STUDENT
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-2 my-4 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
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
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'scan_qr'
                ? 'bg-mario-orange text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            สแกน QR นักเรียน
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-mario-orange text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            กรอกเอง (Fallback)
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
                placeholder="พิมพ์ชื่อ, นามสกุล หรือรหัสนักเรียน..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-yellow"
              />
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {loading ? (
                <p className="text-center py-8 text-xs text-slate-500">กำลังค้นหา...</p>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-slate-500 space-y-2">
                  <p className="text-xs">ไม่พบรายชื่อที่ตรงกับคำค้น</p>
                  <button
                    onClick={() => setActiveTab('manual')}
                    className="text-xs text-mario-yellow underline font-semibold"
                  >
                    กรอกชื่อด้วยตนเอง
                  </button>
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
                        <span className="text-sm font-bold text-white group-hover:text-mario-yellow transition-colors">
                          {s.full_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.class_name} • {s.department}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-mario-orange opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      เลือก <Check className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Dynamic QR Scan */}
        {activeTab === 'scan_qr' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-4 text-center">
            <div id={scannerContainerId} className={`w-full max-w-xs rounded-xl overflow-hidden ${isCameraActive ? 'block' : 'hidden'}`} />

            {!isCameraActive && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-mario-yellow/10 border border-mario-yellow/30 flex items-center justify-center text-mario-yellow">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">สแกน QR Code จากแอปพลิเคชันนักเรียน</p>
                  <p className="text-xs text-slate-400 mt-1">รองรับ Dynamic QR Code ที่เปลี่ยนทุก 5 วินาทีของวิทยาลัย</p>
                </div>
                <button
                  type="button"
                  onClick={startStudentQrScanner}
                  className="px-6 py-2.5 rounded-xl bg-mario-orange text-white font-bold text-xs shadow-neon-red hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>เริ่มสแกน QR นักเรียน</span>
                </button>
              </>
            )}

            {qrError && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{qrError}</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Manual Fallback */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex-1 space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-700/60 text-yellow-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>ใช้กรณีที่ไม่มีข้อมูลในระบบ หรือ Student API ขัดข้อง</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ชื่อ - นามสกุล นักเรียน <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="เช่น นายสมศักดิ์ รักวิทยา"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-mario-yellow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                รหัสนักเรียน (ถ้ามี)
              </label>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="เช่น 66209010099"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-mario-yellow"
              />
            </div>

            <button
              type="submit"
              disabled={!manualName.trim()}
              className="w-full py-3 rounded-xl bg-mario-yellow text-slate-950 font-bold text-sm shadow hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              ยืนยันชื่อนักเรียน
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
