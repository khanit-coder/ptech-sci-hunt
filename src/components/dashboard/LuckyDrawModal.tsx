import React, { useState, useEffect, useRef } from 'react';
import { Student, BoothCheckin, Discovery, Booth } from '@/types';
import { studentService } from '@/services/studentService';
import { boothService } from '@/services/boothService';
import { discoveryService } from '@/services/discoveryService';
import { dashboardService } from '@/services/dashboardService';
import { soundManager } from '@/lib/sound';
import {
  Trophy,
  Sparkles,
  Award,
  X,
  RefreshCw,
  Gift,
  CheckCircle2,
  Star,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface EligibleCandidate {
  student: Student;
  boothsVisitedCount: number;
  itemDiscoveriesCount: number;
  discoveredItemNames: string[];
  baseWeight: number;
  bonusWeight: number;
  finalWeight: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyDrawModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [candidates, setCandidates] = useState<EligibleCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enableItemBonus, setEnableItemBonus] = useState(true);
  const [bonusPercent, setBonusPercent] = useState(100); // default +100% = 2x chance

  const [isRolling, setIsRolling] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<EligibleCandidate | null>(null);
  const [winner, setWinner] = useState<EligibleCandidate | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<EligibleCandidate[]>([]);

  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load eligible candidates (students who have completed ALL active booth checkins)
  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allBooths, allCheckins, allDiscoveries] = await Promise.all([
        studentService.getAllStudents(),
        boothService.getBooths(),
        boothService.getAllCheckins(),
        discoveryService.getAllDiscoveries(),
      ]);

      const activeBooths = allBooths.filter((b) => b.is_active);
      const requiredCount = Math.max(activeBooths.length, 1);

      // Group check-ins by student_id
      const checkinsByStudent = new Map<string, Set<string>>();
      allCheckins.forEach((ci) => {
        if (!checkinsByStudent.has(ci.student_id)) {
          checkinsByStudent.set(ci.student_id, new Set());
        }
        checkinsByStudent.get(ci.student_id)!.add(ci.booth_id);
      });

      // Group confirmed discoveries by student_id
      const discoveriesByStudent = new Map<string, Discovery[]>();
      allDiscoveries.forEach((d) => {
        if (d.student_id && d.status === 'confirmed') {
          if (!discoveriesByStudent.has(d.student_id)) {
            discoveriesByStudent.set(d.student_id, []);
          }
          discoveriesByStudent.get(d.student_id)!.push(d);
        }
      });

      const eligible: EligibleCandidate[] = [];

      allStudents.forEach((st) => {
        const visitedBooths = checkinsByStudent.get(st.id);
        const visitedCount = visitedBooths ? visitedBooths.size : 0;

        // Check if student completed ALL required booth checkins
        if (visitedCount >= requiredCount) {
          const stDiscoveries = discoveriesByStudent.get(st.id) || [];
          const itemsCount = stDiscoveries.length;
          const itemNames = stDiscoveries.map((d) => d.item?.name || d.notes || 'Secret Item');

          const hasItems = itemsCount > 0;
          const bonusMultiplier = hasItems && enableItemBonus ? 1 + bonusPercent / 100 : 1.0;

          eligible.push({
            student: st,
            boothsVisitedCount: visitedCount,
            itemDiscoveriesCount: itemsCount,
            discoveredItemNames: itemNames,
            baseWeight: 1.0,
            bonusWeight: bonusMultiplier - 1.0,
            finalWeight: bonusMultiplier,
          });
        }
      });

      setCandidates(eligible);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    } else {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      setIsRolling(false);
      setWinner(null);
    }
  }, [isOpen, enableItemBonus, bonusPercent]);

  if (!isOpen) return null;

  // Filter out candidates already drawn if available candidates exist
  const availableCandidates = candidates.filter(
    (c) => !drawnHistory.some((d) => d.student.id === c.student.id)
  );

  const pool = availableCandidates.length > 0 ? availableCandidates : candidates;

  const handleStartDraw = () => {
    if (pool.length === 0 || isRolling) return;
    soundManager.playClick();
    setIsRolling(true);
    setWinner(null);

    // 1. Compute total weight
    const totalWeight = pool.reduce((sum, c) => sum + c.finalWeight, 0);

    // 2. Weighted random choice
    let rand = Math.random() * totalWeight;
    let selectedWinner = pool[0];

    for (const cand of pool) {
      if (rand <= cand.finalWeight) {
        selectedWinner = cand;
        break;
      }
      rand -= cand.finalWeight;
    }

    // 3. Ticker Rolling animation
    let step = 0;
    let delay = 40; // initial fast speed in ms

    const rollNext = () => {
      // Pick random candidate for display during animation
      const randomDisplay = pool[Math.floor(Math.random() * pool.length)];
      setRollingCandidate(randomDisplay);
      soundManager.playClick();

      step++;
      if (step < 30) {
        delay += 5; // gradually slow down
        animTimerRef.current = setTimeout(rollNext, delay);
      } else {
        // Animation finished! Reveal winner
        setRollingCandidate(selectedWinner);
        setWinner(selectedWinner);
        setDrawnHistory((prev) => [selectedWinner, ...prev]);
        setIsRolling(false);
        soundManager.playDiscovery();
      }
    };

    rollNext();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="max-w-2xl w-full bg-slate-950 border-2 border-mario-yellow rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_50px_rgba(249,200,14,0.3)] relative overflow-hidden max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mario-yellow/20 border border-mario-yellow/60 flex items-center justify-center shadow-neon-yellow">
              <Trophy className="w-6 h-6 text-mario-yellow" />
            </div>
            <div>
              <h3 className="font-game text-sm sm:text-base text-mario-yellow tracking-wider">LUCKY DRAW GRAND PRIZE</h3>
              <p className="text-xs text-slate-400">สุ่มผู้โชคดีรางวัลใหญ่ (สำหรับนักเรียนที่สะสมตัวอักษรครบทุกซุ้ม)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isRolling}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Options */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Item Bonus Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-200">
              <input
                type="checkbox"
                checked={enableItemBonus}
                onChange={(e) => setEnableItemBonus(e.target.checked)}
                className="w-4 h-4 rounded text-mario-yellow focus:ring-0 bg-slate-950 border-slate-700"
              />
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-mario-yellow fill-mario-yellow" />
                <span>เพิ่มโอกาสชนะสุ่มสำหรับผู้ที่ค้นพบไอเท็มลับ</span>
              </span>
            </label>

            {/* Percentage Bonus Selector */}
            {enableItemBonus && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[11px] text-slate-400 px-2 font-mono">โบนัส:</span>
                {[50, 100, 200].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setBonusPercent(pct)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all ${
                      bonusPercent === pct
                        ? 'bg-mario-yellow text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    +{pct}% ({1 + pct / 100}x)
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-mario-orange" />
              <span>ผู้มีสิทธิ์ลุ้นรางวัล: <strong className="text-mario-yellow font-bold">{candidates.length} คน</strong></span>
            </span>

            {drawnHistory.length > 0 && (
              <span className="text-slate-500">
                สุ่มได้แล้ว: <strong className="text-mario-green">{drawnHistory.length} คน</strong>
              </span>
            )}
          </div>
        </div>

        {/* Ticker / Rolling Display Screen */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-mario-yellow/60 text-center shadow-inner overflow-hidden min-h-[160px] flex flex-col items-center justify-center">
          
          {/* Animated Cyber Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#f9c80e_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-mario-yellow" />
              <span>กำลังดึงข้อมูลนักเรียนผู้มีสิทธิ์ลุ้นรางวัล...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="space-y-2">
              <Trophy className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-xs font-bold">ยังไม่มีนักเรียนสะสมตัวอักษรครบทุกซุ้มกิจกรรม</p>
              <p className="text-slate-600 text-[11px]">ให้นักเรียนสะสมตัวอักษรให้ครบ 100% เพื่อลุ้นรางวัลใหญ่</p>
            </div>
          ) : (
            <div className="space-y-2 z-10 w-full">
              {isRolling && rollingCandidate ? (
                <div className="animate-pulse space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-mario-orange/20 text-mario-orange font-mono text-[10px] font-bold uppercase tracking-widest border border-mario-orange/40">
                    🎲 SEARCHING WINNER...
                  </span>
                  <h2 className="font-bold text-2xl sm:text-4xl text-mario-yellow font-mono tracking-wide truncate max-w-full px-2">
                    {rollingCandidate.student.full_name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    {rollingCandidate.student.student_code}
                  </p>
                </div>
              ) : winner ? (
                <div className="space-y-3 animate-scale-pop">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mario-green/30 text-mario-green font-mono text-xs font-bold border border-mario-green/60 shadow-neon-green">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    LUCKY WINNER FOUND!
                  </span>

                  <div>
                    <h2 className="font-black text-2xl sm:text-4xl text-mario-yellow tracking-tight">
                      {winner.student.full_name}
                    </h2>
                    <p className="text-sm text-slate-300 font-mono mt-1">
                      รหัส: <strong className="text-white font-bold">{winner.student.student_code}</strong>
                      {winner.student.class_name && ` • ${winner.student.class_name}`}
                    </p>
                    {winner.student.department && (
                      <p className="text-xs text-slate-400 mt-0.5">{winner.student.department}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2 flex-wrap text-xs">
                    <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      สะสมครบ {winner.boothsVisitedCount} ซุ้ม (100%)
                    </span>

                    {winner.itemDiscoveriesCount > 0 && (
                      <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/80 text-amber-300 font-bold flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        พบไอเท็มลับ {winner.itemDiscoveriesCount} ชิ้น (+{bonusPercent}% โบนัสโอกาส)
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <Gift className="w-10 h-10 text-mario-yellow mx-auto animate-bounce" />
                  <h3 className="font-bold text-white text-base">พร้อมทำการสุ่มผู้โชคดีรางวัลใหญ่!</h3>
                  <p className="text-xs text-slate-400">
                    กดปุ่ม <strong className="text-mario-yellow">"เริ่มสุ่มผู้โชคดี"</strong> ด้านล่างเพื่อเริ่มการสุ่ม
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleStartDraw}
            disabled={candidates.length === 0 || isRolling}
            className="w-full sm:flex-1 py-4 rounded-2xl bg-gradient-to-r from-mario-yellow via-mario-orange to-mario-red text-slate-950 font-black text-sm shadow-neon-yellow hover:opacity-95 transition-all disabled:opacity-40 pixel-btn flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            <span>{isRolling ? 'กำลังสุ่ม...' : winner ? '🎲 สุ่มผู้โชคดีคนต่อไป' : '🎰 เริ่มสุ่มผู้โชคดีทันที'}</span>
          </button>

          {winner && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 text-slate-300 hover:text-white font-bold text-xs hover:border-slate-600 transition-all"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
