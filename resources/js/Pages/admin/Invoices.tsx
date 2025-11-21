import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  DollarSign, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  CreditCard,
  MapPin,
  User
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Invoice, Order, Location } from '@/app/types/domain';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Invoices() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [openView, setOpenView] = React.useState(false);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // --- HELPER: Safe Number Parsing ---
  // This fixes the "Cannot read properties of null (reading 'toString')" error
  const getAmount = (value: any): number => {
    if (value === null || value === undefined) return 0;
    return parseFloat(String(value));
  };

  // Fetch invoices
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['admin/invoices', page, search, statusFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/invoices?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        
        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            url += `&start_date=${startDate}&end_date=${startDate}`;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${weekAgo.toISOString().split('T')[0]}`;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            url += `&start_date=${monthAgo.toISOString().split('T')[0]}`;
            break;
        }
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch locations for filtering
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations')
  }) as { data: any };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenView(true);
  };

  const handleDownload = (invoice: Invoice) => {
    try {
      const doc = new jsPDF();

      const number = invoice.invoice_number || String(invoice.id || 'unknown');
      const issuedDate = invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'N/A';
      const statusText = getPaymentStatusText(invoice);

      doc.setFontSize(18);
      doc.text(`Invoice #${number}`, 14, 16);

      doc.setFontSize(11);
      doc.text(`Date: ${issuedDate}`, 14, 24);
      doc.text(`Status: ${statusText}`, 14, 30);

      doc.setFontSize(13);
      doc.text('Customer Details', 14, 40);
      doc.setFontSize(11);
      const customerName = invoice.order?.customer?.user?.name || 'Guest';
      const customerEmail = invoice.order?.customer?.user?.email || 'N/A';
      doc.text(`Name: ${customerName}`, 14, 48);
      doc.text(`Email: ${customerEmail}`, 14, 54);

      const items = invoice.order?.items || [];
      const tableBody = items.map((item: any) => {
        const qty = getAmount(item?.quantity);
        const total = getAmount(item?.total_price);
        const unit = qty > 0 ? total / qty : 0;
        return [
          item?.menu_item?.name || 'Item',
          String(qty),
          `$${getAmount(unit).toFixed(2)}`,
          `$${getAmount(total).toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: 64,
        head: [['Item Name', 'Quantity', 'Price', 'Total']],
        body: tableBody,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [52, 58, 64] }
      });


      const finalY = (doc as any).lastAutoTable?.finalY || 64;

      doc.setFontSize(13);
      doc.text('Summary', 14, finalY + 10);
      doc.setFontSize(11);

      const sSubtotal = getAmount(invoice.subtotal);
      const sTax = getAmount(invoice.tax_total);
      const sDiscount = getAmount(invoice.discount_total);
      const sTotal = getAmount(invoice.total);

      const pageWidth = (doc as any).internal?.pageSize?.getWidth ? (doc as any).internal.pageSize.getWidth() : 210;
      const rightX = pageWidth - 14;
      const labelX = rightX - 60;

      doc.text('Subtotal:', labelX, finalY + 18, { align: 'left' });
      doc.text(`$${sSubtotal.toFixed(2)}`, rightX, finalY + 18, { align: 'right' });

      doc.text('Tax:', labelX, finalY + 24, { align: 'left' });
      doc.text(`$${sTax.toFixed(2)}`, rightX, finalY + 24, { align: 'right' });

      doc.text('Discount:', labelX, finalY + 30, { align: 'left' });
      doc.text(`-$${sDiscount.toFixed(2)}`, rightX, finalY + 30, { align: 'right' });

      doc.setFontSize(12);
      doc.text('Grand Total:', labelX, finalY + 38, { align: 'left' });
      doc.text(`$${sTotal.toFixed(2)}`, rightX, finalY + 38, { align: 'right' });

      doc.save(`invoice_${number}.pdf`);
      toastSuccess(`Invoice ${number} download started`);
    } catch (e) {
      toastError('Failed to generate PDF. Please ensure dependencies are installed.');
    }
  };

  const getPaymentStatusColor = (invoice: Invoice) => {
    const due = getAmount(invoice.amount_due);
    const paid = getAmount(invoice.amount_paid);

    if (due <= 0) {
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    } else if (paid > 0) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    } else {
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    }
  };

  const getPaymentStatusText = (invoice: Invoice) => {
    const due = getAmount(invoice.amount_due);
    const paid = getAmount(invoice.amount_paid);

    if (due <= 0) {
      return 'Paid';
    } else if (paid > 0) {
      return 'Partial';
    } else {
      return 'Unpaid';
    }
  };

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
                Invoices Management
              </h1>
              <p className="text-gray-400 mt-1">Manage billing and payment processing</p>
            </div>

            {/* Summary Cards - UPDATED WITH SAFE GETAMOUNT */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Revenue</div>
                <div className="text-xl font-bold text-white">
                  ${invoices?.data?.reduce((sum: number, inv: Invoice) => sum + getAmount(inv.total), 0).toFixed(2) || '0.00'}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Outstanding</div>
                <div className="text-xl font-bold text-red-400">
                  ${invoices?.data?.reduce((sum: number, inv: Invoice) => sum + getAmount(inv.amount_due), 0).toFixed(2) || '0.00'}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Status</option>
            <option value="paid" className='text-black'>Paid</option>
            <option value="unpaid" className='text-black'>Unpaid</option>
            <option value="partial" className='text-black'>Partially Paid</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Time</option>
            <option value="today" className='text-black'>Today</option>
            <option value="week" className='text-black'>This Week</option>
            <option value="month" className='text-black'>This Month</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Invoices Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md p-5">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            invoices?.data?.map((invoice: Invoice, index: number) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">#{invoice.invoice_number}</h3>
                        <p className="text-sm text-gray-400">
                          Order #{invoice.order?.order_number}
                        </p>
                      </div>
                      <Badge className={getPaymentStatusColor(invoice)}>
                        {getPaymentStatusText(invoice)}
                      </Badge>
                    </div>

                    {/* Invoice Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="text-white font-semibold">${getAmount(invoice.total).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Amount Paid:</span>
                        <span className="text-green-400">${getAmount(invoice.amount_paid).toFixed(2)}</span>
                      </div>

                      {getAmount(invoice.amount_due) > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Amount Due:</span>
                          <span className="text-red-400">${getAmount(invoice.amount_due).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        Issued: {invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'Not issued'}
                      </div>

                      {invoice.order?.customer && (
                        <div className="flex items-center text-sm text-gray-300">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {invoice.order.customer.user?.name || 'Guest Customer'}
                        </div>
                      )}

                      {invoice.location && (
                        <div className="flex items-center text-sm text-gray-300">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {invoice.location.name}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(invoice)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDownload(invoice)}
                        className="border-white/20 hover:bg-white/10"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {invoices?.meta && (
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
              Page {page} of {invoices?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === invoices?.meta?.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedInvoice(null);
        }}
        title={`Invoice #${selectedInvoice?.invoice_number}`}
        size="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Invoice Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Invoice Number:</span>
                    <span className="text-white font-mono">{selectedInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Order Number:</span>
                    <span className="text-white font-mono">#{selectedInvoice.order?.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getPaymentStatusColor(selectedInvoice)}>
                      {getPaymentStatusText(selectedInvoice)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Issued Date:</span>
                    <span className="text-white">
                      {selectedInvoice.issued_at ? new Date(selectedInvoice.issued_at).toLocaleDateString() : 'Not issued'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{selectedInvoice.order?.customer?.user?.name || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedInvoice.order?.customer?.user?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{selectedInvoice.location?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Financial Breakdown</h3>
              <div className="bg-white/5 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">${getAmount(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax:</span>
                  <span className="text-white">${getAmount(selectedInvoice.tax_total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Service Charge:</span>
                  <span className="text-white">${getAmount(selectedInvoice.service_charge).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Discount:</span>
                  <span className="text-red-400">-${getAmount(selectedInvoice.discount_total).toFixed(2)}</span>
                </div>
                <hr className="border-white/10" />
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-white">Total:</span>
                  <span className="text-white">${getAmount(selectedInvoice.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="text-green-400">${getAmount(selectedInvoice.amount_paid).toFixed(2)}</span>
                </div>
                {getAmount(selectedInvoice.amount_due) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount Due:</span>
                    <span className="text-red-400">${getAmount(selectedInvoice.amount_due).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
              <div className="space-y-2">
                {selectedInvoice.order?.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{item.menu_item?.name}</span>
                      <span className="text-gray-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-white">${getAmount(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment History */}
            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
                <div className="space-y-2">
                  {selectedInvoice.payments.map((payment: any) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">${getAmount(payment.amount).toFixed(2)}</span>
                        <span className="text-gray-400 ml-2">
                          {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                        </span>
                      </div>
                      <Badge className={
                        payment.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }>
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                onClick={() => handleDownload(selectedInvoice)}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedInvoice(null);
                }}
                className="border-white/20 hover:bg-white/10"
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