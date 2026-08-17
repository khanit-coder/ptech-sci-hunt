import React, { useState } from 'react';
import { Item, Student, VerificationMethod } from '@/types';
import { CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Gift, User, QrCode } from 'lucide-react';
import { soundManager } from '@/lib/sound';

interface Props {
  item: Item;
  student?: Student;
  manualName?: string;
  manualCode?: string;
  verificationMethod: VerificationMethod;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const DiscoveryConfirmDialog: React.FC<Props> = ({
  item,
  student,
  manualName,
  manualCode,
  verificationMethod,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  const studentDisplayName = student?.full_name || manualName || 'นักเรียน';
  const studentCode = student?.student_code || manualCode || '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border-2 border-mario-orange/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-scale-pop">
        
        {/* Title */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-mario-orange/20 border border-mario-orange/50 flex items-center justify-center mx-auto text-mario-yellow">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-game text-xs sm:text-sm text-mario-yellow tracking-wider">
            CONFIRM ITEM DISCOVERY
          </h3>
          <p className="text-xs text-slate-400">
            กรุณาตรวจสอบความถูกต้องก่อนกดยืนยันบันทึกเข้าระบบ
          </p>
        </div>

        {/* Item Card Preview */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-mario-yellow">
              {item.item_code}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {item.item_type?.name || 'CORE'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
              {item.item_type?.icon || '⭐'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">
                {item.name}
              </h4>
              <div className="flex items-center gap-1 text-xs text-mario-green mt-1 font-semibold">
                <Gift className="w-3.5 h-3.5" />
                <span>รางวัล: {item.reward_name || 'Special Prize'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Student Preview */}
        <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">
              ผู้ค้นพบไอเทม (STUDENT)
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {verificationMethod}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              <User className="w-5 h-5 text-mario-orange" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {studentDisplayName}
              </p>
              <p className="text-xs text-slate-400 font-mono">
                รหัส: {studentCode} {student?.class_name ? `• ${student.class_name}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-mario-red via-mario-orange to-mario-yellow text-white text-xs font-bold shadow-neon-red hover:opacity-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 pixel-btn"
          >
            {isSubmitting ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>ยืนยันการค้นพบ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
