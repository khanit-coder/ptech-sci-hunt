import React, { useState, useMemo } from 'react';
import { Student } from '@/types';
import { soundManager } from '@/lib/sound';
import { 
  X, Users, Building2, GraduationCap, Filter, Search, 
  CheckSquare, Square, Palette, ArrowRight, Check
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
  onConfirm: (selectedStudents: Student[]) => void;
}

export const CardStudentSelectorModal: React.FC<Props> = ({
  isOpen,
  students,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  // Filter states
  const [subTab, setSubTab] = useState<'all' | 'internal' | 'external'>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected student IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(students.map(s => s.id)));

  // Count internal vs external
  const internalCount = useMemo(() => students.filter(s => s.student_status !== 'external').length, [students]);
  const externalCount = useMemo(() => students.filter(s => s.student_status === 'external').length, [students]);

  // Extract unique class list for class filter
  const classList = useMemo(() => {
    const set = new Set<string>();
    students.forEach(s => {
      if (s.class_name) set.add(s.class_name);
    });
    return Array.from(set).sort();
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (subTab === 'internal' && s.student_status === 'external') return false;
      if (subTab === 'external' && s.student_status !== 'external') return false;
      if (selectedClass !== 'all' && s.class_name !== selectedClass) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (s.student_code || '').toLowerCase();
        const name = (s.full_name || '').toLowerCase();
        const cls  = (s.class_name || '').toLowerCase();
        const sch  = (s.school_name || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !cls.includes(q) && !sch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, subTab, selectedClass, searchQuery]);

  // Selected students result array
  const selectedStudents = useMemo(() => {
    return students.filter(s => selectedIds.has(s.id));
  }, [students, selectedIds]);

  // Toggle handlers
  const toggleSelectAllFiltered = () => {
    soundManager.playClick();
    const filteredIds = filteredStudents.map(s => s.id);
    const allSelected = filteredIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      filteredIds.forEach(id => next.delete(id));
    } else {
      filteredIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const toggleStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleClassStudents = (className: string) => {
    soundManager.playClick();
    const classStudentIds = students.filter(s => s.class_name === className).map(s => s.id);
    const allSelected = classStudentIds.every(id => selectedIds.has(id));
    const next = new Set(selectedIds);
    if (allSelected) {
      classStudentIds.forEach(id => next.delete(id));
    } else {
      classStudentIds.forEach(id => next.add(id));
    }
    setSelectedIds(next);
  };

  const handleProceed = () => {
    soundManager.playClick();
    if (selectedStudents.length === 0) return;
    onConfirm(selectedStudents);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>เลือกรายชื่อนักเรียนที่จะพิมพ์การ์ด</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 font-semibold">
                  ขั้นที่ 1 / 2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                เลือกกลุ่มนักเรียน (ภายใน/ภายนอก) หรือเลือกตามห้องเรียนที่ต้องการก่อนเข้าสู่หน้าออกแบบ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800/80 space-y-3">
          
          {/* Row 1: SubTab Buttons + Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* SubTabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => { soundManager.playClick(); setSubTab('all'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  subTab === 'all'
                    ? 'bg-slate-800 text-mario-yellow border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ทั้งหมด ({students.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { soundManager.playClick(); setSubTab('internal'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  subTab === 'internal'
                    ? 'bg-mario-blue text-white shadow-neon-blue'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>🏢 นักเรียนภายใน ({internalCount})</span>
              </button>

              <button
                type="button"
                onClick={() => { soundManager.playClick(); setSubTab('external'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  subTab === 'external'
                    ? 'bg-purple-600 text-white shadow-neon-purple'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>🏫 นักเรียนภายนอก ({externalCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัส, ห้อง..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Row 2: Class Pills & Select All */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
            {/* Quick Class Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Filter className="w-3 h-3" /> เลือกห้อง:
              </span>
              
              <button
                type="button"
                onClick={() => setSelectedClass('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                  selectedClass === 'all'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                ทุกห้อง ({students.length})
              </button>

              {classList.map(cls => {
                const classCount = students.filter(s => s.class_name === cls).length;
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cls} ({classCount})
                  </button>
                );
              })}
            </div>

            {/* Select All Toggle Button */}
            <button
              type="button"
              onClick={toggleSelectAllFiltered}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1.5 flex-shrink-0"
            >
              {filteredStudents.every(s => selectedIds.has(s.id)) ? (
                <>
                  <CheckSquare className="w-4 h-4 text-sky-400" />
                  <span>ยกเลิกทั้งหมดในรายการนี้</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-500" />
                  <span>เลือกทั้งหมดในรายการนี้ ({filteredStudents.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Student Checkbox List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              ไม่พบรายชื่อนักเรียนตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredStudents.map(s => {
              const isChecked = selectedIds.has(s.id);
              const isExt = s.student_status === 'external';

              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isChecked
                      ? 'bg-violet-950/30 border-violet-500/60 shadow-sm'
                      : 'bg-slate-950/50 border-slate-800/60 opacity-60 hover:opacity-100 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent div onClick
                    className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold truncate ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                        {s.full_name}
                      </span>
                      {isExt ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-purple-950 text-purple-300 border border-purple-800">
                          ภายนอก
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-blue-950 text-blue-300 border border-blue-800">
                          ภายใน
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                      รหัส: {s.student_code} {s.class_name ? `• ${s.class_name}` : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium">
            เลือกไว้ทั้งหมด: <strong className="text-emerald-400 font-bold text-sm ml-1">{selectedStudents.length}</strong> / {students.length} คน
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all"
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={handleProceed}
              disabled={selectedStudents.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>ถัดไป: เปิดหน้าออกแบบการ์ด ({selectedStudents.length} คน)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
