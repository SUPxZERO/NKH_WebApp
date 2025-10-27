import { useState, useEffect } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import TextArea from '@/Components/TextArea';
import DangerButton from '@/Components/DangerButton';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Order {
  id: number;
  order_number: string;
  customer: {
    user: {
      name: string;
      email: string;
    };
  };
  total_amount: number;
  status: string;
  approval_status: string;
  order_type: string;
}

export default function CustomerRequests({ orders: initialOrders = [] }: { orders?: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ only: ['orders'] });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (orderId: number) => {
    try {
      setProcessing(true);
      await router.patch(`/api/admin/orders/${orderId}/approve`, {});
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedOrder || !rejectionReason.trim()) return;

    try {
      setProcessing(true);
      await router.patch(`/api/admin/orders/${selectedOrder.id}/reject`, {
        rejection_reason: rejectionReason
      });
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error rejecting order:', error);
      alert('Failed to reject order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectionModal = (order: Order) => {
    setSelectedOrder(order);
    setShowRejectionModal(true);
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-4">Manage Customer Requests</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order Number</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {orders.filter(o => o.approval_status === 'pending').map(order => (
              <tr key={order.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{order.order_number}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div>
                    <div className="text-gray-900">{order.customer.user.name}</div>
                    <div className="text-gray-600 text-xs">{order.customer.user.email}</div>
                  </div>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm capitalize">
                  {order.order_type}
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">${order.total_amount.toFixed(2)}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <PrimaryButton
                    onClick={() => handleApprove(order.id)}
                    disabled={processing}
                    className="mr-2"
                  >
                    Approve
                  </PrimaryButton>
                  <DangerButton
                    onClick={() => openRejectionModal(order)}
                    disabled={processing}
                  >
                    Reject
                  </DangerButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showRejectionModal} onClose={() => setShowRejectionModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Reject Order Request</h2>
          <TextArea
            className="w-full"
            placeholder="Please provide a reason for rejection"
            value={rejectionReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectionReason(e.target.value)}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <SecondaryButton onClick={() => setShowRejectionModal(false)}>
              Cancel
            </SecondaryButton>
            <DangerButton
              disabled={processing || !rejectionReason.trim()}
              onClick={handleReject}
            >
              Reject Order
            </DangerButton>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
