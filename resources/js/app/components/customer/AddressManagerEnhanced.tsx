import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin,
    Plus,
    Trash2,
    Edit2,
    Home,
    Building2,
    Check,
    X,
    ChevronRight,
    Navigation
} from 'lucide-react';
import { CustomerAddress } from '@/app/types/domain';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { Button } from '@/app/components/ui/Button';
import AddressPicker, { AddressData } from './AddressPicker';
import { cn } from '@/app/utils/cn';

interface AddressManagerProps {
    /** Currently selected address */
    selected?: CustomerAddress | null;
    /** Callback when address is selected */
    onSelect: (address?: CustomerAddress | null) => void;
    /** Whether in compact mode (for checkout) */
    compact?: boolean;
    /** Whether to allow adding new addresses */
    allowAdd?: boolean;
    /** Whether to allow editing addresses */
    allowEdit?: boolean;
    /** Whether to allow deleting addresses */
    allowDelete?: boolean;
    /** Custom class name */
    className?: string;
}

interface AddressFormData {
    label: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    province: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    delivery_instructions: string;
    is_default: boolean;
}

const defaultFormData: AddressFormData = {
    label: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: null,
    longitude: null,
    delivery_instructions: '',
    is_default: false,
};

export default function AddressManagerEnhanced({
    selected,
    onSelect,
    compact = false,
    allowAdd = true,
    allowEdit = true,
    allowDelete = true,
    className,
}: AddressManagerProps) {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
    const [formData, setFormData] = useState<AddressFormData>(defaultFormData);

    // Fetch addresses
    const { data: addressesResponse, isLoading } = useQuery({
        queryKey: ['customer', 'addresses'],
        queryFn: () => apiGet('/api/customer/addresses'),
    });

    const addresses: CustomerAddress[] = addressesResponse?.data || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: AddressFormData) => apiPost('/api/customer/addresses', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            closeModal();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AddressFormData }) =>
            apiPut(`/api/customer/addresses/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            closeModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/customer/addresses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
        },
    });

    // Handlers
    const openAddModal = () => {
        setEditingAddress(null);
        setFormData(defaultFormData);
        setShowModal(true);
    };

    const openEditModal = (address: CustomerAddress) => {
        setEditingAddress(address);
        setFormData({
            label: address.label,
            address_line_1: address.address_line_1,
            address_line_2: address.address_line_2 || '',
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
            latitude: address.latitude || null,
            longitude: address.longitude || null,
            delivery_instructions: address.delivery_instructions || '',
            is_default: address.is_default || false,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingAddress(null);
        setFormData(defaultFormData);
    };

    const handleAddressPickerChange = (data: AddressData | null) => {
        if (data) {
            setFormData((prev) => ({
                ...prev,
                address_line_1: data.address_line_1 || data.address.split(',')[0] || '',
                city: data.city || '',
                province: data.province || '',
                postal_code: data.postal_code || '',
                latitude: data.lat,
                longitude: data.lng,
            }));
        }
    };

    const handleSave = () => {
        if (!formData.address_line_1 || !formData.label) {
            return;
        }

        if (editingAddress) {
            updateMutation.mutate({ id: editingAddress.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this address?')) {
            deleteMutation.mutate(id);
        }
    };

    // Get icon for address label
    const getAddressIcon = (label: string) => {
        const lower = label.toLowerCase();
        if (lower.includes('home') || lower.includes('house')) {
            return <Home className="w-4 h-4" />;
        }
        if (lower.includes('office') || lower.includes('work')) {
            return <Building2 className="w-4 h-4" />;
        }
        return <MapPin className="w-4 h-4" />;
    };

    return (
        <>
            <Card className={cn('overflow-hidden', className)}>
                <CardHeader className="border-b border-white/10 py-2 sm:py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                            <span className="font-semibold text-white text-sm sm:text-base">Delivery Address</span>
                        </div>
                        {allowAdd && (
                            <Button size="sm" variant="outline" onClick={openAddModal} className="text-xs sm:text-sm">
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span className="hidden sm:inline">Add New</span>
                                <span className="sm:hidden">Add</span>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-3 space-y-2">
                            <Skeleton className="h-14 sm:h-20 w-full" />
                            <Skeleton className="h-14 sm:h-20 w-full" />
                        </div>
                    ) : addresses.length === 0 ? (
                        <div className="p-6 text-center">
                            <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 mb-4 text-sm">No saved addresses</p>
                            {allowAdd && (
                                <Button size="sm" onClick={openAddModal}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Address
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {addresses.map((address: CustomerAddress) => (
                                <motion.div
                                    key={address.id}
                                    className={cn(
                                        'p-2.5 sm:p-4 cursor-pointer transition-all hover:bg-white/5',
                                        selected?.id === address.id && 'bg-purple-500/10 border-l-4 border-purple-500'
                                    )}
                                    onClick={() => onSelect(address)}
                                    whileHover={{ x: 2 }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                            <div
                                                className={cn(
                                                    'p-1.5 sm:p-2 rounded-lg flex-shrink-0',
                                                    selected?.id === address.id
                                                        ? 'bg-purple-500/20 text-purple-400'
                                                        : 'bg-white/5 text-gray-400'
                                                )}
                                            >
                                                {getAddressIcon(address.label)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="font-medium text-white text-sm">{address.label}</span>
                                                    {!!address.latitude && !!address.longitude && (
                                                        <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/20 text-green-400">
                                                            GPS
                                                        </span>
                                                    )}
                                                    {!!address.is_default && (
                                                        <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 hidden sm:inline">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-gray-400 truncate">
                                                    {address.address_line_1}
                                                    {address.address_line_2 && `, ${address.address_line_2}`}
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500">
                                                    {address.city}, {address.province}{address.postal_code && address.postal_code !== '0' ? ` ${address.postal_code}` : ''}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {selected?.id === address.id && (
                                                <div className="p-1 rounded-full bg-purple-500 text-white">
                                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                                </div>
                                            )}
                                            {!compact && allowEdit && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openEditModal(address);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            )}
                                            {!compact && allowDelete && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(address.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </button>
                                            )}
                                            {!compact && <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <>
                        <motion.div
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeModal}
                        />
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <div
                                className="bg-gray-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Navigation className="w-6 h-6 text-purple-400" />
                                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                                    </h2>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-5">
                                    {/* Address Label */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Address Label *
                                        </label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['Home', 'Office', 'Other'].map((label) => (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, label })}
                                                    className={cn(
                                                        'px-4 py-2 rounded-lg border transition-all flex items-center gap-2',
                                                        formData.label === label
                                                            ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                                                    )}
                                                >
                                                    {getAddressIcon(label)}
                                                    {label}
                                                </button>
                                            ))}
                                            <input
                                                type="text"
                                                value={formData.label}
                                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                                placeholder="Custom label"
                                                className="flex-1 min-w-[120px] px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* OpenStreetMap Address Picker */}
                                    <AddressPicker
                                        label="Search Location (OpenStreetMap)"
                                        placeholder="Start typing an address..."
                                        showMap={true}
                                        mapHeight={250}
                                        initialAddress={editingAddress?.address_line_1}
                                        initialLat={editingAddress?.latitude || undefined}
                                        initialLng={editingAddress?.longitude || undefined}
                                        onChange={handleAddressPickerChange}
                                    />

                                    {/* Manual Address Fields (Auto-filled but editable) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Street Address *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address_line_1}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, address_line_1: e.target.value })
                                                }
                                                placeholder="123 Main Street"
                                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Apartment, Suite, etc.
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.address_line_2}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, address_line_2: e.target.value })
                                                }
                                                placeholder="Apt 4B"
                                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                placeholder="Phnom Penh"
                                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Province *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.province}
                                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                                placeholder="Phnom Penh"
                                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.postal_code}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, postal_code: e.target.value })
                                                }
                                                placeholder="12000"
                                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                                GPS Coordinates
                                            </label>
                                            <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm">
                                                {formData.latitude && formData.longitude ? (
                                                    <span className="text-green-400">
                                                        ✓ {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-500">Select location on map</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Instructions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Delivery Instructions
                                        </label>
                                        <textarea
                                            value={formData.delivery_instructions}
                                            onChange={(e) =>
                                                setFormData({ ...formData, delivery_instructions: e.target.value })
                                            }
                                            placeholder="Gate code, building entrance, special instructions..."
                                            rows={3}
                                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                                        />
                                    </div>

                                    {/* Set as Default */}
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default}
                                            onChange={(e) =>
                                                setFormData({ ...formData, is_default: e.target.checked })
                                            }
                                            className="w-5 h-5 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                                        />
                                        <span className="text-gray-300">Set as default address</span>
                                    </label>
                                </div>

                                {/* Modal Footer */}
                                <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={closeModal}
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleSave}
                                        disabled={
                                            !formData.label ||
                                            !formData.address_line_1 ||
                                            createMutation.isPending ||
                                            updateMutation.isPending
                                        }
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? (
                                            <>Saving...</>
                                        ) : editingAddress ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Update Address
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Address
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
