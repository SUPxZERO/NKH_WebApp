import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useLanguage } from '@/app/context/LanguageContext';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Briefcase,
    User,
    ArrowRight,
    MapPin,
    AlertCircle
} from 'lucide-react';

interface ShiftSwap {
    id: number;
    shift_id: number;
    requester_id: number;
    recipient_id: number | null;
    type: 'give_away' | 'trade';
    status: 'pending' | 'accepted_by_peer' | 'approved' | 'denied' | 'cancelled';
    reason: string | null;
    created_at: string;
    shift: {
        id: number;
        date: string;
        start_time: string;
        end_time: string;
        position: { name: string };
        location: { name: string };
    };
    requester: {
        id: number;
        user: { name: string };
    };
    recipient?: {
        id: number;
        user: { name: string };
    } | null;
}

export default function ManagerShiftApprovals() {
    const { t } = useLanguage();
    const qc = useQueryClient();
    const [denyModalOpen, setDenyModalOpen] = useState(false);
    const [selectedSwapId, setSelectedSwapId] = useState<number | null>(null);
    const [denialReason, setDenialReason] = useState('');

    const { data: pendingSwaps, isLoading } = useQuery<{ data: ShiftSwap[] }>({
        queryKey: ['shift-swaps.pending'],
        queryFn: () => apiGet('/admin/shift-swaps/pending'),
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiPut(`/admin/shift-swaps/${id}/approve`, {}),
        onSuccess: () => {
            toastSuccess('Shift swap approved successfully');
            qc.invalidateQueries({ queryKey: ['shift-swaps.pending'] });
        },
        onError: (error: any) => {
            toastError(error?.response?.data?.message || 'Failed to approve swap');
        }
    });

    const denyMutation = useMutation({
        mutationFn: (data: { id: number; reason: string }) =>
            apiPut(`/admin/shift-swaps/${data.id}/deny`, { denial_reason: data.reason }),
        onSuccess: () => {
            toastSuccess('Shift swap denied successfully');
            qc.invalidateQueries({ queryKey: ['shift-swaps.pending'] });
            setDenyModalOpen(false);
            setDenialReason('');
            setSelectedSwapId(null);
        },
        onError: (error: any) => {
            toastError(error?.response?.data?.message || 'Failed to deny swap');
        }
    });

    const handleApprove = (id: number) => {
        if (confirm('Are you sure you want to approve this shift swap?')) {
            approveMutation.mutate(id);
        }
    };

    const handleDenyClick = (id: number) => {
        setSelectedSwapId(id);
        setDenyModalOpen(true);
    };

    const handleDenySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSwapId) {
            denyMutation.mutate({ id: selectedSwapId, reason: denialReason });
        }
    };

    return (
        <AdminLayout>
            <Head title="Shift Swap Approvals" />

            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 text-foreground overflow-x-hidden space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('admin.hr.shifts.title')}</h1>
                        <p className="text-muted-foreground text-gray-400">
                            {t('admin.hr.shifts.subtitle')}
                        </p>
                    </div>
                </div>

                <Card className="bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            {t('admin.hr.shifts.stats.pending')}
                            {pendingSwaps?.data && pendingSwaps.data.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    {pendingSwaps.data.length}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                            </div>
                        ) : pendingSwaps?.data && pendingSwaps.data.length > 0 ? (
                            <div className="space-y-4">
                                {pendingSwaps.data.map((swap) => (
                                    <div key={swap.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={
                                                        swap.type === 'give_away'
                                                            ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300'
                                                            : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                                                    }>
                                                        {swap.type === 'give_away' ? t('admin.hr.shifts.types.give_away') : t('admin.hr.shifts.types.trade')}
                                                    </Badge>
                                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {t('admin.hr.shifts.table.requested_on')} {new Date(swap.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                                                {/* Shift Details */}
                                                <div>
                                                    <h4 className="font-semibold text-lg">
                                                        {new Date(swap.shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </h4>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            {swap.shift.start_time} - {swap.shift.end_time}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Briefcase className="w-4 h-4" />
                                                            {swap.shift.position.name}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {swap.shift.location.name}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Swap Flow */}
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                                                            {swap.requester.user.name.charAt(0)}
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="font-medium text-red-900 dark:text-red-200">From</div>
                                                            <div className="text-gray-600 dark:text-gray-400">{swap.requester.user.name}</div>
                                                        </div>
                                                    </div>

                                                    <ArrowRight className="w-5 h-5 text-gray-400" />

                                                    <div className="flex items-center gap-2 min-w-[120px]">
                                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                                            {swap.recipient?.user.name.charAt(0) || '?'}
                                                        </div>
                                                        <div className="text-sm">
                                                            <div className="font-medium text-green-900 dark:text-green-200">To</div>
                                                            <div className="text-gray-600 dark:text-gray-400">{swap.recipient?.user.name || 'Unknown'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {swap.reason && (
                                                <div className="bg-white dark:bg-gray-800 p-3 rounded text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100 mr-2">{t('admin.hr.shifts.table.reason')}:</span>
                                                    {swap.reason}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col justify-center gap-2 min-w-[140px]">
                                            <Button
                                                variant="success"
                                                className="w-full bg-green-600 hover:bg-green-700"
                                                onClick={() => handleApprove(swap.id)}
                                                disabled={approveMutation.isPending}
                                                leftIcon={approveMutation.isPending ? undefined : <CheckCircle className="w-4 h-4" />}
                                            >
                                                {approveMutation.isPending ? 'Approving...' : t('admin.hr.shifts.actions.approve')}
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                className="w-full"
                                                onClick={() => handleDenyClick(swap.id)}
                                                disabled={denyMutation.isPending}
                                                leftIcon={<XCircle className="w-4 h-4" />}
                                            >
                                                {t('admin.hr.shifts.actions.reject')}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">All caught up!</h3>
                                <p className="mt-1">No pending shift swap requests to review.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Modal
                isOpen={denyModalOpen}
                onClose={() => setDenyModalOpen(false)}
                title={t('admin.hr.shifts.actions.reject')}
            >
                <form onSubmit={handleDenySubmit} className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                            Denying this request will notify both employees and return the shift to the original owner.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('admin.hr.shifts.actions.rejection_reason')} (Optional)</label>
                        <Input
                            value={denialReason}
                            onChange={(e) => setDenialReason(e.target.value)}
                            placeholder="e.g., Staffing requirements not met, seniority issues..."
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setDenyModalOpen(false)}
                        >
                            {t('admin.inventory.adjustments.form.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={denyMutation.isPending}
                        >
                            {denyMutation.isPending ? 'Denying...' : t('admin.hr.shifts.actions.reject')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
