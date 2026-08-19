import React, { useState, useEffect, useRef } from 'react';
import { Student, BoothCheckin, Discovery, Booth } from '@/types';
import { studentService } from '@/services/studentService';
import { boothService } from '@/services/boothService';
import { discoveryService } from '@/services/discoveryService';
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
  Sliders,
  Percent,
} from 'lucide-react';

export interface EligibleCandidate {
  student: Student;
  boothsVisitedCount: number;
  requiredBoothsCount: number;
  completionPercent: number;
  itemDiscoveriesCount: number;
  discoveredItemNames: string[];
  baseWeight: number;
  bonusWeight: number;
  finalWeight: number;
  winChancePercent: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyDrawModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [candidates, setCandidates] = useState<EligibleCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawing settings
  const [enableItemBonus, setEnableItemBonus] = useState(true);
  const [bonusPercent, setBonusPercent] = useState(100); // default +100% = 2x chance
  const [minBoothsFilter, setMinBoothsFilter] = useState<number>(1); // 1 = at least 1 booth (everyone included)
  const [weightMode, setWeightMode] = useState<'progressive' | 'linear' | 'equal'>('progressive');

  const [isRolling, setIsRolling] = useState(false);
  const [rollingCandidate, setRollingCandidate] = useState<EligibleCandidate | null>(null);
  const [winner, setWinner] = useState<EligibleCandidate | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<EligibleCandidate[]>([]);

  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load candidates & calculate weights based on settings configured in admin
  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const [allStudents, allBooths, allCheckins, allDiscoveries, settings] = await Promise.all([
        studentService.getAllStudents(),
        boothService.getBooths(),
        boothService.getAllCheckins(),
        discoveryService.getAllDiscoveries(),
        dashboardService.getSettings(),
      ]);

      const activeBooths = allBooths.filter((b) => b.is_active);
      const requiredCount = Math.max(activeBooths.length, 1);

      const minBoothsFilter = settings.raffle_min_booths ?? 1;
      const weightMode = settings.raffle_weight_mode || 'progressive';
      const enableItemBonus = settings.raffle_enable_item_bonus ?? true;
      const bonusPercent = settings.raffle_bonus_percent ?? 100;

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

