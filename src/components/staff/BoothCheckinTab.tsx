import React, { useState, useEffect, useCallback } from 'react';
import { Booth, BoothCheckin, BoothCheckinResult, Profile } from '@/types';
import { boothService } from '@/services/boothService';
import { StaffScanner } from '@/components/staff/StaffScanner';
import { soundManager } from '@/lib/sound';
import { formatDate } from '@/lib/utils';
import {
  MapPin,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Users,
  Sparkles,
  ChevronDown,
  Clock,
} from 'lucide-react';

interface Props {
  profile: Profile | null;
}

export const BoothCheckinTab: React.FC<Props> = ({ profile }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [checkins, setCheckins] = useState<BoothCheckin[]>([]);
  const [isLoadingBooths, setIsLoadingBooths] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<(BoothCheckinResult & { student_name?: string }) | null>(null);

  // Load booths on mount
  useEffect(() => {
    const load = async () => {
      setIsLoadingBooths(true);
      const all = await boothService.getBooths();
      setBooths(all.filter((b) => b.is_active));
      setIsLoadingBooths(false);
    };
    load();
  }, []);

  // Load today's checkins when booth selected
  const loadCheckins = useCallback(async () => {
    if (!selectedBooth) return;
    const ci = await boothService.getBoothCheckins(selectedBooth.id, true);
    setCheckins(ci);
  }, [selectedBooth]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  const handleSelectBooth = (booth: Booth) => {
    soundManager.playClick();
    setSelectedBooth(booth);
    setResult(null);
    setIsScanning(false);
  };

  const handleScan = async (qrCode: string) => {
    if (!selectedBooth || isSubmitting) return;
    setIsSubmitting(true);
    setIsScanning(false);
    soundManager.playClick();

    const res = await boothService.checkinStudent(selectedBooth.id, qrCode, profile?.id);

    if (res.success) {
      soundManager.playDiscovery();
      setResult({
        ...res,
        student_name: res.student?.full_name,
      });
      await loadCheckins();
    } else {
      soundManager.playError();
      setResult({ ...res, student_name: res.student?.full_name });
    }

    setIsSubmitting(false);
  };

  const handleReset = () => {
    soundManager.playClick();
    setResult(null);
    setIsScanning(false);
  };

  // ── Booth selector ──────────────────────────────────────────────
  if (isLoadingBooths) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        กำลังโหลดข้อมูลบูท...
      </div>
    );
  }

  if (booths.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
        <MapPin className="w-8 h-8" />
        <p className="text-sm font-medium">ยังไม่มีบูทกิจกรรม — ให้ admin สร้างบูทก่อน</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Booth Selector */}
      {!selectedBooth ? (
        <div className="space-y-4">
          <div className="text-center py-4">
            <MapPin className="w-8 h-8 text-mario-orange mx-auto mb-2" />
            <h3 className="font-game text-xs text-mario-yellow">เลือกบูทของคุณ</h3>
            <p className="text-xs text-slate-400 mt-1">เลือกบูทที่คุณรับผิดชอบ</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {booths.map((booth) => (
              <button
                key={booth.id}
                type="button"
                onClick={() => handleSelectBooth(booth)}
                className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-mario-orange transition-all text-left group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 font-game font-black"
                  style={{
                    backgroundColor: `${booth.color}25`,
                    border: `2px solid ${booth.color}60`,
                    color: booth.color,
                  }}
                >
                  {booth.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{booth.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">ตำแหน่ง #{booth.letter_position + 1}</p>
                  {booth.description && (
                    <p className="text-[10px] text-slate-500 truncate">{booth.description}</p>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-mario-orange rotate-[-90deg] transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Active Booth Header */}
          <div
            className="flex items-center justify-between p-4 rounded-2xl border-2"
            style={{
              backgroundColor: `${selectedBooth.color}15`,
              borderColor: `${selectedBooth.color}50`,
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-game text-xl font-black"
                style={{
                  backgroundColor: `${selectedBooth.color}25`,
                  border: `2px solid ${selectedBooth.color}80`,
                  color: selectedBooth.color,
                }}
              >
                {selectedBooth.letter}
              </div>
              <div>
                <p className="font-bold text-white">{selectedBooth.name}</p>
                <p className="text-xs font-mono" style={{ color: selectedBooth.color }}>
                  ตัวอักษร: {selectedBooth.letter} • ตำแหน่ง #{selectedBooth.letter_position + 1}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedBooth(null); setResult(null); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              เปลี่ยนบูท
            </button>
          </div>

          {/* Scanner Area */}
          {!result && (
            <div className="space-y-4">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={() => { soundManager.playClick(); setIsScanning(true); }}
                  disabled={isSubmitting}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-mario-orange to-mario-yellow text-slate-950 font-black text-sm shadow-neon-yellow hover:opacity-95 transition-all pixel-btn flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  <QrCode className="w-5 h-5" />
                  <span>{isSubmitting ? 'กำลังบันทึก...' : 'สแกน QR นักเรียน'}</span>
                </button>
              ) : (
                <StaffScanner
                  isScanning={true}
                  onScanSuccess={handleScan}
                  label={`สแกน QR Code นักเรียน — บูท: ${selectedBooth.name}`}
                  subLabel="สแกน QR Code จากบัตรหรือมือถือนักเรียน"
                />
              )}
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div
              className={`p-6 rounded-3xl border-2 text-center space-y-4 animate-scale-pop ${
                result.success
                  ? 'bg-gradient-to-b from-mario-green/20 via-slate-900 to-slate-950 border-mario-green shadow-neon-green'
                  : result.code === 'ALREADY_CHECKEDIN'
                  ? 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-600'
                  : 'bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-red-600'
              }`}
            >
              {result.success ? (
                <>
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-4xl font-game font-black shadow-neon-green"
                    style={{ backgroundColor: `${selectedBooth.color}30`, border: `3px solid ${selectedBooth.color}` }}
                  >
                    {result.letter}
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mario-green/30 text-mario-green font-mono text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      BOOTH CHECK-IN SUCCESS!
                    </span>
                    <h3 className="font-bold text-white text-base mt-1">
                      {result.student_name || result.student?.full_name || 'นักเรียน'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ได้รับตัวอักษร:{' '}
                      <span className="font-game text-mario-yellow text-lg">{result.letter}</span>
                      {' '}จาก {result.booth_name || selectedBooth.name}
                    </p>
                  </div>
                </>
              ) : result.code === 'ALREADY_CHECKEDIN' ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border-2 border-amber-600 flex items-center justify-center mx-auto text-3xl">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="font-game text-xs text-amber-400">เช็คอินแล้ว!</h3>
                    <p className="text-white font-bold text-sm mt-1">
                      {result.student_name || result.student?.full_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{result.message}</p>
                    {result.checked_in_at && (
                      <p className="text-[11px] text-slate-500 font-mono mt-1">
                        เวลา: {new Date(result.checked_in_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
                  <div>
                    <h3 className="font-game text-xs text-red-400">เกิดข้อผิดพลาด</h3>
                    <p className="text-xs text-slate-300 mt-1">{result.message}</p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleReset}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                  result.success
                    ? 'bg-mario-green text-slate-950 hover:opacity-90 shadow-neon-green'
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>สแกนนักเรียนคนต่อไป</span>
              </button>
            </div>
          )}

          {/* Today's Checkin List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400 font-mono font-bold">
                  เช็คอินวันนี้ ({checkins.length} คน)
                </span>
              </div>
              <button
                type="button"
                onClick={loadCheckins}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {checkins.length === 0 ? (
              <div className="py-6 text-center text-slate-600 text-xs">
                ยังไม่มีการเช็คอินวันนี้
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {checkins.map((ci, idx) => (
                  <div
                    key={ci.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="text-slate-500 font-mono w-5 shrink-0 text-center">{idx + 1}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-mario-green shrink-0" />
                    <span className="text-white font-medium flex-1 truncate">
                      {ci.student?.full_name || 'นักเรียน'}
                    </span>
                    <span className="text-slate-500 font-mono text-[10px] shrink-0">
                      {new Date(ci.checked_in_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
