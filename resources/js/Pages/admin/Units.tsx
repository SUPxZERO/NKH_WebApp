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

// Stats Ribbon
const UnitStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Units</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Ruler className="w-8 h-8 text-purple-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Base Units</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.base}</p>
                </div>
                <Scale className="w-8 h-8 text-blue-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Derived Units</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.derived}</p>
                </div>
                <Hash className="w-8 h-8 text-emerald-400" />
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
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Units</h1>
                        <p className="text-slate-400 mt-1">Measurement units management</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Unit
                    </Button>
                </div>

                <UnitStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Types</option>
                            <option value="for_weight">Weight</option>
                            <option value="for_volume">Volume</option>
                            <option value="for_quantity">Quantity</option>
                            <option value="for_packaging">Packaging</option>
                        </select>
                        <select value={baseUnitFilter} onChange={(e) => setBaseUnitFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Units</option>
                            <option value="base">Base Units</option>
                            <option value="derived">Derived Units</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-3">Name / Code</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Base Unit</div>
                        <div className="col-span-2">Factor</div>
                        <div className="col-span-2">Usage</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : unitList.map((unit: Unit) => (
                            <motion.div key={unit.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-white">{unit.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{unit.code} ({unit.display_name})</div>
                                </div>
                                <div className="col-span-2">
                                    <span className="px-2 py-1 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20 flex items-center gap-1 w-fit">
                                        {getUnitIcon(unit)} {getUnitType(unit)}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm text-gray-300">
                                    {unit.is_base_unit ? <span className="text-emerald-400 text-xs font-bold">BASE UNIT</span> : unit.base_unit}
                                </div>
                                <div className="col-span-2 text-sm text-gray-300 font-mono">
                                    {unit.conversion_factor ? `×${unit.conversion_factor}` : '-'}
                                </div>
                                <div className="col-span-2 flex gap-1">
                                    {unit.for_weight && <Badge className="bg-gray-800 text-gray-400 text-[10px] px-1">W</Badge>}
                                    {unit.for_volume && <Badge className="bg-gray-800 text-gray-400 text-[10px] px-1">V</Badge>}
                                    {unit.for_quantity && <Badge className="bg-gray-800 text-gray-400 text-[10px] px-1">Q</Badge>}
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(unit)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingUnit ? 'Edit Unit' : 'New Unit'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-slate-950 border-white/10" placeholder="e.g. kg" />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" placeholder="e.g. Kilogram" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Display Name" value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required className="bg-slate-950 border-white/10" placeholder="e.g. kg" />
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.is_base_unit} onChange={(e) => setFormData({ ...formData, is_base_unit: e.target.checked })} className="rounded bg-slate-950 border-white/10" />
                                <span className="text-sm text-gray-300">Is Base Unit</span>
                            </label>
                        </div>
                    </div>

                    {!formData.is_base_unit && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Base Unit</label>
                                <select value={formData.base_unit} onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Base Unit</option>
                                    {baseUnits?.map((u: Unit) => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                                </select>
                            </div>
                            <Input label="Conversion Factor" type="number" step="0.001" value={formData.conversion_factor} onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })} className="bg-slate-950 border-white/10" />
                        </div>
                    )}

                    <div className="border-t border-white/10 pt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Applicable Types</label>
                        <div className="flex gap-4 flex-wrap">
                            {['weight', 'volume', 'quantity', 'packaging', 'produce'].map(type => (
                                <label key={type} className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={(formData as any)[`for_${type}`]}
                                        onChange={(e) => setFormData({ ...formData, [`for_${type}`]: e.target.checked })}
                                        className="rounded bg-slate-950 border-white/10" />
                                    <span className="text-sm text-gray-300 capitalize">{type}</span>
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
