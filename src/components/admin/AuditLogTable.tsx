import React, { useState } from 'react';
import { AuditLog } from '@/types';
import { formatDate } from '@/lib/utils';
import { ShieldCheck, Search, Clock, FileText } from 'lucide-react';

interface Props {
  logs: AuditLog[];
}

export const AuditLogTable: React.FC<Props> = ({ logs }) => {
  const [search, setSearch] = useState('');

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.user_name?.toLowerCase().includes(q) ||
      l.target_type?.toLowerCase().includes(q) ||
      l.target_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-game text-xs text-mario-yellow">SECURITY & AUDIT LOGS</h3>
          <p className="text-xs text-slate-400">บันทึกทุก Action สำคัญในระบบเพื่อการตรวจสอบย้อนหลัง</p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา Action, ผู้ใช้..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">ผู้ดำเนินการ</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">เป้าหมาย (Target)</th>
                <th className="py-3 px-4">รายละเอียด (Metadata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-white">
                    {log.user_name || 'System'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-mario-yellow">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">
                    {log.target_type ? `${log.target_type}:${log.target_id || ''}` : '-'}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px] max-w-xs truncate">
                    {JSON.stringify(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
