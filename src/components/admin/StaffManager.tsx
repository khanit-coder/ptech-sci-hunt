import React, { useState } from 'react';
import { Profile, UserRole } from '@/types';
import { soundManager } from '@/lib/sound';
import { UserCheck, ShieldCheck, UserX, Key, Plus, Lock, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Props {
  staffList: Profile[];
  onRefresh: () => void;
}

export const StaffManager: React.FC<Props> = ({ staffList, onRefresh }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    alert('บันทึกการเพิ่มเจ้าหน้าที่เรียบร้อย (ในระบบ Production ให้ส่งอีเมล Invite ผ่าน Supabase Auth)');
    setIsCreating(false);
    setEmail('');
    setName('');
    setDisplayName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-game text-xs text-mario-yellow">STAFF & USER ACCOUNTS</h3>
          <p className="text-xs text-slate-400">จัดการสิทธิ์เจ้าหน้าที่จุดเช็คอินและผู้ดูแลระบบ</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-mario-orange to-mario-yellow text-slate-950 text-xs font-bold shadow hover:opacity-95 transition-all flex items-center gap-1.5 pixel-btn"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มเจ้าหน้าที่ใหม่</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">ชื่อแสดง (Checkpoint)</th>
                <th className="py-3.5 px-4">อีเมล</th>
                <th className="py-3.5 px-4">บทบาท (Role)</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {staffList.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white">
                    {st.full_name}
                  </td>
                  <td className="py-3.5 px-4 text-mario-yellow">
                    {st.display_name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {st.email}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
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
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`ส่งลิงก์ Reset Password ไปที่ ${st.email}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-game text-xs text-mario-yellow">CREATE STAFF ACCOUNT</h4>
              <button onClick={() => setIsCreating(false)} className="p-1 rounded bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">อีเมล (@ptech.ac.th)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@ptech.ac.th"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อ - นามสกุลจริง</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นายพชร บุญส่ง"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อจุดเช็คอิน (Display Name)</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="เช่น Staff Dome จุด 1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">สิทธิ์การใช้งาน (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="staff">STAFF (สแกนและเช็คอินไอเทม)</option>
                  <option value="admin">ADMIN (ควบคุมระบบทั้งหมด)</option>
                  <option value="viewer">VIEWER (ดู Dashboard เท่านั้น)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-mario-orange text-white font-bold shadow mt-2"
              >
                สร้างบัญชีผู้ใช้งาน
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
