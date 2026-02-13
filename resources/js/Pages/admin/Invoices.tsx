import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Eye, Download, DollarSign, Clock,
  CheckCircle, XCircle, FileText, CreditCard
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Invoice } from '@/app/types/domain';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '@/app/context/LanguageContext';

// Enhanced StatCard - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
  const colorStyles: Record<string, any> = {
    purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
    amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
    emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
    red: { gradient: 'from-red-500/20 to-rose-500/10', iconBg: 'bg-gradient-to-br from-red-500 to-rose-600', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30', shadow: 'shadow-red-500/20' },
  };
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 hidden sm:block">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">{title}</p>
            <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate", styles.text)}>{value}</p>
            {subtext && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{subtext}</p>}
          </div>
          <div className={cn("p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function AdminInvoices() {
  const { t, locale } = useLanguage();
  // const [invoiceList, setInvoiceList] = useState<Invoice[]>([]); // Removed redeclaration
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openView, setOpenView] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const getAmount = (value: any): number => {
    if (value === null || value === undefined) return 0;
    return parseFloat(String(value));
  };

  // Fetch Data
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['admin/invoices', page, search, statusFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/invoices?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
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

  const invoiceList = useMemo(() => {
    if (!invoices) return [];
    // Handle direct array
    if (Array.isArray(invoices)) return invoices;
    // Handle Laravel legacy Paginator structure { data: [...], ... }
    if (Array.isArray((invoices as any)?.data)) return (invoices as any).data;
    // Handle Resource Collection structure { data: [...], meta: ... } which might be nested if axios wraps it
    if (Array.isArray((invoices as any)?.data?.data)) return (invoices as any).data.data;

    return [];
  }, [invoices]);

  const stats = useMemo(() => ({
    totalRevenue: invoiceList.reduce((sum: number, i: Invoice) => sum + getAmount(i.total), 0),
    outstanding: invoiceList.reduce((sum: number, i: Invoice) => sum + getAmount(i.amount_due), 0),
    paidCount: invoiceList.filter((i: Invoice) => getAmount(i.amount_due) <= 0).length,
    unpaidCount: invoiceList.filter((i: Invoice) => getAmount(i.amount_due) > 0).length
  }), [invoiceList]);

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenView(true);
  };

  const handleDownload = (invoice: Invoice) => {
    const url = `/api/admin/invoices/${invoice.id}/pdf?locale=${locale}`;
    window.open(url, '_blank');
  };

  const getPaymentStatus = (invoice: Invoice) => {
    const due = getAmount(invoice.amount_due);
    const paid = getAmount(invoice.amount_paid);
    if (due <= 0) return { label: t('admin.finance.invoices.status.paid'), color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (paid > 0) return { label: t('admin.finance.invoices.status.partial'), color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: t('admin.finance.invoices.status.unpaid'), color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
  };

  return (
    <AdminLayout>
      <div className="min-h-screen  bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
        {/* Decorative Background - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                <span className="truncate">{t('admin.finance.invoices.title')}</span>
              </motion.h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-2 hidden sm:block">{t('admin.finance.invoices.subtitle')}</p>
            </div>
            <Button
              onClick={() => {
                let url = `/api/admin/invoices/export/csv?locale=${locale}`;
                if (statusFilter !== 'all') url += `&status=${statusFilter}`;
                if (dateFilter !== 'all') {
                  const today = new Date();
                  let startDate = '';
                  if (dateFilter === 'today') startDate = today.toISOString().split('T')[0];
                  else if (dateFilter === 'week') startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
                  else if (dateFilter === 'month') startDate = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
                  url += `&start_date=${startDate}`;
                }
                window.location.href = url;
              }}
              className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('admin.finance.invoices.export_csv')}</span>
            </Button>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <StatCard title={t('admin.finance.invoices.stats.revenue')} value={`$${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} color="purple" index={0} />
            <StatCard title={t('admin.finance.invoices.stats.outstanding')} value={`$${stats.outstanding.toFixed(0)}`} icon={Clock} color="red" index={1} />
            <StatCard title={t('admin.finance.invoices.stats.paid')} value={stats.paidCount} icon={CheckCircle} color="emerald" index={2} />
            <StatCard title={t('admin.finance.invoices.stats.unpaid')} value={stats.unpaidCount} icon={XCircle} color="amber" index={3} />
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder={t('admin.finance.invoices.filters.search') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-background/50 border-border/50 text-foreground" />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-background/50 border border-border/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none">
                  <option value="all">{t('admin.finance.invoices.filters.all_status')}</option>
                  <option value="paid">{t('admin.finance.invoices.status.paid')}</option>
                  <option value="unpaid">{t('admin.finance.invoices.status.unpaid')}</option>
                  <option value="partial">{t('admin.finance.invoices.status.partial')}</option>
                </select>
                <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-background/50 border border-border/50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none">
                  <option value="all">{t('admin.finance.invoices.filters.all_time')}</option>
                  <option value="today">{t('admin.dashboard.period.today')}</option>
                  <option value="week">{t('admin.dashboard.period.this_week')}</option>
                  <option value="month">{t('admin.dashboard.period.this_month')}</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Desktop Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden md:block bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
          >
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10">
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.invoices.table.invoice_no')}</div>
              <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.invoices.table.customer')}</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.invoices.table.amount')}</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.invoices.table.issued_date')}</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.invoices.table.status')}</div>
              <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.finance.invoices.table.actions')}</div>
            </div>
            <div className="divide-y divide-border/30">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">{t('admin.finance.invoices.table.loading')}</div>
              ) : invoiceList.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{t('admin.finance.invoices.table.empty')}</p>
                </div>
              ) : invoiceList.map((invoice: Invoice, idx: number) => {
                const status = getPaymentStatus(invoice);
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-purple-500/5 transition-all group"
                  >
                    <div className="col-span-2 font-mono text-sm text-foreground/80 bg-secondary/50 px-2 py-1 rounded w-fit">#{invoice.invoice_number}</div>
                    <div className="col-span-3">
                      <div className="font-medium text-foreground">{invoice.order?.customer?.user?.name || t('admin.finance.invoices.na')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> #{invoice.order?.order_number}
                      </div>
                    </div>
                    <div className="col-span-2 font-bold text-foreground">
                      ${getAmount(invoice.total).toFixed(2)}
                      {getAmount(invoice.amount_paid) > 0 && <span className="text-xs font-normal text-emerald-600 block">{t('admin.finance.invoices.table.paid_amount')}: ${getAmount(invoice.amount_paid).toFixed(2)}</span>}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground font-mono">
                      {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '-'}
                    </div>
                    <div className="col-span-2">
                      <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", status.color)}>
                        {status.label}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" onClick={() => handleView(invoice)} className="h-8 w-8 p-0 hover:text-blue-500" title={t('admin.finance.invoices.modal.view_details') as string}><Eye size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(invoice)} className="h-8 w-8 p-0 hover:text-purple-500" title={t('admin.finance.invoices.modal.download_pdf') as string}><Download size={14} /></Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{t('admin.finance.invoices.table.loading')}</span>
                </div>
              </div>
            ) : invoiceList.length === 0 ? (
              <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">{t('admin.finance.invoices.table.empty')}</p>
              </div>
            ) : invoiceList.map((invoice: Invoice, idx: number) => {
              const status = getPaymentStatus(invoice);
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-mono font-semibold text-sm text-foreground">#{invoice.invoice_number}</h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {invoice.order?.customer?.user?.name || t('admin.finance.invoices.na')}
                        </p>
                      </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0", status.color)}>
                      {status.label}
                    </span>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground text-base">${getAmount(invoice.total).toFixed(2)}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleView(invoice)} className="h-8 w-8 p-0 hover:bg-blue-500/20 hover:text-blue-500">
                        <Eye size={14} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(invoice)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-500">
                        <Download size={14} />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal open={openView} onClose={() => setOpenView(false)} title={`${t('admin.finance.invoices.modal.title')} #${selectedInvoice?.invoice_number}`} size="lg">
        {selectedInvoice && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-secondary/20 p-3 sm:p-4 rounded-xl border border-border/50">
              <div>
                <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">{t('admin.finance.invoices.modal.title')}</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-1.5 sm:pb-2"><span className="text-muted-foreground">{t('admin.finance.invoices.modal.invoice_number')}:</span> <span className="text-foreground font-mono font-bold">{selectedInvoice.invoice_number}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5 sm:pb-2"><span className="text-muted-foreground">{t('admin.finance.invoices.modal.order_reference')}:</span> <span className="text-foreground">#{selectedInvoice.order?.order_number}</span></div>
                  <div className="flex justify-between pb-1.5 sm:pb-2"><span className="text-muted-foreground">{t('admin.finance.invoices.modal.date_issued')}:</span> <span className="text-foreground">{selectedInvoice.issued_at ? new Date(selectedInvoice.issued_at).toLocaleDateString() : t('admin.finance.invoices.na')}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">{t('admin.finance.invoices.modal.financials')}</h3>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-1.5 sm:pb-2"><span className="text-muted-foreground">{t('admin.finance.invoices.modal.subtotal')}:</span> <span className="text-foreground">${getAmount(selectedInvoice.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-1.5 sm:pb-2"><span className="text-muted-foreground">{t('admin.finance.invoices.modal.tax')}:</span> <span className="text-foreground">${getAmount(selectedInvoice.tax_total).toFixed(2)}</span></div>
                  <div className="flex justify-between pt-1 sm:pt-2"><span className="text-foreground font-bold text-sm sm:text-lg">{t('admin.finance.invoices.modal.total')}:</span> <span className="text-foreground font-bold text-sm sm:text-lg">${getAmount(selectedInvoice.total).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button onClick={() => handleDownload(selectedInvoice)} className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                <Download className="w-4 h-4 mr-2" /> {t('admin.finance.invoices.modal.download_pdf')}
              </Button>
              <Button variant="secondary" onClick={() => setOpenView(false)} className="flex-1 h-10 sm:h-11 text-sm">{t('admin.finance.invoices.modal.close')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
