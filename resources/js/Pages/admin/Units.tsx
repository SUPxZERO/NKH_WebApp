import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Scale, Ruler, Package,
    Droplet, Hash, CheckCircle, XCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon with Dark/Light Mode Support
const UnitStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Units</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Ruler className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Base Units</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.base}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Derived Units</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.derived}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <Hash className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </div>
    </div>
);

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
            <div className="min-h-screen bg-background p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Units</h1>
                        <p className="text-muted-foreground mt-1">Measurement units management</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Unit
                    </Button>
                </div>

                <UnitStatsRibbon stats={stats} />

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-6 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
                        </div>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-secondary/50 border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none">
                            <option value="all">All Types</option>
                            <option value="for_weight">Weight</option>
                            <option value="for_volume">Volume</option>
                            <option value="for_quantity">Quantity</option>
                            <option value="for_packaging">Packaging</option>
                        </select>
                        <select value={baseUnitFilter} onChange={(e) => setBaseUnitFilter(e.target.value)}
                            className="bg-secondary/50 border border-border rounded-lg px-4 py-2 text-foreground focus:border-primary outline-none">
                            <option value="all">All Units</option>
                            <option value="base">Base Units</option>
                            <option value="derived">Derived Units</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase">
                        <div className="col-span-3">Name / Code</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Base Unit</div>
                        <div className="col-span-2">Factor</div>
                        <div className="col-span-2">Usage</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-border/50">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading...</div>
                        ) : unitList.length === 0 ? (
                            <div className="p-12 text-center">
                                <Ruler className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No units found</p>
                            </div>
                        ) : unitList.map((unit: Unit) => (
                            <motion.div key={unit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/50 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-foreground">{unit.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{unit.code} ({unit.display_name})</div>
                                </div>
                                <div className="col-span-2">
                                    <span className="px-2 py-1 rounded-md text-xs font-medium border bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20 flex items-center gap-1 w-fit">
                                        {getUnitIcon(unit)} {getUnitType(unit)}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground">
                                    {unit.is_base_unit ? <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">BASE UNIT</span> : unit.base_unit}
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground font-mono">
                                    {unit.conversion_factor ? `×${unit.conversion_factor}` : '-'}
                                </div>
                                <div className="col-span-2 flex gap-1">
                                    {unit.for_weight && <Badge className="bg-secondary text-muted-foreground text-[10px] px-1">W</Badge>}
                                    {unit.for_volume && <Badge className="bg-secondary text-muted-foreground text-[10px] px-1">V</Badge>}
                                    {unit.for_quantity && <Badge className="bg-secondary text-muted-foreground text-[10px] px-1">Q</Badge>}
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(unit)} className="h-8 w-8 p-0"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingUnit ? 'Edit Unit' : 'New Unit'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="e.g. kg" />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Kilogram" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Display Name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required placeholder="e.g. kg" />
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.is_base_unit} onChange={(e) => setFormData({ ...formData, is_base_unit: e.target.checked })}
                                    className="rounded bg-card border-border" />
                                <span className="text-sm text-foreground">Is Base Unit</span>
                            </label>
                        </div>
                    </div>

                    {!formData.is_base_unit && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Base Unit</label>
                                <select value={formData.base_unit} onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground">
                                    <option value="">Select Base Unit</option>
                                    {baseUnits?.map((u: Unit) => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                                </select>
                            </div>
                            <Input label="Conversion Factor" type="number" step="0.001" value={formData.conversion_factor} onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })} />
                        </div>
                    )}

                    <div className="border-t border-border pt-4">
                        <label className="block text-sm font-medium text-foreground mb-2">Applicable Types</label>
                        <div className="flex gap-4 flex-wrap">
                            {['weight', 'volume', 'quantity', 'packaging', 'produce'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={(formData as any)[`for_${type}`]}
                                        onChange={(e) => setFormData({ ...formData, [`for_${type}`]: e.target.checked })}
                                        className="rounded bg-card border-border" />
                                    <span className="text-sm text-foreground capitalize">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
