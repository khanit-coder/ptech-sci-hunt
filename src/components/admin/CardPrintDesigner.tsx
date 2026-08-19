import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Student } from "@/types";
import { QRCodeSVG } from "qrcode.react";
import { soundManager } from "@/lib/sound";
import { X, Eye, EyeOff, Printer, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

type PaperSz = "A4" | "A5" | "A6";
type Orient  = "portrait" | "landscape";
type DragTgt = "qr" | "name" | "code" | "class" | "school" | null;
interface Pos { x: number; y: number; }

interface CardCfg {
  bgFront: string | null; bgBack: string | null;
  paper: PaperSz; orient: Orient; cols: number; rows: number;
  qrPos: Pos; qrSzPct: number; qrRot: number; qrFlipH: boolean; qrFlipV: boolean;
  qrCnt: "student_code" | "qr_token";
  showName: boolean; nPos: Pos; nFpt: number;
  showCode: boolean; cdPos: Pos; cdFpt: number;
  showClass: boolean; clPos: Pos; clFpt: number;
  showSchool: boolean; scPos: Pos; scFpt: number;
  dblSided: boolean;
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
  showName: true,  nPos:  { x: 50, y: 75 }, nFpt: 10,
  showCode: true,  cdPos: { x: 50, y: 83 }, cdFpt: 7,
  showClass: true, clPos: { x: 50, y: 90 }, clFpt: 7,
  showSchool: false, scPos: { x: 50, y: 96 }, scFpt: 7,
  dblSided: false,
};

interface Props { students: Student[]; onClose: () => void; }
const pill = (a: boolean): React.CSSProperties => ({
  padding: "5px 11px", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: 700,
  border: `1px solid ${a ? "#f97316" : "#334155"}`, background: a ? "#7c2d12" : "#1e293b", color: a ? "#fb923c" : "#94a3b8",
});
const iBtn: React.CSSProperties = {
  background: "#1e293b", border: "1px solid #334155", borderRadius: "6px",
  color: "#94a3b8", padding: "5px 10px", cursor: "pointer", fontSize: "11px", fontWeight: 600,
};

export const CardPrintDesigner: React.FC<Props> = ({ students, onClose }) => {
  const [cfg, setCfg] = useState<CardCfg>(INIT);
  const [pvIdx, setPvIdx] = useState(0);
  const [printOpen, setPrintOpen] = useState(false);
  const [drag, setDrag] = useState<{ tgt: DragTgt; mx: number; my: number; ex: number; ey: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const frontRef  = useRef<HTMLInputElement>(null);
  const backRef   = useRef<HTMLInputElement>(null);
  const upd = (p: Partial<CardCfg>) => setCfg(prev => ({ ...prev, ...p }));

  const demo: Student = { id: "demo", student_code: "66209010001", full_name: "ตัวอย่าง นักเรียน", first_name: "ตัวอย่าง", last_name: "นักเรียน", class_name: "ปวช.1/1", school_name: "วิทยาลัย", student_status: "active", qr_token: "66209010001" } as Student;
  const pvStu = students.length > 0 ? students[Math.min(pvIdx, students.length - 1)] : demo;
  const paper = PAPER_MM[cfg.paper][cfg.orient];
  const cardW = paper.w / cfg.cols;
  const cardH = paper.h / cfg.rows;
  const perPage = cfg.cols * cfg.rows;

  const posMap = (): Record<Exclude<DragTgt, null>, Pos> => ({
    qr: cfg.qrPos, name: cfg.nPos, code: cfg.cdPos, class: cfg.clPos, school: cfg.scPos,
  });

  const onDown = (e: React.MouseEvent | React.TouchEvent, tgt: DragTgt) => {
    if (!tgt) return; e.preventDefault();
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
  }, [drag]); // eslint-disable-line

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
    fr.onload = e => side === "front" ? upd({ bgFront: e.target?.result as string }) : upd({ bgBack: e.target?.result as string });
    fr.readAsDataURL(file);
  };

  const act = (t: DragTgt) => drag?.tgt === t;

  const renderCard = (s: Student, inter: boolean, bgOvr?: string | null) => {
    const bg = bgOvr !== undefined ? bgOvr : cfg.bgFront;
    const labelStyle = (tgt: DragTgt, x: number, y: number, fs: number, mono?: boolean): React.CSSProperties => ({
      position: "absolute", left: `${x}%`, top: `${y}%`,
      transform: "translate(-50%,-50%)", fontSize: `${fs}pt`,
      color: "white", textShadow: "0 1px 5px rgba(0,0,0,1)", whiteSpace: "nowrap",
      fontFamily: mono ? "monospace" : undefined,
      cursor: inter ? (act(tgt) ? "grabbing" : "grab") : "default",
      zIndex: 10, touchAction: "none",
      background: inter ? "rgba(0,0,0,0.32)" : undefined,
      padding: inter ? "1px 4px" : undefined, borderRadius: inter ? "3px" : undefined,
      outline: act(tgt) ? "1px dashed #4ade80" : undefined,
    });
    return (
      <div style={{
        position: "relative", width: "100%", height: "100%", overflow: "hidden",
        backgroundImage: bg ? `url(${bg})` : undefined, backgroundSize: "cover", backgroundPosition: "center",
        backgroundColor: bg ? undefined : "#0f172a",
      }}>
        {!bg && inter && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "28px" }}>🖼️</span>
            <span style={{ color: "#334155", fontSize: "11px", textAlign: "center" }}>อัปโหลดภาพพื้นหลัง<br/>เพื่อดูตัวอย่าง</span>
          </div>
        )}
        <div onMouseDown={inter ? e => onDown(e, "qr") : undefined} onTouchStart={inter ? e => onDown(e, "qr") : undefined}
          style={{
            position: "absolute", left: `${cfg.qrPos.x}%`, top: `${cfg.qrPos.y}%`,
            width: `${cfg.qrSzPct}%`, aspectRatio: "1/1",
            transform: `translate(-50%,-50%) rotate(${cfg.qrRot}deg) scaleX(${cfg.qrFlipH ? -1 : 1}) scaleY(${cfg.qrFlipV ? -1 : 1})`,
            cursor: inter ? (act("qr") ? "grabbing" : "grab") : "default",
            zIndex: 10, touchAction: "none",
            outline: inter ? (act("qr") ? "2px solid #f97316" : "1px dashed rgba(249,115,22,0.4)") : undefined,
            outlineOffset: "2px",
          }}>
          <QRCodeSVG value={qrVal(s)} size={256} level="M" bgColor="white" fgColor="#000"
            style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        {cfg.showName && (
          <div onMouseDown={inter ? e => onDown(e, "name") : undefined} onTouchStart={inter ? e => onDown(e, "name") : undefined}
            style={{ ...labelStyle("name", cfg.nPos.x, cfg.nPos.y, cfg.nFpt), fontWeight: 700 }}>{s.full_name}</div>
        )}
        {cfg.showCode && (
          <div onMouseDown={inter ? e => onDown(e, "code") : undefined} onTouchStart={inter ? e => onDown(e, "code") : undefined}
            style={labelStyle("code", cfg.cdPos.x, cfg.cdPos.y, cfg.cdFpt, true)}>{s.student_code}</div>
        )}
        {cfg.showClass && s.class_name && (
          <div onMouseDown={inter ? e => onDown(e, "class") : undefined} onTouchStart={inter ? e => onDown(e, "class") : undefined}
            style={labelStyle("class", cfg.clPos.x, cfg.clPos.y, cfg.clFpt)}>{s.class_name}</div>
        )}
        {cfg.showSchool && s.school_name && (
          <div onMouseDown={inter ? e => onDown(e, "school") : undefined} onTouchStart={inter ? e => onDown(e, "school") : undefined}
            style={labelStyle("school", cfg.scPos.x, cfg.scPos.y, cfg.scFpt)}>{s.school_name}</div>
        )}
      </div>
    );
  };

  const pages: Student[][] = [];
  for (let i = 0; i < students.length; i += perPage) pages.push(students.slice(i, i + perPage));

  const SecTitle = ({ ch }: { ch: string }) => (
    <div style={{ fontSize: "10px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", paddingBottom: "6px", borderBottom: "1px solid #1e293b", marginTop: "4px" }}>{ch}</div>
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

  const PrintPortal = printOpen ? createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 999999, background: "#111827", overflowY: "auto" }}>
      <style>{`
        @media print {
          @page { size: ${paper.w}mm ${paper.h}mm; margin: 0mm; }
          body > *:not(#cpd-root) { display: none !important; }
          #cpd-root { position: fixed; inset: 0; background: white; display: block !important; overflow: auto; }
          .np { display: none !important; }
          .pg { margin: 0 !important; box-shadow: none !important; page-break-after: always; break-after: page; }
        }
      `}</style>
      <div id="cpd-root" style={{ minHeight: "100vh" }}>
        <div className="np" style={{ position: "sticky", top: 0, zIndex: 10, background: "#0f172a", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1e293b", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: "white" }}>🖨️ ตัวอย่างก่อนพิมพ์</span>
            <span style={{ fontSize: "11px", color: "#64748b", background: "#1e293b", padding: "3px 10px", borderRadius: "8px" }}>
              {students.length} คน • {pages.length} แผ่น • {cfg.paper} • {cfg.cols}x{cfg.rows} ช่อง • {cardW.toFixed(0)}x{cardH.toFixed(0)}mm
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => window.print()} style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none", borderRadius: "10px", padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}>🖨️ พิมพ์เลย</button>
            <button onClick={() => setPrintOpen(false)} style={{ background: "#374151", color: "white", border: "none", borderRadius: "8px", padding: "9px 14px", fontWeight: 600, cursor: "pointer" }}>x ปิด</button>
          </div>
        </div>
        <div style={{ padding: "20px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {pages.map((pg, pi) => (
            <div key={`f${pi}`} className="pg" style={{ width: `${paper.w}mm`, height: `${paper.h}mm`, display: "grid", gridTemplateColumns: `repeat(${cfg.cols}, ${cardW}mm)`, gridTemplateRows: `repeat(${cfg.rows}, ${cardH}mm)`, margin: "0 auto 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
              {Array(perPage).fill(null).map((_, ci) => {
                const stu = pg[ci];
                return <div key={ci} style={{ width: `${cardW}mm`, height: `${cardH}mm`, position: "relative", overflow: "hidden" }}>{stu ? renderCard(stu, false) : <div style={{ width: "100%", height: "100%", backgroundImage: cfg.bgFront ? `url(${cfg.bgFront})` : undefined, backgroundSize: "cover", backgroundColor: "#f8fafc" }} />}</div>;
              })}
            </div>
          ))}
          {cfg.dblSided && pages.map((_, pi) => (
            <div key={`b${pi}`} className="pg" style={{ width: `${paper.w}mm`, height: `${paper.h}mm`, display: "grid", gridTemplateColumns: `repeat(${cfg.cols}, ${cardW}mm)`, gridTemplateRows: `repeat(${cfg.rows}, ${cardH}mm)`, margin: "0 auto 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", overflow: "hidden" }}>
              {Array(perPage).fill(null).map((_, ci) => (
                <div key={ci} style={{ width: `${cardW}mm`, height: `${cardH}mm`, backgroundImage: cfg.bgBack ? `url(${cfg.bgBack})` : undefined, backgroundSize: "cover", backgroundColor: cfg.bgBack ? undefined : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!cfg.bgBack && <span style={{ fontSize: "8pt", color: "#cbd5e1" }}>หน้าหลัง</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>, document.body
  ) : null;

  return (
    <>
      {PrintPortal}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: "#020617", color: "white", fontFamily: "system-ui,-apple-system,sans-serif" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #1e293b", background: "#0f172a", flexShrink: 0, gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "20px" }}>🎨</span>
            <span style={{ fontWeight: 800, fontSize: "15px" }}>Card Print Designer</span>
            <span style={{ fontSize: "11px", color: "#64748b", background: "#1e293b", padding: "2px 8px", borderRadius: "6px" }}>{students.length} นักเรียน</span>
            <span style={{ fontSize: "11px", color: "#475569", background: "#1e293b", padding: "2px 8px", borderRadius: "6px" }}>{cfg.paper} {cfg.orient === "portrait" ? "แนวตั้ง" : "แนวนอน"} • {cfg.cols}x{cfg.rows} = {perPage} การ์ด/แผ่น • {cardW.toFixed(0)}x{cardH.toFixed(0)}mm</span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={() => { soundManager.playClick(); setPrintOpen(true); }}
              style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", color: "white", border: "none", borderRadius: "10px", padding: "9px 18px", fontWeight: 800, cursor: "pointer", fontSize: "13px", boxShadow: "0 2px 12px rgba(249,115,22,0.35)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Printer size={14} /> Preview & Print
            </button>
            <button onClick={onClose} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: "8px", padding: "9px 12px", cursor: "pointer", display: "flex" }}><X size={16} /></button>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* LEFT */}
          <div style={{ width: "258px", flexShrink: 0, borderRight: "1px solid #1e293b", overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: "10px", background: "#080d18" }}>
            <SecTitle ch="📷 ภาพพื้นหลัง" />
            <div>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "5px", fontWeight: 600 }}>หน้าหน้า (Front)</div>
              <div onClick={() => frontRef.current?.click()} style={{ height: "72px", border: `2px dashed ${cfg.bgFront ? "#334155" : "#1e3a8a"}`, borderRadius: "10px", cursor: "pointer", overflow: "hidden", position: "relative", backgroundImage: cfg.bgFront ? `url(${cfg.bgFront})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {!cfg.bgFront && <span style={{ fontSize: "11px", color: "#475569", textAlign: "center" }}>📁 คลิกอัปโหลด<br/><span style={{ fontSize: "10px", color: "#334155" }}>PNG / JPG / WEBP</span></span>}
                {cfg.bgFront && <button onClick={e => { e.stopPropagation(); upd({ bgFront: null }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "4px", color: "white", width: 20, height: 20, cursor: "pointer", fontSize: "12px" }}>x</button>}
              </div>
              <input ref={frontRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onImg("front", e.target.files[0])} />
            </div>
            {cfg.dblSided && (
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "5px", fontWeight: 600 }}>หน้าหลัง (Back)</div>
                <div onClick={() => backRef.current?.click()} style={{ height: "72px", border: `2px dashed ${cfg.bgBack ? "#334155" : "#7c2d12"}`, borderRadius: "10px", cursor: "pointer", overflow: "hidden", position: "relative", backgroundImage: cfg.bgBack ? `url(${cfg.bgBack})` : undefined, backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!cfg.bgBack && <span style={{ fontSize: "11px", color: "#475569", textAlign: "center" }}>📁 คลิกอัปโหลด<br/><span style={{ fontSize: "10px", color: "#334155" }}>ภาพหน้าหลัง</span></span>}
                  {cfg.bgBack && <button onClick={e => { e.stopPropagation(); upd({ bgBack: null }); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.75)", border: "none", borderRadius: "4px", color: "white", width: 20, height: 20, cursor: "pointer", fontSize: "12px" }}>x</button>}
                </div>
                <input ref={backRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files?.[0] && onImg("back", e.target.files[0])} />
              </div>
            )}

            <SecTitle ch="📄 ขนาดกระดาษ" />
            <div style={{ display: "flex", gap: "6px" }}>
              {(["A4","A5","A6"] as PaperSz[]).map(sz => <button key={sz} onClick={() => upd({ paper: sz })} style={pill(cfg.paper === sz)}>{sz}</button>)}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {(["portrait","landscape"] as Orient[]).map(o => <button key={o} onClick={() => upd({ orient: o })} style={{ ...pill(cfg.orient === o), flex: 1 }}>{o === "portrait" ? "⬆ แนวตั้ง" : "➡ แนวนอน"}</button>)}
            </div>

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
                <RefreshCw size={11} /> Reset QR
              </button>
              <div style={{ fontSize: "10px", color: "#334155", fontFamily: "monospace", background: "#0f172a", padding: "4px 8px", borderRadius: "6px" }}>
                x:{cfg.qrPos.x.toFixed(0)}% y:{cfg.qrPos.y.toFixed(0)}% rot:{cfg.qrRot}{cfg.qrFlipH ? " +H" : ""}{cfg.qrFlipV ? " +V" : ""}
              </div>
            </div>

            <SecTitle ch="✏️ ข้อความ" />
            <TextRow lbl="ชื่อนักเรียน"  show={cfg.showName}   tog={() => upd({ showName:   !cfg.showName   })} fpt={cfg.nFpt}  sf={v => upd({ nFpt:  v })} />
            <TextRow lbl="รหัสนักเรียน" show={cfg.showCode}   tog={() => upd({ showCode:   !cfg.showCode   })} fpt={cfg.cdFpt} sf={v => upd({ cdFpt: v })} />
            <TextRow lbl="ห้อง/ชั้น"    show={cfg.showClass}  tog={() => upd({ showClass:  !cfg.showClass  })} fpt={cfg.clFpt} sf={v => upd({ clFpt: v })} />
            <TextRow lbl="โรงเรียน"     show={cfg.showSchool} tog={() => upd({ showSchool: !cfg.showSchool })} fpt={cfg.scFpt} sf={v => upd({ scFpt: v })} />

            <SecTitle ch="📑 การพิมพ์" />
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "#94a3b8" }}>
              <input type="checkbox" checked={cfg.dblSided} onChange={e => upd({ dblSided: e.target.checked })} style={{ accentColor: "#f97316" }} />
              <span>Double-sided (หน้า-หลัง)</span>
            </label>
            {cfg.dblSided && !cfg.bgBack && (
              <div style={{ fontSize: "11px", color: "#fbbf24", background: "rgba(251,191,36,0.08)", padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(251,191,36,0.25)" }}>
                ⚠️ อัปโหลดภาพหน้าหลัง หรือปล่อยว่างสำหรับหน้าขาว
              </div>
            )}
          </div>

          {/* CENTER */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at center,#0d1626 0%,#020617 100%)", padding: "20px", gap: "12px" }}>
            <div style={{ fontSize: "11px", color: "#1e3a5f", textAlign: "center" }}>🖱️ ลากวาง QR Code และข้อความได้โดยตรงบน Canvas</div>
            <div style={{ position: "relative", width: "100%", maxWidth: "460px" }}>
              <div ref={canvasRef} style={{
                width: "100%", paddingBottom: `${(cardH / cardW) * 100}%`, position: "relative",
                cursor: drag ? "grabbing" : "default", borderRadius: "6px", overflow: "hidden",
                boxShadow: drag ? "0 0 0 2px #f97316,0 12px 40px rgba(0,0,0,0.7)" : "0 0 0 1px rgba(249,115,22,0.15),0 8px 32px rgba(0,0,0,0.6)",
                transition: "box-shadow 0.2s",
              }}>
                <div style={{ position: "absolute", inset: 0 }}>{renderCard(pvStu, true)}</div>
              </div>
            </div>
            {students.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => setPvIdx(i => Math.max(0, i - 1))} disabled={pvIdx === 0} style={{ ...iBtn, opacity: pvIdx === 0 ? 0.4 : 1, display: "flex", alignItems: "center" }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: "11px", color: "#475569", minWidth: "80px", textAlign: "center" }}>{pvIdx + 1} / {students.length}</span>
                <button onClick={() => setPvIdx(i => Math.min(students.length - 1, i + 1))} disabled={pvIdx === students.length - 1} style={{ ...iBtn, opacity: pvIdx === students.length - 1 ? 0.4 : 1, display: "flex", alignItems: "center" }}><ChevronRight size={14} /></button>
              </div>
            )}
            <div style={{ fontSize: "10px", color: "#1e293b", fontFamily: "monospace" }}>{pvStu.full_name} | {pvStu.student_code}</div>
          </div>

          {/* RIGHT */}
          <div style={{ width: "210px", flexShrink: 0, borderLeft: "1px solid #1e293b", display: "flex", flexDirection: "column", background: "#080d18", overflow: "hidden" }}>
            <div style={{ padding: "12px", borderBottom: "1px solid #1e293b", flexShrink: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>👥 นักเรียน ({students.length})</div>
              <div style={{ fontSize: "10px", color: "#334155", marginTop: "3px" }}>คลิกเพื่อดูตัวอย่าง</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
              {students.map((s, idx) => (
                <div key={s.id} onClick={() => setPvIdx(idx)} style={{
                  padding: "7px 8px", borderRadius: "8px", cursor: "pointer", marginBottom: "3px",
                  background: idx === pvIdx ? "rgba(59,130,246,0.1)" : "transparent",
                  border: `1px solid ${idx === pvIdx ? "rgba(59,130,246,0.35)" : "transparent"}`,
                  display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s",
                }}>
                  <div style={{ width: 30, height: 30, background: "#0f172a", borderRadius: "6px", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QRCodeSVG value={qrVal(s)} size={30} level="L" bgColor="transparent" fgColor={idx === pvIdx ? "#60a5fa" : "#334155"} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: idx === pvIdx ? 700 : 400, color: idx === pvIdx ? "white" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.full_name}</div>
                    <div style={{ fontSize: "9px", color: "#334155", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.student_code}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
