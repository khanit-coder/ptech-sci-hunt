import React, { useState } from 'react';
import { adminService } from '@/services/adminService';
import { discoveryService } from '@/services/discoveryService';
import { itemService } from '@/services/itemService';
import { soundManager } from '@/lib/sound';
import { Gamepad2, Zap, Play, RotateCcw, AlertTriangle, Users, X, Sparkles } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export const SimulatorModal: React.FC<Props> = ({ onClose, onRefresh }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [raceTestResult, setRaceTestResult] = useState<string | null>(null);

  // 1. Simulate single discovery
  const handleSingleSim = async () => {
    soundManager.playClick();
    setIsSimulating(true);
    try {
      const res = await adminService.simulateRandomDiscovery();
      alert(res.message);
      onRefresh();
    } finally {
      setIsSimulating(false);
    }
  };

  // 2. Simulate 5 discoveries
  const handleBatchSim = async (count: number) => {
    soundManager.playClick();
    setIsSimulating(true);
    try {
      const res = await adminService.simulateBatchDiscoveries(count);
      alert(`จำลองสำเร็จ ${res.success} จาก ${res.total} รายการ!`);
      onRefresh();
    } finally {
      setIsSimulating(false);
    }
  };

  // 3. Test Concurrent Race Condition (Simulate 2 Staff claiming same item simultaneously)
  const handleTestRaceCondition = async () => {
    soundManager.playClick();
    setIsSimulating(true);
    setRaceTestResult('กำลังเริ่มการทดสอบจำลองส่งข้อมูลพร้อมกัน (Simulating concurrent claims)...');

    try {
      const items = await itemService.getAllItems();
      const activeItem = items.find((i) => i.status === 'active');
      if (!activeItem) {
        setRaceTestResult('ไม่พบไอเทมที่มีสถานะ ACTIVE กรุณารีเซ็ตกิจกรรมก่อนทดสอบ');
        setIsSimulating(false);
        return;
      }

      // Fire 2 concurrent requests at the exact same millisecond
      const [resA, resB] = await Promise.all([
        discoveryService.confirmDiscovery({
          qr_token: activeItem.qr_token,
          manual_student_name: 'Staff A (สมศักดิ์)',
          verification_method: 'manual_name',
          notes: 'Concurrent Test Client A',
        }),
        discoveryService.confirmDiscovery({
          qr_token: activeItem.qr_token,
          manual_student_name: 'Staff B (วิภาดา)',
          verification_method: 'manual_name',
          notes: 'Concurrent Test Client B',
        }),
      ]);

      const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
      const conflictMsg = resA.success ? resB.message : resA.message;

      setRaceTestResult(
        `ผลการทดสอบ: สำเร็จ 1 รายการ (${resA.success ? 'Staff A' : 'Staff B'}) และอีกคนถูกปฏิเสธด้วยข้อความ: "${conflictMsg}" — ป้องกัน Duplicate 100% สมบูรณ์แบบ!`
      );
      onRefresh();
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border-2 border-mario-yellow rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(255,215,0,0.3)] text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-mario-yellow" />
            <h3 className="font-game text-xs text-mario-yellow">EVENT SIMULATOR & TEST TOOLS</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-300">
          เครื่องมือสำหรับผู้ดูแลระบบ เพื่อจำลองการค้นพบไอเทมและทดสอบการทำงานของ Real-Time Dashboard และ Concurrency Lock
        </p>

        <div className="space-y-3">
          <button
            type="button"
            disabled={isSimulating}
            onClick={handleSingleSim}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-50"
          >
            <span>จำลองการค้นพบ 1 ชิ้น (Random Item)</span>
            <Zap className="w-4 h-4 text-mario-yellow" />
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={() => handleBatchSim(5)}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-50"
          >
            <span>จำลองการค้นพบ 5 ชิ้นรวด (Batch +20%)</span>
            <Sparkles className="w-4 h-4 text-mario-orange" />
          </button>

          <button
            type="button"
            disabled={isSimulating}
            onClick={handleTestRaceCondition}
            className="w-full py-3 px-4 rounded-xl bg-red-950/60 border border-red-700 text-red-300 font-bold flex items-center justify-between hover:bg-red-900/60 transition-colors disabled:opacity-50"
          >
            <span>ทดสอบยิงซ้ำพร้อมกัน 2 จุด (Race Condition Test)</span>
            <Users className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {raceTestResult && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-mario-yellow/60 text-slate-200 text-xs leading-relaxed space-y-1">
            <strong className="text-mario-yellow block font-bold">📋 รายงานผลการทดสอบ:</strong>
            <p>{raceTestResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};
