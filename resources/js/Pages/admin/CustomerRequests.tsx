import { useState, useEffect, ChangeEvent } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { router } from '@inertiajs/react';
import { customerRequestsApi, ordersApi } from '../../services/api';
import Modal from '@/Components/Modal';
import TextArea from '@/Components/TextArea';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Order {
  id: number;
  order_number: string;
  customer?: { user?: { name?: string; email?: string } | null } | null;
  customer_request?: { id: number } | null;
  total_amount: number | string;
  status: string; // e.g., 'pending', 'processing', 'completed', 'cancelled'
  approval_status: string; // 'pending', 'approved', 'rejected'
  order_type: string;
  created_at?: string;
}

export default function CustomerRequests({ orders: initialOrders = [] }: { orders?: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Sync local state when props change (from Inertia reloads)
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      // preserveState: true is CRITICAL here.
      // Without it, if the user is typing in the modal and a refresh hits, the modal closes.
      router.get(window.location.pathname + window.location.search, {}, { only: ['orders'], preserveState: true, preserveScroll: true, replace: true });
    }, 10000); // Reload every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (order: Order) => {
    try {
      setProcessing(true);
      if (order.customer_request?.id) {
        await customerRequestsApi.update(order.customer_request.id, { approval_status: 'approved' });
      } else {
        await ordersApi.approve(order.id);
      }
      router.get(window.location.pathname + window.location.search, {}, { only: ['orders'], preserveState: true, replace: true });
    } catch (error) {
      console.error('Error approving order:', error);
      // Replace alert with a more stylish notification (e.g., toast, custom modal)
      alert('Failed to approve order.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) return;

    try {
      setProcessing(true);
      if (selectedOrder.customer_request?.id) {
        await customerRequestsApi.update(selectedOrder.customer_request.id, { approval_status: 'rejected', rejection_reason: rejectionReason });
      } else {
        await ordersApi.reject(selectedOrder.id, { rejection_reason: rejectionReason });
      }
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedOrder(null);
      router.get(window.location.pathname + window.location.search, {}, { only: ['orders'], preserveState: true, replace: true });
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order.');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectionModal = (order: Order) => {
    setSelectedOrder(order);
    setShowRejectionModal(true);
  };

  // Helper for currency formatting
  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const pendingOrders = orders.filter(o => o.approval_status === 'pending');

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8 bg-[#1a1f37] min-h-screen text-gray-200"> {/* Main dark background */}
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Customer Requests</h1>
            <p className="text-sm text-gray-400 mt-2">
              Review and manage incoming order requests awaiting your approval.
            </p>
          </div>
          <div className="bg-purple-600/20 text-purple-300 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center shadow-md">
            <span className="animate-pulse mr-2 h-2 w-2 bg-purple-400 rounded-full"></span>
            {pendingOrders.length} Pending Request{pendingOrders.length !== 1 && 's'}
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-gray-900/60 shadow-lg rounded-xl border border-gray-700 overflow-hidden">
          {pendingOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-zinc-700">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Order Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/60 divide-y divide-zinc-800">
                {pendingOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-700/50 transition-colors duration-200">
                    {/* Order Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">#{order.order_number}</span>
                        <span className="text-xs text-gray-400 mt-0.5">ID: {order.id}</span>
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-9 w-9 rounded-full bg-purple-800/40 flex items-center justify-center text-purple-300 font-bold text-sm mr-3 flex-shrink-0">
                          {(order.customer?.user?.name ?? 'Guest').charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{order.customer?.user?.name ?? 'Guest'}</div>
                          <div className="text-xs text-gray-400">{order.customer?.user?.email ?? 'N/A'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-indigo-700/30 text-indigo-300 capitalize">
                        {order.order_type}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-white">{formatCurrency(order.total_amount)}</div>
                      <div className="text-xs text-yellow-500 flex items-center mt-1">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5"></span>
                        Awaiting Approval
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => handleApprove(order)}
                          disabled={processing}
                          className="text-green-400 hover:text-green-300 bg-green-900/40 hover:bg-green-800/60 p-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                          title="Approve Order"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => openRejectionModal(order)}
                          disabled={processing}
                          className="text-red-400 hover:text-red-300 bg-red-900/40 hover:bg-red-800/60 p-2.5 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                          title="Reject Order"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 group-hover:scale-110 transition-transform">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Empty State
            <div className="text-center py-16 text-gray-400">
              <div className="mx-auto h-16 w-16 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">No pending requests</h3>
              <p className="mt-2 text-sm text-gray-500">All customer orders have been processed and approved.</p>
            </div>
          )}
        </div>

        {/* Rejection Modal */}
        <Modal show={showRejectionModal} onClose={() => setShowRejectionModal(false)} maxWidth="lg">
          <div className="p-6 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold text-white">Reject Order</h2>
              <button onClick={() => setShowRejectionModal(false)} className="text-gray-400 hover:text-gray-200 transition-colors">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              You are about to reject order <span className="font-medium text-purple-300">#{selectedOrder?.order_number}</span>. 
              Please provide a clear and concise reason for the customer.
            </p>

            <TextArea
              className="w-full min-h-[140px] bg-zinc-700 border-zinc-600 text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500 rounded-md shadow-sm resize-y"
              placeholder="e.g., Insufficient stock, payment issue, unable to fulfill this custom request at this time..."
              value={rejectionReason}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
            />

            <div className="mt-7 flex justify-end space-x-3">
              <SecondaryButton
                onClick={() => setShowRejectionModal(false)}
                className="bg-zinc-700 hover:bg-zinc-600 text-gray-300 border-none px-5 py-2.5 rounded-lg"
              >
                Cancel
              </SecondaryButton>
              <DangerButton
                disabled={processing || !rejectionReason.trim()}
                onClick={handleReject}
                className={`bg-red-700 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg transition-all duration-200 
                            ${processing || !rejectionReason.trim() ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'}`}
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </DangerButton>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}