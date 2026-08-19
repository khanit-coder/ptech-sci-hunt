import React, { useState, useEffect } from 'react';
import { Booth, EventSettings } from '@/types';
import { boothService } from '@/services/boothService';
import { dashboardService } from '@/services/dashboardService';
import { soundManager } from '@/lib/sound';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  Settings,
  Type,
} from 'lucide-react';

// ── Booth Form ────────────────────────────────────────────────────
interface BoothFormData {
  name: string;
  description: string;
  letter: string;
  letter_position: number;
  icon: string;
  color: string;
  is_active: boolean;
  sort_order: number;
}

const defaultForm: BoothFormData = {
  name: '',
  description: '',
  letter: '',
  letter_position: 0,
  icon: '🏛️',
  color: '#3B82F6',
  is_active: true,
  sort_order: 0,
};

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#84CC16', '#6366F1', '#D946EF', '#10B981',
];

// ── BoothManager Component ─────────────────────────────────────────
interface Props {
  onRefresh?: () => void;
}

export const BoothManager: React.FC<Props> = ({ onRefresh }) => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [checkinStats, setCheckinStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BoothFormData>(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Word settings
  const [editingWord, setEditingWord] = useState(false);
  const [wordDraft, setWordDraft] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    const [bArr, sett] = await Promise.all([
      boothService.getBooths(),
      dashboardService.getSettings(),
    ]);
    setBooths(bArr);
    setSettings(sett);
    setWordDraft(sett?.target_word || 'SAVEPTECHWORLD');

    // Load check-in counts
    const stats: Record<string, number> = {};
    await Promise.all(
      bArr.map(async (b) => {
        const ci = await boothService.getBoothCheckins(b.id);
        stats[b.id] = ci.length;
      })
    );
    setCheckinStats(stats);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const targetWord = settings?.target_word?.toUpperCase() || 'SAVEPTECHWORLD';

  // Build letter slots from target_word
  const letterSlots = Array.from(targetWord).map((letter, pos) => {
    const booth = booths.find((b) => b.letter_position === pos);
    return { letter, pos, booth };
  });

  const openCreate = (pos: number) => {
    soundManager.playClick();
    setForm({
      ...defaultForm,
      letter: targetWord[pos] || '',
      letter_position: pos,
      sort_order: pos,
    });
    setEditingId(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (booth: Booth) => {
    soundManager.playClick();
    setForm({
      name: booth.name,
      description: booth.description || '',
      letter: booth.letter,
      letter_position: booth.letter_position,
      icon: booth.icon || '🏛️',
      color: booth.color || '#3B82F6',
      is_active: booth.is_active,
      sort_order: booth.sort_order,
    });
    setEditingId(booth.id);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('กรุณากรอกชื่อบูท'); return; }
    if (!form.letter.trim()) { setFormError('กรุณากรอกตัวอักษร'); return; }

    setIsSaving(true);
    setFormError(null);
    soundManager.playClick();

    const payload = {
      ...form,
      letter: form.letter.toUpperCase().slice(0, 1),
    };

    let res;
    if (editingId) {
      res = await boothService.updateBooth(editingId, payload);
    } else {
      res = await boothService.createBooth(payload);
      if (res && 'booth' in res && res.booth) res = { success: true, message: 'สำเร็จ' };
    }

    if (res && !res.success) {
      setFormError(res.message);
    } else {
      setIsFormOpen(false);
      await loadData();
      onRefresh?.();
    }
    setIsSaving(false);
  };

  const handleDelete = async (boothId: string, boothName: string) => {
    if (!confirm(`ลบบูท "${boothName}" และข้อมูลการเช็คอินทั้งหมด?`)) return;
    soundManager.playClick();
    await boothService.deleteBooth(boothId);
    await loadData();
    onRefresh?.();
  };

  const handleSaveWord = async () => {
    if (!wordDraft.trim()) return;
    soundManager.playClick();
    // Use dashboardService.updateSettings for event_settings
    await dashboardService.updateSettings({ target_word: wordDraft.trim().toUpperCase() } as any);
    setEditingWord(false);
    await loadData();
  };

  return (
    <div className="space-y-8">
      {/* ── Target Word Config ── */}
      <div className="p-5 rounded-3xl bg-slate-900 border-2 border-mario-purple/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-mario-purple" />
            <h3 className="font-game text-xs text-mario-yellow">คำเป้าหมาย (Target Word)</h3>
          </div>
          {!editingWord ? (
            <button
              type="button"
              onClick={() => { soundManager.playClick(); setEditingWord(true); }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-mario-yellow text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              แก้ไข
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveWord}
                className="px-3 py-1.5 rounded-xl bg-mario-green text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => { setEditingWord(false); setWordDraft(targetWord); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {editingWord ? (
          <input
            type="text"
            value={wordDraft}
            onChange={(e) => setWordDraft(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-mario-yellow font-game text-sm font-bold tracking-widest focus:outline-none focus:border-mario-orange"
            placeholder="SAVEPTECHWORLD"
            maxLength={30}
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {Array.from(targetWord).map((letter, pos) => {
              const booth = booths.find((b) => b.letter_position === pos);
              return (
                <div
                  key={pos}
                  className="flex flex-col items-center gap-0.5"
                  title={booth?.name}
                >
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-game text-sm font-black border-2 transition-colors"
                    style={
                      booth
                        ? { backgroundColor: `${booth.color}30`, borderColor: `${booth.color}80`, color: booth.color }
                        : { backgroundColor: '#1e293b', borderColor: '#334155', color: '#475569' }
                    }
                  >
                    {letter}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">{pos + 1}</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-slate-500">
          {targetWord.length} ตัวอักษร = ต้องการ {targetWord.length} บูท •{' '}
          <span className="text-mario-green">{booths.length} บูท</span>ที่สร้างแล้ว
        </p>
      </div>

      {/* ── Letter Slots Grid ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-mario-orange" />
            <h3 className="font-game text-[11px] text-mario-yellow">บูทกิจกรรม</h3>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {letterSlots.map(({ letter, pos, booth }) => (
            <div
              key={pos}
              className={`p-4 rounded-2xl border-2 transition-all ${
                booth
                  ? 'bg-slate-900'
                  : 'bg-slate-950 border-dashed border-slate-700 opacity-70'
              }`}
              style={booth ? { borderColor: `${booth.color}60` } : {}}
            >
              <div className="flex items-center gap-3">
                {/* Letter badge */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-game text-xl font-black shrink-0"
                  style={
                    booth
                      ? { backgroundColor: `${booth.color}25`, border: `2px solid ${booth.color}80`, color: booth.color }
                      : { backgroundColor: '#1e293b', border: '2px dashed #334155', color: '#475569' }
                  }
                >
                  {letter}
                </div>

                {booth ? (
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{booth.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      <span>{checkinStats[booth.id] ?? 0} เช็คอิน</span>
                      {!booth.is_active && (
                        <span className="text-red-400 font-bold">• ปิดการใช้งาน</span>
                      )}
                    </p>
                    {booth.description && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{booth.description}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1">
                    <p className="text-slate-500 text-xs italic">ยังไม่มีบูท</p>
                    <p className="text-[10px] text-slate-600">ตำแหน่ง #{pos + 1}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {booth ? (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(booth)}
                        className="p-1.5 rounded-lg bg-slate-800 text-mario-yellow hover:bg-slate-700 transition-colors"
                        title="แก้ไข"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(booth.id, booth.name)}
                        className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900/60 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCreate(pos)}
                      className="px-2.5 py-1.5 rounded-lg bg-mario-orange/20 border border-mario-orange/50 text-mario-orange hover:bg-mario-orange/30 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      สร้างบูท
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Booth Form Modal ── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-mario-orange" />
                <h3 className="font-game text-xs text-mario-yellow">
                  {editingId ? 'แก้ไขบูท' : 'สร้างบูทใหม่'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Letter position (readonly) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-game text-lg font-black"
                  style={{ backgroundColor: `${form.color}25`, border: `2px solid ${form.color}60`, color: form.color }}
                >
                  {form.letter || '?'}
                </div>
                <div>
                  <p className="font-bold text-white">ตัวอักษร: {form.letter}</p>
                  <p className="text-slate-400">ตำแหน่ง #{form.letter_position + 1} ในคำ "{targetWord}"</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อบูท <span className="text-mario-red">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="เช่น บูทฟิสิกส์"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-mario-orange"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">คำอธิบาย <span className="text-slate-600">(ไม่จำเป็น)</span></label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="เช่น กิจกรรมทดลองวิทยาศาสตร์"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-mario-orange"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">ไอคอน (emoji)</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="🏛️"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-mario-orange"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-slate-300 font-semibold mb-2">สี</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                        form.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer"
                    title="กำหนดสีเอง"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    form.is_active ? 'bg-mario-green' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={form.is_active ? 'text-mario-green' : 'text-slate-500'}>
                  {form.is_active ? 'เปิดใช้งาน' : 'ปิดการใช้งาน'}
                </span>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-700 text-red-300 text-xs">
                  {formError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-mario-orange text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
