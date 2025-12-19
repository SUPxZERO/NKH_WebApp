import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Bell, MessageSquare, AlertTriangle, Info, CheckCircle,
  XCircle, Clock, Users, Settings, Zap, Trash2, Eye, Check
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

// Stats Ribbon
const NotificationStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Notifications</p>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <Bell className="w-8 h-8 text-purple-500 dark:text-purple-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Unread</p>
          <p className="text-2xl font-bold text-amber-500 dark:text-amber-400 mt-1">{stats.unread}</p>
        </div>
        <MessageSquare className="w-8 h-8 text-amber-500 dark:text-amber-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">System Alerts</p>
          <p className="text-2xl font-bold text-red-500 dark:text-red-400 mt-1">{stats.systemAlerts}</p>
        </div>
        <AlertTriangle className="w-8 h-8 text-red-500 dark:text-red-400" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">User Messages</p>
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400 mt-1">{stats.userMessages}</p>
        </div>
        <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
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

  return (
    <AdminLayout>
      <div className="relative min-h-screen bg-background p-6">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent tracking-tight">Notifications</h1>
              <p className="text-muted-foreground mt-1">System alerts, user messaging, and broadcast notifications</p>
            </div>
          </div>

          <NotificationStatsRibbon stats={stats} />

          {/* Targeted Send Panel */}
          <div className="mb-6">
            <SendNotificationPanel />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Types</option>
                <option value="order">Order</option>
                <option value="promotion">Promotion</option>
                <option value="reward">Reward</option>
                <option value="system">System</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Status</option>
                <option value="read">Read</option>
                <option value="unread">Unread</option>
              </select>
              <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)}
                className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:border-purple-500 outline-none">
                <option value="all">All Targets</option>
                <option value="all_users">All Users</option>
                <option value="all_customers">All Customers</option>
                <option value="all_employees">All Employees</option>
                <option value="by_role">By Role/Position</option>
                <option value="by_tier">By Customer Tier</option>
                <option value="by_location">By Location</option>
                <option value="specific_users">Specific Users</option>
                <option value="recent_customers">Recent Customers</option>
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
              <div className="col-span-3">Title / Message</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Target</div>
              <div className="col-span-2">Recipients</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : notificationList.map((notification: Notification) => (
                <motion.div key={notification.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors group">
                  <div className="col-span-3">
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
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => { setSelectedNotification(notification); setOpenView(true); }} className="h-8 w-8 p-0 border-border"><Eye size={14} /></Button>
                    <Button size="sm" variant="danger" onClick={() => confirm('Delete?') && deleteMutation.mutate(notification.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400"><Trash2 size={14} /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={openCreate} onClose={closeModal} title="Send Notification" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-background border-border" />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Message</label>
            <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required rows={4}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground">
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
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground">
                <option value="all">All Users</option>
                {users?.data?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Send</Button>
          </div>
        </form>
      </Modal>

      <Modal open={openView} onClose={() => setOpenView(false)} title="Notification Details">
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">{selectedNotification.title}</h3>
              <Badge className={getTypeColor(selectedNotification.type)}>{selectedNotification.type.toUpperCase()}</Badge>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg border border-border text-foreground/80 text-sm whitespace-pre-wrap">
              {selectedNotification.message}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background p-3 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground">Target Type</div>
                <div className="text-sm font-medium text-foreground mt-1">
                  {selectedNotification.target_type ? selectedNotification.target_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}
                </div>
              </div>
              <div className="bg-background p-3 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground">Recipients</div>
                <div className="text-sm font-medium text-foreground mt-1">{selectedNotification.recipient_count || 0} users</div>
              </div>
              <div className="bg-background p-3 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground">Read</div>
                <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">{selectedNotification.read_count || 0}</div>
              </div>
              <div className="bg-background p-3 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground">Unread</div>
                <div className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-1">{selectedNotification.unread_count || 0}</div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>Created by: {selectedNotification.created_by?.name || 'System'}</span>
              <span>{new Date(selectedNotification.created_at).toLocaleString()}</span>
            </div>
            <Button onClick={() => setOpenView(false)} className="w-full mt-4">Close</Button>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
