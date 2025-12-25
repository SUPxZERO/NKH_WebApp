import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Bell, MessageSquare, AlertTriangle, Info, CheckCircle,
  XCircle, Clock, Users, Settings, Zap, Trash2, Eye, Check, Filter, ChevronDown
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import SendNotificationPanel from '@/app/components/admin/SendNotificationPanel';

// Stats Ribbon - Mobile optimized with horizontal scroll
const NotificationStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
    <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[100px] sm:min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.total}</p>
          </div>
          <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 dark:text-purple-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[100px] sm:min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">Unread</p>
            <p className="text-xl sm:text-2xl font-bold text-amber-500 dark:text-amber-400 mt-0.5 sm:mt-1">{stats.unread}</p>
          </div>
          <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 dark:text-amber-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[100px] sm:min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">Alerts</p>
            <p className="text-xl sm:text-2xl font-bold text-red-500 dark:text-red-400 mt-0.5 sm:mt-1">{stats.systemAlerts}</p>
          </div>
          <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 dark:text-red-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[100px] sm:min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">Messages</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-500 dark:text-blue-400 mt-0.5 sm:mt-1">{stats.userMessages}</p>
          </div>
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 dark:text-blue-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  </div>
);

interface Notification {
  id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' | 'system' | 'order' | 'promotion' | 'reward';
  target_type?: string; target_metadata?: any;
  recipient_count?: number; read_count?: number; unread_count?: number;
  created_by?: { id: number; name: string }; created_at: string;
}

