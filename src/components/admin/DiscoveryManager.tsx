import React, { useState } from 'react';
import { Discovery } from '@/types';
import { discoveryService } from '@/services/discoveryService';
import { exportService } from '@/services/exportService';
import { authService } from '@/services/authService';
import { soundManager } from '@/lib/sound';
import { formatDate } from '@/lib/utils';
import { 
  Trophy, 
  Search, 
  Download, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  User, 
  AlertTriangle, 
  FileSpreadsheet,
  Gift,
  X 
} from 'lucide-react';

interface Props {
  discoveries: Discovery[];
  onRefresh: () => void;
}

export const DiscoveryManager: React.FC<Props> = ({ discoveries, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [revokingDisc, setRevokingDisc] = useState<Discovery | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaimReward = async (disc: Discovery) => {
    soundManager.playClick();
    // Use synchronous getProfile() instead of async getCurrentUser() to avoid
    // silent bail-out when session is expired/unavailable
    const profile = authService.getProfile();
    const staffId = profile?.id ?? 'admin-fallback';

    setClaimingId(disc.id);
    try {
      const result = await discoveryService.claimReward(disc.id, staffId);
      if (result.success) {
        onRefresh();
      } else {
        console.error('claimReward failed:', result.message);
        alert('มอบรางวัลไม่สำเร็จ: ' + result.message);
      }
    } catch (err) {
      console.error('claimReward exception:', err);
      alert('เกิดข้อผิดพลาด: ' + String(err));
    } finally {
      setClaimingId(null);
    }
  };

  const filtered = discoveries.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      d.item?.item_code?.toLowerCase().includes(q) ||
      d.item?.name?.toLowerCase().includes(q) ||
      d.student?.full_name?.toLowerCase().includes(q) ||
      d.student?.student_code?.toLowerCase().includes(q) ||
      d.manual_student_name?.toLowerCase().includes(q) ||
      d.manual_student_code?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return Boolean(matchesQuery && matchesStatus);
  });

  const handleRevokeConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingDisc) return;
    soundManager.playClick();

    await discoveryService.revokeDiscovery(revokingDisc.id, revokeReason.trim());
    setRevokingDisc(null);
    setRevokeReason('');
    onRefresh();
  };

  const handleExport = (format: 'xlsx' | 'csv' | 'json') => {
    soundManager.playClick();
    exportService.exportDiscoveries(format);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสไอเทม, ชื่อนักเรียน..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-mario-orange"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-mario-orange"
          >
            <option value="ALL">สถานะทั้งหมด ({discoveries.length})</option>
            <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
            <option value="correction_requested">มีคำขอแก้ไข (Correction)</option>
            <option value="revoked">ยกเลิกแล้ว (Revoked)</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
          <span className="text-[11px] font-mono font-bold text-slate-400 px-2 flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> EXPORT:
          </span>
          <button
            type="button"
            onClick={() => handleExport('xlsx')}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-emerald-800 text-slate-200 hover:text-white text-[11px] font-bold"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="px-2 py-1 rounded bg-slate-700 hover:bg-blue-800 text-slate-200 hover:text-white text-[11px] font-bold"
          >
            CSV
          </button>
        </div>
      </div>

      {/* Discoveries Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">ไอเทม</th>
                <th className="py-3.5 px-4">ผู้ค้นพบ (Student)</th>
                <th className="py-3.5 px-4">เวลาที่ค้นพบ</th>
                <th className="py-3.5 px-4">เจ้าหน้าที่ / วิธี</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    ยังไม่มีรายการค้นพบที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* Item */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-mario-yellow">
                          {d.item?.item_code}
                        </span>
                        <span className="font-bold text-white truncate max-w-[160px]">
                          {d.item?.name}
                        </span>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="py-3 px-4">
                      <span className="text-white font-semibold block">
                        {d.student?.full_name || d.manual_student_name || 'ไม่ระบุชื่อ'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {d.student?.student_code || d.manual_student_code || '-'}
                        {d.student?.class_name ? ` • ${d.student.class_name}` : ''}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatDate(d.discovered_at)}
                    </td>

                    {/* Staff & Method */}
                    <td className="py-3 px-4">
                      <span className="text-slate-300 block">
                        {d.staff_profile?.display_name || 'Staff'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {d.verification_method}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-mario-green font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> บันทึกแล้ว
                      </span>
                    </td>

                    {/* Status & Correction notes */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        d.status === 'confirmed'
                          ? 'bg-mario-green/20 text-mario-green'
                          : d.status === 'correction_requested'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500 animate-pulse'
                          : 'bg-red-950 text-red-400'
                      }`}>
                        {d.status}
                      </span>
                      {d.correction_note && (
                        <p className="text-[10px] text-yellow-300 mt-1 max-w-xs italic">
                          คำขอ: {d.correction_note}
                        </p>
                      )}
                    </td>

                    {/* Revoke Action */}
                    <td className="py-3 px-4 text-right">
                      {d.status !== 'revoked' && (
                        <button
                          type="button"
                          onClick={() => setRevokingDisc(d)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>ยกเลิก (Revoke)</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoke Modal with Audit Reason */}
      {revokingDisc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-red-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-game text-xs text-red-400">
                REVOKE DISCOVERY (ยกเลิกการค้นพบ)
              </h4>
              <button onClick={() => setRevokingDisc(null)} className="p-1 rounded bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              การยกเลิกจะทำให้ไอเทม <strong className="text-mario-yellow">{revokingDisc.item?.item_code}</strong> กลับมามีสถานะ ACTIVE เพื่อให้สแกนใหม่ได้
            </p>

            <form onSubmit={handleRevokeConfirm} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">เหตุผลในการยกเลิก (Audit Log):</label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="เช่น สแกนผิดคน หรือได้รับการยืนยันการสแกนซ้ำ..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingDisc(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow"
                >
                  ยืนยันยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
