import React, { useState, useEffect } from 'react';
import { Profile, UserRole, StaffDutyType, Booth } from '@/types';
import { adminService } from '@/services/adminService';
import { boothService } from '@/services/boothService';
import { exportService } from '@/services/exportService';
import { soundManager } from '@/lib/sound';
import { UserCheck, ShieldCheck, UserX, Key, Plus, Lock, X, Trash2, MapPin, Scan, Sparkles, Download, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  staffList: Profile[];
  onRefresh: () => void;
}

export const StaffManager: React.FC<Props> = ({ staffList, onRefresh }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [staffDuty, setStaffDuty] = useState<StaffDutyType>('item_scanner');
  const [assignedBoothId, setAssignedBoothId] = useState<string>('');
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Batch staff creator state
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchPrefixUser, setBatchPrefixUser] = useState('staff');
  const [batchPrefixPass, setBatchPrefixPass] = useState('World');
  const [batchStartIndex, setBatchStartIndex] = useState(1);
  const [batchCount, setBatchCount] = useState(14);
  const [batchDuty, setBatchDuty] = useState<StaffDutyType>('booth_staff');
  const [autoLinkBooths, setAutoLinkBooths] = useState(true);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  useEffect(() => {
    boothService.getBooths().then((bList) => {
      setBooths(bList);
      if (bList.length > 0 && !assignedBoothId) {
        setAssignedBoothId(bList[0].id);
      }
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('กรุณาระบุ Username');
      return;
    }
    soundManager.playClick();
    setIsSaving(true);

    const selectedBooth = booths.find((b) => b.id === assignedBoothId);

    const res = await adminService.createStaffUser({
      username: username.trim(),
      password: password.trim() || undefined,
      role,
      staff_duty: staffDuty,
      assigned_booth_id: role === 'staff' && staffDuty === 'booth_staff' ? assignedBoothId : undefined,
      assigned_booth_name: role === 'staff' && staffDuty === 'booth_staff' ? selectedBooth?.name : undefined,
    });

    setIsSaving(false);
    if (res.success) {
      soundManager.playDiscovery();
      alert(res.message);
      setIsCreating(false);
      setUsername('');
      setPassword('');
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchPrefixUser.trim()) {
      alert('กรุณาระบุ Prefix สำหรับ Username');
      return;
    }
    if (!batchPrefixPass.trim()) {
      alert('กรุณาระบุ Prefix สำหรับ Password');
      return;
    }
    if (batchCount <= 0 || batchCount > 50) {
      alert('จำนวนการสร้างต้องอยู่ระหว่าง 1 ถึง 50');
      return;
    }

    soundManager.playClick();
    setIsBatchSaving(true);

    const res = await adminService.batchCreateStaffUsers({
      prefixUsername: batchPrefixUser,
      prefixPassword: batchPrefixPass,
      startIndex: batchStartIndex,
      count: batchCount,
      staffDuty: batchDuty,
      autoLinkBooths,
    });

    setIsBatchSaving(false);
    if (res.success) {
      soundManager.playDiscovery();
      alert(`🎉 ${res.message}`);
      setIsBatchOpen(false);
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  const handleDeleteStaff = async (st: Profile) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบบัญชีสตาฟ "${st.username || st.display_name}"?`)) return;
    soundManager.playClick();
    const res = await adminService.deleteStaffUser(st.id);
    if (res.success) {
      onRefresh();
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-game text-xs text-mario-yellow">STAFF & USER ACCOUNTS</h3>
          <p className="text-xs text-slate-400">จัดการบัญชีผู้ใช้งานสตาฟประจำจุดสแกนไอเท็ม และประจำบูธกิจกรรม</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export Staff List */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              exportService.exportStaffAccounts(staffList, 'xlsx');
            }}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title="ดาวน์โหลดรายชื่อบัญชีสตาฟทั้งหมดเป็นไฟล์ Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Batch Staff Generator Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsBatchOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-950/90 border border-purple-500/80 text-purple-200 hover:bg-purple-900 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            title="สร้างบัญชีสตาฟทีละหลายๆ บัญชี เช่น staff01-staff14"
          >
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>⚡ สร้างสตาฟแบบกลุ่ม (Batch)</span>
          </button>

          {/* Single Staff Add Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.playClick();
              setIsCreating(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-mario-orange to-mario-yellow text-slate-950 text-xs font-bold shadow hover:opacity-95 transition-all flex items-center gap-1.5 pixel-btn"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มสตาฟรายบุคคล</span>
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ชื่อผู้ใช้งาน (Username)</th>
                <th className="py-3.5 px-4">หน้าที่ / บูทประจำการ</th>
                <th className="py-3.5 px-4">สิทธิ์การใช้งาน (Role)</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    ยังไม่มีข้อมูลเจ้าหน้าที่สตาฟ
                  </td>
                </tr>
              ) : (
                staffList.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-mario-yellow">@{st.username || st.email?.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {st.role === 'admin' ? (
                        <span className="text-red-400 font-bold">⚡ ผู้ดูแลระบบทั้งหมด (Admin)</span>
                      ) : st.staff_duty === 'booth_staff' || st.assigned_booth_name ? (
                        <div className="flex items-center gap-1.5 text-mario-green font-bold">
                          <MapPin className="w-3.5 h-3.5 text-mario-orange" />
                          <span>ประจำบูธ: {st.assigned_booth_name || 'บูธกิจกรรม'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                          <Scan className="w-3.5 h-3.5 text-cyan-400" />
                          <span>สแกนไอเท็มลับตามจุด</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        st.role === 'admin'
                          ? 'bg-mario-red/20 text-mario-red border border-mario-red/40'
                          : 'bg-mario-orange/20 text-mario-orange border border-mario-orange/40'
                      }`}>
                        {st.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-mario-green/20 text-mario-green">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(st)}
                        className="p-1.5 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400 hover:bg-red-900 hover:text-white transition-colors"
                        title={`ลบบัญชี ${st.username || st.display_name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Single Create Modal ── */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-mario-orange" />
                <h4 className="font-game text-xs text-mario-yellow">CREATE STAFF ACCOUNT</h4>
              </div>
              <button onClick={() => setIsCreating(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Username */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  ชื่อผู้ใช้งาน (Username) <span className="text-mario-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น staff_booth1 หรือ scanner01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-mario-orange"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเข้าใช้งาน (เริ่มต้น)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-mario-orange"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">สิทธิ์การใช้งาน (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-mario-orange"
                >
                  <option value="staff">STAFF (เจ้าหน้าที่ปฏิบัติตามจุด)</option>
                  <option value="admin">ADMIN (ผู้ดูแลระบบทั้งหมด)</option>
                  <option value="viewer">VIEWER (ดู Dashboard เท่านั้น)</option>
                </select>
              </div>

              {/* Staff Duty Selection (Only if role === 'staff') */}
              {role === 'staff' && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <label className="block text-amber-300 font-bold text-xs">
                    📍 หน้าที่ประจำจุดของเจ้าหน้าที่สตาฟ:
                  </label>

                  <div className="grid grid-cols-1 gap-2">
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        staffDuty === 'item_scanner'
                          ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffDuty"
                        checked={staffDuty === 'item_scanner'}
                        onChange={() => setStaffDuty('item_scanner')}
                        className="text-cyan-500 focus:ring-0"
                      />
                      <Scan className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="font-bold text-xs">อยู่สแกนไอเท็มลับตามจุด</p>
                        <p className="text-[10px] text-slate-400">สแกนยืนยันการค้นพบไอเท็มของนักเรียน</p>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                        staffDuty === 'booth_staff'
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="staffDuty"
                        checked={staffDuty === 'booth_staff'}
                        onChange={() => setStaffDuty('booth_staff')}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <MapPin className="w-4 h-4 text-mario-orange shrink-0" />
                      <div>
                        <p className="font-bold text-xs">อยู่ประจำบูธกิจกรรม</p>
                        <p className="text-[10px] text-slate-400">เช็คอินให้นักเรียนเพื่อมอบตัวอักษรประจำบูธ</p>
                      </div>
                    </label>
                  </div>

                  {/* Booth Selector dropdown when booth_staff is selected */}
                  {staffDuty === 'booth_staff' && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <label className="block text-slate-300 font-semibold">
                        เลือกบูธกิจกรรมประจำการ: <span className="text-mario-red">*</span>
                      </label>
                      {booths.length === 0 ? (
                        <p className="text-amber-400 text-[11px]">ยังไม่ได้สร้างบูทกิจกรรมในระบบ</p>
                      ) : (
                        <select
                          value={assignedBoothId}
                          onChange={(e) => setAssignedBoothId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-mario-yellow font-bold"
                        >
                          {booths.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} (ตัวอักษร '{b.letter}' ตำแหน่ง #{b.letter_position + 1})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-mario-orange to-mario-yellow text-slate-950 font-bold shadow hover:opacity-95 transition-all text-xs disabled:opacity-50 mt-2"
              >
                {isSaving ? 'กำลังบันทึก...' : 'สร้างบัญชีผู้ใช้งาน'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Batch Create Staff Modal ── */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-lg w-full bg-slate-900 border-2 border-purple-600/80 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h4 className="font-game text-xs text-mario-yellow">BATCH CREATE STAFF ACCOUNTS</h4>
              </div>
              <button onClick={() => setIsBatchOpen(false)} className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Prefix Username */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    คำนำหน้า Username <span className="text-mario-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchPrefixUser}
                    onChange={(e) => setBatchPrefixUser(e.target.value)}
                    placeholder="เช่น staff"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-mario-orange"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">เช่น `staff` ➔ staff01, staff02...</p>
                </div>

                {/* Prefix Password */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    คำนำหน้า Password <span className="text-mario-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchPrefixPass}
                    onChange={(e) => setBatchPrefixPass(e.target.value)}
                    placeholder="เช่น World"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:border-mario-orange"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">เช่น `World` ➔ World01, World02...</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Start index */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">ลำดับเริ่มต้น (Start Index)</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={batchStartIndex}
                    onChange={(e) => setBatchStartIndex(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                {/* Count */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">จำนวนที่ต้องการสร้าง (Count)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-mario-yellow font-bold"
                  />
                </div>
              </div>

              {/* Staff Duty Selection */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="block text-amber-300 font-bold text-xs">
                  📍 กำหนดหน้าที่สำหรับสตาฟชุดนี้:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      batchDuty === 'booth_staff'
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="batchDuty"
                      checked={batchDuty === 'booth_staff'}
                      onChange={() => setBatchDuty('booth_staff')}
                      className="text-emerald-500"
                    />
                    <MapPin className="w-4 h-4 text-mario-orange shrink-0" />
                    <div>
                      <p className="font-bold text-xs">อยู่ประจำบูธกิจกรรม</p>
                      <p className="text-[10px] text-slate-400">เช็คอินมอบตัวอักษร</p>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                      batchDuty === 'item_scanner'
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="batchDuty"
                      checked={batchDuty === 'item_scanner'}
                      onChange={() => setBatchDuty('item_scanner')}
                      className="text-cyan-500"
                    />
                    <Scan className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">อยู่สแกนไอเท็มลับ</p>
                      <p className="text-[10px] text-slate-400">ยืนยันการค้นพบไอเท็ม</p>
                    </div>
                  </label>
                </div>

                {batchDuty === 'booth_staff' && (
                  <label className="flex items-center gap-2 text-xs text-emerald-300 font-medium pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoLinkBooths}
                      onChange={(e) => setAutoLinkBooths(e.target.checked)}
                      className="rounded text-mario-green focus:ring-0"
                    />
                    <span>☑️ จับคู่บัญชีสตาฟตามลำดับบูธกิจกรรม 1 ถึง {booths.length || batchCount} ให้อัตโนมัติ</span>
                  </label>
                )}
              </div>

              {/* Real-time Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono space-y-1.5">
                <p className="text-slate-400 text-[11px] font-bold">💡 ตัวอย่างรายการบัญชีที่จะถูกสร้างขึ้น ({batchCount} บัญชี):</p>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-[11px]">
                  {Array.from({ length: Math.min(batchCount, 5) }).map((_, i) => {
                    const num = batchStartIndex + i;
                    const padNum = String(num).padStart(2, '0');
                    const u = `${batchPrefixUser.trim()}${padNum}`;
                    const p = `${batchPrefixPass.trim()}${padNum}`;
                    const booth = booths[i % booths.length];
                    return (
                      <div key={i} className="flex items-center justify-between text-slate-300">
                        <span>@{u} (รหัส: {p})</span>
                        <span className="text-mario-yellow text-[10px]">
                          {batchDuty === 'booth_staff'
                            ? booth
                              ? `➔ บูท: ${booth.name}`
                              : `➔ บูธลำดับ #${i + 1}`
                            : '➔ สแกนไอเท็มลับ'}
                        </span>
                      </div>
                    );
                  })}
                  {batchCount > 5 && (
                    <p className="text-slate-600 text-[10px] italic">...และอีก {batchCount - 5} บัญชี</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isBatchSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-mario-orange to-mario-yellow text-slate-950 font-bold shadow-lg hover:opacity-95 transition-all text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isBatchSaving ? 'กำลังสร้างบัญชี...' : `สร้าง ${batchCount} บัญชีสตาฟทันที`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