export default function Notifications() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [formData, setFormData] = useState({
    title: '', message: '', type: 'info', user_id: '', send_to_all: false
  });

  // Fetch Data
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', page, search, typeFilter, statusFilter, targetFilter],
    queryFn: () => {
      let url = `/api/admin/notifications?page=${page}&per_page=${perPage}&search=${search}`;
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (targetFilter !== 'all') url += `&target_type=${targetFilter}`;
      return apiGet(url);
    }
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => apiGet('/api/admin/users') });
  const { data: statsData } = useQuery({ queryKey: ['notification-stats'], queryFn: () => apiGet('/api/admin/notifications/stats') });

  const notificationList = useMemo(() => notifications?.data || [], [notifications]);

  const stats = useMemo(() => ({
    total: statsData?.total || 0,
    unread: statsData?.unread || 0,
    systemAlerts: statsData?.system_alerts || 0,
    userMessages: statsData?.user_messages || 0
  }), [statsData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/notifications', data),
    onSuccess: () => { toastSuccess('Notification sent'); closeModal(); qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notification-stats'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => apiPut(`/api/admin/notifications/${id}/read`, {}),
    onSuccess: () => { toastSuccess('Marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notification-stats'] }); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/notifications/${id}`),
    onSuccess: () => { toastSuccess('Notification deleted'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setFormData({ title: '', message: '', type: 'info', user_id: '', send_to_all: false });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      user_id: formData.send_to_all ? null : parseInt(formData.user_id)
    };
    createMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    if (type === 'success') return <CheckCircle size={14} />;
    if (type === 'warning') return <AlertTriangle size={14} />;
    if (type === 'error') return <XCircle size={14} />;
    if (type === 'system') return <Zap size={14} />;
    return <Info size={14} />;
  };

  const getTypeColor = (type: string) => {
    if (type === 'success') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (type === 'warning') return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (type === 'error') return 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20';
    if (type === 'system') return 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="relative min-h-screen bg-background p-3 sm:p-4 md:p-6">
        {/* Decorative Background Elements - Hidden on mobile for performance */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header - Mobile optimized */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight truncate">
                Notifications
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">System alerts and broadcasts</p>
            </div>
          </div>

          <NotificationStatsRibbon stats={stats} />

          {/* Targeted Send Panel */}
          <div className="mb-4 sm:mb-6">
            <SendNotificationPanel />
          </div>

          {/* Search & Filters - Mobile optimized */}
          <div className="bg-card border border-border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-11 bg-background border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>

            {/* Filter toggle button for mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex sm:hidden items-center justify-between w-full px-3 py-2 bg-muted/50 rounded-lg text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {(typeFilter !== 'all' || statusFilter !== 'all' || targetFilter !== 'all') && (
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                )}
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
            </button>

            {/* Filter dropdowns - Hidden on mobile by default, shown when expanded */}
            <div className={cn(
              "grid gap-2 mt-3 sm:mt-0 sm:grid-cols-3",
              showFilters ? "grid" : "hidden sm:grid"
            )}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Types</option>
                <option value="order">Order</option>
                <option value="promotion">Promotion</option>
                <option value="reward">Reward</option>
                <option value="system">System</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Targets</option>
                <option value="all_users">All Users</option>
                <option value="all_customers">All Customers</option>
                <option value="all_employees">All Employees</option>
                <option value="by_role">By Role</option>
                <option value="by_tier">By Tier</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
            {/* Table Header - Desktop only */}
            <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-4">Title / Message</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Target</div>
              <div className="col-span-2">Recipients</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : notificationList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  No notifications found
                </div>
              ) : notificationList.map((notification: Notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 sm:p-4 hover:bg-muted/30 transition-colors"
                  onClick={() => { setSelectedNotification(notification); setOpenView(true); }}
                >
                  {/* Mobile Card Layout */}
                  <div className="lg:hidden">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate">{notification.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notification.message}</div>
                      </div>
                      <span className={cn("px-2 py-1 rounded-md text-[10px] font-medium border flex items-center gap-1 flex-shrink-0", getTypeColor(notification.type))}>
                        {getTypeIcon(notification.type)}
                        <span className="hidden sm:inline">{notification.type.toUpperCase()}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        {notification.target_type && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                            {notification.target_type.replace(/_/g, ' ').slice(0, 12)}
                          </span>
                        )}
                        <span>{notification.recipient_count || 0} recipients</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{notification.read_count || 0} read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs">{formatDate(notification.created_at)}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); confirm('Delete?') && deleteMutation.mutate(notification.id); }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 items-center group">
                    <div className="col-span-4">
                      <div className="font-medium text-foreground">{notification.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{notification.message}</div>
                    </div>
                    <div className="col-span-2">
                      <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getTypeColor(notification.type))}>
                        {getTypeIcon(notification.type)} {notification.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {notification.target_type ? (
                        <span className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {notification.target_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Legacy</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-foreground">{notification.recipient_count || 0} recipients</div>
                      <div className="text-xs text-muted-foreground">
                        {notification.read_count || 0} read • {notification.unread_count || 0} unread
                      </div>
                    </div>
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {formatDate(notification.created_at)}
                    </div>
                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setSelectedNotification(notification); setOpenView(true); }} className="h-8 w-8 p-0 border-border"><Eye size={14} /></Button>
                      <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); confirm('Delete?') && deleteMutation.mutate(notification.id); }} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={openCreate} onClose={closeModal} title="Send Notification" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-background border-border" />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Recipient</label>
              <select value={formData.send_to_all ? 'all' : formData.user_id} onChange={(e) => {
                if (e.target.value === 'all') setFormData({ ...formData, send_to_all: true, user_id: '' });
                else setFormData({ ...formData, send_to_all: false, user_id: e.target.value });
              }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm">
                <option value="all">All Users</option>
                {users?.data?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-11">Cancel</Button>
            <Button type="submit" className="flex-1 h-11 bg-purple-600 hover:bg-purple-700">Send</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={openView} onClose={() => setOpenView(false)} title="Notification Details">
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{selectedNotification.title}</h3>
              <Badge className={cn("flex-shrink-0", getTypeColor(selectedNotification.type))}>{selectedNotification.type.toUpperCase()}</Badge>
            </div>
            <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border border-border text-foreground/80 text-sm whitespace-pre-wrap">
              {selectedNotification.message}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-background p-2.5 sm:p-3 rounded-lg border border-border">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Target</div>
                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5 sm:mt-1 truncate">
                  {selectedNotification.target_type ? selectedNotification.target_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                </div>
              </div>
              <div className="bg-background p-2.5 sm:p-3 rounded-lg border border-border">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Recipients</div>
                <div className="text-xs sm:text-sm font-medium text-foreground mt-0.5 sm:mt-1">{selectedNotification.recipient_count || 0}</div>
              </div>
              <div className="bg-background p-2.5 sm:p-3 rounded-lg border border-border">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Read</div>
                <div className="text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{selectedNotification.read_count || 0}</div>
              </div>
              <div className="bg-background p-2.5 sm:p-3 rounded-lg border border-border">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Unread</div>
                <div className="text-xs sm:text-sm font-medium text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{selectedNotification.unread_count || 0}</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between text-[10px] sm:text-xs text-muted-foreground pt-2 border-t border-border gap-1">
              <span>By: {selectedNotification.created_by?.name || 'System'}</span>
              <span>{new Date(selectedNotification.created_at).toLocaleString()}</span>
            </div>
            <Button onClick={() => setOpenView(false)} className="w-full h-11 mt-4">Close</Button>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
