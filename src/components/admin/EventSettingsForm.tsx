import React, { useState } from 'react';
import { EventSettings, StudentNameDisplayMode, EventStatus } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { adminService } from '@/services/adminService';
import { exportService } from '@/services/exportService';
import { soundManager } from '@/lib/sound';
import { 
  Settings, 
  ShieldAlert, 
  Save, 
  Pause, 
  Play, 
  RotateCcw, 
  Download, 
  Volume2, 
  Sparkles, 
  Eye, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';

interface Props {
  settings: EventSettings;
  onRefresh: () => void;
}

export const EventSettingsForm: React.FC<Props> = ({ settings, onRefresh }) => {
  const [eventName, setEventName] = useState(settings.event_name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [dashboardTitle, setDashboardTitle] = useState(settings.dashboard_title);
  const [dashboardSubtitle, setDashboardSubtitle] = useState(settings.dashboard_subtitle);
  const [nameMode, setNameMode] = useState<StudentNameDisplayMode>(settings.show_student_name_mode);
  const [soundEnabled, setSoundEnabled] = useState(settings.sound_enabled);
  const [animationEnabled, setAnimationEnabled] = useState(settings.animation_enabled);
  const [celebrationEnabled, setCelebrationEnabled] = useState(settings.celebration_enabled);
  const [showRecent, setShowRecent] = useState(settings.show_recent_discoveries);
  const [showHints, setShowHints] = useState(settings.show_item_hints);
  const [isSaved, setIsSaved] = useState(false);

  // Multi-step Emergency Reset protection state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();

    await dashboardService.updateSettings({
      event_name: eventName,
      tagline,
      dashboard_title: dashboardTitle,
      dashboard_subtitle: dashboardSubtitle,
      show_student_name_mode: nameMode,
      sound_enabled: soundEnabled,
      animation_enabled: animationEnabled,
      celebration_enabled: celebrationEnabled,
      show_recent_discoveries: showRecent,
      show_item_hints: showHints,
    });

    await adminService.logAction('SETTINGS_UPDATED', 'event_settings', '1');
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    onRefresh();
  };

  const handleStatusChange = async (status: EventStatus) => {
    soundManager.playClick();
    if (status === 'paused') await adminService.pauseEvent();
    else if (status === 'open') await adminService.resumeEvent();
    else if (status === 'closed') await adminService.closeEvent();
    onRefresh();
  };

  const handleExecuteReset = async () => {
    if (resetConfirmText !== 'RESET-PTECH-2026') {
      alert('รหัสยืนยันไม่ถูกต้อง');
      return;
    }
    soundManager.playClick();
    await adminService.resetAllEventData();
    setIsResetConfirmOpen(false);
    setResetConfirmText('');
    alert('รีเซ็ตข้อมูลกิจกรรมทั้งหมดเรียบร้อยแล้ว');
    onRefresh();
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Emergency Event Status Control Pod */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-mario-yellow" />
            <h3 className="font-game text-xs text-mario-yellow">EVENT STATUS CONTROL</h3>
          </div>
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase border ${
            settings.status === 'open' 
              ? 'bg-mario-green/20 text-mario-green border-mario-green' 
              : settings.status === 'paused'
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500 animate-pulse'
              : 'bg-red-950 text-red-400 border-red-800'
          }`}>
            STATUS: {settings.status}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleStatusChange('open')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              settings.status === 'open'
                ? 'bg-mario-green text-slate-950 border-mario-green shadow-neon-green font-extrabold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>OPEN (เปิดให้สแกน)</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('paused')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              settings.status === 'paused'
                ? 'bg-yellow-500 text-slate-950 border-yellow-500 shadow font-extrabold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Pause className="w-4 h-4" />
            <span>PAUSE (หยุดชั่วคราว)</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusChange('closed')}
            className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              settings.status === 'closed'
                ? 'bg-red-600 text-white border-red-600 shadow font-extrabold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>CLOSE (ปิดกิจกรรม)</span>
          </button>
        </div>
      </div>

      {/* 2. Main Event Configuration Form */}
      <form onSubmit={handleSave} className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-6 text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-game text-xs text-mario-yellow">EVENT CONFIGURATION</h3>
          {isSaved && (
            <span className="text-mario-green text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> บันทึกการตั้งค่าแล้ว
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">ชื่อกิจกรรม (Event Name)</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">คำขวัญ / Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">หัวข้อ Dashboard LED</label>
            <input
              type="text"
              value={dashboardTitle}
              onChange={(e) => setDashboardTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">คำบรรยาย Dashboard LED</label>
            <input
              type="text"
              value={dashboardSubtitle}
              onChange={(e) => setDashboardSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
        </div>

        {/* Privacy Setting for Student Name on LED */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="block text-slate-200 font-bold flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-mario-yellow" />
            <span>การแสดงชื่อนักเรียนบนจอสาธารณะ LED (Privacy Mode):</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { mode: 'masked', label: 'ซ่อนบางตัวอักษร (สม*** ส***)', desc: 'แนะนำสำหรับจอใหญ่' },
              { mode: 'full', label: 'แสดงชื่อเต็ม', desc: 'เห็นชื่อ-นามสกุลครบ' },
              { mode: 'nickname', label: 'แสดงเฉพาะชื่อจริง', desc: 'Agent สมชาย' },
              { mode: 'hidden', label: 'ไม่แสดงชื่อ (Secret Agent)', desc: 'นิรนามทั้งหมด' },
            ].map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => setNameMode(opt.mode as StudentNameDisplayMode)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  nameMode === opt.mode
                    ? 'bg-mario-orange/20 border-mario-orange text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs">{opt.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Feature Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-white block">เสียงประกอบ (Audio)</span>
              <span className="text-[10px] text-slate-500">เปิด/ปิด Sound Effects</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-mario-orange"
            />
          </label>

          <label className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-white block">Celebration 100%</span>
              <span className="text-[10px] text-slate-500">แสดงพลุและแบนเนอร์ชัยชนะ</span>
            </div>
            <input
              type="checkbox"
              checked={celebrationEnabled}
              onChange={(e) => setCelebrationEnabled(e.target.checked)}
              className="w-5 h-5 rounded accent-mario-orange"
            />
          </label>

          <label className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-bold text-white block">Recent Radar Live</span>
              <span className="text-[10px] text-slate-500">แสดงการค้นพบล่าสุดบน LED</span>
            </div>
            <input
              type="checkbox"
              checked={showRecent}
              onChange={(e) => setShowRecent(e.target.checked)}
              className="w-5 h-5 rounded accent-mario-orange"
            />
          </label>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-mario-red to-mario-orange text-white font-bold text-xs shadow-neon-red hover:opacity-95 transition-all flex items-center gap-2 pixel-btn"
        >
          <Save className="w-4 h-4" />
          <span>บันทึกการตั้งค่ากิจกรรม</span>
        </button>
      </form>

      {/* 3. Emergency Zone & Event Backup */}
      <div className="p-6 rounded-3xl bg-red-950/20 border-2 border-red-900/60 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2 text-red-400">
          <AlertOctagon className="w-5 h-5" />
          <h3 className="font-game text-xs">DANGER ZONE & BACKUP SNAPSHOT</h3>
        </div>

        <p className="text-slate-400 text-xs">
          ก่อนเริ่มกิจกรรมจริง แนะนำให้ดาวน์โหลดสำเนาข้อมูล (Snapshot Backup) เก็บไว้ และสามารถกดล้างข้อมูลทดสอบได้
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => exportService.exportFullEventBackup()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4 text-mario-green" />
            <span>ดาวน์โหลด Event Backup Snapshot (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-700 font-bold flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESET EVENT DATA (ล้างข้อมูลการค้นพบทั้งหมด)</span>
          </button>
        </div>
      </div>

      {/* Multi-step Reset Modal Safeguard */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-600 rounded-3xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-500">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
              <h4 className="font-game text-xs">CONFIRM EVENT RESET</h4>
            </div>

            <p className="text-slate-300">
              คำเตือน: การรีเซ็ตจะลบข้อมูลการค้นพบ (Discoveries) ทั้งหมด และคืนสถานะไอเทม 25 ชิ้นกลับเป็น ACTIVE เหมาะสำหรับใช้ก่อนเปิดงานจริง
            </p>

            <div>
              <label className="block text-slate-400 mb-1 font-mono">
                พิมพ์คำว่า <strong className="text-red-400">RESET-PTECH-2026</strong> เพื่อยืนยัน:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET-PTECH-2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-red-800 text-red-300 font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={resetConfirmText !== 'RESET-PTECH-2026'}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-40"
              >
                ยืนยันการล้างข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
