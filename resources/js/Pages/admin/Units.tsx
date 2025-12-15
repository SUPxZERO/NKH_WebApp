import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Scale, Ruler, Package,
    Droplet, Hash, CheckCircle, XCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard Component
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
        amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
        rose: { gradient: 'from-rose-500/20 to-red-500/10', iconBg: 'bg-gradient-to-br from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' },
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

interface Unit {
    id: number;
    code: string;
    name: string;
    display_name: string;
    base_unit: string | null;
    conversion_factor: number | null;
    is_base_unit: boolean;
    for_weight: boolean;
    for_volume: boolean;
    for_quantity: boolean;
    for_packaging: boolean;
    for_produce: boolean;
}

export default function Units() {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [baseUnitFilter, setBaseUnitFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        code: '', name: '', display_name: '', base_unit: '', conversion_factor: '',
        is_base_unit: false, for_weight: false, for_volume: false, for_quantity: false,
        for_packaging: false, for_produce: false
    });

    // Fetch Data
    const { data: units, isLoading } = useQuery({
        queryKey: ['units', page, search, typeFilter, baseUnitFilter],
        queryFn: () => {
            let url = `/api/units?page=${page}&per_page=${perPage}&search=${search}`;
            if (typeFilter !== 'all') url += `&${typeFilter}=1`;
            if (baseUnitFilter !== 'all') url += `&is_base_unit=${baseUnitFilter === 'base' ? '1' : '0'}`;
            return apiGet(url);
        }
    });

    const { data: baseUnits } = useQuery({
        queryKey: ['units/base-units'],
        queryFn: () => apiGet('/api/units/base-units')
    });

    const unitList = useMemo(() => units?.data || [], [units]);

    const stats = useMemo(() => ({
        total: unitList.length,
        base: unitList.filter((u: Unit) => u.is_base_unit).length,
        derived: unitList.filter((u: Unit) => !u.is_base_unit).length
    }), [unitList]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/units', data),
        onSuccess: () => { toastSuccess('Unit created'); closeModal(); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/units/${id}`, data),
        onSuccess: () => { toastSuccess('Unit updated'); closeModal(); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/units/${id}`),
        onSuccess: () => { toastSuccess('Unit deleted'); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingUnit(null);
        setFormData({
            code: '', name: '', display_name: '', base_unit: '', conversion_factor: '',
            is_base_unit: false, for_weight: false, for_volume: false, for_quantity: false,
            for_packaging: false, for_produce: false
        });
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            code: unit.code,
            name: unit.name,
            display_name: unit.display_name,
            base_unit: unit.base_unit || '',
            conversion_factor: unit.conversion_factor?.toString() || '',
            is_base_unit: unit.is_base_unit,
            for_weight: unit.for_weight,
            for_volume: unit.for_volume,
            for_quantity: unit.for_quantity,
            for_packaging: unit.for_packaging,
            for_produce: unit.for_produce
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this unit?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            base_unit: formData.is_base_unit ? null : (formData.base_unit || null),
            conversion_factor: formData.is_base_unit ? null : (formData.conversion_factor ? parseFloat(formData.conversion_factor) : null)
        };
        if (editingUnit) updateMutation.mutate({ id: editingUnit.id, data });
        else createMutation.mutate(data);
    };

    const getUnitIcon = (unit: Unit) => {
        if (unit.for_weight) return <Scale size={14} />;
        if (unit.for_volume) return <Droplet size={14} />;
        if (unit.for_quantity) return <Hash size={14} />;
        if (unit.for_packaging) return <Package size={14} />;
        return <Ruler size={14} />;
    };

    const getUnitType = (unit: Unit) => {
        if (unit.for_weight) return 'Weight';
        if (unit.for_volume) return 'Volume';
        if (unit.for_quantity) return 'Quantity';
        if (unit.for_packaging) return 'Packaging';
        if (unit.for_produce) return 'Produce';
        return 'General';
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
                                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"
                            >
                                <Ruler className="w-8 h-8 text-purple-600" />
                                Measurement Units
                            </motion.h1>
                            <p className="text-muted-foreground mt-2">Manage standard and derived units for recipes and stock</p>
                        </div>
                        <Button
                            onClick={() => { closeModal(); setOpenCreate(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Unit
                        </Button>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Total Units" value={stats.total} icon={Ruler} color="purple" index={0} />
                        <StatCard title="Base Units" value={stats.base} icon={Scale} color="blue" index={1} subtext="Primary measurement standards" />
                        <StatCard title="Derived Units" value={stats.derived} icon={Hash} color="emerald" index={2} subtext="Calculated from base units" />
                    </div>

                    {/* Filters & Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex flex-wrap gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search units by name or code..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-purple-500 transition-all" />
                            </div>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                                <option value="all">All Types</option>
                                <option value="for_weight">Weight</option>
                                <option value="for_volume">Volume</option>
                                <option value="for_quantity">Quantity</option>
                                <option value="for_packaging">Packaging</option>
                            </select>
                            <select value={baseUnitFilter} onChange={(e) => setBaseUnitFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                                <option value="all">All Units</option>
                                <option value="base">Base Units Only</option>
                                <option value="derived">Derived Units Only</option>
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
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Name / Code</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Type</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Base Unit</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Factor</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Usage</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading...</div>
                            ) : unitList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <Ruler className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">No units found matching your filters</p>
                                </div>
                            ) : unitList.map((unit: Unit, idx: number) => (
                                <motion.div
                                    key={unit.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="col-span-3">
                                        <div className="font-medium text-foreground">{unit.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{unit.code}</span>
                                            <span className="opacity-70">{unit.display_name}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20 flex items-center gap-1 w-fit">
                                            {getUnitIcon(unit)} {getUnitType(unit)}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {unit.is_base_unit ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> BASE UNIT
                                            </span>
                                        ) : unit.base_unit}
                                    </div>
                                    <div className="col-span-2 text-sm text-foreground font-mono">
                                        {unit.conversion_factor ? (
                                            <span className="bg-secondary/50 px-2 py-1 rounded">× {unit.conversion_factor}</span>
                                        ) : '-'}
                                    </div>
                                    <div className="col-span-2 flex gap-1">
                                        {unit.for_weight && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] px-1.5 border-none">W</Badge>}
                                        {unit.for_volume && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-[10px] px-1.5 border-none">V</Badge>}
                                        {unit.for_quantity && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] px-1.5 border-none">Q</Badge>}
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(unit)} className="h-8 w-8 p-0 hover:text-blue-600"><Edit size={14} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0 hover:text-red-600"><Trash2 size={14} /></Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modal */}
            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingUnit ? 'Edit Unit' : 'Create New Unit'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-5 p-1">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Short Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="e.g. kg" />
                        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Kilogram" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Display Label" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required placeholder="e.g. kg" />
                        <div className="flex items-center pt-8">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border/50 bg-secondary/30 w-full hover:bg-secondary/50 transition-colors">
                                <div className="relative flex items-center">
                                    <input type="checkbox" checked={formData.is_base_unit} onChange={(e) => setFormData({ ...formData, is_base_unit: e.target.checked })}
                                        className="peer h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                </div>
                                <span className="text-sm font-medium text-foreground">Is Base Unit?</span>
                            </label>
                        </div>
                    </div>

                    {!formData.is_base_unit && (
                        <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <h4 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="w-4 h-4" />
                                Conversion Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Base Unit</label>
                                    <select value={formData.base_unit} onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:ring-2 focus:ring-purple-500/20 outline-none transition-all">
                                        <option value="">Select Base Unit</option>
                                        {baseUnits?.map((u: Unit) => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                                    </select>
                                </div>
                                <Input label="Conversion Factor" type="number" step="0.001" value={formData.conversion_factor} onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })} placeholder="1 unit = X base units" />
                            </div>
                        </div>
                    )}

                    <div className="border-t border-border/50 pt-4">
                        <label className="block text-sm font-medium text-foreground mb-3">Applicable Usage</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['weight', 'volume', 'quantity', 'packaging', 'produce'].map(type => (
                                <label key={type} className={cn(
                                    "flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all",
                                    (formData as any)[`for_${type}`] ? "bg-purple-500/10 border-purple-500/30" : "bg-card border-border/50 hover:bg-secondary/50"
                                )}>
                                    <input type="checkbox" checked={(formData as any)[`for_${type}`]}
                                        onChange={(e) => setFormData({ ...formData, [`for_${type}`]: e.target.checked })}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                    <span className="text-sm text-foreground capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 hover:bg-secondary/80">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                            {editingUnit ? 'Save Changes' : 'Create Unit'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
