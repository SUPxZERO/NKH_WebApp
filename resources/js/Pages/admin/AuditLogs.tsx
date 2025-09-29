import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Eye, 
  Shield, 
  User,
  Calendar,
  Globe,
  Monitor,
  Database,
  Activity,
  Clock,
  FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet } from '@/app/utils/api';
import { AuditLog } from '@/app/types/domain';

export default function AuditLogs() {
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('all');
  const [userFilter, setUserFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [openView, setOpenView] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['admin/audit-logs', page, search, actionFilter, userFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/audit-logs?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (actionFilter !== 'all') {
        url += `&action=${actionFilter}`;
      }
      
      if (userFilter !== 'all') {
        url += `&user_id=${userFilter}`;
      }
      
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        
        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            url += `&date=${startDate}`;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${weekAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            url += `&start_date=${monthAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
            break;
        }
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch audit stats
  const { data: auditStats } = useQuery({
    queryKey: ['admin/audit-stats'],
    queryFn: () => apiGet('/api/admin/audit-stats')
  }) as { data: any };

  const handleView = (log: AuditLog) => {
    setSelectedLog(log);
    setOpenView(true);
  };

  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (actionLower.includes('update') || actionLower.includes('edit')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (actionLower.includes('delete')) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (actionLower.includes('login') || actionLower.includes('auth')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (actionLower.includes('view') || actionLower.includes('read')) return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  const getActionIcon = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return <Database className="w-4 h-4" />;
    if (actionLower.includes('update') || actionLower.includes('edit')) return <FileText className="w-4 h-4" />;
    if (actionLower.includes('delete')) return <Shield className="w-4 h-4" />;
    if (actionLower.includes('login') || actionLower.includes('auth')) return <User className="w-4 h-4" />;
    if (actionLower.includes('view') || actionLower.includes('read')) return <Eye className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    
    // Simple user agent parsing
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Mobile')) return 'Mobile';
    return 'Other';
  };

  const totalLogs = auditLogs?.data?.length || 0;
  const todayLogs = auditStats?.today_count || 0;
  const uniqueUsers = auditStats?.unique_users || 0;
  const topAction = auditStats?.top_action || 'N/A';

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Audit Logs
              </h1>
              <p className="text-gray-400 mt-1">System activity tracking and monitoring</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Logs</div>
                <div className="text-xl font-bold text-white">{totalLogs}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Today</div>
                <div className="text-xl font-bold text-blue-400">{todayLogs}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active Users</div>
                <div className="text-xl font-bold text-green-400">{uniqueUsers}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Top Action</div>
                <div className="text-xl font-bold text-purple-400">{topAction}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="login">Login</option>
            <option value="view">View</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setActionFilter('all');
              setUserFilter('all');
              setDateFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Audit Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/5 border-white/10 backdrop-blur-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-gray-300 font-semibold">Timestamp</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">User</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Action</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Resource</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">IP Address</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Browser</th>
                      <th className="text-left p-4 text-gray-300 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="p-4">
                            <div className="animate-pulse h-4 bg-white/10 rounded w-24"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-4 bg-white/10 rounded w-20"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-6 bg-white/10 rounded w-16"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-4 bg-white/10 rounded w-32"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-4 bg-white/10 rounded w-24"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-4 bg-white/10 rounded w-16"></div>
                          </td>
                          <td className="p-4">
                            <div className="animate-pulse h-8 bg-white/10 rounded w-16"></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      auditLogs?.data?.map((log: AuditLog) => (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <div className="text-white text-sm">
                              {new Date(log.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white text-sm">
                              {log.user?.name || 'System'}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {log.user?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getActionColor(log.action)}>
                              <div className="flex items-center gap-1">
                                {getActionIcon(log.action)}
                                {log.action}
                              </div>
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-white text-sm">
                              {log.auditable_type || 'N/A'}
                            </div>
                            {log.auditable_id && (
                              <div className="text-gray-400 text-xs">
                                ID: {log.auditable_id}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-white text-sm flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {log.ip_address || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-white text-sm flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {formatUserAgent(log.user_agent)}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleView(log)}
                              className="border-white/20 hover:bg-white/10"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {auditLogs?.meta && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {auditLogs?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === auditLogs?.meta?.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* View Log Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedLog(null);
        }}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Log Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID:</span>
                    <span className="text-white">{selectedLog.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action:</span>
                    <Badge className={getActionColor(selectedLog.action)}>
                      <div className="flex items-center gap-1">
                        {getActionIcon(selectedLog.action)}
                        {selectedLog.action}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resource Type:</span>
                    <span className="text-white">{selectedLog.auditable_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resource ID:</span>
                    <span className="text-white">{selectedLog.auditable_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timestamp:</span>
                    <span className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">User & Session</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User:</span>
                    <span className="text-white">{selectedLog.user?.name || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedLog.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">IP Address:</span>
                    <span className="text-white">{selectedLog.ip_address || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Browser:</span>
                    <span className="text-white">{formatUserAgent(selectedLog.user_agent)}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedLog.user_agent && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">User Agent</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg text-sm break-all">
                  {selectedLog.user_agent}
                </p>
              </div>
            )}

            {selectedLog.metadata && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Metadata</h3>
                <pre className="text-gray-300 bg-white/5 p-3 rounded-lg text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedLog(null);
                }}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
