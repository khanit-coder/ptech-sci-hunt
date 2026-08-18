import React, { useState, useEffect } from 'react';
import { Student, RegisterExternalStudentInput } from '@/types';
import { studentService } from '@/services/studentService';
import { soundManager } from '@/lib/sound';
import { StaffScanner } from './StaffScanner';
import { 
  UserPlus, 
  QrCode, 
  CheckCircle2, 
  School, 
  Phone, 
  User, 
  Tag, 
  FileText, 
  Sparkles, 
  X, 
  Edit3, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface Props {
  initialQrToken?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: Student) => void;
  title?: string;
}

export const ExternalStudentRegisterModal: React.FC<Props> = ({
  initialQrToken,
  isOpen,
  onClose,
  onSuccess,
  title = 'ลงทะเบียนนักเรียนภายนอกด้วย QR Code',
}) => {
  const [step, setStep] = useState<'scan' | 'form' | 'existing' | 'success'>(initialQrToken ? 'form' : 'scan');
  const [scannedToken, setScannedToken] = useState<string>(initialQrToken || '');
  const [existingStudent, setExistingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [level, setLevel] = useState('มัธยมศึกษา (ม.1-6)');
  const [phone, setPhone] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [notes, setNotes] = useState('');

  // Registered result student
  const [registeredStudent, setRegisteredStudent] = useState<Student | null>(null);

  // If initialQrToken changes
  useEffect(() => {
    if (initialQrToken) {
      handleQrScanned(initialQrToken);
    }
  }, [initialQrToken]);

  if (!isOpen) return null;

  const handleQrScanned = async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) return;

    setScannedToken(cleanToken);
    setErrorMessage(null);
    soundManager.playClick();

    // Check if QR already belongs to an existing student
    const existing = await studentService.findStudentByQr(cleanToken);
    if (existing) {
      setExistingStudent(existing);
      setStep('existing');
    } else {
      // Pre-fill student code with sensible default
      const shortCode = cleanToken.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || Math.random().toString(36).substring(2, 6).toUpperCase();
      setCustomCode(`EXT-${shortCode}`);
      setStep('form');
    }
  };

  const handleEditExisting = () => {
    if (!existingStudent) return;
    setFirstName(existingStudent.first_name || '');
    setLastName(existingStudent.last_name || '');
    setNickname(existingStudent.nickname || '');
    setSchoolName(existingStudent.school_name || '');
    setLevel(existingStudent.level || 'มัธยมศึกษา (ม.1-6)');
    setPhone(existingStudent.phone || '');
    setCustomCode(existingStudent.student_code || '');
    setNotes(existingStudent.notes || '');
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMessage('กรุณาระบุชื่อนักเรียน');
      return;
    }
    if (!scannedToken.trim()) {
      setErrorMessage('ไม่พบข้อมูล QR Code กรุณาสแกนใหม่อีกครั้ง');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: RegisterExternalStudentInput = {
        qr_token: scannedToken.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || undefined,
        school_name: schoolName.trim() || undefined,
        level: level.trim() || undefined,
        class_name: schoolName ? `${schoolName} (${level})` : level,
        department: schoolName.trim() || 'บุคคลภายนอก',
        phone: phone.trim() || undefined,
        student_code: customCode.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await studentService.registerExternalStudent(payload);
      if (res.success && res.student) {
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        soundManager.playDiscovery();
        setRegisteredStudent(res.student);
        setStep('success');
      } else {
        soundManager.playError();
        setErrorMessage(res.message || 'เกิดข้อผิดพลาดในการลงทะเบียน');
      }
    } catch (err: any) {
      soundManager.playError();
      setErrorMessage(err?.message || 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setScannedToken('');
    setExistingStudent(null);
    setRegisteredStudent(null);
    setFirstName('');
    setLastName('');
    setNickname('');
    setSchoolName('');
    setLevel('มัธยมศึกษา (ม.1-6)');
    setPhone('');
    setCustomCode('');
    setNotes('');
    setErrorMessage(null);
    setStep('scan');
  };

  const handleSelectStudent = (student: Student) => {
    soundManager.playClick();
    onSuccess(student);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-mario-orange/70 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-mario-orange/20 border border-mario-orange/40 flex items-center justify-center text-mario-orange">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                ผูก QR Code กับข้อมูลนักเรียนสำหรับร่วมกิจกรรมล่าไอเทม
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          
          {/* STEP 1: SCAN QR CODE */}
          {step === 'scan' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-mario-orange/10 border border-mario-orange/30 text-xs text-mario-orange flex items-center gap-2">
                <QrCode className="w-4 h-4 shrink-0" />
                <span>กรุณาสแกน QR Code (เช่น สายรัดข้อมือ, บัตรผู้เข้าร่วม, บัตรนักเรียนเดิม หรือลิงก์)</span>
              </div>

              <StaffScanner
                isScanning={true}
                onScanSuccess={handleQrScanned}
                label="สแกน QR Code นักเรียนภายนอก"
                subLabel="นำกล้องส่องที่ QR Code หรืออัปโหลดภาพ"
              />
            </div>
          )}

          {/* STEP: EXISTING STUDENT FOUND */}
          {step === 'existing' && existingStudent && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/60 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-game text-xs text-amber-300">
                  QR CODE นี้เคยลงทะเบียนแล้ว
                </h4>
                <p className="text-xs text-slate-300">
                  พบข้อมูลผู้เข้าร่วมงานผูกกับ QR Code นี้เรียบร้อยแล้ว
                </p>
              </div>

              {/* Student Detail Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">รหัสอ้างอิง:</span>
                  <span className="font-mono font-bold text-mario-yellow">{existingStudent.student_code}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">ชื่อ - นามสกุล:</span>
                  <span className="text-white font-bold text-sm">
                    {existingStudent.full_name} {existingStudent.nickname ? `(${existingStudent.nickname})` : ''}
                  </span>
                </div>

                {existingStudent.school_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">โรงเรียน / สถาบัน:</span>
                    <span className="text-slate-200">{existingStudent.school_name}</span>
                  </div>
                )}

                {existingStudent.level && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ระดับชั้น:</span>
                    <span className="text-slate-200">{existingStudent.level}</span>
                  </div>
                )}

                {existingStudent.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">เบอร์โทรติดต่อ:</span>
                    <span className="text-mario-green font-mono">{existingStudent.phone}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-slate-500">QR Token:</span>
                  <span className="font-mono text-slate-400 truncate max-w-[200px]">{existingStudent.qr_token || existingStudent.external_id}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectStudent(existingStudent)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-mario-green to-emerald-500 text-slate-950 font-black text-sm shadow-neon-green hover:opacity-95 transition-all flex items-center justify-center gap-2 pixel-btn"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เลือกนักเรียนคนนี้ทันที</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditExisting}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-mario-yellow text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>แก้ไขข้อมูล</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForNext}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>สแกน QR อื่น</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: FILL REGISTRATION FORM */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Scanned QR Badge */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-mario-orange" />
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono">QR CODE ผูกกับข้อมูลนี้:</span>
                    <span className="font-mono text-xs font-bold text-mario-yellow truncate block max-w-[220px]">
                      {scannedToken}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('scan')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                >
                  เปลี่ยน QR
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ชื่อจริง <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="เช่น สมศักดิ์"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    นามสกุล
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="เช่น รักการเรียน"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
                  />
                </div>
              </div>

              {/* Nickname & School */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ชื่อเล่น
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น น้องนนท์"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-mario-yellow" />
                    <span>โรงเรียน / สถาบัน / สังกัด</span>
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="เช่น โรงเรียนมัธยมวิทยา, บุคคลทั่วไป"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange"
                  />
                </div>
              </div>

              {/* Level & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    ระดับชั้น / ระดับการศึกษา
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-mario-orange"
                  >
                    <option value="มัธยมศึกษาตอนต้น (ม.1-3)">มัธยมศึกษาตอนต้น (ม.1-3)</option>
                    <option value="มัธยมศึกษาตอนปลาย (ม.4-6)">มัธยมศึกษาตอนปลาย (ม.4-6)</option>
                    <option value="ปวช. (อาชีวศึกษา)">ปวช. (อาชีวศึกษา)</option>
                    <option value="ปวส. (ประกาศนียบัตรวิชาชีพชั้นสูง)">ปวส.</option>
                    <option value="ประถมศึกษา">ประถมศึกษา</option>
                    <option value="อุดมศึกษา / ปริญญาตรี">อุดมศึกษา / ปริญญาตรี</option>
                    <option value="บุคคลทั่วไป / ผู้ปกครอง">บุคคลทั่วไป / ผู้ปกครอง</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-mario-green" />
                    <span>เบอร์โทรศัพท์ติดต่อ (ถ้ามี)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 0812345678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-orange font-mono"
                  />
                </div>
              </div>

              {/* Optional Custom Code & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    รหัสอ้างอิง (Student Code)
                  </label>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="เช่น EXT-1001"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono focus:outline-none focus:border-slate-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    หมายเหตุเพิ่มเติม
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น กลุ่มบูธฟิสิกส์"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-slate-600 text-xs"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('scan')}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !firstName.trim()}
                  className="flex-2 py-3 rounded-xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white font-bold text-xs shadow-neon-red hover:opacity-95 transition-all disabled:opacity-50 pixel-btn flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>กำลังบันทึกข้อมูล...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>ยืนยันการลงทะเบียน</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'success' && registeredStudent && (
            <div className="p-6 rounded-3xl bg-gradient-to-b from-mario-green/20 via-slate-950 to-slate-950 border-2 border-mario-green text-center space-y-5 animate-scale-pop">
              <div className="w-16 h-16 rounded-2xl bg-mario-green/20 border-2 border-mario-green flex items-center justify-center mx-auto text-mario-green text-3xl shadow-neon-green">
                ⭐
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mario-green/30 text-mario-green font-mono text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  REGISTRATION COMPLETED
                </span>
                <h3 className="font-game text-sm sm:text-base text-white">
                  {registeredStudent.full_name}
                </h3>
                <p className="text-xs text-mario-yellow mt-0.5">
                  {registeredStudent.school_name || 'นักเรียนภายนอก'} • {registeredStudent.level}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  รหัส: {registeredStudent.student_code}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left text-xs text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">QR Code Token:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[200px]">{registeredStudent.qr_token}</span>
                </div>
                {registeredStudent.phone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">เบอร์โทรศัพท์:</span>
                    <span className="font-mono text-mario-green">{registeredStudent.phone}</span>
                  </div>
                )}
                <p className="text-[11px] text-emerald-400 text-center pt-1 font-semibold">
                  ✓ พร้อมนำ QR Code นี้ไปสแกนรับไอเทมได้ทันที
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectStudent(registeredStudent)}
                  className="w-full py-3.5 rounded-2xl bg-mario-green text-slate-950 font-black text-sm shadow-neon-green hover:opacity-95 transition-all flex items-center justify-center gap-2 pixel-btn"
                >
                  <span>ใช้นักเรียนคนนี้รับไอเทมทันที</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors"
                >
                  ลงทะเบียนนักเรียนคนต่อไป
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
