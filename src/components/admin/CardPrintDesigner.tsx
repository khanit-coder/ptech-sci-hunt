import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Student } from "@/types";
import { QRCodeSVG } from "qrcode.react";
import { soundManager } from "@/lib/sound";
import { 
  X, Eye, EyeOff, Printer, RefreshCw, ChevronLeft, ChevronRight, 
  Save, FolderOpen, Trash2, CheckSquare, Square, Search, Filter,
  Layers, Check
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
type PaperSz = "A4" | "A5" | "A6";
type Orient  = "portrait" | "landscape";
type DragTgt = "qr" | "name" | "code" | "class" | "school" | null;
interface Pos { x: number; y: number; }

interface CardCfg {
  bgFront: string | null; bgBack: string | null;
  paper: PaperSz; orient: Orient;
  cols: number; rows: number;
  qrPos: Pos; qrSzPct: number; qrRot: number; qrFlipH: boolean; qrFlipV: boolean;
  qrCnt: "student_code" | "qr_token";
  showName: boolean;   nPos: Pos;  nFpt: number;
  showCode: boolean;   cdPos: Pos; cdFpt: number;
  showClass: boolean;  clPos: Pos; clFpt: number;
  showSchool: boolean; scPos: Pos; scFpt: number;
  dblSided: boolean;
}

interface CardTemplate {
  id: string;
  name: string;
  createdAt: string;
  cfg: CardCfg;
}

const PAPER_MM: Record<PaperSz, Record<Orient, { w: number; h: number }>> = {
  A4: { portrait: { w: 210, h: 297 }, landscape: { w: 297, h: 210 } },
  A5: { portrait: { w: 148, h: 210 }, landscape: { w: 210, h: 148 } },
  A6: { portrait: { w: 105, h: 148 }, landscape: { w: 148, h: 105 } },
};

const INIT: CardCfg = {
  bgFront: null, bgBack: null, paper: "A4", orient: "portrait", cols: 2, rows: 2,
  qrPos: { x: 50, y: 38 }, qrSzPct: 40, qrRot: 0, qrFlipH: false, qrFlipV: false,
  qrCnt: "student_code",
  showName: true,   nPos:  { x: 50, y: 75 }, nFpt: 10,
  showCode: true,   cdPos: { x: 50, y: 83 }, cdFpt: 7,
  showClass: true,  clPos: { x: 50, y: 90 }, clFpt: 7,
  showSchool: false, scPos: { x: 50, y: 96 }, scFpt: 7,
  dblSided: false,
};

const PRESET_TEMPLATES: CardTemplate[] = [
  {
    id: "preset-a4-2x2",
    name: "Standard A4 (2×2 = 4 การ์ด)",
    createdAt: new Date().toISOString(),
    cfg: { ...INIT, paper: "A4", cols: 2, rows: 2 }
  },
  {
    id: "preset-a4-3x3",
    name: "Compact A4 (3×3 = 9 การ์ด)",
    createdAt: new Date().toISOString(),
    cfg: { ...INIT, paper: "A4", cols: 3, rows: 3, qrSzPct: 35, nFpt: 8, cdFpt: 6, clFpt: 6 }
  },
  {
    id: "preset-a6-single",
    name: "Single Card A6 (1×1)",
    createdAt: new Date().toISOString(),
    cfg: { ...INIT, paper: "A6", cols: 1, rows: 1, qrSzPct: 45, nFpt: 14, cdFpt: 10, clFpt: 10 }
  }
];

const LOCAL_STORAGE_KEY = "ptech_card_print_templates_v1";

interface Props { students: Student[]; onClose: () => void; }

// ── Shared UI helpers ────────────────────────────────────────────────────────
const pill = (active: boolean): React.CSSProperties => ({
  padding: "5px 11px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
  border: `1px solid ${active ? "#f97316" : "#334155"}`,
  background: active ? "#7c2d12" : "#1e293b",
  color: active ? "#fb923c" : "#94a3b8",
});

const iBtn: React.CSSProperties = {
  background: "#1e293b", border: "1px solid #334155", borderRadius: "6px",
  color: "#94a3b8", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600,
};

// ── Main Component ───────────────────────────────────────────────────────────
export const CardPrintDesigner: React.FC<Props> = ({ students, onClose }) => {
  const [cfg, setCfg] = useState<CardCfg>(INIT);
  const [canvasSide, setCanvasSide] = useState<"front" | "back">("front");
  const [pvIdx, setPvIdx] = useState(0);
  const [printOpen, setPrintOpen] = useState(false);
  const [drag, setDrag] = useState<{ tgt: DragTgt; mx: number; my: number; ex: number; ey: number } | null>(null);

  // Student filtering & selection state
  const [subTab, setSubTab] = useState<"all" | "internal" | "external">("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(students.map(s => s.id)));

  // Saved templates state
  const [savedTemplates, setSavedTemplates] = useState<CardTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [templateName, setTemplateName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const frontRef  = useRef<HTMLInputElement>(null);
  const backRef   = useRef<HTMLInputElement>(null);

  const upd = (p: Partial<CardCfg>) => setCfg(prev => ({ ...prev, ...p }));

  // Extract unique class list for filter dropdown
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter students based on SubTab, Class, Search
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (subTab === "internal" && s.student_status === "external") return false;
      if (subTab === "external" && s.student_status !== "external") return false;
      if (filterClass !== "all" && s.class_name !== filterClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (s.student_code || "").toLowerCase();
        const name = (s.full_name || "").toLowerCase();
        const cls  = (s.class_name || "").toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cls.includes(q)) return false;
      }
      return true;
    });
  }, [students, subTab, filterClass, searchQuery]);

  // Print list: filtered students that are checked/selected
  const printableStudents = useMemo(() => {
    return filteredStudents.filter(s => selectedIds.has(s.id));
  }, [filteredStudents, selectedIds]);

  // Keep selectedIds up to date when students prop changes
  useEffect(() => {
    setSelectedIds(new Set(students.map(s => s.id)));
  }, [students]);

  const toggleSelectAll = () => {
    const currentFilteredIds = filteredStudents.map(s => s.id);
    const allSelected = currentFilteredIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      currentFilteredIds.forEach(id => next.delete(id));
    } else {
      currentFilteredIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleSelectStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Demo student fallback if printable is empty
  const demoStu: Student = {
    id: "demo", student_code: "66209010001", full_name: "ตัวอย่าง นักเรียน",
    first_name: "ตัวอย่าง", last_name: "นักเรียน", class_name: "ปวช.1/1",
    school_name: "วิทยาลัย", student_status: "active", qr_token: "66209010001"
  } as Student;

  const pvStu = printableStudents.length > 0
    ? printableStudents[Math.min(pvIdx, printableStudents.length - 1)]
    : (filteredStudents.length > 0 ? filteredStudents[0] : demoStu);

  const paper    = PAPER_MM[cfg.paper][cfg.orient];
  const cardW    = paper.w / cfg.cols;
  const cardH    = paper.h / cfg.rows;
  const perPage  = cfg.cols * cfg.rows;

  // ── Drag Handlers ──────────────────────────────────────────────────────────
  const posMap = (): Record<Exclude<DragTgt, null>, Pos> => ({
    qr: cfg.qrPos, name: cfg.nPos, code: cfg.cdPos, class: cfg.clPos, school: cfg.scPos,
  });

  const onDown = (e: React.MouseEvent | React.TouchEvent, tgt: DragTgt) => {
    if (!tgt || canvasSide === "back") return; 
    e.preventDefault();
    if ("stopPropagation" in e) e.stopPropagation();
    const pm = posMap(); const ep = pm[tgt];
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    setDrag({ tgt, mx: cx, my: cy, ex: ep.x, ey: ep.y });
  };

  const onMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drag || !canvasRef.current) return;
    const cx = "touches" in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    const cy = "touches" in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
    const r  = canvasRef.current.getBoundingClientRect();
    const nx = Math.max(1, Math.min(99, drag.ex + (cx - drag.mx) / r.width  * 100));
    const ny = Math.max(1, Math.min(99, drag.ey + (cy - drag.my) / r.height * 100));
    const p: Pos = { x: nx, y: ny };
    if      (drag.tgt === "qr")    upd({ qrPos: p });
    else if (drag.tgt === "name")  upd({ nPos: p });
    else if (drag.tgt === "code")  upd({ cdPos: p });
    else if (drag.tgt === "class") upd({ clPos: p });
    else                           upd({ scPos: p });
  }, [drag]);

  const onUp = useCallback(() => setDrag(null), []);

  useEffect(() => {
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, [onMove, onUp]);

  const qrVal = (s: Student) => cfg.qrCnt === "qr_token" && s.qr_token ? s.qr_token : s.student_code;

  const onImg = (side: "front" | "back", file: File) => {
    const fr = new FileReader();
    fr.onload = e => {
      const res = e.target?.result as string;
      if (side === "front") upd({ bgFront: res });
      else upd({ bgBack: res });
    };
    fr.readAsDataURL(file);
  };

  const act = (t: DragTgt) => drag?.tgt === t;

  // ── Card renderer (Front or Back) ──────────────────────────────────────────
  const renderCard = (s: Student, inter: boolean, isBackSide: boolean = false) => {
    const bg = isBackSide ? cfg.bgBack : cfg.bgFront;

    const labelStyle = (tgt: DragTgt, x: number, y: number, fs: number, mono?: boolean): React.CSSProperties => ({
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%,-50%)", fontSize: `${fs}pt`,
      color: "white", textShadow: "0 1px 5px rgba(0,0,0,1)", whiteSpace: "nowrap",
      fontFamily: mono ? "monospace" : undefined,
      cursor: inter && !isBackSide ? (act(tgt) ? "grabbing" : "grab") : "default",
      zIndex: 10, touchAction: "none",
      background: inter && !isBackSide ? "rgba(0,0,0,0.35)" : undefined,
      padding: inter && !isBackSide ? "1px 4px" : undefined, 
      borderRadius: inter && !isBackSide ? "3px" : undefined,
      outline: inter && !isBackSide && act(tgt) ? "1px dashed #4ade80" : undefined,
    });

    return (
      <div 
        className="cpd-card-inner"
        style={{
          position: "relative", width: "100%", height: "100%", overflow: "hidden",
          backgroundImage: bg ? `url(${bg})` : undefined, 
          backgroundSize: "cover", backgroundPosition: "center",
          backgroundColor: bg ? undefined : (isBackSide ? "#1e293b" : "#0f172a"),
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
      >
        {!bg && inter && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "28px" }}>{isBackSide ? "🎴" : "🖼️"}</span>
            <span style={{ color: "#475569", fontSize: "11px", textAlign: "center" }}>
              {isBackSide ? "อัปโหลดภาพพื้นหลังด้านหลัง" : "อัปโหลดภาพพื้นหลังด้านหน้า"}
            </span>
          </div>
        )}

        {/* Render Front Elements (QR & Texts) only on Front Side */}
        {!isBackSide && (
          <>
            {/* QR Code */}
            <div 
              onMouseDown={inter ? e => onDown(e, "qr") : undefined} 
              onTouchStart={inter ? e => onDown(e, "qr") : undefined}
              style={{
                position: "absolute", left: `${cfg.qrPos.x}%`, top: `${cfg.qrPos.y}%`,
                width: `${cfg.qrSzPct}%`, aspectRatio: "1/1",
                transform: `translate(-50%,-50%) rotate(${cfg.qrRot}deg) scaleX(${cfg.qrFlipH ? -1 : 1}) scaleY(${cfg.qrFlipV ? -1 : 1})`,
                cursor: inter ? (act("qr") ? "grabbing" : "grab") : "default",
                zIndex: 10, touchAction: "none",
                outline: inter ? (act("qr") ? "2px solid #f97316" : "1px dashed rgba(249,115,22,0.4)") : undefined,
                outlineOffset: "2px",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              <QRCodeSVG value={qrVal(s)} size={256} level="M" bgColor="white" fgColor="#000"
                style={{ width: "100%", height: "auto", display: "block" }} />
            </div>

            {/* Name */}
            {cfg.showName && (
              <div onMouseDown={inter ? e => onDown(e, "name") : undefined} onTouchStart={inter ? e => onDown(e, "name") : undefined}
                style={{ ...labelStyle("name", cfg.nPos.x, cfg.nPos.y, cfg.nFpt), fontWeight: 700 }}>{s.full_name}</div>
            )}

            {/* Code */}
            {cfg.showCode && (
              <div onMouseDown={inter ? e => onDown(e, "code") : undefined} onTouchStart={inter ? e => onDown(e, "code") : undefined}
                style={labelStyle("code", cfg.cdPos.x, cfg.cdPos.y, cfg.cdFpt, true)}>{s.student_code}</div>
            )}

            {/* Class */}
            {cfg.showClass && s.class_name && (
              <div onMouseDown={inter ? e => onDown(e, "class") : undefined} onTouchStart={inter ? e => onDown(e, "class") : undefined}
                style={labelStyle("class", cfg.clPos.x, cfg.clPos.y, cfg.clFpt)}>{s.class_name}</div>
            )}

            {/* School */}
            {cfg.showSchool && s.school_name && (
              <div onMouseDown={inter ? e => onDown(e, "school") : undefined} onTouchStart={inter ? e => onDown(e, "school") : undefined}
                style={labelStyle("school", cfg.scPos.x, cfg.scPos.y, cfg.scFpt)}>{s.school_name}</div>
            )}
          </>
        )}
      </div>
    );
  };

  // Build Pages for Print
  const pages: Student[][] = [];
  for (let i = 0; i < printableStudents.length; i += perPage) {
    pages.push(printableStudents.slice(i, i + perPage));
  }

  // ── Save & Load Templates ──────────────────────────────────────────────────
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    const newTpl: CardTemplate = {
      id: "tpl-" + Date.now(),
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      cfg: { ...cfg }
    };
    const next = [newTpl, ...savedTemplates];
    setSavedTemplates(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Failed to save template to localStorage", err);
    }
    setTemplateName("");
    setShowSaveModal(false);
    soundManager.playClick();
  };

  const handleLoadTemplate = (tpl: CardTemplate) => {
    upd(tpl.cfg);
    soundManager.playClick();
  };

  const handleDeleteTemplate = (id: string) => {
    const next = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(next);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
    soundManager.playClick();
  };

  // ── Print Portal ───────────────────────────────────────────────────────────
  const PrintPortal = printOpen ? createPortal(
    <div id="cpd-root-portal" style={{ position: "fixed", inset: 0, zIndex: 999999, background: "#0b0f19", overflowY: "auto" }}>
      <style>{`
        @media print {
          @page { size: ${paper.w}mm ${paper.h}mm; margin: 0mm !important; }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body > *:not(#cpd-root-portal) { display: none !important; }
          #cpd-root-portal { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            color: black !important; 
            display: block !important; 
            overflow: visible !important; 
          }
          .np { display: none !important; }
          .pg { 
            margin: 0 !important; 
            box-shadow: none !important; 
            border: none !important; 
            page-break-after: always !important; 
            break-after: page !important; 
            page-break-inside: avoid !important; 
            break-inside: avoid !important; 
            overflow: hidden !important; 
          }
        }
      `}</style>

      <div style={{ minHeight: "100vh" }}>
        {/* Header bar (no-print) */}
        <div className="np" style={{
          position: "sticky", top: 0, zIndex: 10, background: "#0f172a",
          padding: "12px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid #1e293b", gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>🖨️ ตัวอย่างก่อนพิมพ์ ({printableStudents.length} คน)</span>
            <span style={{ fontSize: "11px", color: "#94a3b8", background: "#1e293b", padding: "3px 10px", borderRadius: "8px" }}>
              {pages.length} แผ่น • {cfg.paper} {cfg.orient === "portrait" ? "แนวตั้ง" : "แนวนอน"} • {cfg.cols}x{cfg.rows} ช่อง ({cardW.toFixed(0)}x{cardH.toFixed(0)}mm)
            </span>
            {cfg.dblSided && (
              <span style={{ fontSize: "11px", color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "3px 10px", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.3)" }}>
                ⚡ Double-sided: {pages.length} หน้าหน้า + {pages.length} หน้าหลัง
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => window.print()} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none", borderRadius: "10px", padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: "13px", boxShadow: "0 2px 12px rgba(249,115,22,0.4)" }}>
              🖨️ พิมพ์เลย
            </button>
            <button onClick={() => setPrintOpen(false)} style={{ background: "#374151", color: "white", border: "none", borderRadius: "8px", padding: "9px 14px", fontWeight: 600, cursor: "pointer" }}>
              ✕ ปิด
            </button>
          </div>
        </div>

        {/* Printable Sheets */}
        <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {pages.map((pg, pi) => (
            <div key={`f${pi}`} className="pg" style={{
              width: `${paper.w}mm`, height: `${paper.h}mm`,
              display: "grid",
              gridTemplateColumns: `repeat(${cfg.cols}, ${cardW}mm)`,
              gridTemplateRows: `repeat(${cfg.rows}, ${cardH}mm)`,
              margin: "0 auto 24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              overflow: "hidden", flexShrink: 0,
              background: "white",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}>
              {Array(perPage).fill(null).map((_, ci) => {
                const stu = pg[ci];
                return (
                  <div key={ci} style={{ width: `${cardW}mm`, height: `${cardH}mm`, position: "relative", overflow: "hidden" }}>
                    {stu ? renderCard(stu, false, false) : (
                      <div style={{
                        width: "100%", height: "100%",
                        backgroundImage: cfg.bgFront ? `url(${cfg.bgFront})` : undefined,
                        backgroundSize: "cover", backgroundColor: "#f8fafc",
                        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact"
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Double-sided Back Pages */}
          {cfg.dblSided && pages.map((pg, pi) => (
            <div key={`b${pi}`} className="pg" style={{
              width: `${paper.w}mm`, height: `${paper.h}mm`,
              display: "grid",
              gridTemplateColumns: `repeat(${cfg.cols}, ${cardW}mm)`,
              gridTemplateRows: `repeat(${cfg.rows}, ${cardH}mm)`,
              margin: "0 auto 24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              overflow: "hidden", flexShrink: 0,
              background: "white",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}>
              {Array(perPage).fill(null).map((_, ci) => {
                const stu = pg[ci];
                return (
                  <div key={ci} style={{ width: `${cardW}mm`, height: `${cardH}mm`, position: "relative", overflow: "hidden" }}>
                    {stu ? renderCard(stu, false, true) : (
                      <div style={{
                        width: "100%", height: "100%",
                        backgroundImage: cfg.bgBack ? `url(${cfg.bgBack})` : undefined,
                        backgroundSize: "cover", backgroundColor: "#f1f5f9",
                        WebkitPrintColorAdjust: "exact", printColorAdjust: "exact"
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // Sub-components
  const SecTitle = ({ ch }: { ch: string }) => (
    <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: "6px", borderBottom: "1px solid #1e293b", marginTop: "4px" }}>{ch}</div>
  );

  const TextRow = ({ lbl, show, tog, fpt, sf }: { lbl: string; show: boolean; tog: () => void; fpt: number; sf: (v: number) => void }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px", borderRadius: "8px", background: "#0f172a", border: `1px solid ${show ? "#1e3a5f" : "#1e293b"}` }}>
      <button onClick={tog} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: show ? "#4ade80" : "#475569", display: "flex", flexShrink: 0 }}>
        {show ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <span style={{ fontSize: "11px", color: show ? "white" : "#475569", flex: 1, fontWeight: 500 }}>{lbl}</span>
      {show && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <button onClick={() => sf(Math.max(6, fpt - 1))} style={{ width: 20, height: 20, background: "#1e293b", border: "1px solid #334155", borderRadius: "4px", color: "white", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
          <span style={{ fontSize: "10px", color: "#94a3b8", minWidth: "30px", textAlign: "center", fontFamily: "monospace" }}>{fpt}pt</span>
          <button onClick={() => sf(Math.min(24, fpt + 1))} style={{ width: 20, height: 20, background: "#1e293b", border: "1px solid #334155", borderRadius: "4px", color: "white", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {PrintPortal}

      {/* Save Template Modal */}
      {showSaveModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", padding: "20px", width: "100%", maxWidth: "380px", color: "white" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Save size={16} className="text-orange-500" /> บันทึกเท็มเพลตการ์ด
            </h3>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
              ตั้งชื่อเท็มเพลตนี้เพื่อเรียกใช้งานภายหลัง (รวมรูปพื้นหลังและตำแหน่งตำแหน่งที่จัดไว้)
            </p>
            <input
              type="text"
              placeholder="เช่น บัตรนักเรียน A4 (2×2)"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              style={{ width: "100%", background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "10px 12px", color: "white", fontSize: "13px", marginBottom: "16px" }}
              autoFocus
            />
            <div style={{ display: "flex", justifyContent: "end", gap: "8px" }}>
              <button onClick={() => setShowSaveModal(false)} style={{ background: "#334155", color: "white", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={handleSaveTemplate} disabled={!templateName.trim()} style={{ background: "#f97316", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 700, cursor: "pointer", opacity: templateName.trim() ? 1 : 0.4 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Designer Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", flexDirection: "column",
        background: "#020617", color: "white",
        fontFamily: "system-ui,-apple-system,sans-serif",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: "1px solid #1e293b",
          background: "#0f172a", flexShrink: 0, gap: "12px", flexWrap: "wrap"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "20px" }}>🎨</span>
            <span style={{ fontWeight: 800, fontSize: "15px" }}>Card Print Designer</span>
            <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", padding: "2px 10px", borderRadius: "8px", fontWeight: 700 }}>
              เลือก {printableStudents.length} / {students.length} คน
            </span>
            <span style={{ fontSize: "11px", color: "#64748b", background: "#1e293b", padding: "2px 8px", borderRadius: "6px" }}>
              {cfg.paper} {cfg.orient === "portrait" ? "แนวตั้ง" : "แนวนอน"} • {cfg.cols}x{cfg.rows} = {perPage} การ์ด/แผ่น ({cardW.toFixed(0)}x{cardH.toFixed(0)}mm)
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setShowSaveModal(true)}
              style={{ background: "#1e293b", color: "#fb923c", border: "1px solid #7c2d12", borderRadius: "8px", padding: "7px 12px", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              title="บันทึกเลย์เอาต์นี้ไว้เป็นเท็มเพลต"
            >
              <Save size={14} /> บันทึกเท็มเพลต
            </button>
            <button
              onClick={() => { soundManager.playClick(); setPrintOpen(true); }}
              disabled={printableStudents.length === 0}
              style={{
                background: printableStudents.length > 0 ? "linear-gradient(135deg,#f97316,#ea580c)" : "#334155",
                color: "white", border: "none", borderRadius: "10px", padding: "9px 18px", fontWeight: 800,
                cursor: printableStudents.length > 0 ? "pointer" : "not-allowed", fontSize: "13px",
                boxShadow: printableStudents.length > 0 ? "0 2px 12px rgba(249,115,22,0.35)" : "none",
                display: "flex", alignItems: "center", gap: "6px"
              }}
            >
              <Printer size={14} /> Preview & Print ({printableStudents.length})
            </button>
            <button onClick={onClose} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", padding: "9px 12px", cursor: "pointer", display: "flex" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* LEFT PANEL: Settings & Templates */}
          <div style={{
            width: "260px", flexShrink: 0, borderRight: "1px solid #1e293b",
            overflowY: "auto", padding: "14px 12px",
            display: "flex", flexDirection: "column", gap: "10px",
            background: "#080d18",
          }}>

            {/* Saved Templates Selection */}
            <SecTitle ch="📂 เท็มเพลตที่บันทึกไว้ (Templates)" />
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <select
                onChange={e => {
                  const val = e.target.value;
                  if (!val) return;
                  const allTpls = [...PRESET_TEMPLATES, ...savedTemplates];
                  const found = allTpls.find(t => t.id === val);
                  if (found) handleLoadTemplate(found);
                }}
                style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "white", padding: "7px 10px", fontSize: "11px" }}
                defaultValue=""
              >
                <option value="" disabled>-- เลือกเท็มเพลตที่ต้องการใช้ --</option>
                <optgroup label="✨ Preset เริ่มต้น">
                  {PRESET_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
                {savedTemplates.length > 0 && (
                  <optgroup label="💾 เท็มเพลตของคุณ">
                    {savedTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* Saved custom templates pills */}
              {savedTemplates.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                  {savedTemplates.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", padding: "4px 8px" }}>
                      <span onClick={() => handleLoadTemplate(t)} style={{ fontSize: "11px", color: "#fb923c", cursor: "pointer", flex: 1, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.name}
                      </span>
                      <button onClick={() => handleDeleteTemplate(t.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px" }} title="ลบเท็มเพลตนี้">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Background Images */}
            <SecTitle ch="📷 ภาพพื้นหลัง" />
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "5px", fontWeight: 600 }}>หน้าหน้า (Front Image)</div>
              <div onClick={() => frontRef.current?.click()} style={{ height: "72px", border: `2px dashed ${cfg.bgFront ? "#334155" : "#1e3a8a"}`, borderRadius: "10px", cursor: "pointer", overflow: "hidden", position: "relative", backgroundImage: cfg.bgFront ? `url(${cfg.bgFront})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!cfg.bgFront && <span style={{ fontSize: "11px", color: "#475569", textAlign: "center" }}>📁 คลิกอัปโหลดภาพ<br/><span style={{ fontSize: "10px", color: "#334155" }}>PNG / JPG / WEBP</span></span>}
                {cfg.bgFront && <button onClick={e => { e.stopPropagation(); upd({ bgFront: null }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "4px", color: "white", width: 20, height: 20, cursor: "pointer", fontSize: "12px" }}>x</button>}
              </div>
              <input ref={frontRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onImg("front", e.target.files[0])} />
            </div>

            {cfg.dblSided && (
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "5px", fontWeight: 600 }}>หน้าหลัง (Back Image)</div>
                <div onClick={() => backRef.current?.click()} style={{ height: "72px", border: `2px dashed ${cfg.bgBack ? "#334155" : "#7c2d12"}`, borderRadius: "10px", cursor: "pointer", overflow: "hidden", position: "relative", backgroundImage: cfg.bgBack ? `url(${cfg.bgBack})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!cfg.bgBack && <span style={{ fontSize: "11px", color: "#475569", textAlign: "center" }}>📁 คลิกอัปโหลดภาพ<br/><span style={{ fontSize: "10px", color: "#334155" }}>ภาพพื้นหลังด้านหลัง</span></span>}
                  {cfg.bgBack && <button onClick={e => { e.stopPropagation(); upd({ bgBack: null }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "4px", color: "white", width: 20, height: 20, cursor: "pointer", fontSize: "12px" }}>x</button>}
                </div>
                <input ref={backRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onImg("back", e.target.files[0])} />
              </div>
            )}

            {/* Paper Size */}
            <SecTitle ch="📄 ขนาดกระดาษ" />
            <div style={{ display: "flex", gap: "6px" }}>
              {(["A4","A5","A6"] as PaperSz[]).map(sz => <button key={sz} onClick={() => upd({ paper: sz })} style={pill(cfg.paper === sz)}>{sz}</button>)}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["portrait","landscape"] as Orient[]).map(o => <button key={o} onClick={() => upd({ orient: o })} style={{ ...pill(cfg.orient === o), flex: 1 }}>{o === "portrait" ? "⬆ แนวตั้ง" : "➡ แนวนอน"}</button>)}
            </div>

            {/* Grid */}
            <SecTitle ch="🔲 Grid (ช่อง/แผ่น)" />
            {[
              { lbl: "คอลัมน์ (Cols)", v: cfg.cols, min: 1, max: 6, s: (v: number) => upd({ cols: v }) },
              { lbl: "แถว (Rows)",     v: cfg.rows, min: 1, max: 8, s: (v: number) => upd({ rows: v }) },
            ].map(({ lbl, v, min, max, s }) => (
              <div key={lbl} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", flex: 1 }}>{lbl}:</span>
                <button onClick={() => s(Math.max(min, v - 1))} style={{ ...iBtn, width: 24, height: 24, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>-</button>
                <span style={{ minWidth: "24px", textAlign: "center", fontSize: "14px", fontWeight: 800, color: "white" }}>{v}</span>
                <button onClick={() => s(Math.min(max, v + 1))} style={{ ...iBtn, width: 24, height: 24, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>+</button>
              </div>
            ))}
            <div style={{ fontSize: "11px", color: "#475569", background: "#0f172a", padding: "6px 10px", borderRadius: "8px", border: "1px solid #1e293b" }}>
              {cfg.cols}x{cfg.rows} = <strong style={{ color: "#f97316" }}>{perPage} การ์ด</strong>/แผ่น &nbsp;•&nbsp; <strong style={{ color: "#94a3b8" }}>{cardW.toFixed(0)}x{cardH.toFixed(0)}mm</strong>
            </div>

            {/* QR Code */}
            <SecTitle ch="📱 QR Code" />
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", minWidth: "52px" }}>เนื้อหา:</span>
                <select value={cfg.qrCnt} onChange={e => upd({ qrCnt: e.target.value as "student_code" | "qr_token" })}
                  style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: "6px", color: "white", padding: "5px 8px", fontSize: "11px" }}>
                  <option value="student_code">รหัสนักเรียน</option>
                  <option value="qr_token">QR Token</option>
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", minWidth: "52px" }}>ขนาด:</span>
                <input type="range" min={10} max={80} value={cfg.qrSzPct} onChange={e => upd({ qrSzPct: +e.target.value })} style={{ flex: 1, accentColor: "#f97316" }} />
                <span style={{ fontSize: "11px", color: "white", minWidth: "32px", fontFamily: "monospace" }}>{cfg.qrSzPct}%</span>
              </div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                <button onClick={() => upd({ qrRot: (cfg.qrRot - 90 + 360) % 360 })} style={iBtn}>↺ -90</button>
                <button onClick={() => upd({ qrRot: (cfg.qrRot + 90) % 360 })}       style={iBtn}>↻ +90</button>
                <button onClick={() => upd({ qrFlipH: !cfg.qrFlipH })} style={{ ...iBtn, background: cfg.qrFlipH ? "#7c2d12" : "#1e293b", color: cfg.qrFlipH ? "#fb923c" : "#94a3b8" }}>↔ Flip H</button>
                <button onClick={() => upd({ qrFlipV: !cfg.qrFlipV })} style={{ ...iBtn, background: cfg.qrFlipV ? "#7c2d12" : "#1e293b", color: cfg.qrFlipV ? "#fb923c" : "#94a3b8" }}>↕ Flip V</button>
              </div>
              <button onClick={() => upd({ qrRot: 0, qrFlipH: false, qrFlipV: false, qrPos: INIT.qrPos, qrSzPct: INIT.qrSzPct })}
                style={{ ...iBtn, color: "#f87171", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                <RefreshCw size={11} /> Reset QR Position
              </button>
            </div>

            {/* Text Labels */}
            <SecTitle ch="✏️ ข้อความ" />
            <TextRow lbl="ชื่อนักเรียน"  show={cfg.showName}   tog={() => upd({ showName:   !cfg.showName   })} fpt={cfg.nFpt}  sf={v => upd({ nFpt:  v })} />
            <TextRow lbl="รหัสนักเรียน" show={cfg.showCode}   tog={() => upd({ showCode:   !cfg.showCode   })} fpt={cfg.cdFpt} sf={v => upd({ cdFpt: v })} />
            <TextRow lbl="ห้อง/ชั้น"    show={cfg.showClass}  tog={() => upd({ showClass:  !cfg.showClass  })} fpt={cfg.clFpt} sf={v => upd({ clFpt: v })} />
            <TextRow lbl="โรงเรียน"     show={cfg.showSchool} tog={() => upd({ showSchool: !cfg.showSchool })} fpt={cfg.scFpt} sf={v => upd({ scFpt: v })} />

            {/* Print settings */}
            <SecTitle ch="📑 การพิมพ์" />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#94a3b8" }}>
              <input type="checkbox" checked={cfg.dblSided} onChange={e => upd({ dblSided: e.target.checked })} style={{ accentColor: "#f97316" }} />
              <span>Double-sided (พิมพ์หน้า-หลัง)</span>
            </label>
          </div>

          {/* CENTER PANEL: Design Canvas */}
          <div style={{
            flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            background: "radial-gradient(ellipse at center,#0d1626 0%,#020617 100%)",
            padding: "20px", gap: "12px", position: "relative",
          }}>

            {/* Canvas Front/Back Toggle Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#0f172a", border: "1px solid #1e293b", padding: "4px 8px", borderRadius: "10px" }}>
              <button
                onClick={() => setCanvasSide("front")}
                style={{
                  background: canvasSide === "front" ? "#f97316" : "#1e293b",
                  color: canvasSide === "front" ? "white" : "#94a3b8",
                  border: "none", borderRadius: "6px", padding: "5px 12px",
                  fontSize: "12px", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "5px"
                }}
              >
                🎴 ด้านหน้า (Front)
              </button>
              {cfg.dblSided && (
                <button
                  onClick={() => setCanvasSide("back")}
                  style={{
                    background: canvasSide === "back" ? "#f97316" : "#1e293b",
                    color: canvasSide === "back" ? "white" : "#94a3b8",
                    border: "none", borderRadius: "6px", padding: "5px 12px",
                    fontSize: "12px", fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "5px"
                  }}
                >
                  🎴 ด้านหลัง (Back)
                </button>
              )}
            </div>

            <div style={{ fontSize: "11px", color: "#475569", textAlign: "center" }}>
              {canvasSide === "front"
                ? "🖱️ ลากวาง QR Code และข้อความได้โดยตรงบน Canvas ด้านหน้า"
                : "🖼️ พรีวิวภาพพื้นหลังด้านหลัง (Back Side Preview)"}
            </div>

            {/* Card Canvas */}
            <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>
              <div ref={canvasRef} style={{
                width: "100%", paddingBottom: `${(cardH / cardW) * 100}%`, position: "relative",
                cursor: drag ? "grabbing" : "default", borderRadius: "6px", overflow: "hidden",
                boxShadow: drag ? "0 0 0 2px #f97316,0 12px 40px rgba(0,0,0,0.7)" : "0 0 0 1px rgba(249,115,22,0.2),0 8px 32px rgba(0,0,0,0.6)",
                transition: "box-shadow 0.2s",
              }}>
                <div style={{ position: "absolute", inset: 0 }}>
                  {renderCard(pvStu, true, canvasSide === "back")}
                </div>
              </div>
            </div>

            {/* Student Navigator */}
            {printableStudents.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => setPvIdx(i => Math.max(0, i - 1))} disabled={pvIdx === 0} style={{ ...iBtn, opacity: pvIdx === 0 ? 0.4 : 1, display: "flex", alignItems: "center" }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: "11px", color: "#64748b", minWidth: "80px", textAlign: "center" }}>{pvIdx + 1} / {printableStudents.length}</span>
                <button onClick={() => setPvIdx(i => Math.min(printableStudents.length - 1, i + 1))} disabled={pvIdx === printableStudents.length - 1} style={{ ...iBtn, opacity: pvIdx === printableStudents.length - 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}><ChevronRight size={14} /></button>
              </div>
            )}

            <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace" }}>
              {pvStu.full_name} | {pvStu.student_code} {pvStu.class_name ? `(${pvStu.class_name})` : ""}
            </div>
          </div>

          {/* RIGHT PANEL: Filter & Individual Selection */}
          <div style={{
            width: "260px", flexShrink: 0, borderLeft: "1px solid #1e293b",
            display: "flex", flexDirection: "column",
            background: "#080d18", overflow: "hidden",
          }}>

            {/* Panel Header & Filters */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #1e293b", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  👥 เลือกรายชื่อ ({printableStudents.length}/{students.length})
                </span>
                <button onClick={toggleSelectAll} style={{ background: "none", border: "none", color: "#38bdf8", cursor: "pointer", fontSize: "10px", fontWeight: 700 }}>
                  {filteredStudents.every(s => selectedIds.has(s.id)) ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>

              {/* SubTab: Internal / External / All */}
              <div style={{ display: "flex", background: "#0f172a", padding: "2px", borderRadius: "6px", border: "1px solid #1e293b" }}>
                {(["all", "internal", "external"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setSubTab(tab)}
                    style={{
                      flex: 1, background: subTab === tab ? "#1e293b" : "transparent",
                      color: subTab === tab ? "#fb923c" : "#64748b",
                      border: "none", borderRadius: "4px", padding: "4px 0", fontSize: "10px", fontWeight: 700, cursor: "pointer"
                    }}
                  >
                    {tab === "all" ? "ทั้งหมด" : tab === "internal" ? "ภายใน" : "ภายนอก"}
                  </button>
                ))}
              </div>

              {/* Class Filter Dropdown */}
              {classList.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Filter size={12} className="text-slate-500" />
                  <select
                    value={filterClass}
                    onChange={e => setFilterClass(e.target.value)}
                    style={{ flex: 1, background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "white", padding: "4px 6px", fontSize: "10px" }}
                  >
                    <option value="all">ทุกห้อง/ชั้น ({filteredStudents.length})</option>
                    {classList.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Box */}
              <div style={{ position: "relative" }}>
                <Search size={12} className="text-slate-500 absolute left-2 top-2" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ / รหัส..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: "100%", background: "#0f172a", border: "1px solid #1e293b", borderRadius: "6px", color: "white", padding: "4px 6px 4px 24px", fontSize: "10px" }}
                />
              </div>
            </div>

            {/* Student List with Checkboxes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
              {filteredStudents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 10px", color: "#475569", fontSize: "11px" }}>
                  ไม่พบรายชื่อนักเรียน
                </div>
              ) : (
                filteredStudents.map((s, idx) => {
                  const isChecked = selectedIds.has(s.id);
                  const isPreviewed = printableStudents[pvIdx]?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        toggleSelectStudent(s.id);
                        const printableIdx = printableStudents.findIndex(ps => ps.id === s.id);
                        if (printableIdx !== -1) setPvIdx(printableIdx);
                      }}
                      style={{
                        padding: "6px 8px", borderRadius: "8px", cursor: "pointer", marginBottom: "3px",
                        background: isPreviewed ? "rgba(249,115,22,0.12)" : (isChecked ? "rgba(59,130,246,0.06)" : "transparent"),
                        border: `1px solid ${isPreviewed ? "rgba(249,115,22,0.4)" : (isChecked ? "rgba(59,130,246,0.2)" : "transparent")}`,
                        display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by div onClick
                        style={{ accentColor: "#f97316", cursor: "pointer" }}
                      />

                      <div style={{ width: 26, height: 26, background: "#0f172a", borderRadius: "4px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <QRCodeSVG value={qrVal(s)} size={26} level="L" bgColor="transparent" fgColor={isChecked ? "#60a5fa" : "#334155"} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: "11px", fontWeight: isChecked ? 700 : 400, color: isChecked ? "white" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.full_name}
                        </div>
                        <div style={{ fontSize: "9px", color: "#475569", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.student_code} {s.class_name ? `• ${s.class_name}` : ""}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </div>
    </>
  );
};
