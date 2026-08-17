import React, { useState, useEffect } from 'react';
import { Item, Student, Discovery, VerificationMethod, Profile } from '@/types';
import { itemService } from '@/services/itemService';
import { discoveryService, DiscoveryResult } from '@/services/discoveryService';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { generateIdempotencyKey, formatDate } from '@/lib/utils';
import { StaffScanner } from '@/components/staff/StaffScanner';
import { StudentSearchModal } from '@/components/staff/StudentSearchModal';
import { DiscoveryConfirmDialog } from '@/components/staff/DiscoveryConfirmDialog';
import { StaffHistoryList } from '@/components/staff/StaffHistoryList';
import { LiveStatusBadge } from '@/components/dashboard/LiveStatusBadge';
import { 
  ScanLine, 
  CheckCircle2, 
  AlertTriangle, 
  Gift, 
  RotateCcw, 
  UserCheck, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Clock,
  User,
  History
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeStep, setActiveStep] = useState<'scan_item' | 'preview_item' | 'success' | 'already_discovered'>('scan_item');
  
  // Selected state
  const [scannedToken, setScannedToken] = useState<string>('');
  const [scannedItem, setScannedItem] = useState<Item | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  
  // Student identification state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>(undefined);
  const [manualStudentName, setManualStudentName] = useState<string | undefined>(undefined);
  const [manualStudentCode, setManualStudentCode] = useState<string | undefined>(undefined);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod>('imported_student');

  // Confirmation & Submission
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryResult | null>(null);

  // Staff history
  const [historyList, setHistoryList] = useState<Discovery[]>([]);

  const loadHistory = async () => {
    const p = await authService.getCurrentUser();
    setProfile(p);
    if (p) {
      const all = await discoveryService.getStaffDiscoveries(p.id);
      setHistoryList(all);
    }
  };

  useEffect(() => {
    loadHistory();
    const unsub = authService.subscribe((p) => {
      setProfile(p);
      loadHistory();
    });
    return () => unsub();
  }, []);

  // 1. Handle Item QR Scanned
  const handleItemScan = async (tokenOrCode: string) => {
    soundManager.playClick();
    setScannedToken(tokenOrCode);
    setItemError(null);

    const item = await itemService.getItemByQrToken(tokenOrCode);
    if (!item) {
      soundManager.playError();
      setItemError(`ไม่พบข้อมูลไอเทมสำหรับรหัส "${tokenOrCode}" หรือ QR Code ไม่ถูกต้อง`);
      return;
    }

    setScannedItem(item);

    // If item is already discovered, show already discovered state immediately
    if (item.status === 'discovered') {
      const all = await discoveryService.getAllDiscoveries();
      const existing = all.find((d) => d.item_id === item.id && d.status === 'confirmed');
      setDiscoveryResult({
        success: false,
        code: 'ALREADY_DISCOVERED',
        message: 'ไอเทมนี้ถูกค้นพบไปแล้ว!',
        item_code: item.item_code,
        item_name: item.name,
        discovered_at: existing?.discovered_at,
        discovered_by: existing?.student?.full_name || existing?.manual_student_name || 'Hunter',
        verified_by: existing?.staff_profile?.display_name || 'Staff Point',
      });
      setActiveStep('already_discovered');
      return;
    }

    setActiveStep('preview_item');
    // Prompt student selection immediately
    setIsStudentModalOpen(true);
  };

  // 2. Handle Student Selected
  const handleStudentSelected = (data: { student?: Student; manualName?: string; manualCode?: string; method: VerificationMethod }) => {
    setSelectedStudent(data.student);
    setManualStudentName(data.manualName);
    setManualStudentCode(data.manualCode);
    setVerificationMethod(data.method);
    setIsStudentModalOpen(false);
    setIsConfirmOpen(true);
  };

  // 3. Confirm Discovery Transaction
  const handleConfirmSubmit = async () => {
    if (!scannedItem || isSubmitting) return;

    setIsSubmitting(true);
    const idempotencyKey = generateIdempotencyKey();

    try {
      const res = await discoveryService.confirmDiscovery({
        qr_token: scannedItem.qr_token,
        student_id: selectedStudent?.id,
        manual_student_name: manualStudentName,
        manual_student_code: manualStudentCode,
        staff_id: profile?.id,
        verification_method: verificationMethod,
        idempotency_key: idempotencyKey,
      });

      setDiscoveryResult(res);
      setIsConfirmOpen(false);

      if (res.success) {
        setActiveStep('success');
        loadHistory();
      } else {
        setActiveStep('already_discovered');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset workflow back to scan
  const handleResetToScan = () => {
    soundManager.playClick();
    setScannedToken('');
    setScannedItem(null);
    setSelectedStudent(undefined);
    setManualStudentName(undefined);
    setManualStudentCode(undefined);
    setItemError(null);
    setDiscoveryResult(null);
    setActiveStep('scan_item');
  };

  return (
    <div className="min-h-screen pb-20 pt-4 px-4 sm:px-6 max-w-2xl mx-auto space-y-6">
      
      {/* Top Mobile Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-game text-xs text-mario-red">PTECH-Sci</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-mario-orange/20 text-mario-orange border border-mario-orange/40">
              STAFF CHECK-IN
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">จุดตรวจ: {profile?.display_name || 'Staff Checkpoint'}</p>
        </div>

        <LiveStatusBadge />
      </div>

      {/* STEP 1: SCAN ITEM QR */}
      {activeStep === 'scan_item' && (
        <div className="space-y-4">
          <StaffScanner
            isScanning={true}
            onScanSuccess={handleItemScan}
            label="สแกน QR Code จากไอเทม"
          />

          {itemError && (
            <div className="p-4 rounded-2xl bg-red-950/80 border-2 border-red-700 text-red-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
              <div>
                <strong className="block font-bold">ไม่สามารถตรวจสอบไอเทมได้</strong>
                <span>{itemError}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PREVIEW ITEM & IDENTIFY STUDENT */}
      {activeStep === 'preview_item' && scannedItem && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-mario-orange shadow-2xl space-y-6">
          
          <div className="text-center space-y-1">
            <span className="px-3 py-1 rounded-full bg-mario-green/20 text-mario-green font-mono text-xs font-bold border border-mario-green/40">
              ITEM FOUND!
            </span>
            <h3 className="font-game text-sm text-mario-yellow mt-2">
              {scannedItem.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              รหัส: {scannedItem.item_code} • ประเภท: {scannedItem.item_type?.name}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">ของรางวัล:</span>
              <span className="text-mario-green font-bold flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                {scannedItem.reward_name || 'Special Prize'}
              </span>
            </div>
            {scannedItem.location_hint && (
              <div className="flex justify-between">
                <span className="text-slate-400">จุดติดตั้ง:</span>
                <span className="text-slate-200">{scannedItem.location_hint}</span>
              </div>
            )}
          </div>

          {/* Student Status Box */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
            <div className="text-xs text-slate-400 font-semibold uppercase">
              ผู้ค้นพบไอเทม (STUDENT IDENTIFICATION)
            </div>

            {selectedStudent || manualStudentName ? (
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-white">
                <UserCheck className="w-5 h-5 text-mario-green" />
                <span>{selectedStudent?.full_name || manualStudentName}</span>
                <span className="font-mono text-xs text-slate-400">({selectedStudent?.student_code || manualStudentCode || 'Manual'})</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                ยังไม่ได้ระบุตัวตนนักเรียนผู้ค้นพบ
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsStudentModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-mario-yellow text-xs font-bold transition-colors"
            >
              {selectedStudent || manualStudentName ? 'เปลี่ยนผู้ค้นพบ' : 'ระบุตัวตนนักเรียน (สแกน QR / ค้นหาชื่อ)'}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetToScan}
              className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              disabled={!selectedStudent && !manualStudentName}
              onClick={() => setIsConfirmOpen(true)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-bold text-xs shadow-neon-red disabled:opacity-50 pixel-btn"
            >
              ยืนยันการค้นพบ
            </button>
          </div>
        </div>
      )}

      {/* STEP: SUCCESS NOTIFICATION */}
      {activeStep === 'success' && discoveryResult && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-mario-green/20 via-slate-900 to-slate-950 border-4 border-mario-green text-center space-y-6 shadow-neon-green animate-scale-pop">
          <div className="w-20 h-20 rounded-3xl bg-mario-green/20 border-2 border-mario-green flex items-center justify-center mx-auto text-mario-green text-4xl shadow-neon-green animate-bounce">
            ⭐
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mario-green/30 text-mario-green font-mono text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              DISCOVERY CONFIRMED!
            </span>
            <h2 className="font-game text-base sm:text-lg text-white">
              {discoveryResult.item_name}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              ผู้ค้นพบ: <strong className="text-mario-yellow">{discoveryResult.student_name}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <p className="text-mario-green font-bold">
              🎁 รางวัล: {discoveryResult.reward_name || 'Special Prize'}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              บันทึกเข้าระบบ Real-Time สำเร็จ • Dashboard ได้รับการอัปเดตแล้ว
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToScan}
            className="w-full py-3.5 rounded-2xl bg-mario-green text-slate-950 font-extrabold text-sm shadow-neon-green hover:opacity-95 transition-all pixel-btn"
          >
            สแกนไอเทมชิ้นต่อไป
          </button>
        </div>
      )}

      {/* STEP: ALREADY DISCOVERED WARNING */}
      {activeStep === 'already_discovered' && discoveryResult && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-4 border-red-600 text-center space-y-6 shadow-2xl animate-scale-pop">
          <div className="w-16 h-16 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mx-auto text-red-400 text-3xl">
            ⚠
          </div>

          <div>
            <h2 className="font-game text-sm text-red-400">
              ITEM ALREADY DISCOVERED!
            </h2>
            <h3 className="text-base font-bold text-white mt-1">
              {discoveryResult.item_code} - {discoveryResult.item_name}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              ไอเทมนี้ถูกค้นพบและบันทึกในระบบไปแล้ว
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">เวลาที่ค้นพบ:</span>
              <span className="text-slate-200 font-mono">{formatDate(discoveryResult.discovered_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ผู้ค้นพบคนแรก:</span>
              <span className="text-mario-yellow font-bold">{discoveryResult.discovered_by || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">เจ้าหน้าที่ผู้ตรวจ:</span>
              <span className="text-slate-300">{discoveryResult.verified_by || 'Staff'}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetToScan}
            className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            กลับไปหน้าสแกน
          </button>
        </div>
      )}

      {/* Staff Check-in History List */}
      <StaffHistoryList
        discoveries={historyList}
        onRefresh={loadHistory}
      />

      {/* Modals */}
      {isStudentModalOpen && (
        <StudentSearchModal
          onSelectStudent={handleStudentSelected}
          onCancel={() => setIsStudentModalOpen(false)}
        />
      )}

      {isConfirmOpen && scannedItem && (
        <DiscoveryConfirmDialog
          item={scannedItem}
          student={selectedStudent}
          manualName={manualStudentName}
          manualCode={manualStudentCode}
          verificationMethod={verificationMethod}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setIsConfirmOpen(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
