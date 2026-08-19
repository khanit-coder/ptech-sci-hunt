import React, { useState } from 'react';
import { Discovery } from '@/types';
import { discoveryService } from '@/services/discoveryService';
import { authService } from '@/services/authService';
import { Gift, CheckCircle, Clock, AlertTriangle, MessageSquarePlus, RotateCcw } from 'lucide-react';
import { formatTimeOnly } from '@/lib/utils';
import { soundManager } from '@/lib/sound';

interface Props {
  discoveries: Discovery[];
  onRefresh: () => void;
}

export const StaffHistoryList: React.FC<Props> = ({ discoveries, onRefresh }) => {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [correctingDisc, setCorrectingDisc] = useState<Discovery | null>(null);
  const [correctionNote, setCorrectionNote] = useState('');

  const handleClaimReward = async (discovery: Discovery) => {
    soundManager.playClick();
    const profile = await authService.getCurrentUser();
    if (!profile) return;

    setClaimingId(discovery.id);
    try {
      await discoveryService.claimReward(discovery.id, profile.id);
      onRefresh();
    } finally {
      setClaimingId(null);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctingDisc || !correctionNote.trim()) return;
    soundManager.playClick();

    await discoveryService.requestCorrection(correctingDisc.id, correctionNote.trim());
    setCorrectingDisc(null);
    setCorrectionNote('');
    onRefresh();
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
          MY RECENT CHECK-INS
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          ({discoveries.length} รายการ)
        </span>
      </div>

      {discoveries.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          ยังไม่มีประวัติการเช็คอินของจุดตรวจนี้
        </div>
      ) : (
        <div className="space-y-3">
          {discoveries.map((disc) => (
            <div
              key={disc.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Item and Student Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-mario-yellow">
                    {disc.item?.item_code || 'ITEM'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {disc.item?.name}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  นักเรียน: <strong className="text-white">{disc.student?.full_name || disc.manual_student_name || 'ไม่ระบุชื่อ'}</strong>
                  {disc.student?.student_code && <span className="font-mono text-slate-400"> ({disc.student.student_code})</span>}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  <span>{formatTimeOnly(disc.discovered_at)}</span>
                  <span>•</span>
                  <span>วิธี: {disc.verification_method}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-mario-green/20 text-mario-green border border-mario-green/40 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>เช็คอินสำเร็จ</span>
                </span>

                {/* Correction Request Button */}
                <button
                  type="button"
                  onClick={() => setCorrectingDisc(disc)}
                  title="แจ้งขอแก้ไขข้อมูล"
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Correction Modal */}
      {correctingDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4">
            <h4 className="font-game text-xs text-mario-yellow">
              REQUEST CORRECTION
            </h4>
            <p className="text-xs text-slate-400">
              ส่งคำขอแก้ไขสำหรับรายการ {correctingDisc.item?.item_code} ไปยัง Admin
            </p>

            <form onSubmit={handleCorrectionSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={correctionNote}
                onChange={(e) => setCorrectionNote(e.target.value)}
                placeholder="ระบุเหตุผล เช่น สแกนผิดคน หรือข้อมูลนักเรียนผิดพลาด..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-mario-yellow"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCorrectingDisc(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={!correctionNote.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-mario-orange text-white text-xs font-bold shadow"
                >
                  ส่งคำขอแก้ไข
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
