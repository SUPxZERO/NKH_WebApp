import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Plus, Eye, Edit, Trash2,
  Users, MapPin, CheckCircle, XCircle, Clock, AlertTriangle,
  LayoutGrid, List, QrCode, Download, Printer, RefreshCw, Copy, ExternalLink
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError, toastInfo } from '@/app/utils/toast';
import { DiningTable, Floor, Location } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

// Stats Ribbon Component - Mobile optimized
const TableStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">{t('admin.tables.stats.total')}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.total}</p>
          </div>
          <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">{t('admin.tables.stats.available')}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{stats.available}</p>
          </div>
          <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">{t('admin.tables.stats.occupied')}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">{stats.occupied}</p>
          </div>
          <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">{t('admin.tables.stats.reserved')}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{stats.reserved}</p>
          </div>
          <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default function Tables() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);

  // QR Modal State
  const [openQrModal, setOpenQrModal] = useState(false);
  const [selectedTableForQr, setSelectedTableForQr] = useState<any | null>(null);
  const [qrImageData, setQrImageData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    location_id: '',
    floor_id: '',
    code: '',
    capacity: '2',
    status: 'available' as 'available' | 'reserved' | 'occupied' | 'unavailable'
  });

  // Fetch Data
  const { data: grouped } = useQuery({
    queryKey: ['admin/tables/grouped', search, statusFilter, floorFilter],
    queryFn: () => {
      let url = `/api/admin/tables/grouped?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (floorFilter !== 'all') url += `&floor_id=${floorFilter}`;
      return apiGet(url);
    }
  });

  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: () => apiGet('/api/admin/floors?per_page=100')
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/admin/locations?per_page=100')
  });

  // Flatten tables for list view
  const allTables = useMemo(() => {
    if (!grouped?.floors) return [];
    return grouped.floors.flatMap((f: any) =>
      f.tables.map((t: any) => ({ ...t, floor_name: f.floor.name }))
    );
  }, [grouped]);

  const stats = useMemo(() => ({
    total: grouped?.totals?.total || 0,
    available: grouped?.totals?.available || 0,
    occupied: grouped?.totals?.occupied || 0,
    reserved: grouped?.totals?.reserved || 0
  }), [grouped]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/tables', data),
    onSuccess: () => {
      toastSuccess(t('admin.tables.messages.created') as string);
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.tables.messages.create_failed') as string)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/tables/${id}`, data),
    onSuccess: () => {
      toastSuccess(t('admin.tables.messages.updated') as string);
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.tables.messages.update_failed') as string)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/tables/${id}`),
    onSuccess: () => {
      toastSuccess(t('admin.tables.messages.deleted') as string);
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.tables.messages.delete_failed') as string)
  });

  // QR Code Mutations
  const generateQrMutation = useMutation({
    mutationFn: (id: number) => apiPost(`/api/admin/tables/${id}/generate-qr`, {}),
    onSuccess: (response, id) => {
      toastSuccess(t('admin.tables.messages.qr_generated') as string);
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
      // Refresh QR image if modal is open for this table
      if (selectedTableForQr?.id === id) {
        // Update the local state with the new QR data from response
        const newQrData = response.data;
        if (newQrData) {
          setSelectedTableForQr((prev: any) => ({
            ...prev,
            qr_token: newQrData.qr_token,
            qr_url: newQrData.qr_url,
          }));
        }
        fetchQrImage(id);
      }
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.tables.messages.qr_failed') as string)
  });

  const bulkGenerateQrMutation = useMutation({
    mutationFn: (tableIds: number[]) => apiPost('/api/admin/tables/bulk-generate-qr', { table_ids: tableIds }),
    onSuccess: (data: any) => {
      toastSuccess(t('admin.tables.messages.bulk_qr_generated', { count: data.generated.toString() }) as string);
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.tables.messages.bulk_qr_failed') as string)
  });

  // Handlers
  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingTable(null);
    setFormData({ location_id: '', floor_id: '', code: '', capacity: '2', status: 'available' });
  };

  const handleEdit = (table: DiningTable) => {
    setEditingTable(table);
    // Find floor to identify location
    const floor = floors?.data?.find((f: Floor) => f.id === table.floor_id);

    setFormData({
      location_id: floor?.location_id?.toString() || '',
      floor_id: table.floor_id.toString(),
      code: table.code,
      capacity: table.capacity.toString(),
      status: table.status
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('admin.tables.messages.confirm_delete') as string)) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacity: parseInt(formData.capacity),
      floor_id: parseInt(formData.floor_id)
    };
    if (editingTable) updateMutation.mutate({ id: editingTable.id, data });
    else createMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'reserved': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'occupied': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  // QR Code Handlers
  const fetchQrImage = async (tableId: number) => {
    setQrLoading(true);
    try {
      const response = await apiGet(`/api/admin/tables/${tableId}/qr-image?format=base64`);
      setQrImageData(response.image || null);
    } catch (err) {
      console.error('Failed to fetch QR image:', err);
      setQrImageData(null);
    } finally {
      setQrLoading(false);
    }
  };

  const openQrModalForTable = async (table: any) => {
    setSelectedTableForQr(table);
    setOpenQrModal(true);
    if (table.qr_token) {
      fetchQrImage(table.id);
    } else {
      setQrImageData(null);
    }
  };

  const handleGenerateQr = (tableId: number) => {
    generateQrMutation.mutate(tableId);
  };

  const handleBulkGenerateQr = () => {
    const tablesWithoutQr = allTables.filter((t: any) => !t.qr_token).map((t: any) => t.id);
    if (tablesWithoutQr.length === 0) {
      toastInfo(t('admin.tables.messages.all_qr_exists') as string);
      return;
    }
    if (confirm(t('admin.tables.messages.confirm_bulk_qr', { count: tablesWithoutQr.length.toString() }) as string)) {
      bulkGenerateQrMutation.mutate(tablesWithoutQr);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImageData || !selectedTableForQr) return;

    // The backend returns SVG mostly, so we need to convert it to JPEG/PNG for better compatibility
    const img = new Image();
    img.src = qrImageData;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Set canvas size (default 300x300 or based on image)
      canvas.width = img.width || 300;
      canvas.height = img.height || 300;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background (important for JPEG transparency)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw SVG image
      ctx.drawImage(img, 0, 0);

      // Convert to JPEG
      const jpgUrl = canvas.toDataURL('image/jpeg', 1.0);

      // Download
      const link = document.createElement('a');
      link.href = jpgUrl;
      link.download = `table-${selectedTableForQr.code}-qr.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toastSuccess(t('admin.tables.messages.qr_downloaded') as string);
    };

    img.onerror = () => {
      console.error('Failed to load QR image for conversion');
      toastError(t('admin.tables.messages.qr_process_failed') as string);
    };
  };

  const handleCopyQrUrl = () => {
    if (!selectedTableForQr?.qr_url) return;
    navigator.clipboard.writeText(window.location.origin + selectedTableForQr.qr_url);
    toastSuccess(t('admin.tables.messages.url_copied') as string);
  };

  const handlePrintQr = () => {
    if (!qrImageData || !selectedTableForQr) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printTitle = t('admin.tables.print.title', { code: selectedTableForQr.code });
      const mainFloorText = selectedTableForQr.floor_name || t('admin.tables.modal.main_floor');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${printTitle}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                font-family: system-ui, -apple-system, sans-serif;
                background: white;
              }
              .qr-container {
                padding: 40px;
                text-align: center;
              }
              img { 
                width: 300px; 
                height: 300px; 
                margin-bottom: 24px; 
              }
              h1 { 
                font-size: 48px; 
                margin: 0 0 8px 0; 
                color: #1a1a1a;
              }
              p { 
                font-size: 24px; 
                color: #666; 
                margin: 0;
              }
              @media print {
                body { background: white; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${qrImageData}" alt="${t('admin.tables.print.qr_alt')}" />
              <h1>${t('admin.tables.print.table_prefix')} ${selectedTableForQr.code}</h1>
              <p>${mainFloorText}</p>
            </div>
            <script>
              // Wait for image to load before printing
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 500);
              };
              // Close only after print dialog is handled
              window.onafterprint = function() {
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent truncate">
                {t('admin.tables.title')}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.tables.subtitle')}</p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Button
                onClick={() => window.location.href = '/admin/tables/print-qr-view'}
                variant="secondary"
                className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm border-border"
              >
                <Printer className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin.tables.actions.print_all')}</span>
              </Button>
              {/* Bulk Generate QR Button */}
              <Button
                onClick={handleBulkGenerateQr}
                variant="secondary"
                className="h-9 sm:h-10 px-2 sm:px-3 text-xs sm:text-sm border-border"
                disabled={bulkGenerateQrMutation.isPending}
              >
                <QrCode className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin.tables.actions.generate_all_qr')}</span>
              </Button>
              <div className="bg-secondary p-0.5 sm:p-1 rounded-lg border border-border flex">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn("p-1.5 sm:p-2 rounded-md transition-all", viewMode === 'list' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <List size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1.5 sm:p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin.tables.add')}</span>
              </Button>
            </div>
          </div>

          <TableStatsRibbon stats={stats} />

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={t('admin.tables.filters.search') as string}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none"
                >
                  <option value="all">{t('admin.tables.filters.all_status')}</option>
                  <option value="available">{t('admin.tables.status.available')}</option>
                  <option value="reserved">{t('admin.tables.status.reserved')}</option>
                  <option value="occupied">{t('admin.tables.status.occupied')}</option>
                </select>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none"
                >
                  <option value="all">{t('admin.tables.filters.all_floors')}</option>
                  {floors?.data?.map((f: Floor) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'list' ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-semibold text-muted-foreground uppercase">
                  <div className="col-span-2">{t('admin.tables.table.code')}</div>
                  <div className="col-span-3">{t('admin.tables.table.floor')}</div>
                  <div className="col-span-2">{t('admin.tables.table.capacity')}</div>
                  <div className="col-span-3">{t('admin.tables.table.status')}</div>
                  <div className="col-span-2 text-right">{t('admin.tables.table.actions')}</div>
                </div>
                <div className="divide-y divide-border">
                  {allTables.map((table: any) => (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="col-span-2 font-medium text-foreground">{table.code}</div>
                      <div className="col-span-3 text-muted-foreground flex items-center gap-2">
                        <MapPin size={14} className="text-muted-foreground" />
                        {table.floor_name}
                      </div>
                      <div className="col-span-2 text-muted-foreground flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        {table.capacity}
                      </div>
                      <div className="col-span-3 flex items-center gap-2">
                        <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(table.status))}>
                          {t(`admin.tables.status.${table.status}`)}
                        </span>
                        {table.qr_token ? (
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <QrCode size={10} /> {t('admin.tables.table.qr_badge')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-500 border border-gray-500/20">
                            {t('admin.tables.table.no_qr')}
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={() => openQrModalForTable(table)} className="h-8 w-8 p-0 border-border" title={t('common.actions.view_qr_code')}>
                          <QrCode size={14} />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(table)} className="h-8 w-8 p-0 border-border">
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(table.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {allTables.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">{t('admin.tables.empty.no_tables')}</div>
                  )}
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {allTables.length === 0 ? (
                  <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <LayoutGrid className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-foreground font-semibold text-sm">{t('admin.tables.empty.no_tables')}</h3>
                    <p className="text-muted-foreground text-xs mt-1">{t('admin.tables.empty.create_first')}</p>
                  </div>
                ) : (
                  allTables.map((table: any) => (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl p-3 backdrop-blur-sm"
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                            <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{table.code}</h3>
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <MapPin size={10} /> {table.floor_name}
                            </p>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0", getStatusColor(table.status))}>
                          {t(`admin.tables.status.${table.status}`)}
                        </span>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users size={12} className="text-blue-500" />
                          <span className="font-semibold text-foreground">{table.capacity}</span> {t('admin.tables.table.seats')}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(table)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-500">
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(table.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {allTables.map((table: any) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-xl p-3 sm:p-4 hover:bg-secondary/50 transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <span className="font-bold text-foreground text-base sm:text-lg">{table.code}</span>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      table.status === 'available' ? "bg-emerald-500" :
                        table.status === 'occupied' ? "bg-red-500" : "bg-amber-500"
                    )} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{table.floor_name}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={10} className="sm:w-3 sm:h-3" /> {table.capacity} {t('admin.tables.table.seats')}
                  </div>

                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => handleEdit(table)} className="p-1 sm:p-1.5 bg-secondary rounded text-muted-foreground hover:text-foreground"><Edit size={10} className="sm:w-3 sm:h-3" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingTable ? t('admin.tables.modal.edit') : t('admin.tables.modal.new')}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">{t('admin.tables.modal.location')}</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value, floor_id: '' })}
                required
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">{t('admin.tables.modal.select_location')}</option>
                {locations?.data?.map((l: Location) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">{t('admin.tables.modal.floor')}</label>
              <select
                value={formData.floor_id}
                onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                required
                disabled={!formData.location_id}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground disabled:opacity-50"
              >
                <option value="">{t('admin.tables.modal.select_floor')}</option>
                {floors?.data?.filter((f: Floor) => !formData.location_id || f.location_id === parseInt(formData.location_id)).map((f: Floor) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('admin.tables.modal.code') as string} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-secondary border-border h-10 text-sm" />
            <Input label={t('admin.tables.modal.capacity') as string} type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required className="bg-secondary border-border h-10 text-sm" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">{t('admin.tables.modal.status')}</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="available">{t('admin.tables.status.available')}</option>
              <option value="reserved">{t('admin.tables.status.reserved')}</option>
              <option value="occupied">{t('admin.tables.status.occupied')}</option>
              <option value="unavailable">{t('admin.tables.status.unavailable')}</option>
            </select>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">{t('admin.common.cancel')}</Button>
            <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700">{t('layout.actions.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        open={openQrModal}
        onClose={() => { setOpenQrModal(false); setSelectedTableForQr(null); setQrImageData(null); }}
        title={t('admin.tables.modal.qr_for', { code: selectedTableForQr?.code || '' }) as string}
      >
        <div className="space-y-4">
          {/* Table Info */}
          <div className="bg-secondary/50 rounded-lg p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20">
              <LayoutGrid className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{selectedTableForQr?.code}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin size={12} /> {selectedTableForQr?.floor_name || t('admin.tables.modal.main_floor')}
                <span className="mx-2">•</span>
                <Users size={12} /> {selectedTableForQr?.capacity} {t('admin.tables.table.seats')}
              </p>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center py-6">
            {qrLoading ? (
              <div className="w-48 h-48 bg-secondary rounded-xl flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : qrImageData ? (
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img src={qrImageData} alt={t('admin.tables.modal.qr_alt') as string} className="w-48 h-48" />
              </div>
            ) : (
              <div className="w-48 h-48 bg-secondary rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                <QrCode className="w-12 h-12 mb-2" />
                <p className="text-sm">{t('admin.tables.modal.no_qr_yet')}</p>
              </div>
            )}

            {selectedTableForQr?.qr_url && (
              <p className="mt-4 text-xs text-muted-foreground font-mono bg-secondary px-3 py-1.5 rounded-lg max-w-full break-all text-center">
                {selectedTableForQr.qr_url}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {selectedTableForQr?.qr_token ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => handleGenerateQr(selectedTableForQr.id)}
                  disabled={generateQrMutation.isPending}
                  className="h-11"
                >
                  <RefreshCw size={16} className={cn("mr-2", generateQrMutation.isPending && "animate-spin")} />
                  {t('admin.tables.actions.regenerate')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCopyQrUrl}
                  className="h-11"
                >
                  <Copy size={16} className="mr-2" />
                  {t('admin.tables.actions.copy_url')}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleDownloadQr}
                  disabled={!qrImageData}
                  className="h-11"
                >
                  <Download size={16} className="mr-2" />
                  {t('admin.tables.actions.download')}
                </Button>
                <Button
                  onClick={handlePrintQr}
                  disabled={!qrImageData}
                  className="h-11 bg-purple-600 hover:bg-purple-700"
                >
                  <Printer size={16} className="mr-2" />
                  {t('admin.tables.actions.print')}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleGenerateQr(selectedTableForQr?.id)}
                disabled={generateQrMutation.isPending || !selectedTableForQr}
                className="col-span-2 h-11 bg-purple-600 hover:bg-purple-700"
              >
                <QrCode size={16} className="mr-2" />
                {generateQrMutation.isPending ? t('admin.tables.actions.generating') : t('admin.tables.actions.generate_qr')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </AdminLayout >
  );
}
