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

// Enhanced StatCard
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
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Invoices() {
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
    // Open the backend PDF route in a new tab/window which triggers download
    const url = `/api/admin/invoices/${invoice.id}/pdf`;
    window.open(url, '_blank');
  };

  const getPaymentStatus = (invoice: Invoice) => {
    const due = getAmount(invoice.amount_due);
    const paid = getAmount(invoice.amount_paid);
    if (due <= 0) return { label: 'Paid', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (paid > 0) return { label: 'Partial', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Unpaid', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' };
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6 transition-colors relative overflow-hidden">
        {/* Decorative Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"
              >
                <FileText className="w-8 h-8 text-purple-600" />
                Invoices
              </motion.h1>
              <p className="text-muted-foreground mt-2">Manage customer billing, payments, and history</p>
            </div>
            <Button
              onClick={() => {
                let url = `/api/admin/invoices/export/csv?`;
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
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* Stats Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="purple" index={0} />
            <StatCard title="Outstanding" value={`$${stats.outstanding.toFixed(2)}`} icon={Clock} color="red" index={1} />
            <StatCard title="Paid Invoices" value={stats.paidCount} icon={CheckCircle} color="emerald" index={2} />
            <StatCard title="Unpaid Invoices" value={stats.unpaidCount} icon={XCircle} color="amber" index={3} />
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
          >
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search invoices by number or customer..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50 border-border/50 focus:border-purple-500 text-foreground" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
          >
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10">
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Invoice #</div>
              <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Customer</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Amount</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Issued Date</div>
              <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
              <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
            </div>
            <div className="divide-y divide-border/30">
              {isLoading ? (
                <div className="p-12 text-center text-muted-foreground">Loading...</div>
              ) : invoiceList.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No invoices found</p>
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
                      <div className="font-medium text-foreground">{invoice.order?.customer?.user?.name || 'Guest'}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Order #{invoice.order?.order_number}
                      </div>
                    </div>
                    <div className="col-span-2 font-bold text-foreground">
                      ${getAmount(invoice.total).toFixed(2)}
                      {getAmount(invoice.amount_paid) > 0 && <span className="text-xs font-normal text-emerald-600 block">Paid: ${getAmount(invoice.amount_paid).toFixed(2)}</span>}
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
                      <Button size="sm" variant="ghost" onClick={() => handleView(invoice)} className="h-8 w-8 p-0 hover:text-blue-500" title="View Details"><Eye size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(invoice)} className="h-8 w-8 p-0 hover:text-purple-500" title="Download PDF"><Download size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(`/api/admin/invoices/${invoice.id}/csv`, '_blank')} className="h-8 w-8 p-0 hover:text-green-500" title="Download CSV"><FileText size={14} /></Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      <Modal open={openView} onClose={() => setOpenView(false)} title={`Invoice #${selectedInvoice?.invoice_number}`} size="lg">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6 bg-secondary/20 p-4 rounded-xl border border-border/50">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-2"><span className="text-muted-foreground">Invoice Number:</span> <span className="text-foreground font-mono font-bold">{selectedInvoice.invoice_number}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-2"><span className="text-muted-foreground">Order Reference:</span> <span className="text-foreground">#{selectedInvoice.order?.order_number}</span></div>
                  <div className="flex justify-between pb-2"><span className="text-muted-foreground">Date Issued:</span> <span className="text-foreground">{selectedInvoice.issued_at ? new Date(selectedInvoice.issued_at).toLocaleDateString() : 'N/A'}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Financials</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-border/30 pb-2"><span className="text-muted-foreground">Subtotal:</span> <span className="text-foreground">${getAmount(selectedInvoice.subtotal).toFixed(2)}</span></div>
                  <div className="flex justify-between border-b border-border/30 pb-2"><span className="text-muted-foreground">Tax:</span> <span className="text-foreground">${getAmount(selectedInvoice.tax_total).toFixed(2)}</span></div>
                  <div className="flex justify-between pt-2"><span className="text-foreground font-bold text-lg">Total:</span> <span className="text-foreground font-bold text-lg">${getAmount(selectedInvoice.total).toFixed(2)}</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => handleDownload(selectedInvoice)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
              <Button variant="secondary" onClick={() => setOpenView(false)} className="flex-1">Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
