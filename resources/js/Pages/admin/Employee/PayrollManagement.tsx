import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useTranslation } from '@/app/hooks/useTranslation';
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
    Search,
    ChevronDown,
    FileSpreadsheet,
    FileText
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

// Enhanced StatCard - Mobile optimized
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
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function PayrollManagement() {
    const { t, locale } = useTranslation();
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
        description: 'Bonus',
        amount: 0,
        percentage: 0,
    });

    const qc = useQueryClient();

    // Fetch employees
    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('admin/employees'),
    });

    // Fetch payroll records for month
    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ['payroll.management', selectedMonth, selectedEmployees],
        queryFn: () =>
            apiGet('admin/payroll/history', {
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
        queryFn: () => apiGet(`admin/payroll/${viewingPayrollId}/details`),
        enabled: !!viewingPayrollId,
    });

    // Generate payroll mutation
    const generateMutation = useMutation({
        mutationFn: (employeeIds: number[]) =>
            apiPost('admin/payroll/generate', {
                employee_ids: employeeIds.length > 0 ? employeeIds : undefined,
                month: selectedMonth,
                include_overtime: true,
            }),
        onSuccess: () => {
            toastSuccess(t('admin.hr.payroll.messages.generated') as string);
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
            setSelectedEmployees([]);
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || t('admin.hr.payroll.messages.generate_failed') as string);
        },
    });

    // Finalize payroll mutation
    const finalizeMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`admin/payroll/${payrollId}/finalize`, {}),
        onSuccess: () => {
            toastSuccess(t('admin.hr.payroll.messages.finalized') as string);
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || t('admin.hr.payroll.messages.finalize_failed') as string);
        },
    });

    // Add detail mutation
    const addDetailMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`admin/payroll/${payrollId}/add-detail`, newDetail),
        onSuccess: () => {
            toastSuccess(t('admin.hr.payroll.messages.adjustment_added') as string);
            setShowAddDetailModal(false);
            setNewDetail({ type: 'earning', description: 'Bonus', amount: 0, percentage: 0 });
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || t('admin.hr.payroll.messages.adjustment_failed') as string);
        },
    });

    // Remove detail mutation
    const removeDetailMutation = useMutation({
        mutationFn: (detailId: number) =>
            apiDelete(`admin/payroll-details/${detailId}`),
        onSuccess: () => {
            toastSuccess('Detail removed successfully');
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
            qc.invalidateQueries({ queryKey: ['payroll.management'] }); // Update globals
        },
        onError: (error: any) => {
            toastError('Failed to remove detail');
        },
    });

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    const handleExportCSV = () => {
        setIsExportDropdownOpen(false);
        const url = `/api/admin/payroll/export/csv?month=${selectedMonth}&locale=${locale}`;
        window.open(url, '_blank');
        toastSuccess(t('admin.hr.payroll.messages.exported') as string);
    };

    const handleExportPDF = () => {
        setIsExportDropdownOpen(false);
        const url = `/api/admin/payroll/export/pdf?month=${selectedMonth}&locale=${locale}`;
        window.open(url, '_blank');
        toastSuccess(t('admin.hr.payroll.messages.exported') as string);
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
            <Head title={t('admin.hr.payroll.title')} />
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
                            >
                                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                                <span className="truncate">{t('admin.hr.payroll.title')}</span>
                            </motion.h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-1 hidden sm:block">{t('admin.hr.payroll.subtitle')}</p>
                        </div>
                        <div className="relative flex-shrink-0">
                            <Button
                                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                                disabled={!(payrollData as any)?.data?.length}
                                variant="outline"
                                className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm bg-background/50 backdrop-blur-sm border-border"
                            >
                                <Download className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">{t('admin.hr.payroll.actions.export')}</span>
                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                            </Button>
                            {isExportDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 z-50">
                                    <div
                                        className="border rounded-xl shadow-2xl p-2 w-40 sm:w-48"
                                        style={{ backgroundColor: '#18181b' }}
                                    >
                                        <button
                                            onClick={handleExportCSV}
                                            className="flex items-center gap-3 w-full p-2 sm:p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                            <span className="text-sm" style={{ color: '#ffffff', fontWeight: 500 }}>{t('admin.hr.payroll.actions.csv')}</span>
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="flex items-center gap-3 w-full p-2 sm:p-2.5 rounded-lg cursor-pointer transition-colors hover:bg-zinc-800"
                                        >
                                            <FileText className="w-4 h-4 text-red-500" />
                                            <span className="text-sm" style={{ color: '#ffffff', fontWeight: 500 }}>{t('admin.hr.payroll.actions.pdf')}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats Ribbon - Grid on all sizes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                        <StatCard title={t('admin.hr.payroll.stats.employees')} value={employeeCount} icon={Users} color="blue" index={0} />
                        <StatCard title={t('admin.hr.payroll.stats.gross')} value={`$${totalGross.toFixed(0)}`} icon={Wallet} color="emerald" index={1} />
                        <StatCard title={t('admin.hr.payroll.stats.net')} value={`$${totalNet.toFixed(0)}`} icon={CreditCard} color="amber" index={2} />
                        <StatCard title={t('admin.hr.payroll.stats.deduct')} value={`$${totalDeductions.toFixed(0)}`} icon={TrendingDown} color="rose" index={3} />
                    </div>

                    {/* Control Panel - Mobile optimized */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg"
                    >
                        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:gap-6">
                            <div className="w-full md:w-1/4 space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.hr.payroll.filters.period')}</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        type="month"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="pl-10 h-10 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-1.5 sm:space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('admin.hr.payroll.filters.employees')}</label>
                                <div className="relative">
                                    <button
                                        onClick={toggleDropdown}
                                        className="w-full flex items-center justify-between p-2 pl-3 h-10 bg-background border border-border rounded-xl shadow-sm hover:border-blue-500/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm truncate">
                                                {selectedEmployees.length === 0
                                                    ? t('admin.hr.payroll.filters.select')
                                                    : `${selectedEmployees.length} ${t('admin.hr.payroll.filters.selected')}`}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute inset-x-0 top-full mt-2" style={{ zIndex: 9999 }}>
                                            <div
                                                className="border rounded-xl shadow-2xl p-2 max-h-48 sm:max-h-60 overflow-y-auto"
                                                style={{ backgroundColor: '#18181b' }}
                                            >
                                                <label
                                                    className="flex items-center gap-3 p-2 sm:p-2.5 rounded-lg cursor-pointer font-medium border-b mb-2 sticky top-0"
                                                    style={{ backgroundColor: '#18181b', borderColor: '#3f3f46' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            !!employees &&
                                                            selectedEmployees.length === (employees as any)?.data?.length
                                                        }
                                                        onChange={(e) => handleSelectAllEmployees(e.target.checked)}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm" style={{ color: '#ffffff', fontWeight: 600 }}>{t('admin.hr.payroll.filters.all')} ({(employees as any)?.data?.length || 0})</span>
                                                </label>
                                                <div className="space-y-1">
                                                    {(employees as any)?.data?.map((emp: any) => (
                                                        <label
                                                            key={emp.id}
                                                            className="flex items-center gap-3 p-2 sm:p-2.5 rounded-lg cursor-pointer transition-colors group hover:brightness-125"
                                                            style={{ backgroundColor: '#18181b' }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmployees.includes(emp.id)}
                                                                onChange={(e) => handleSelectEmployee(emp.id, e.target.checked)}
                                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm truncate" style={{ color: '#ffffff', fontWeight: 500 }}>{emp.user?.name || emp.employee_code}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="w-full md:w-1/4 flex items-end">
                                <Button
                                    onClick={() => generateMutation.mutate(selectedEmployees)}
                                    disabled={generateMutation.isPending || selectedEmployees.length === 0}
                                    className="w-full h-10 text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                                >
                                    {generateMutation.isPending ? t('admin.hr.payroll.actions.generating') : t('admin.hr.payroll.actions.generate')}
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Records Table - Desktop */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:block bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-blue-500/10">
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.payroll.table.employee')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.base')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.ot')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.bonus')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.deduct')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.tax')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.net')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-center">{t('admin.hr.payroll.table.status')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.payroll.table.actions')}</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {payrollLoading ? (
                                <div className="p-12 text-center text-muted-foreground">{t('layout.status.loading')}...</div>
                            ) : !(payrollData as any)?.data?.length ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <Wallet className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">{t('admin.hr.payroll.messages.no_records')}</p>
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
                                                {t(`admin.hr.payroll.status.${record.status}`)}
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

                    {/* Records Cards - Mobile */}
                    <div className="md:hidden space-y-3">
                        {payrollLoading ? (
                            <div className="p-8 text-center text-muted-foreground bg-card/50 rounded-xl border border-border/50">{t('layout.status.loading')}...</div>
                        ) : !(payrollData as any)?.data?.length ? (
                            <div className="p-8 text-center bg-card/50 rounded-xl border border-border/50">
                                <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">{t('admin.hr.payroll.messages.no_records')}</p>
                            </div>
                        ) : (
                            (payrollData as any).data.map((record: PayrollRecord) => (
                                <div
                                    key={record.id}
                                    className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
                                >
                                    {/* Header: Name + Status */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm text-foreground truncate">{record.employee_name}</div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {new Date(record.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(record.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                        </div>
                                        <span className={cn("px-2 py-1 rounded-full text-[10px] uppercase font-bold border flex-shrink-0", getStatusColor(record.status))}>
                                            {t(`admin.hr.payroll.status.${record.status}`)}
                                        </span>
                                    </div>

                                    {/* Pay breakdown */}
                                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                                        <div className="bg-secondary/30 rounded-lg p-2 text-center">
                                            <div className="text-muted-foreground">{t('admin.hr.payroll.table.base')}</div>
                                            <div className="font-semibold">${record.base_pay.toFixed(0)}</div>
                                        </div>
                                        <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                                            <div className="text-muted-foreground">+{t('admin.hr.payroll.table.bonus')}</div>
                                            <div className="font-semibold text-emerald-600">${(record.overtime_pay + record.bonuses).toFixed(0)}</div>
                                        </div>
                                        <div className="bg-red-500/10 rounded-lg p-2 text-center">
                                            <div className="text-muted-foreground">-{t('admin.hr.payroll.table.deduct')}</div>
                                            <div className="font-semibold text-red-500">${(record.deductions + record.taxes).toFixed(0)}</div>
                                        </div>
                                    </div>

                                    {/* Net pay + Actions */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                        <div>
                                            <span className="text-xs text-muted-foreground">{t('admin.hr.payroll.table.net')}: </span>
                                            <span className="font-bold text-foreground">${record.net_pay.toFixed(2)}</span>
                                        </div>
                                        <div className="flex gap-1">
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
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div >
            </div >

            {/* Details Modal - Mobile optimized */}
            <Modal open={showDetailsModal} onClose={() => setShowDetailsModal(false)} title={t('admin.hr.payroll.modal.breakdown')}>
                <div className="space-y-3 sm:space-y-4">
                    {/* Earnings Section */}
                    {(detailsData as any)?.earnings?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">{t('admin.hr.payroll.modal.earnings')}</h4>
                            <div className="space-y-2">
                                {(detailsData as any)?.earnings?.map((detail: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-500/20">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-foreground truncate">{detail.description}</p>
                                        </div>
                                        <span className="font-bold text-sm text-emerald-600 flex-shrink-0">
                                            +${(detail.amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Deductions Section */}
                    {(detailsData as any)?.deductions?.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">{t('admin.hr.payroll.modal.deductions')}</h4>
                            <div className="space-y-2">
                                {(detailsData as any)?.deductions?.map((detail: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl border border-red-500/20">
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm text-foreground truncate">{detail.description}</p>
                                        </div>
                                        <span className="font-bold text-sm text-red-600 flex-shrink-0">
                                            -${(detail.amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No details message */}
                    {(!(detailsData as any)?.earnings?.length && !(detailsData as any)?.deductions?.length) && (
                        <p className="text-center text-muted-foreground py-4 text-sm">{t('admin.hr.payroll.modal.no_details')}</p>
                    )}

                    {/* Totals Summary */}
                    {(detailsData as any)?.totals && (
                        <div className="border-t border-border pt-3 mt-3">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('admin.hr.payroll.modal.gross_pay')}</span>
                                    <span className="font-medium">${((detailsData as any)?.totals?.gross_pay || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('admin.hr.payroll.modal.deduction_label')}</span>
                                    <span className="font-medium text-red-500">-${((detailsData as any)?.totals?.total_deductions || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between col-span-2 pt-2 border-t border-border">
                                    <span className="font-bold">{t('admin.hr.payroll.modal.net_pay')}</span>
                                    <span className="font-bold text-emerald-600">${((detailsData as any)?.totals?.net_pay || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <Button onClick={() => setShowDetailsModal(false)} variant="secondary" className="w-full h-10 sm:h-11 text-sm">{t('admin.hr.payroll.modal.close')}</Button>
                </div>
            </Modal>

            {/* Add Detail Modal - Mobile optimized */}
            <Modal open={showAddDetailModal} onClose={() => setShowAddDetailModal(false)} title={t('admin.hr.payroll.modal.add_adj')}>
                <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1.5">{t('admin.hr.payroll.modal.type')}</label>
                            <select
                                value={newDetail.type}
                                onChange={(e) => setNewDetail({ ...newDetail, type: e.target.value as any })}
                                className="w-full h-10 rounded-lg sm:rounded-xl border border-border bg-background px-3 text-sm"
                            >
                                <option value="earning">{t('admin.hr.payroll.modal.earning')}</option>
                                <option value="deduction">{t('admin.hr.payroll.modal.deduction')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium mb-1.5">{t('admin.hr.payroll.modal.description')}</label>
                            <Input value={newDetail.description} onChange={(e) => setNewDetail({ ...newDetail, description: e.target.value })} placeholder="e.g. Bonus" className="h-10 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium mb-1.5">{t('admin.hr.payroll.modal.amount')}</label>
                        <Input type="number" step="0.01" value={newDetail.amount} onChange={(e) => setNewDetail({ ...newDetail, amount: parseFloat(e.target.value) || 0 })} className="h-10 text-sm" />
                    </div>
                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <Button onClick={() => setShowAddDetailModal(false)} variant="secondary" className="flex-1 h-10 sm:h-11 text-sm">{t('admin.hr.payroll.modal.cancel')}</Button>
                        <Button onClick={() => addDetailMutation.mutate(editingPayrollId!)} className="flex-1 h-10 sm:h-11 text-sm bg-blue-600 hover:bg-blue-700">{t('admin.hr.payroll.modal.add')}</Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout >
    );
}
