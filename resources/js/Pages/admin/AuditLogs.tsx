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

// Stats Ribbon - Mobile optimized
const AuditStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
    <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Logs</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.total}</p>
        </div>
        <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">Today</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">{stats.today}</p>
        </div>
        <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Users</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{stats.activeUsers}</p>
        </div>
        <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Top Action</p>
          <p className="text-sm sm:text-base md:text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1 truncate">{stats.topAction}</p>
        </div>
        <Activity className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full mx-auto">
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-600 dark:from-purple-400 dark:via-blue-400 dark:to-emerald-400 bg-clip-text text-transparent truncate">
                <span className="sm:hidden">Logs</span>
                <span className="hidden sm:inline">Audit Logs</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">System activity monitoring</p>
            </div>
          </div>

          <AuditStatsRibbon stats={stats} />

          <div className="bg-card border border-border rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-background border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="flex gap-2">
                <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-background border border-border rounded-lg px-2 sm:px-4 py-2 h-10 text-sm text-foreground focus:border-purple-500 outline-none">
                  <option value="all">All</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-background border border-border rounded-lg px-2 sm:px-4 py-2 h-10 text-sm text-foreground focus:border-purple-500 outline-none">
                  <option value="all">All</option>
                  <option value="today">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
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

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : logList.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No logs found</p>
              </div>
            ) : logList.map((log: AuditLog) => (
              <motion.div key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-3 backdrop-blur-sm">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 flex-shrink-0", getActionColor(log.action))}>
                      {getActionIcon(log.action)} {log.action}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleView(log)} className="h-7 w-7 p-0 border-border flex-shrink-0">
                    <Eye size={12} />
                  </Button>
                </div>

                {/* User & Resource */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">User: </span>
                    <span className="text-foreground font-medium">{log.user?.name || 'System'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground">IP: </span>
                    <span className="text-foreground font-mono">{log.ip_address || '-'}</span>
                  </div>
                </div>

                {/* Resource */}
                <div className="mt-1.5 pt-1.5 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">Resource: </span>
                  <span className="text-foreground">{log.auditable_type || '-'}</span>
                  <span className="text-muted-foreground ml-2">ID: {log.auditable_id || '-'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openView} onClose={() => setOpenView(false)} title="Log Details" size="lg">
        {selectedLog && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">General</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">ID:</span> <span className="text-foreground">{selectedLog.id}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Action:</span> <span className="text-foreground">{selectedLog.action}</span></div>
                  <div className="flex justify-between flex-wrap gap-1"><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">User</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{selectedLog.user?.name || 'System'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IP:</span> <span className="text-foreground font-mono">{selectedLog.ip_address}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Browser:</span> <span className="text-foreground">{formatUserAgent(selectedLog.user_agent ?? null)}</span></div>
                </div>
              </div>
            </div>
            {selectedLog.metadata && (
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">Metadata</h3>
                <pre className="bg-muted border border-border rounded-lg p-3 sm:p-4 text-[10px] sm:text-xs text-muted-foreground overflow-auto max-h-40 sm:max-h-60">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpenView(false)} className="h-10 text-sm">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
