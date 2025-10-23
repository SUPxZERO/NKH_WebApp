import React from 'react';
import { DataTable } from '../components/DataTable';
import { customerRequestsApi } from '../services/api';
import { useForm } from '../hooks/useApi';

const STATUS_COLORS = {
    open: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
};

const PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
};

export function CustomerRequests() {
    const [selectedRequest, setSelectedRequest] = React.useState(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const { submit: updateRequest, loading: updateLoading } = useForm(
        (data) => customerRequestsApi.update(selectedRequest?.id, data),
        {
            onSuccess: () => {
                setIsModalOpen(false);
                // Refresh table
            }
        }
    );

    const columns = [
        { 
            title: 'Customer',
            key: 'customer',
            render: (row) => row.customer?.name
        },
        { title: 'Subject', key: 'subject' },
        {
            title: 'Status',
            key: 'status',
            render: (row) => (
                <span className={`px-2 py-1 rounded ${STATUS_COLORS[row.status]}`}>
                    {row.status.replace('_', ' ')}
                </span>
            )
        },
        {
            title: 'Priority',
            key: 'priority',
            render: (row) => (
                <span className={`px-2 py-1 rounded ${PRIORITY_COLORS[row.priority]}`}>
                    {row.priority}
                </span>
            )
        },
        {
            title: 'Created',
            key: 'created_at',
            render: (row) => new Date(row.created_at).toLocaleDateString()
        },
        {
            title: 'Actions',
            render: (row) => (
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleViewRequest(row)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                        View
                    </button>
                </div>
            )
        }
    ];

    const handleViewRequest = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Customer Requests</h1>
            
            <DataTable
                apiFunction={customerRequestsApi.getAll}
                columns={columns}
                filters={[
                    {
                        key: 'status',
                        label: 'Status',
                        options: [
                            { value: 'open', label: 'Open' },
                            { value: 'in_progress', label: 'In Progress' },
                            { value: 'resolved', label: 'Resolved' },
                            { value: 'closed', label: 'Closed' }
                        ]
                    },
                    {
                        key: 'priority',
                        label: 'Priority',
                        options: [
                            { value: 'low', label: 'Low' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'high', label: 'High' },
                            { value: 'urgent', label: 'Urgent' }
                        ]
                    }
                ]}
            />

            {isModalOpen && selectedRequest && (
                <CustomerRequestModal
                    request={selectedRequest}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={updateRequest}
                    loading={updateLoading}
                />
            )}
        </div>
    );
}

function CustomerRequestModal({ request, onClose, onSubmit, loading }) {
    const [formData, setFormData] = React.useState({
        status: request.status,
        admin_notes: request.admin_notes || '',
        resolution: request.resolution || ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Request Details</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-600">Customer</label>
                            <p className="font-medium">{request.customer?.name}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Type</label>
                            <p className="font-medium">{request.type}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm text-gray-600">Subject</label>
                            <p className="font-medium">{request.subject}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm text-gray-600">Description</label>
                            <p className="whitespace-pre-wrap">{request.description}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        status: e.target.value 
                                    }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                >
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Admin Notes
                                </label>
                                <textarea
                                    value={formData.admin_notes}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        admin_notes: e.target.value 
                                    }))}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                />
                            </div>

                            {formData.status === 'resolved' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Resolution
                                    </label>
                                    <textarea
                                        value={formData.resolution}
                                        onChange={(e) => setFormData(prev => ({ 
                                            ...prev, 
                                            resolution: e.target.value 
                                        }))}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}