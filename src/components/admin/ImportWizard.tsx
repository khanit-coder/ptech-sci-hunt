import React, { useState } from 'react';
import { studentService } from '@/services/studentService';
import { ImportPreviewRow } from '@/types';
import { soundManager } from '@/lib/sound';
import { 
  Upload, 
  FileCheck, 
  Settings2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  X, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportWizard: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [importResult, setImportResult] = useState<{ imported: number; updated: number; skipped: number; errors: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // STEP 1: File selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    soundManager.playClick();

    setIsProcessing(true);
    try {
      const { headers: detectedHeaders, rows } = await studentService.parseRawFile(selected);
      setHeaders(detectedHeaders);
      setRawRows(rows);

      // STEP 2 & 3: Auto-detect mapping
      const autoMap = studentService.detectColumnMapping(detectedHeaders);
      setMapping(autoMap);
      setStep(3); // Go straight to mapping review
    } catch (err: any) {
      alert('ไม่สามารถอ่านไฟล์ได้: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // STEP 4 & 5: Generate Preview and Validate
  const handleProceedToPreview = () => {
    soundManager.playClick();
    const { preview, validCount: vCount, errorCount: eCount } = studentService.validateRows(rawRows, mapping, customValues);
    setPreviewRows(preview);
    setValidCount(vCount);
    setErrorCount(eCount);
    setStep(4);
  };

  // STEP 6: Execute Import
  const handleExecuteImport = async () => {
    soundManager.playClick();
    setIsProcessing(true);
    try {
      const res = await studentService.importStudents(previewRows);
      setImportResult(res);
      setStep(6);
      onSuccess();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการนำเข้า: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Error Report for rows with validation errors
  const handleDownloadErrorReport = () => {
    soundManager.playClick();
    const errors = previewRows
      .filter((r) => !r.is_valid)
      .map((r) => ({
        'แถวที่': r.row_number,
        'รหัสนักเรียน': r.student_code,
        'ชื่อ': r.first_name,
        'นามสกุล': r.last_name,
        'สาเหตุข้อผิดพลาด': r.error,
      }));

    const ws = XLSX.utils.json_to_sheet(errors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Errors');
    XLSX.writeFile(wb, `student_import_errors_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-3xl w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header with Wizard Step Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
              STUDENT IMPORT WIZARD
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ขั้นตอนที่ {step} จาก 6
            </p>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Timeline */}
        <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shrink-0 text-center font-mono text-[10px]">
          {['1. Upload', '2. Detect', '3. Map', '4. Preview', '5. Validate', '6. Result'].map((label, idx) => (
            <div
              key={idx}
              className={`py-1.5 rounded-lg font-bold transition-colors ${
                step === idx + 1
                  ? 'bg-mario-orange text-white shadow'
                  : step > idx + 1
                  ? 'text-mario-green'
                  : 'text-slate-600'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1 text-xs">
          
          {/* STEP 1: Upload File */}
          {step === 1 && (
            <div className="py-12 border-2 border-dashed border-slate-700 rounded-3xl flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-mario-orange/10 border border-mario-orange/30 flex items-center justify-center text-mario-orange">
                <Upload className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  เลือกไฟล์รายชื่อนักเรียนสำหรับนำเข้า
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  รองรับไฟล์ CSV, Excel (.xlsx, .xls), JSON และ TXT พร้อมหัวตารางภาษาไทย
                </p>
              </div>

              <label className="px-6 py-3 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-bold text-xs shadow-neon-red cursor-pointer hover:opacity-95 transition-opacity pixel-btn">
                <span>เลือกไฟล์จากเครื่อง...</span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls, .json, .txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* STEP 3: Map Columns */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-semibold text-white">ไฟล์: {file?.name}</p>
                <p className="text-[11px] text-slate-400 font-mono">พบ {rawRows.length} รายการ และ {headers.length} คอลัมน์</p>
              </div>

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white text-sm">จับคู่คอลัมน์ในไฟล์ หรือกรอกข้อความที่ใช้ร่วมกันทุกคน:</h4>
                <span className="text-[11px] text-amber-400 font-medium font-mono">💡 หากไฟล์ไม่มีคอลัมน์ สามารถพิมพ์ข้อความระบุตรงๆ ได้ทันที</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { field: 'student_code', label: 'รหัสนักเรียน (เว้นว่างได้ถ้านักเรียนภายนอก)', req: false, placeholder: 'เช่น 66209010001 (เว้นว่างได้ถ้านักเรียนภายนอก)' },
                  { field: 'first_name', label: 'ชื่อจริง *', req: true, placeholder: 'เช่น สมชาย' },
                  { field: 'last_name', label: 'นามสกุล *', req: true, placeholder: 'เช่น สายวิทย์' },
                  { field: 'class_name', label: 'ห้องเรียน / ชั้น', req: false, placeholder: 'เช่น ปวช.1/1' },
                  { field: 'department', label: 'แผนกวิชา / สาขา', req: false, placeholder: 'เช่น เทคโนโลยีสารสนเทศ' },
                  { field: 'level', label: 'ระดับชั้น (ปวช./ปวส.)', req: false, placeholder: 'เช่น ปวช.' },
                  { field: 'school_name', label: 'ชื่อโรงเรียน / สถาบัน', req: false, placeholder: 'เช่น วิทยาลัยเทคโนโลยี...' },
                ].map((item) => (
                  <div key={item.field} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-slate-300 font-semibold text-xs">
                        {item.label}
                      </label>
                      {mapping[item.field] && mapping[item.field] !== '__CUSTOM__' && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">✓ แมปคอลัมน์แล้ว</span>
                      )}
                    </div>

                    <select
                      value={mapping[item.field] || ''}
                      onChange={(e) => setMapping({ ...mapping, [item.field]: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                    >
                      <option value="">-- ไม่ได้เลือกลักษณะคอลัมน์ --</option>
                      <option value="__CUSTOM__">✏️ กรอกข้อความเอง (ระบุให้ทุกคนในไฟล์นี้)</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          คอลัมน์ในไฟล์: {h}
                        </option>
                      ))}
                    </select>

                    {/* Custom text fallback input */}
                    {(mapping[item.field] === '__CUSTOM__' || !mapping[item.field] || customValues[item.field]) && (
                      <div className="mt-1 pt-2 border-t border-slate-800/80 space-y-1">
                        <label className="block text-[10px] text-amber-300 font-medium">
                          {mapping[item.field] === '__CUSTOM__'
                            ? '📝 ข้อความกำหนดเอง (จะใส่ให้ทุกคนในไฟล์นี้):'
                            : '💡 หรือระบุข้อความแทนกรณีไม่มีคอลัมน์นี้:'}
                        </label>
                        <input
                          type="text"
                          placeholder={item.placeholder}
                          value={customValues[item.field] || ''}
                          onChange={(e) => setCustomValues({ ...customValues, [item.field]: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:border-mario-yellow focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 & 5: Preview & Validation */}
          {(step === 4 || step === 5) && (
            <div className="space-y-4">
              {/* Summary Pod */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <span className="text-slate-400 block text-[11px]">ทั้งหมด</span>
                  <span className="font-mono text-xl font-bold text-white">{previewRows.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-center">
                  <span className="text-emerald-300 block text-[11px]">ถูกต้อง</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">{validCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/60 text-center">
                  <span className="text-red-300 block text-[11px]">ข้อผิดพลาด</span>
                  <span className="font-mono text-xl font-bold text-red-400">{errorCount}</span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 font-mono">
                    <tr>
                      <th className="p-2.5">แถว</th>
                      <th className="p-2.5">รหัส</th>
                      <th className="p-2.5">ชื่อ-นามสกุล</th>
                      <th className="p-2.5">ห้อง / แผนก</th>
                      <th className="p-2.5">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {previewRows.slice(0, 20).map((r) => (
                      <tr key={r.row_number} className={r.is_valid ? '' : 'bg-red-950/30'}>
                        <td className="p-2.5 font-mono text-slate-500">{r.row_number}</td>
                        <td className="p-2.5 font-mono font-bold text-mario-yellow">{r.student_code || '-'}</td>
                        <td className="p-2.5 text-white">{r.first_name} {r.last_name}</td>
                        <td className="p-2.5 text-slate-400">{r.class_name} {r.department ? `• ${r.department}` : ''}</td>
                        <td className="p-2.5">
                          {r.is_valid ? (
                            <span className="text-[10px] text-mario-green font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ผ่าน
                            </span>
                          ) : (
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-1" title={r.error}>
                              <AlertTriangle className="w-3.5 h-3.5" /> {r.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 6: Import Result */}
          {step === 6 && importResult && (
            <div className="py-8 text-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-mario-green/20 border border-mario-green flex items-center justify-center mx-auto text-mario-green shadow-neon-green">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-game text-sm text-mario-yellow">
                  IMPORT COMPLETED!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  ระบบได้ประมวลผลและบันทึกข้อมูลนักเรียนเรียบร้อยแล้ว
                </p>
              </div>

              {/* Stats Result Pods */}
              <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">นำเข้าสำเร็จ</span>
                  <span className="font-mono text-xl font-bold text-mario-green">{importResult.imported}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">อัปเดต</span>
                  <span className="font-mono text-xl font-bold text-blue-400">{importResult.updated}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ข้าม</span>
                  <span className="font-mono text-xl font-bold text-slate-400">{importResult.skipped}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ข้อผิดพลาด</span>
                  <span className="font-mono text-xl font-bold text-red-400">{importResult.errors}</span>
                </div>
              </div>

              {importResult.errors > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadErrorReport}
                  className="px-4 py-2 rounded-xl bg-red-950/80 border border-red-700 text-red-300 text-xs font-bold hover:bg-red-900 transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดรายงานข้อผิดพลาด (Error Report)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 shrink-0">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1) as any)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>
          ) : <div />}

          {step === 3 && (
            <button
              type="button"
              disabled={(!mapping.first_name && !customValues.first_name)}
              onClick={handleProceedToPreview}
              className="px-6 py-2.5 rounded-xl bg-mario-orange text-white text-xs font-bold shadow flex items-center gap-1.5 disabled:opacity-50 pixel-btn"
            >
              <span>ตรวจสอบและดูตัวอย่าง</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={validCount === 0 || isProcessing}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-mario-green to-emerald-600 text-slate-950 font-bold text-xs shadow-neon-green flex items-center gap-1.5 disabled:opacity-50 pixel-btn"
            >
              <span>{isProcessing ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า (${validCount} รายชื่อ)`}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-mario-yellow text-slate-950 font-bold text-xs shadow"
            >
              เสร็จสิ้น
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