        // Include students meeting minimum booth threshold
        if (visitedCount >= minBoothsFilter) {
          const stDiscoveries = discoveriesByStudent.get(st.id) || [];
          const itemsCount = stDiscoveries.length;
          const itemNames = stDiscoveries.map((d) => d.item?.name || d.notes || 'Secret Item');

          const ratio = Math.min(1.0, visitedCount / requiredCount);
          const completionPct = Math.round(ratio * 100);

          let baseWeight = 1.0;
          if (weightMode === 'progressive') {
            baseWeight = Math.pow(ratio, 2.5);
          } else if (weightMode === 'linear') {
            baseWeight = ratio;
          } else {
            baseWeight = 1.0;
          }

          const hasItems = itemsCount > 0;
          const bonusMultiplier = hasItems && enableItemBonus ? 1 + bonusPercent / 100 : 1.0;
          const finalWeight = baseWeight * bonusMultiplier;

          eligible.push({
            student: st,
            boothsVisitedCount: visitedCount,
            requiredBoothsCount: requiredCount,
            completionPercent: completionPct,
            itemDiscoveriesCount: itemsCount,
            discoveredItemNames: itemNames,
            baseWeight,
            bonusWeight: finalWeight - baseWeight,
            finalWeight,
            winChancePercent: 0,
          });
        }
      });

      // Calculate total weight of candidates
      const totalWeight = eligible.reduce((sum, c) => sum + c.finalWeight, 0);
      if (totalWeight > 0) {
        eligible.forEach((c) => {
          c.winChancePercent = (c.finalWeight / totalWeight) * 100;
        });
      }

      // Sort by completion percent descending
      eligible.sort((a, b) => b.completionPercent - a.completionPercent || b.finalWeight - a.finalWeight);

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
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter out candidates already drawn if available candidates exist
  const availableCandidates = candidates.filter(
    (c) => !drawnHistory.some((d) => d.student.id === c.student.id)
  );

  const pool = availableCandidates.length > 0 ? availableCandidates : candidates;

  // Statistics breakdown
  const full100Count = candidates.filter((c) => c.completionPercent === 100).length;
  const partialCount = candidates.filter((c) => c.completionPercent < 100).length;

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
      if (step < 35) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-2xl animate-fade-in">
      <div className="max-w-5xl lg:max-w-6xl w-full bg-slate-950 border-4 border-mario-yellow rounded-3xl p-6 sm:p-10 space-y-6 shadow-[0_0_100px_rgba(249,200,14,0.5)] relative overflow-hidden max-h-[96vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-mario-yellow/20 border-2 border-mario-yellow/70 flex items-center justify-center shadow-neon-yellow shrink-0">
              <Trophy className="w-8 h-8 text-mario-yellow" />
            </div>
            <div>
              <h3 className="font-game text-lg sm:text-2xl text-mario-yellow tracking-wider">🎰 LUCKY DRAW GRAND PRIZE</h3>
              <p className="text-xs sm:text-base text-slate-300">
                สุ่มผู้โชคดีรางวัลใหญ่ประจำกิจกรรม PTECH-Sci
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900 px-3.5 py-2 rounded-2xl border border-slate-800">
              <Users className="w-4 h-4 text-mario-orange" />
              <span>ผู้มีสิทธิ์: <strong className="text-mario-yellow font-black text-sm">{candidates.length} คน</strong></span>
              <span className="text-emerald-400 font-bold ml-1">(ครบ 100%: {full100Count} คน)</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isRolling}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all disabled:opacity-30"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Ticker / Rolling Display Screen (GIANT STAGE VIEW) */}
        <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-4 border-mario-yellow/80 text-center shadow-[inset_0_0_80px_rgba(249,200,14,0.2)] overflow-hidden min-h-[340px] sm:min-h-[420px] flex flex-col items-center justify-center">
          
          {/* Animated Cyber Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#f9c80e_2px,transparent_2px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          {isLoading ? (
            <div className="flex items-center gap-3 text-slate-200 font-mono text-base sm:text-lg font-bold">
              <RefreshCw className="w-8 h-8 animate-spin text-mario-yellow" />
              <span>กำลังโหลดรายชื่อผู้เข้าร่วมกิจกรรม...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="space-y-3">
              <Trophy className="w-16 h-16 text-slate-600 mx-auto" />
              <p className="text-slate-200 text-lg font-bold">ไม่พบรายชื่อผู้เข้าร่วมสุ่มรางวัล</p>
              <p className="text-slate-400 text-sm">กรุณาตรวจสอบการตั้งค่าหลังบ้านในหน้าผู้ดูแลระบบ</p>
            </div>
          ) : (
            <div className="space-y-4 z-10 w-full">
              {isRolling && rollingCandidate ? (
                <div className="animate-pulse space-y-4">
                  <span className="inline-block px-6 py-2 rounded-full bg-mario-orange/30 text-mario-yellow font-mono text-sm sm:text-base font-black uppercase tracking-widest border-2 border-mario-orange/60 shadow-neon-orange">
                    🎲 SEARCHING LUCKY WINNER...
                  </span>
                  <h2 className="font-black text-4xl sm:text-6xl lg:text-7xl text-mario-yellow font-mono tracking-tight truncate max-w-full px-2 drop-shadow-[0_0_30px_rgba(249,200,14,0.8)]">
                    {rollingCandidate.student.full_name}
                  </h2>
                  <p className="text-xl sm:text-3xl text-white font-mono font-black">
                    รหัส: {rollingCandidate.student.student_code}
                  </p>
                </div>
              ) : winner ? (
                <div className="space-y-6 animate-scale-pop">
                  <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-mario-green/30 text-mario-green font-mono text-base sm:text-xl font-black border-2 border-mario-green/80 shadow-neon-green">
                    <Sparkles className="w-6 h-6 animate-spin text-mario-green" />
                    🎉 LUCKY WINNER FOUND! 🎉
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-black text-5xl sm:text-7xl lg:text-8xl text-mario-yellow tracking-tight drop-shadow-[0_0_50px_rgba(249,200,14,0.9)] leading-none px-2">
                      {winner.student.full_name}
                    </h2>

                    <div className="text-2xl sm:text-4xl text-white font-mono font-black tracking-wide flex items-center justify-center gap-3 flex-wrap pt-2">
                      <span>รหัส: <strong className="text-mario-yellow underline">{winner.student.student_code}</strong></span>
                      {winner.student.class_name && (
                        <span className="px-3 py-1 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200">
                          {winner.student.class_name}
                        </span>
                      )}
                    </div>

                    {winner.student.department && (
                      <p className="text-lg sm:text-2xl text-emerald-300 font-bold tracking-wide">
                        {winner.student.department}
                      </p>
                    )}
                  </div>

                  {/* Achievement Stats Badges */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4 pt-4 flex-wrap text-sm sm:text-lg">
                    <span className="px-5 py-2.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500/80 text-emerald-300 font-extrabold flex items-center gap-2 shadow-lg">
                      <ShieldCheck className="w-5 h-5 text-mario-green" />
                      สะสมตัวอักษร {winner.boothsVisitedCount}/{winner.requiredBoothsCount} ซุ้ม ({winner.completionPercent}%)
                    </span>

                    <span className="px-5 py-2.5 rounded-2xl bg-sky-950/90 border-2 border-sky-500/80 text-sky-300 font-extrabold flex items-center gap-2 shadow-lg font-mono">
                      <Percent className="w-5 h-5 text-sky-400" />
                      โอกาสถูกสุ่มในรอบนี้: {winner.winChancePercent.toFixed(2)}%
                    </span>

                    {winner.itemDiscoveriesCount > 0 && (
                      <span className="px-5 py-2.5 rounded-2xl bg-amber-950/90 border-2 border-amber-500/80 text-amber-300 font-extrabold flex items-center gap-2 shadow-lg">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        พบไอเท็มลับ {winner.itemDiscoveriesCount} ชิ้น
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-6">
                  <Gift className="w-20 h-20 text-mario-yellow mx-auto animate-bounce" />
                  <h3 className="font-black text-white text-2xl sm:text-4xl">พร้อมทำการสุ่มผู้โชคดีรางวัลใหญ่!</h3>
                  <p className="text-sm sm:text-lg text-slate-300 max-w-xl mx-auto">
                    กดปุ่ม <strong className="text-mario-yellow font-black">"🎰 เริ่มสุ่มผู้โชคดีทันที"</strong> ด้านล่างเพื่อเริ่มการสุ่มลุ้นรางวัล
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={handleStartDraw}
            disabled={candidates.length === 0 || isRolling}
            className="w-full sm:flex-1 py-5 sm:py-6 rounded-2xl bg-gradient-to-r from-mario-yellow via-mario-orange to-mario-red text-slate-950 font-black text-lg sm:text-2xl shadow-neon-yellow hover:opacity-95 transition-all disabled:opacity-40 pixel-btn flex items-center justify-center gap-3 cursor-pointer"
          >
            <Trophy className="w-7 h-7 text-slate-950" />
            <span>{isRolling ? 'กำลังสุ่ม...' : winner ? '🎲 สุ่มผู้โชคดีคนต่อไป' : '🎰 เริ่มสุ่มผู้โชคดีทันที'}</span>
          </button>

          {winner && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-8 py-5 sm:py-6 rounded-2xl bg-slate-900 border-2 border-slate-700 text-slate-200 hover:text-white font-bold text-base hover:border-slate-600 transition-all cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
