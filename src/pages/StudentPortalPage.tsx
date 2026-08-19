import React, { useState, useEffect, useCallback } from 'react';
import { Student, Booth, BoothCheckin, EventSettings } from '@/types';
import { studentService } from '@/services/studentService';
import { boothService } from '@/services/boothService';
import { dashboardService } from '@/services/dashboardService';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  QrCode,
  User,
  ChevronRight,
  Download,
  RefreshCw,
  CheckCircle2,
  Lock,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

// ─── Letter Cell ─────────────────────────────────────────────────────────────
const LetterCell: React.FC<{
  letter?: string;
  index: number;
  collected: boolean;
}> = ({ letter, index, collected }) => (
  <div
    className={`relative flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
      collected
        ? 'bg-gradient-to-b from-mario-yellow/30 via-slate-900 to-slate-950 border-mario-yellow shadow-neon-yellow'
        : 'bg-slate-900/60 border-slate-800'
    }`}
    style={{ minWidth: 48, minHeight: 56, padding: '4px 6px' }}
  >
    <span
      className={`font-game text-xl font-black leading-none transition-all ${
        collected ? 'text-mario-yellow drop-shadow-[0_0_8px_rgba(249,200,14,0.8)]' : 'text-slate-700'
      }`}
    >
      {collected && letter ? letter : '?'}
    </span>
    <span className="text-[9px] font-mono text-slate-600 mt-1">#{(index + 1).toString().padStart(2, '0')}</span>
    {collected && (
      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-mario-green rounded-full flex items-center justify-center shadow">
        <CheckCircle2 className="w-3 h-3 text-white" />
      </span>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export const StudentPortalPage: React.FC = () => {
  const [step, setStep] = useState<'search' | 'results'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [checkins, setCheckins] = useState<BoothCheckin[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Load global settings & booths once
  useEffect(() => {
    const load = async () => {
      const [s, b] = await Promise.all([
        dashboardService.getSettings(),
        boothService.getBooths(),
      ]);
      setSettings(s);
      setBooths(b.filter((bt) => bt.is_active));
    };
    load();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    const results = await studentService.searchStudents(query.trim(), 10);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectStudent = async (student: Student) => {
    setIsLoading(true);
    setSelectedStudent(student);
    setStep('results');
    const ci = await boothService.getStudentCheckins(student.id);
    setCheckins(ci);
    setIsLoading(false);
  };

  const handleRefresh = async () => {
    if (!selectedStudent) return;
    setIsLoading(true);
    const ci = await boothService.getStudentCheckins(selectedStudent.id);
    setCheckins(ci);
    setIsLoading(false);
  };

  const handleReset = () => {
    setStep('search');
    setQuery('');
    setSearchResults([]);
    setSelectedStudent(null);
    setCheckins([]);
    setShowQR(false);
  };

  const targetWord = settings?.target_word || 'SAVEPTECHWORLD';
  const totalSlotsCount = Math.max(targetWord.length, booths.length, 14);

  // Extract collected letters from student check-ins
  const collectedLetters = checkins.map((c) => c.letter_awarded).filter(Boolean);
  const collectedCount = collectedLetters.length;
  const progress = totalSlotsCount > 0 ? (collectedCount / totalSlotsCount) * 100 : 0;

  // Build grid slots: filled with collected letters in order of collection, followed by locked slots
  const gridSlots = Array.from({ length: totalSlotsCount }).map((_, idx) => {
    const isCollected = idx < collectedLetters.length;
    const letter = isCollected ? collectedLetters[idx] : undefined;
    return { index: idx, collected: isCollected, letter };
  });

  return (
    <div className="min-h-screen bg-mario-deepBg text-slate-100 flex flex-col">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mario-red/20 border border-mario-red/40 flex items-center justify-center">
            <span className="text-base">🎮</span>
          </div>
          <div>
            <span className="font-game text-[10px] text-mario-red block leading-none">PTECH-Sci</span>
            <span className="text-[10px] text-slate-400 font-mono">Student Portal</span>
          </div>
        </div>
        {step === 'results' && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>ค้นหาคนอื่น</span>
          </button>
        )}
      </div>

      {/* ── STEP 1: SEARCH ── */}
      {step === 'search' && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-20 gap-8">
          {/* Hero */}
          <div className="text-center space-y-3 max-w-lg">
            <div className="text-5xl sm:text-6xl mb-4 animate-pixel-float">🔍</div>
            <h1 className="font-game text-base sm:text-xl text-mario-yellow leading-snug">
              ค้นหาตัวอักษรของคุณ
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              ค้นหาด้วยชื่อหรือรหัสนักเรียน เพื่อดู QR Code และตัวอักษรที่สะสมได้
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full max-w-md space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                id="student-portal-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="ชื่อ, นามสกุล, หรือรหัสนักเรียน..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-mario-orange text-white text-sm font-medium placeholder:text-slate-500 focus:outline-none transition-colors"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-black text-sm shadow-neon-red hover:opacity-95 transition-all disabled:opacity-50 pixel-btn flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isSearching ? 'กำลังค้นหา...' : 'ค้นหา'}</span>
            </button>
          </div>

          {/* Results */}
          {searchResults.length > 0 && (
            <div className="w-full max-w-md space-y-2">
              <p className="text-xs text-slate-400 font-mono">พบ {searchResults.length} รายการ — เลือกชื่อของคุณ</p>
              {searchResults.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-mario-orange hover:bg-slate-800/80 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-mario-blue/20 border border-mario-blue/40 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-mario-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{student.full_name}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {student.student_code}
                        {student.class_name && ` • ${student.class_name}`}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-mario-orange transition-colors" />
                </button>
              ))}
            </div>
          )}

          {searchResults.length === 0 && query.trim() && !isSearching && (
            <div className="text-center text-slate-500 text-sm">
              ไม่พบนักเรียนที่ค้นหา — ลองค้นด้วยชื่อหรือรหัสอื่น
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: RESULTS ── */}
      {step === 'results' && selectedStudent && (
        <div className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-2xl mx-auto w-full">
          {/* Student Card */}
          <div className="w-full p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-mario-blue/10 border-2 border-mario-blue/40 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-mario-blue/20 border border-mario-blue/40 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-mario-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg text-white truncate">{selectedStudent.full_name}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  รหัส: <span className="text-mario-yellow font-bold">{selectedStudent.student_code}</span>
                  {selectedStudent.class_name && ` • ${selectedStudent.class_name}`}
                </p>
                {selectedStudent.department && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{selectedStudent.department}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="รีเฟรช"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="w-full">
            {!showQR ? (
              <button
                type="button"
                onClick={() => setShowQR(true)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-mario-green/50 text-mario-green font-bold text-sm flex items-center justify-center gap-2.5 hover:border-mario-green hover:shadow-neon-green transition-all"
              >
                <QrCode className="w-5 h-5" />
                <span>แสดง QR Code ของฉัน</span>
              </button>
            ) : (
              <div className="w-full flex flex-col items-center gap-4 p-6 rounded-3xl bg-white">
                <p className="text-slate-700 text-xs font-bold text-center">
                  📲 บันทึก QR Code ไว้ สำหรับเช็คอินกิจกรรม
                </p>

                <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-xl">
                  <QRCodeSVG
                    value={selectedStudent.student_code}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center">
                  <p className="text-slate-900 font-black text-sm">{selectedStudent.full_name}</p>
                  <p className="text-slate-600 font-mono text-xs">{selectedStudent.student_code}</p>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 border border-blue-300">
                  <Download className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-700 text-[11px] font-bold">กดค้างที่ QR Code เพื่อบันทึก</span>
                </div>
              </div>
            )}
          </div>

          {/* Letter Collection Progress */}
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-mario-yellow" />
                <span className="font-game text-[11px] text-mario-yellow">ตัวอักษรที่สะสมได้</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                {collectedCount} / {totalSlotsCount}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mario-yellow to-mario-orange rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Letter Grid (Unordered to keep secret target word hidden) */}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(48px, 1fr))` }}
            >
              {gridSlots.map(({ index, collected, letter }) => (
                <LetterCell
                  key={index}
                  index={index}
                  collected={collected}
                  letter={letter}
                />
              ))}
            </div>

            {/* Collected summary */}
            {collectedCount > 0 && (
              <div className="p-3 rounded-2xl bg-mario-yellow/10 border border-mario-yellow/30 text-center">
                <p className="text-mario-yellow text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  ตัวอักษรที่สะสมได้ ({collectedCount} ตัว):{' '}
                  <span className="font-game text-sm tracking-wider text-white">
                    {collectedLetters.join('  •  ')}
                  </span>
                </p>
              </div>
            )}

            {collectedCount === 0 && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <Lock className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">ยังไม่ได้เข้าร่วมบูทกิจกรรมใดเลย</p>
                <p className="text-slate-600 text-[11px] mt-1">สแกน QR Code ที่บูทกิจกรรมเพื่อรับตัวอักษร</p>
              </div>
            )}

            {collectedCount >= totalSlotsCount && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-mario-green/20 to-mario-yellow/20 border-2 border-mario-green text-center animate-scale-pop">
                <span className="text-3xl">🎉</span>
                <p className="font-game text-xs text-mario-green mt-2">MISSION COMPLETE!</p>
                <p className="text-slate-300 text-xs mt-1">สะสมตัวอักษรครบตามจำนวนแล้ว!</p>
              </div>
            )}
          </div>

          {/* Booth Check-in History (Only shows booth name and checkin status, hides awarded letter) */}
          {checkins.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-xs text-slate-400 font-mono font-bold uppercase">ประวัติซุ้มกิจกรรมที่เข้าร่วมแล้ว</p>
              <div className="space-y-1.5">
                {checkins.map((ci) => (
                  <div
                    key={ci.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          backgroundColor: `${ci.booth?.color || '#3B82F6'}25`,
                          border: `1.5px solid ${ci.booth?.color || '#3B82F6'}60`,
                        }}
                      >
                        {ci.booth?.icon || '🏛️'}
                      </div>
                      <div>
                        <p className="text-white font-bold">{ci.booth?.name || 'ซุ้มกิจกรรม'}</p>
                        <p className="text-[10px] text-mario-green font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>เช็คอินเข้าร่วมแล้ว</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {new Date(ci.checked_in_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
