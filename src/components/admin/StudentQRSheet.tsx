import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Student } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import {
  Printer,
  X,
  Users,
  Eye,
  EyeOff,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Download,
} from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  students: Student[];
  onClose: () => void;
}

type LayoutMode = '3x3' | '2x4' | '2x2';
type QRContent = 'student_code' | 'qr_token' | 'full_name';

const LAYOUT_CONFIG: Record<LayoutMode, { cols: number; rows: number; label: string; cardH: string }> = {
  '3x3': { cols: 3, rows: 3, label: '3×3 (9 บัตร/แผ่น)', cardH: '86mm' },
  '2x4': { cols: 2, rows: 4, label: '2×4 (8 บัตร/แผ่น)', cardH: '64mm' },
  '2x2': { cols: 2, rows: 2, label: '2×2 (4 บัตร/แผ่น ขนาดใหญ่)', cardH: '130mm' },
};

export const StudentQRSheet: React.FC<Props> = ({ students, onClose }) => {
  const [showStudentName, setShowStudentName] = useState(true);
  const [showStudentCode, setShowStudentCode] = useState(true);
  const [showClassName, setShowClassName] = useState(true);
  const [qrContent, setQrContent] = useState<QRContent>('student_code');
  const [layout, setLayout] = useState<LayoutMode>('3x3');
  const [previewPage, setPreviewPage] = useState(0);

  const cfg = LAYOUT_CONFIG[layout];
  const itemsPerPage = cfg.cols * cfg.rows;

  // Build pages
  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += itemsPerPage) {
    pages.push(students.slice(i, i + itemsPerPage));
  }

  const getQRValue = (s: Student): string => {
    if (qrContent === 'qr_token' && s.qr_token) return s.qr_token;
    if (qrContent === 'full_name') return s.full_name || s.student_code;
    return s.student_code;
  };

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  const colsClass: Record<LayoutMode, string> = {
    '3x3': 'stu-grid-3x3',
    '2x4': 'stu-grid-2x4',
    '2x2': 'stu-grid-2x2',
  };

  const modalContent = (
    <div
      id="qr-portal-root"
      className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white overflow-y-auto print:bg-white print:text-black print:overflow-visible print:static print:inset-auto print:z-auto"
    >
      {/* ── Top Action Bar (hidden on print) ── */}
      <div className="sticky top-0 z-20 flex flex-col gap-3 p-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 print:hidden no-print">

        {/* Row 1: Title + Close */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <QrCode className="w-5 h-5 text-mario-yellow" />
            <div>
              <h2 className="font-game text-xs text-mario-yellow">STUDENT QR CODE SHEET</h2>
              <p className="text-xs text-slate-400">
                {students.length} คน • {pages.length} แผ่น A4 • Layout: {cfg.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white text-xs font-black shadow-neon-red flex items-center gap-1.5 pixel-btn"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์ (Print A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Row 2: Controls */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Layout Picker */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2">LAYOUT:</span>
            {(Object.keys(LAYOUT_CONFIG) as LayoutMode[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => { soundManager.playClick(); setLayout(l); setPreviewPage(0); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  layout === l
                    ? 'bg-mario-orange text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* QR Content Picker */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2">QR DATA:</span>
            {([
              { v: 'student_code', label: 'รหัสนักเรียน' },
              { v: 'qr_token', label: 'QR Token' },
              { v: 'full_name', label: 'ชื่อ-นามสกุล' },
            ] as { v: QRContent; label: string }[]).map(({ v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => { soundManager.playClick(); setQrContent(v); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  qrContent === v
                    ? 'bg-sci-cyan/20 border border-sci-cyan text-sci-cyan'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Toggle visibility */}
          <div className="flex items-center gap-2">
            {[
              { label: 'ชื่อ', val: showStudentName, set: setShowStudentName },
              { label: 'รหัส', val: showStudentCode, set: setShowStudentCode },
              { label: 'ห้องเรียน', val: showClassName, set: setShowClassName },
            ].map(({ label, val, set }) => (
              <button
                key={label}
                type="button"
                onClick={() => { soundManager.playClick(); set(!val); }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors border ${
                  val
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                {val ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Page navigator */}
        {pages.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>ดูตัวอย่างแผ่น:</span>
            <button
              type="button"
              disabled={previewPage === 0}
              onClick={() => setPreviewPage((p) => p - 1)}
              className="p-1 rounded bg-slate-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-white">
              {previewPage + 1} / {pages.length}
            </span>
            <button
              type="button"
              disabled={previewPage === pages.length - 1}
              onClick={() => setPreviewPage((p) => p + 1)}
              className="p-1 rounded bg-slate-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-slate-500 ml-2">
              (การพิมพ์จะรวมทุกแผ่นอัตโนมัติ)
            </span>
          </div>
        )}
      </div>

      {/* ── Pages Container ── */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 print:p-0 print:m-0 print:max-w-none print:w-full">
        {pages.map((pageStudents, pageIndex) => (
          <div
            key={pageIndex}
            className={`a4-sheet-container bg-white text-slate-950 p-4 rounded-2xl mb-8 shadow-xl print:shadow-none print:rounded-none print:p-0 print:m-0 ${
              pageIndex !== previewPage ? 'print:block hidden' : ''
            }`}
            style={{
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pageIndex < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* Screen indicator (hidden on print) */}
            <div className="text-xs text-slate-500 font-mono mb-3 pb-2 border-b border-slate-200 flex justify-between items-center print:hidden">
              <span className="font-bold text-blue-700">
                แผ่นที่ {pageIndex + 1} / {pages.length} ({pageStudents.length} คน)
              </span>
              <span className="text-slate-600 font-bold">PTECH-Sci 2026 • Student QR</span>
            </div>

            {/* Grid */}
            <div className={`${colsClass[layout]} stu-grid-common`}>
              {pageStudents.map((student, idx) => {
                const qrVal = getQRValue(student);
                const displayName = student.full_name || `${student.first_name} ${student.last_name}`.trim();
                const isExternal = student.student_status === 'external';

                return (
                  <div key={student.id} className="stu-qr-card">
                    {/* Header */}
                    <div className="stu-card-header">
                      <span className="stu-card-tag">PTECH-SCI 2026</span>
                      <span className={`stu-card-badge ${isExternal ? 'stu-badge-ext' : 'stu-badge-std'}`}>
                        {isExternal ? 'EXT' : 'STD'}
                      </span>
                    </div>

                    {/* QR Code */}
                    <div className="stu-qr-box">
                      <QRCodeSVG
                        value={qrVal || student.student_code}
                        size={100}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Student Info */}
                    <div className="stu-info-box">
                      {showStudentCode && (
                        <div className="stu-code">{student.student_code}</div>
                      )}
                      {showStudentName && (
                        <div className="stu-name">{displayName}</div>
                      )}
                      {showClassName && (student.class_name || student.school_name) && (
                        <div className="stu-class">
                          {student.class_name || student.school_name}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
