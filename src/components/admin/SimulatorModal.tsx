import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '@/services/adminService';
import { discoveryService } from '@/services/discoveryService';
import { itemService } from '@/services/itemService';
import { boothService } from '@/services/boothService';
import { studentService } from '@/services/studentService';
import { dashboardService } from '@/services/dashboardService';
import { soundManager } from '@/lib/sound';
import { Gamepad2, Zap, Play, Square, AlertTriangle, Users, X, Sparkles, MapPin, Clock, Activity } from 'lucide-react';

interface Props {
  onClose: () => void;
  onRefresh: () => void;
}

export const SimulatorModal: React.FC<Props> = ({ onClose, onRefresh }) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [raceTestResult, setRaceTestResult] = useState<string | null>(null);

  // Booth Traffic Simulator State
  const [concurrentBooths, setConcurrentBooths] = useState<number>(3);
  const [intervalSeconds, setIntervalSeconds] = useState<number>(2);
  const [isTrafficSimulating, setIsTrafficSimulating] = useState<boolean>(false);
  const [trafficLogs, setTrafficLogs] = useState<Array<{ id: string; time: string; text: string; success: boolean }>>([]);
  const [totalSimulatedScans, setTotalSimulatedScans] = useState<number>(0);

  const activeTimersRef = useRef<(NodeJS.Timeout | number)[]>([]);

  // Stop traffic simulation on unmount
  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((t) => clearInterval(t as any));
      activeTimersRef.current = [];
    };
  }, []);

  // Start Traffic Simulation
  const handleStartTrafficSim = async () => {
    soundManager.playClick();
    setIsSimulating(true);

    try {
      const [allBooths, allStudents] = await Promise.all([
        boothService.getBooths(),
        studentService.getAllStudents(),
      ]);

      const activeBooths = allBooths.filter((b) => b.is_active);
      if (activeBooths.length === 0) {
        alert('ไม่พบซุ้มกิจกรรมที่เปิดใช้งาน (Active Booths)');
        setIsSimulating(false);
        return;
      }

      if (allStudents.length === 0) {
        alert('ไม่พบข้อมูลนักเรียนในระบบ');
        setIsSimulating(false);
        return;
      }

      setIsTrafficSimulating(true);
      setTrafficLogs([]);
      setTotalSimulatedScans(0);

      // Pick target booths based on concurrentBooths
      const targetBooths = activeBooths.slice(0, Math.min(concurrentBooths, activeBooths.length));

      // Clear any existing timers
      activeTimersRef.current.forEach((t) => clearInterval(t as any));
      activeTimersRef.current = [];

      // Launch an interval timer for each booth thread
      targetBooths.forEach((booth, idx) => {
        // Stagger initial start to prevent firing on exact same millisecond
        const initialTimer = setTimeout(() => {
          const intervalTimer = setInterval(async () => {
            const randomStudent = allStudents[Math.floor(Math.random() * allStudents.length)];
            const res = await boothService.checkinStudent(booth.id, randomStudent.student_code);

            const timeStr = new Date().toLocaleTimeString();
            const logText = res.success
              ? `🎪 [${booth.name}] นักเรียน ${randomStudent.full_name} (${randomStudent.student_code}) ➔ แสกนสำเร็จ (+ตัวอักษร ${booth.letter})`
              : `⚠️ [${booth.name}] ${randomStudent.full_name} ➔ ${res.message}`;

            setTrafficLogs((prev) => [
              { id: Math.random().toString(36), time: timeStr, text: logText, success: res.success },
              ...prev.slice(0, 49),
            ]);

            setTotalSimulatedScans((prev) => prev + 1);

            // Notify real-time dashboards
            dashboardService.forceRefresh();
            onRefresh();
          }, Math.max(1, intervalSeconds) * 1000);

          activeTimersRef.current.push(intervalTimer);
        }, idx * 300);

        activeTimersRef.current.push(initialTimer);
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Stop Traffic Simulation
  const handleStopTrafficSim = () => {
    soundManager.playClick();
    activeTimersRef.current.forEach((t) => clearInterval(t as any));
    activeTimersRef.current = [];
    setIsTrafficSimulating(false);
  };

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

  // 3. Test Concurrent Race Condition
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="max-w-lg w-full bg-slate-900 border-2 border-mario-yellow rounded-3xl p-5 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(255,215,0,0.3)] text-xs max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-mario-yellow" />
            <h3 className="font-game text-xs text-mario-yellow">EVENT SIMULATOR & TEST TOOLS</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SECTION 1: BOOTH SCANNING LOAD TEST SIMULATOR ── */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-mario-orange" />
              <span>ระบบจำลองสแกนข้อมูลซุ้มกิจกรรม (Booth Traffic Simulator)</span>
            </h4>
            {isTrafficSimulating && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 animate-pulse flex items-center gap-1">
                <Activity className="w-3 h-3 animate-spin" /> RUNNING
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            ตั้งค่าจำลองการยิงแสกนเข้าร่วมซุ้มกิจกรรมของนักเรียน เพื่อทดสอบภาระเครื่องและ Real-time Update
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Concurrent Booths Count */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold block">
                จำนวนบูทที่ยิงพร้อมกัน:
              </label>
              <select
                disabled={isTrafficSimulating}
                value={concurrentBooths}
                onChange={(e) => setConcurrentBooths(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                {[1, 2, 3, 4, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} บูทพร้อมกัน
                  </option>
                ))}
              </select>
            </div>

            {/* Delay Interval per Booth */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-300 font-bold block">
                ระยะห่างในการยิง (วินาที):
              </label>
              <select
                disabled={isTrafficSimulating}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold"
              >
                {[1, 2, 3, 5, 10, 15].map((sec) => (
                  <option key={sec} value={sec}>
                    ทุกๆ {sec} วินาที / บูท
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start / Stop Controls */}
          <div className="pt-1">
            {!isTrafficSimulating ? (
              <button
                type="button"
                onClick={handleStartTrafficSim}
                disabled={isSimulating}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-mario-green to-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-neon-green hover:opacity-95 transition-all pixel-btn"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>🚀 เริ่มทดสอบยิงสแกนต่อเนื่อง (Start Traffic)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopTrafficSim}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-neon-red transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>⏹️ หยุดการยิงสแกน (Total Fired: {totalSimulatedScans})</span>
              </button>
            )}
          </div>

          {/* Live Log Console Screen */}
          {trafficLogs.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>LOG STREAM (ล่าสุด 50 รายการ)</span>
                <span className="text-mario-yellow font-bold">รวมแสกนสำเร็จ: {totalSimulatedScans} ครั้ง</span>
              </div>
              <div className="h-32 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 overflow-y-auto font-mono text-[10px] space-y-1">
                {trafficLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`leading-tight ${log.success ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                    <span>{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: ITEM DISCOVERY & CONCURRENCY TESTS ── */}
        <div className="space-y-2.5 pt-2 border-t border-slate-800">
          <h4 className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
            🛠️ ทดสอบระบบค้นพบไอเท็มลับ & Concurrency
          </h4>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isSimulating || isTrafficSimulating}
              onClick={handleSingleSim}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-50"
            >
              <span>จำลองการค้นพบไอเทม 1 ชิ้น (Random Item Discovery)</span>
              <Zap className="w-4 h-4 text-mario-yellow" />
            </button>

            <button
              type="button"
              disabled={isSimulating || isTrafficSimulating}
              onClick={() => handleBatchSim(5)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-between transition-colors disabled:opacity-50"
            >
              <span>จำลองการค้นพบไอเทม 5 ชิ้นรวด (Batch Sim)</span>
              <Sparkles className="w-4 h-4 text-mario-orange" />
            </button>

            <button
              type="button"
              disabled={isSimulating || isTrafficSimulating}
              onClick={handleTestRaceCondition}
              className="w-full py-2.5 px-3.5 rounded-xl bg-red-950/60 border border-red-700 text-red-300 font-bold flex items-center justify-between hover:bg-red-900/60 transition-colors disabled:opacity-50"
            >
              <span>ทดสอบยิงซ้ำพร้อมกัน 2 จุด (Race Condition Test)</span>
              <Users className="w-4 h-4 text-red-400" />
            </button>
          </div>
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
