import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/app/layouts/AdminLayout';
import {
    useAdminPaymentMethods,
    useTogglePaymentMethod,
    useUpdatePaymentMethod,
    usePaymentMethodAuditLogs,
    AdminPaymentMethod,
    UpdatePaymentMethodPayload
} from '@/app/hooks/usePaymentMethods';
import { Button } from '@/app/components/ui/Button';
import { Card } from '@/app/components/ui/Card';
import { Badge } from '@/app/components/ui/Badge';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import PaymentMethodForm from '@/app/components/admin/payment-methods/PaymentMethodForm';
import PaymentMethodAuditViewer from '@/app/components/admin/payment-methods/PaymentMethodAuditViewer';
import {
    CreditCard,
    Settings,
    History,
    Search,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Activity
} from 'lucide-react';
import { cn } from '@/app/utils/cn';

export default function PaymentMethodManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<{ is_active?: boolean }>({});

    // Data Fetching
    const { data: paymentMethods, isLoading } = useAdminPaymentMethods(filters);
    const toggleMutation = useTogglePaymentMethod();
    const updateMutation = useUpdatePaymentMethod();

    // Modal State
    const [editingMethod, setEditingMethod] = useState<AdminPaymentMethod | null>(null);
    const [viewingHistoryMethod, setViewingHistoryMethod] = useState<AdminPaymentMethod | null>(null);

    // Audit Logs Query (only enabled when viewingHistoryMethod is set)
    const { data: auditLogs, isLoading: isLoadingLogs } = usePaymentMethodAuditLogs(viewingHistoryMethod?.id || null);

    // Handlers
    const handleToggle = async (method: AdminPaymentMethod) => {
        if (!method.can_be_disabled && method.is_active) {
            // Usually the backend prevents this, but good to show UI feedback or just let backend error handle it
            // Ideally we show a toast here. For now rely on button logic.
            return;
        }
        try {
            await toggleMutation.mutateAsync(method.id);
        } catch (error) {
            console.error('Failed to toggle payment method', error);
        }
    };

    const handleUpdate = async (data: UpdatePaymentMethodPayload) => {
        if (!editingMethod) return;
        try {
            await updateMutation.mutateAsync({ id: editingMethod.id, data });
            setEditingMethod(null);
        } catch (error) {
            console.error('Failed to update payment method', error);
        }
    };

    // Derived State
    const filteredMethods = paymentMethods?.filter(method =>
        method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        method.type.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <AdminLayout>
            <Head title="Payment Methods" />

            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Payment Methods</h1>
                        <p className="text-muted-foreground mt-1">
                            Configure payment options, processing fees, and availability.
                        </p>
                    </div>
                </div>

                {/* Filters & Controls */}
                <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-card/50 backdrop-blur-sm">
                    <div className="w-full md:w-96 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search payment methods..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button
                            variant={filters.is_active === undefined ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({})}
                            className="flex-1 md:flex-none"
                        >
                            All
                        </Button>
                        <Button
                            variant={filters.is_active === true ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({ is_active: true })}
                            className="flex-1 md:flex-none"
                        >
                            Active Only
                        </Button>
                        <Button
                            variant={filters.is_active === false ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setFilters({ is_active: false })}
                            className="flex-1 md:flex-none"
                        >
                            Inactive Only
                        </Button>
                    </div>
                </Card>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredMethods.map((method) => (
                            <Card
                                key={method.id}
                                className={cn(
                                    "p-5 transition-all duration-200 border-l-4",
                                    method.is_active ? "border-l-success" : "border-l-muted-foreground/30 opacity-75 hover:opacity-100"
                                )}
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-6 items-start md:items-center">

                                    {/* Info Section */}
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-xl flex items-center justify-center shadow-sm",
                                            method.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                        )}>
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg">{method.name}</h3>
                                                {!method.is_active && (
                                                    <Badge variant="outline" className="text-muted-foreground text-xs">Disabled</Badge>
                                                )}
                                                {method.is_active && (
                                                    <Badge variant="success" className="text-xs">Active</Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">{method.code}</span>
                                                <span>•</span>
                                                <span className="capitalize">{method.type.replace('_', ' ')}</span>
                                                {method.processing_fee > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-warning font-medium">
                                                            {method.processing_fee}% Fee
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                            {method.description && (
                                                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                                                    {method.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions Section */}
                                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">

                                        {/* Toggle Switch Logic */}
                                        <div className="flex items-center mr-2">
                                            {method.is_active ? (
                                                method.can_be_disabled ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleToggle(method)}
                                                        disabled={toggleMutation.isPending}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Disable
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic px-3 flex items-center gap-1">
                                                        <Activity className="h-3 w-3" /> Required
                                                    </span>
                                                )
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-success hover:text-success hover:bg-success/10"
                                                    onClick={() => handleToggle(method)}
                                                    disabled={toggleMutation.isPending}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                                    Enable
                                                </Button>
                                            )}
                                        </div>

                                        <div className="h-8 w-[1px] bg-border mx-1 hidden md:block"></div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setViewingHistoryMethod(method)}
                                            title="View Audit History"
                                        >
                                            <History className="h-4 w-4 md:mr-2" />
                                            <span className="hidden md:inline">History</span>
                                        </Button>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setEditingMethod(method)}
                                        >
                                            <Settings className="h-4 w-4 md:mr-2" />
                                            <span className="hidden md:inline">Configure</span>
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {filteredMethods.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-medium">No payment methods found</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit Modal */}
                <Modal
                    isOpen={!!editingMethod}
                    onClose={() => setEditingMethod(null)}
                    title={`Configure ${editingMethod?.name}`}
                    size="lg"
                >
                    {editingMethod && (
                        <PaymentMethodForm
                            paymentMethod={editingMethod}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditingMethod(null)}
                            isSubmitting={updateMutation.isPending}
                        />
                    )}
                </Modal>

                {/* History Modal */}
                <Modal
                    isOpen={!!viewingHistoryMethod}
                    onClose={() => setViewingHistoryMethod(null)}
                    title={`History: ${viewingHistoryMethod?.name}`}
                    size="lg"
                >
                    <PaymentMethodAuditViewer
                        logs={auditLogs || []}
                        isLoading={isLoadingLogs}
                    />
                    <div className="mt-6 flex justify-end">
                        <Button variant="outline" onClick={() => setViewingHistoryMethod(null)}>
                            Close
                        </Button>
                    </div>
                </Modal>

            </div>
        </AdminLayout>
    );
}
