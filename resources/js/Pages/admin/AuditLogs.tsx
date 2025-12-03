import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, Eye, Shield, User, Calendar, Globe, Monitor,
  Database, Activity, Clock, FileText, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const AuditStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Logs</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <FileText className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Today</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.today}</p>
        </div>
        <Clock className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active Users</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.activeUsers}</p>
        </div>
        <User className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Top Action</p>
          <p className="text-lg font-bold text-amber-400 mt-1 truncate">{stats.topAction}</p>
        </div>
        <Activity className="w-8 h-8 text-amber-400" />
      </div>
    </div>
  </div>
);

interface AuditLog {
  id: number; user_id?: number; user?: { name: string; email: string }; action: string;
  auditable_type?: string; auditable_id?: number; ip_address?: string;
  user_agent?: string | null; properties?: any; created_at: string;
  metadata?: any;
}

const formatUserAgent = (ua: string | null | undefined): string => {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Other';
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openView, setOpenView] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Fetch Data
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin/audit-logs', page, search, actionFilter, userFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/audit-logs?page=${page}&per_page=${perPage}&search=${search}`;
      if (actionFilter !== 'all') url += `&action=${actionFilter}`;
      if (userFilter !== 'all') url += `&user_id=${userFilter}`;
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        if (dateFilter === 'today') startDate = today.toISOString().split('T')[0];
        else if (dateFilter === 'week') startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
        else if (dateFilter === 'month') startDate = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
        url += `&start_date=${startDate}`;
      }
      return apiGet(url);
    }
  });

  const { data: auditStats } = useQuery({
    queryKey: ['admin/audit-stats'],
    queryFn: () => apiGet('/api/admin/audit-stats')
  });

  const logList = useMemo(() => auditLogs?.data || [], [auditLogs]);

  const stats = useMemo(() => ({
    total: auditLogs?.meta?.total || logList.length,
    today: auditStats?.today_count || 0,
    activeUsers: auditStats?.unique_users || 0,
    topAction: auditStats?.top_action || 'N/A'
  }), [logList, auditLogs, auditStats]);

  const handleView = (log: AuditLog) => {
    setSelectedLog(log);
    setOpenView(true);
  };

  const getActionColor = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('create')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (lower.includes('update') || lower.includes('edit')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (lower.includes('delete')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (lower.includes('login')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const getActionIcon = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('create')) return <Database size={14} />;
    if (lower.includes('update') || lower.includes('edit')) return <FileText size={14} />;
    if (lower.includes('delete')) return <Shield size={14} />;
    if (lower.includes('login')) return <User size={14} />;
    return <Activity size={14} />;
  };

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Audit Logs</h1>
            <p className="text-slate-400 mt-1">System activity monitoring</p>
          </div>
        </div>

        <AuditStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-2">Timestamp</div>
            <div className="col-span-2">User</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-3">Resource</div>
            <div className="col-span-2">Details</div>
            <div className="col-span-1 text-right">View</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : logList.map((log: AuditLog) => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-2 text-sm text-gray-300">
                  <div className="text-white">{new Date(log.created_at).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                </div>
                <div className="col-span-2">
                  <div className="font-medium text-white">{log.user?.name || 'System'}</div>
                  <div className="text-xs text-gray-500">{log.user?.email || '-'}</div>
                </div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getActionColor(log.action))}>
                    {getActionIcon(log.action)} {log.action}
                  </span>
                </div>
                <div className="col-span-3 text-sm text-gray-300">
                  <div className="text-white">{log.auditable_type || '-'}</div>
                  <div className="text-xs text-gray-500">ID: {log.auditable_id || '-'}</div>
                </div>
                <div className="col-span-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2"><Globe size={12} /> {log.ip_address || '-'}</div>
                  <div className="flex items-center gap-2 mt-1"><Monitor size={12} /> {formatUserAgent(log.user_agent ?? null)}</div>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => handleView(log)} className="h-8 w-8 p-0 border-white/10"><Eye size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openView} onClose={() => setOpenView(false)} title="Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">General</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">ID:</span> <span className="text-white">{selectedLog.id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Action:</span> <span className="text-white">{selectedLog.action}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">User</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="text-white">{selectedLog.user?.name || 'System'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IP:</span> <span className="text-white">{selectedLog.ip_address}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Browser:</span> <span className="text-white">{formatUserAgent(selectedLog.user_agent ?? null)}</span></div>
                </div>
              </div>
            </div>
            {selectedLog.metadata && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Metadata</h3>
                <pre className="bg-slate-950 border border-white/10 rounded-lg p-4 text-xs text-gray-300 overflow-auto max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpenView(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
