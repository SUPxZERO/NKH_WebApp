import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Scale,
    Ruler,
    Package,
    Droplet,
    Hash
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

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
    created_at: string;
    updated_at: string;
}

export default function Units() {
    const [search, setSearch] = React.useState('');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [baseUnitFilter, setBaseUnitFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [selectedUnit, setSelectedUnit] = React.useState<Unit | null>(null);
    const [editingUnit, setEditingUnit] = React.useState<Unit | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        display_name: '',
        base_unit: '',
        conversion_factor: '',
        is_base_unit: false,
        for_weight: false,
        for_volume: false,
        for_quantity: false,
        for_packaging: false,
        for_produce: false
    });

    // Fetch units
    const { data: units, isLoading } = useQuery({
        queryKey: ['units', page, search, typeFilter, baseUnitFilter],
        queryFn: () => {
            let url = `/api/units?page=${page}&per_page=${perPage}&search=${search}`;
            if (typeFilter !== 'all') {
                url += `&${typeFilter}=1`;
            }
            if (baseUnitFilter !== 'all') {
                url += `&is_base_unit=${baseUnitFilter === 'base' ? '1' : '0'}`;
            }
            return apiGet(url);
        }
    });

    // Fetch base units for dropdown
    const { data: baseUnits } = useQuery({
        queryKey: ['units/base-units'],
        queryFn: () => apiGet('/api/units/base-units')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/units', data),
        onSuccess: () => {
            toastSuccess('Unit created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['units'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to create unit');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/units/${id}`, data),
        onSuccess: () => {
            toastSuccess('Unit updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['units'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to update unit');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/units/${id}`),
        onSuccess: () => {
            toastSuccess('Unit deleted successfully!');
            qc.invalidateQueries({ queryKey: ['units'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to delete unit');
        }
    });

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            display_name: '',
            base_unit: '',
            conversion_factor: '',
            is_base_unit: false,
            for_weight: false,
            for_volume: false,
            for_quantity: false,
            for_packaging: false,
            for_produce: false
        });
        setEditingUnit(null);
        setError('');
    };

    const handleCreate = () => {
        resetForm();
        setOpenCreate(true);
    };

    const handleEdit = (unit: Unit) => {
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
        setEditingUnit(unit);
        setOpenEdit(true);
    };

    const handleView = (unit: Unit) => {
        setSelectedUnit(unit);
        setOpenView(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this unit? This may affect ingredients using this unit.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = {
            ...formData,
            base_unit: formData.is_base_unit ? null : (formData.base_unit || null),
            conversion_factor: formData.is_base_unit ? null : (formData.conversion_factor ? parseFloat(formData.conversion_factor) : null)
        };

        if (editingUnit) {
            updateMutation.mutate({ id: editingUnit.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getUnitIcon = (unit: Unit) => {
        if (unit.for_weight) return <Scale className="w-4 h-4" />;
        if (unit.for_volume) return <Droplet className="w-4 h-4" />;
        if (unit.for_quantity) return <Hash className="w-4 h-4" />;
        if (unit.for_packaging) return <Package className="w-4 h-4" />;
        return <Ruler className="w-4 h-4" />;
    };

    const getUnitType = (unit: Unit) => {
        if (unit.for_weight) return 'Weight';
        if (unit.for_volume) return 'Volume';
        if (unit.for_quantity) return 'Quantity';
        if (unit.for_packaging) return 'Packaging';
        if (unit.for_produce) return 'Produce';
        return 'General';
    };

    const totalUnits = units?.data?.length || 0;
    const baseUnitsCount = units?.data?.filter((u: Unit) => u.is_base_unit).length || 0;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Units Management
                            </h1>
                            <p className="text-gray-400 mt-1">Manage measurement units and conversions</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Units</div>
                                <div className="text-xl font-bold text-white">{totalUnits}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Base Units</div>
                                <div className="text-xl font-bold text-blue-400">{baseUnitsCount}</div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Unit
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search units..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="all" className="text-black">All Types</option>
                        <option value="for_weight" className="text-black">Weight</option>
                        <option value="for_volume" className="text-black">Volume</option>
                        <option value="for_quantity" className="text-black">Quantity</option>
                        <option value="for_packaging" className="text-black">Packaging</option>
                        <option value="for_produce" className="text-black">Produce</option>
                    </select>

                    <select
                        value={baseUnitFilter}
                        onChange={(e) => setBaseUnitFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="all" className="text-black">All Units</option>
                        <option value="base" className="text-black">Base Units</option>
                        <option value="derived" className="text-black">Derived Units</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearch('');
                            setTypeFilter('all');
                            setBaseUnitFilter('all');
                        }}
                        className="border-white/20 hover:bg-white/10"
                    >
                        Clear Filters
                    </Button>
                </motion.div>

                {/* Units Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        units?.data?.map((unit: Unit, index: number) => (
                            <motion.div
                                key={unit.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                {getUnitIcon(unit)}
                                                <div>
                                                    <h3 className="font-semibold text-white text-lg">{unit.name}</h3>
                                                    <p className="text-sm text-gray-400">{unit.code}</p>
                                                </div>
                                            </div>
                                            {unit.is_base_unit && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                    Base
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Display:</span>
                                                <span className="text-white">{unit.display_name}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Type:</span>
                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                                                    {getUnitType(unit)}
                                                </Badge>
                                            </div>
                                            {!unit.is_base_unit && unit.base_unit && (
                                                <>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-400">Base:</span>
                                                        <span className="text-white">{unit.base_unit}</span>
                                                    </div>
                                                    {unit.conversion_factor && (
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-400">Factor:</span>
                                                            <span className="text-white font-mono">×{unit.conversion_factor}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleView(unit)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEdit(unit)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(unit.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    open={openCreate || openEdit}
                    onClose={() => {
                        setOpenCreate(false);
                        setOpenEdit(false);
                        resetForm();
                    }}
                    title={editingUnit ? 'Edit Unit' : 'Create Unit'}
                    size="lg"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Unit Code *</label>
                                <Input
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="e.g., kg, ml, pcs"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Unit Name *</label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="e.g., Kilogram, Milliliter"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name *</label>
                                <Input
                                    required
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="e.g., kg, ml"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer mt-8">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_base_unit}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            is_base_unit: e.target.checked,
                                            base_unit: e.target.checked ? '' : formData.base_unit,
                                            conversion_factor: e.target.checked ? '' : formData.conversion_factor
                                        })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Is Base Unit</span>
                                </label>
                            </div>

                            {!formData.is_base_unit && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Base Unit</label>
                                        <select
                                            value={formData.base_unit}
                                            onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                        >
                                            <option value="">None</option>
                                            {baseUnits?.map((unit: Unit) => (
                                                <option key={unit.code} value={unit.code} className="bg-gray-800">
                                                    {unit.name} ({unit.code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Conversion Factor</label>
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={formData.conversion_factor}
                                            onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                            placeholder="e.g., 1000 (if 1 kg = 1000 g)"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Unit Types</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_weight}
                                        onChange={(e) => setFormData({ ...formData, for_weight: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Scale className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">Weight</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_volume}
                                        onChange={(e) => setFormData({ ...formData, for_volume: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Droplet className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">Volume</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_quantity}
                                        onChange={(e) => setFormData({ ...formData, for_quantity: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Hash className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">Quantity</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_packaging}
                                        onChange={(e) => setFormData({ ...formData, for_packaging: e.target.checked })}
                                        className="rounded"
                                    />
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-300">Packaging</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.for_produce}
                                        onChange={(e) => setFormData({ ...formData, for_produce: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Produce</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setOpenCreate(false);
                                    setOpenEdit(false);
                                    resetForm();
                                }}
                                className="flex-1 border-white/20 hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1"
                            >
                                {editingUnit ? 'Update' : 'Create'} Unit
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal
                    open={openView}
                    onClose={() => {
                        setOpenView(false);
                        setSelectedUnit(null);
                    }}
                    title="Unit Details"
                    size="md"
                >
                    {selectedUnit && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">Unit Information</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Code:</span>
                                        <span className="text-white font-semibold">{selectedUnit.code}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Name:</span>
                                        <span className="text-white">{selectedUnit.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Display:</span>
                                        <span className="text-white">{selectedUnit.display_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Type:</span>
                                        <span className="text-white">{getUnitType(selectedUnit)}</span>
                                    </div>
                                    {selectedUnit.is_base_unit ? (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Unit Type:</span>
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                Base Unit
                                            </Badge>
                                        </div>
                                    ) : (
                                        <>
                                            {selectedUnit.base_unit && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Base Unit:</span>
                                                    <span className="text-white">{selectedUnit.base_unit}</span>
                                                </div>
                                            )}
                                            {selectedUnit.conversion_factor && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-400">Conversion Factor:</span>
                                                    <span className="text-white font-mono">×{selectedUnit.conversion_factor}</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleEdit(selectedUnit)}
                                    className="flex-1 border-white/20 hover:bg-white/10"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Unit
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setOpenView(false);
                                        setSelectedUnit(null);
                                    }}
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
