import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiPost, apiDelete } from '@/app/libs/apiClient';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import {
    DollarSign,
    Plus,
    Trash2,
    Eye,
    Download,
    CheckCircle,
    AlertCircle,
    Users,
    Calendar,
    Wallet,
    CreditCard,
    TrendingDown,
    TrendingUp,
    Search
} from 'lucide-react';
import { Modal } from '@/app/components/ui/Modal';

interface PayrollRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    period_start: string;
    period_end: string;
    base_pay: number;
    overtime_pay: number;
    bonuses: number;
    gross_pay: number;
    deductions: number;
    taxes: number;
    net_pay: number;
    status: 'draft' | 'approved' | 'paid';
    paid_at?: string;
}

interface PayrollDetail {
    id: number;
    type: 'earning' | 'deduction';
    category: string;
    amount: number;
    percentage?: number;
}

// Enhanced StatCard
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
        rose: { gradient: 'from-rose-500/20 to-red-500/10', iconBg: 'bg-gradient-to-br from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' },
        amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
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

export default function PayrollManagement() {
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().split('T')[0].substring(0, 7)
    );
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [viewingPayrollId, setViewingPayrollId] = useState<number | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddDetailModal, setShowAddDetailModal] = useState(false);
    const [editingPayrollId, setEditingPayrollId] = useState<number | null>(null);
    const [newDetail, setNewDetail] = useState({
        type: 'earning',
        category: 'bonus',
        amount: 0,
        percentage: 0,
    });

    const qc = useQueryClient();

    // Fetch employees
    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/admin/employees'),
    });

    // Fetch payroll records for month
    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ['payroll.management', selectedMonth, selectedEmployees],
        queryFn: () =>
            apiGet('/api/admin/payroll/history', {
                params: {
                    month: selectedMonth,
                    employee_ids: selectedEmployees.length > 0 ? selectedEmployees : undefined,
                    per_page: 100,
                },
            }),
    });

    // Fetch payroll details
    const { data: detailsData } = useQuery({
        queryKey: ['payroll.details', viewingPayrollId],
        queryFn: () => apiGet(`/api/admin/payroll/${viewingPayrollId}/details`),
        enabled: !!viewingPayrollId,
    });

    // Generate payroll mutation
    const generateMutation = useMutation({
        mutationFn: (employeeIds: number[]) =>
            apiPost('/api/admin/payroll/generate', {
                employee_ids: employeeIds.length > 0 ? employeeIds : undefined,
                month: selectedMonth,
                include_overtime: true,
            }),
        onSuccess: () => {
            toastSuccess('Payroll generated successfully');
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to generate payroll');
        },
    });

    // Finalize payroll mutation
    const finalizeMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`/api/admin/payroll/${payrollId}/finalize`, {}),
        onSuccess: () => {
            toastSuccess('Payroll finalized successfully');
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to finalize payroll');
        },
    });

    // Add detail mutation
    const addDetailMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`/api/admin/payroll/${payrollId}/add-detail`, newDetail),
        onSuccess: () => {
            toastSuccess('Detail added successfully');
            setNewDetail({ type: 'earning', category: 'bonus', amount: 0, percentage: 0 });
            setShowAddDetailModal(false);
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
            qc.invalidateQueries({ queryKey: ['payroll.management'] }); // Update globals
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to add detail');
        },
    });

    // Remove detail mutation
    const removeDetailMutation = useMutation({
        mutationFn: (detailId: number) =>
            apiDelete(`/api/admin/payroll-details/${detailId}`),
        onSuccess: () => {
            toastSuccess('Detail removed successfully');
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
            qc.invalidateQueries({ queryKey: ['payroll.management'] }); // Update globals
        },
        onError: (error: any) => {
            toastError('Failed to remove detail');
        },
    });

    const handleSelectAllEmployees = (checked: boolean) => {
        if (checked) {
            setSelectedEmployees((employees as any)?.data?.map((e: any) => e.id) || []);
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (employeeId: number, checked: boolean) => {
        if (checked) {
            setSelectedEmployees([...selectedEmployees, employeeId]);
        } else {
            setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
        }
    };

    const handleExportPayroll = async () => {
        try {
            const data = (payrollData as any)?.data || [];
            if (!data.length) return;
            const csv = [
                ['Employee', 'Period', 'Base Pay', 'Overtime', 'Bonuses', 'Gross Pay', 'Deductions', 'Taxes', 'Net Pay', 'Status'].join(','),
                ...data.map((record: PayrollRecord) =>
                    [
                        record.employee_name,
                        `${record.period_start} to ${record.period_end}`,
                        record.base_pay.toFixed(2),
                        record.overtime_pay.toFixed(2),
                        record.bonuses.toFixed(2),
                        record.gross_pay.toFixed(2),
                        record.deductions.toFixed(2),
                        record.taxes.toFixed(2),
                        record.net_pay.toFixed(2),
                        record.status,
                    ].join(',')
                ),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll_${selectedMonth}.csv`;
            a.click();
            toastSuccess('Payroll exported successfully');
        } catch (error) {
            toastError('Failed to export payroll');
        }
    };

    const totalGross = (payrollData as any)?.data?.reduce((sum: number, r: PayrollRecord) => sum + r.gross_pay, 0) || 0;
    const totalNet = (payrollData as any)?.data?.reduce((sum: number, r: PayrollRecord) => sum + r.net_pay, 0) || 0;
    const totalDeductions = totalGross - totalNet;
    const employeeCount = (payrollData as any)?.data?.length || 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'approved': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
    };

    return (
        <AdminLayout>
            <Head title="Payroll Management" />
            <div className="min-h-screen bg-background p-6 transition-colors relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-3"
                            >
                                <DollarSign className="w-8 h-8 text-blue-600" />
                                Payroll Management
                            </motion.h1>
                            <p className="text-muted-foreground mt-2">Manage employee compensation, bonuses, and deductions</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleExportPayroll}
                                disabled={!(payrollData as any)?.data?.length}
                                variant="outline"
                                className="bg-background/50 backdrop-blur-sm border-border"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Total Employees" value={employeeCount} icon={Users} color="blue" index={0} />
                        <StatCard title="Gross Pay" value={`$${totalGross.toFixed(2)}`} icon={Wallet} color="emerald" index={1} />
                        <StatCard title="Total Net Pay" value={`$${totalNet.toFixed(2)}`} icon={CreditCard} color="amber" index={2} />
                        <StatCard title="Total Deductions" value={`$${totalDeductions.toFixed(2)}`} icon={TrendingDown} color="rose" index={3} />
                    </div>

                    {/* Control Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-1/4 space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payroll Period</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Employee Selection</label>
                                <div className="relative group">
                                    <div className="absolute inset-x-0 top-10 z-20 hidden group-hover:block pt-2">
                                        <div className="bg-card border border-border rounded-xl shadow-xl p-3 max-h-48 overflow-y-auto">
                                            <label className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer font-medium mb-1 border-b border-border/50">
                                                <input type="checkbox"
                                                    checked={selectedEmployees.length === (employees as any)?.data?.length}
                                                    onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                Select All
                                            </label>
                                            {(employees as any)?.data?.map((employee: any) => (
                                                <label key={employee.id} className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer text-sm">
                                                    <input type="checkbox"
                                                        checked={selectedEmployees.includes(employee.id)}
                                                        onChange={(e) => handleSelectEmployee(employee.id, e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    {employee.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full px-4 py-2 bg-background/50 border border-border rounded-xl cursor-pointer hover:bg-background/80 transition-colors">
                                        <span className="text-sm text-foreground">
                                            {selectedEmployees.length > 0 ? `${selectedEmployees.length} Employees Selected` : 'Select Employees to Generate'}
                                        </span>
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-1/4 flex items-end">
                                <Button
                                    onClick={() => generateMutation.mutate(selectedEmployees)}
                                    disabled={generateMutation.isPending || selectedEmployees.length === 0}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                                >
                                    {generateMutation.isPending ? 'Generating...' : 'Generate Payroll'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Records Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-blue-500/10">
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Employee</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Base</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">OT</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Bonus</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Deduct</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Tax</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Net</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-center">Status</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {payrollLoading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading...</div>
                            ) : !(payrollData as any)?.data?.length ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <Wallet className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">No payroll records generated for this period</p>
                                </div>
                            ) : (
                                (payrollData as any).data.map((record: PayrollRecord, idx: number) => (
                                    <motion.div
                                        key={record.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="col-span-3">
                                            <div className="font-medium text-foreground">{record.employee_name}</div>
                                            <div className="text-xs text-muted-foreground">{new Date(record.period_start).toLocaleDateString()} - {new Date(record.period_end).toLocaleDateString()}</div>
                                        </div>
                                        <div className="col-span-1 text-sm text-right text-muted-foreground">${record.base_pay.toFixed(2)}</div>
                                        <div className="col-span-1 text-sm text-right text-emerald-600 font-medium">+${record.overtime_pay.toFixed(2)}</div>
                                        <div className="col-span-1 text-sm text-right text-emerald-600 font-medium">+${record.bonuses.toFixed(2)}</div>
                                        <div className="col-span-1 text-sm text-right text-red-500 font-medium">-${record.deductions.toFixed(2)}</div>
                                        <div className="col-span-1 text-sm text-right text-red-500 font-medium">-${record.taxes.toFixed(2)}</div>
                                        <div className="col-span-1 text-sm text-right font-bold text-foreground">${record.net_pay.toFixed(2)}</div>
                                        <div className="col-span-1 text-center">
                                            <span className={cn("px-2 py-1 rounded-full text-[10px] uppercase font-bold border", getStatusColor(record.status))}>
                                                {record.status}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="ghost" onClick={() => { setViewingPayrollId(record.id); setShowDetailsModal(true); }} className="h-8 w-8 p-0">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {record.status === 'draft' && (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={() => { setEditingPayrollId(record.id); setShowAddDetailModal(true); }} className="h-8 w-8 p-0 hover:text-blue-600">
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => finalizeMutation.mutate(record.id)} className="h-8 w-8 p-0 hover:text-emerald-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Payroll Breakdown">
                <div className="space-y-4">
                    {(detailsData as any)?.data?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No additional details</p>
                    ) : (
                        <div className="space-y-2">
                            {(detailsData as any)?.data?.map((detail: PayrollDetail) => (
                                <div key={detail.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border/50">
                                    <div>
                                        <p className="font-medium text-foreground">{detail.category}</p>
                                        <span className={cn("text-xs uppercase font-bold", detail.type === 'earning' ? "text-emerald-600" : "text-red-500")}>
                                            {detail.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("font-bold", detail.type === 'earning' ? "text-emerald-600" : "text-red-600")}>
                                            {detail.type === 'earning' ? '+' : '-'}${detail.amount.toFixed(2)}
                                        </span>
                                        {editingPayrollId && (
                                            <button onClick={() => removeDetailMutation.mutate(detail.id)} className="text-muted-foreground hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <Button onClick={() => setShowDetailsModal(false)} variant="secondary" className="w-full">Close</Button>
                </div>
            </Modal>

            {/* Add Detail Modal */}
            <Modal open={showAddDetailModal} onClose={() => setShowAddDetailModal(false)} title="Add Adjustment">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={newDetail.type}
                                onChange={(e) => setNewDetail({ ...newDetail, type: e.target.value as any })}
                                className="w-full rounded-xl border border-border bg-background px-3 py-2"
                            >
                                <option value="earning">Earning (+)</option>
                                <option value="deduction">Deduction (-)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Category</label>
                            <Input value={newDetail.category} onChange={(e) => setNewDetail({ ...newDetail, category: e.target.value })} placeholder="e.g. Bonus" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount ($)</label>
                        <Input type="number" step="0.01" value={newDetail.amount} onChange={(e) => setNewDetail({ ...newDetail, amount: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button onClick={() => setShowAddDetailModal(false)} variant="secondary" className="flex-1">Cancel</Button>
                        <Button onClick={() => addDetailMutation.mutate(editingPayrollId!)} className="flex-1 bg-blue-600 hover:bg-blue-700">Add Adjustment</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
