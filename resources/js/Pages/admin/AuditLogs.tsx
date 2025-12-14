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
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Logs</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Today</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.today}</p>
        </div>
        <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Active Users</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.activeUsers}</p>
        </div>
        <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Top Action</p>
          <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1 truncate">{stats.topAction}</p>
        </div>
        <Activity className="w-8 h-8 text-amber-600 dark:text-amber-400" />
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
    if (lower.includes('create')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (lower.includes('update') || lower.includes('edit')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (lower.includes('delete')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    if (lower.includes('login')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
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
      <div className="min-h-screen bg-background p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 dark:from-purple-400 dark:via-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                Audit Logs
              </h1>
              <p className="text-muted-foreground mt-1">System activity monitoring</p>
            </div>
          </div>

          <AuditStatsRibbon stats={stats} />

          <div className="bg-card border border-border rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Actions</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-2">Timestamp</div>
              <div className="col-span-2">User</div>
              <div className="col-span-2">Action</div>
              <div className="col-span-3">Resource</div>
              <div className="col-span-2">Details</div>
              <div className="col-span-1 text-right">View</div>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : logList.map((log: AuditLog) => (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors group">
                  <div className="col-span-2 text-sm">
                    <div className="text-foreground">{new Date(log.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-foreground">{log.user?.name || 'System'}</div>
                    <div className="text-xs text-muted-foreground">{log.user?.email || '-'}</div>
                  </div>
                  <div className="col-span-2">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getActionColor(log.action))}>
                      {getActionIcon(log.action)} {log.action}
                    </span>
                  </div>
                  <div className="col-span-3 text-sm">
                    <div className="text-foreground">{log.auditable_type || '-'}</div>
                    <div className="text-xs text-muted-foreground">ID: {log.auditable_id || '-'}</div>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Globe size={12} /> {log.ip_address || '-'}</div>
                    <div className="flex items-center gap-2 mt-1"><Monitor size={12} /> {formatUserAgent(log.user_agent ?? null)}</div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => handleView(log)} className="h-8 w-8 p-0 border-border"><Eye size={14} /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={openView} onClose={() => setOpenView(false)} title="Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">General</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">ID:</span> <span className="text-foreground">{selectedLog.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Action:</span> <span className="text-foreground">{selectedLog.action}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">User</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedLog.user?.name || 'System'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IP:</span> <span className="text-foreground">{selectedLog.ip_address}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Browser:</span> <span className="text-foreground">{formatUserAgent(selectedLog.user_agent ?? null)}</span></div>
                </div>
              </div>
            </div>
            {selectedLog.metadata && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Metadata</h3>
                <pre className="bg-muted border border-border rounded-lg p-4 text-xs text-muted-foreground overflow-auto max-h-60">
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
