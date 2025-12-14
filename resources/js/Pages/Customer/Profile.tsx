import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Save,
    Plus,
    Trash2,
    Edit,
    Check,
    Shield,
    Home,
    Crosshair,
    Loader2
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import Map from '@/app/components/ui/Map';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';
import NotificationPreferencesSettings from '@/app/components/customer/NotificationPreferencesSettings';

interface Address {
    id: number;
    label: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    province: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    delivery_instructions?: string;
    is_default: boolean;
}

export default function Profile() {
    const queryClient = useQueryClient();
    const [editMode, setEditMode] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Fetch profile
    const { data: profileData } = useQuery({
        queryKey: ['customer', 'profile'],
        queryFn: () => apiGet('/api/customer/profile')
    });

    // Fetch addresses
    const { data: addressesData } = useQuery({
        queryKey: ['customer', 'addresses'],
        queryFn: () => apiGet('/api/customer/addresses')
    });

    const profile = profileData?.data;
    const addresses = addressesData?.data || [];

    // Profile form state
    const [formData, setFormData] = useState({
        name: profile?.user?.name || '',
        email: profile?.user?.email || '',
        phone: profile?.user?.phone || '',
        birth_date: profile?.birth_date || '',
        gender: profile?.gender || '',
        preferred_language: profile?.preferred_language || 'en',
        marketing_consent: profile?.marketing_consent || false,
    });

    // Address form state
    const [addressForm, setAddressForm] = useState({
        label: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        province: '',
        postal_code: '',
        country: 'Cambodia',
        latitude: 11.5564,
        longitude: 104.9282,
        delivery_instructions: '',
        is_default: false,
    });

    // Update profile when data loads
    React.useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.user?.name || '',
                email: profile.user?.email || '',
                phone: profile.user?.phone || '',
                birth_date: profile.birth_date || '',
                gender: profile.gender || '',
                preferred_language: profile.preferred_language || 'en',
                marketing_consent: profile.marketing_consent || false,
            });
        }
    }, [profile]);

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/customer/profile', data),
        onSuccess: () => {
            toastSuccess('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
            setEditMode(false);
        },
        onError: () => toastError('Failed to update profile')
    });

    // Address mutations
    const createAddressMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/customer/addresses', data),
        onSuccess: () => {
            toastSuccess('Address added successfully');
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            setShowAddressModal(false);
            resetAddressForm();
        },
        onError: () => toastError('Failed to add address')
    });

    const updateAddressMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiPut(`/api/customer/addresses/${id}`, data),
        onSuccess: () => {
            toastSuccess('Address updated successfully');
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            setShowAddressModal(false);
            setEditingAddress(null);
            resetAddressForm();
        },
        onError: () => toastError('Failed to update address')
    });

    const deleteAddressMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/customer/addresses/${id}`),
        onSuccess: () => {
            toastSuccess('Address deleted');
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
        },
        onError: () => toastError('Failed to delete address')
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/customer/addresses/${id}/set-default`, {}),
        onSuccess: () => {
            toastSuccess('Default address updated');
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
        },
        onError: () => toastError('Failed to set default address')
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(formData);
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        resetAddressForm();
        setShowAddressModal(true);
    };

    const handleEditAddress = (address: Address) => {
        setEditingAddress(address);
        setAddressForm({
            label: address.label,
            address_line_1: address.address_line_1,
            address_line_2: address.address_line_2 || '',
            city: address.city,
            province: address.province,
            postal_code: address.postal_code,
            country: address.country || 'Cambodia',
            latitude: address.latitude || 11.5564,
            longitude: address.longitude || 104.9282,
            delivery_instructions: address.delivery_instructions || '',
            is_default: address.is_default,
        });
        setShowAddressModal(true);
    };

    const handleSaveAddress = () => {
        if (editingAddress) {
            updateAddressMutation.mutate({ id: editingAddress.id, data: addressForm });
        } else {
            createAddressMutation.mutate(addressForm);
        }
    };

    const resetAddressForm = () => {
        setAddressForm({
            label: '',
            address_line_1: '',
            address_line_2: '',
            city: '',
            province: '',
            postal_code: '',
            country: 'Cambodia',
            latitude: 11.5564,
            longitude: 104.9282,
            delivery_instructions: '',
            is_default: false,
        });
    };

    // Geocoding: Fetch address from coordinates
    const fetchAddressFromCoords = async (lat: number, lng: number) => {
        setLoadingLocation(true);
        setAddressForm(prev => ({ ...prev, latitude: lat, longitude: lng }));

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data.address) {
                setAddressForm(prev => ({
                    ...prev,
                    address_line_1: data.address.road || data.address.house_number || prev.address_line_1,
                    city: data.address.city || data.address.town || data.address.village || prev.city,
                    province: data.address.state || prev.province,
                    postal_code: data.address.postcode || prev.postal_code,
                    country: data.address.country || prev.country
                }));
            }
        } catch (error) {
            console.error("Geocoding failed", error);
        } finally {
            setLoadingLocation(false);
        }
    };

    // Get current location
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toastError("Geolocation is not supported by your browser");
            return;
        }
        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchAddressFromCoords(latitude, longitude);
            },
            (error) => {
                console.error(error);
                toastError("Unable to retrieve your location. Check browser permissions.");
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    return (
        <CustomerLayout>
            <div className="p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <User className="w-8 h-8 text-purple-600" />
                            My Profile
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage your personal information and preferences
                        </p>
                    </div>
                    {!editMode && (
                        <Button onClick={() => setEditMode(true)} variant="outline">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}
                </div>

                {/* Personal Information */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Personal Information
                        </h2>

                        <div className="flex justify-center mb-6">
                            <ProfilePictureUpload
                                name={profile?.user?.name || ''}
                                currentAvatar={profile?.user?.avatar}
                                size="xl"
                                onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Birth Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Gender
                                </label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                >
                                    <option value="">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Preferred Language
                                </label>
                                <select
                                    value={formData.preferred_language}
                                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                                    disabled={!editMode}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                >
                                    <option value="en">English</option>
                                    <option value="km">ខ្មែរ (Khmer)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.marketing_consent}
                                    onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                                    disabled={!editMode}
                                    className="w-5 h-5 rounded text-purple-600"
                                />
                                <span className="text-sm text-muted-foreground">
                                    I want to receive promotional emails and offers
                                </span>
                            </label>
                        </div>

                        {editMode && (
                            <div className="flex gap-3 mt-6">
                                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                                    <Save className="w-4 h-4 mr-2" />
                                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button variant="outline" onClick={() => setEditMode(false)}>
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Addresses */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                <MapPin className="w-5 h-5 inline mr-2" />
                                My Addresses
                            </h2>
                            <Button onClick={handleAddAddress} variant="outline" size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Address
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {addresses.map((address: Address) => (
                                <motion.div
                                    key={address.id}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {address.label}
                                                </h3>
                                                {address.is_default && (
                                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {address.address_line_1}
                                                {address.address_line_2 && `, ${address.address_line_2}`}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {address.city}, {address.province} {address.postal_code}
                                            </p>
                                            {address.delivery_instructions && (
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                                    Instructions: {address.delivery_instructions}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            {!address.is_default && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setDefaultMutation.mutate(address.id)}
                                                    title="Set as Default"
                                                >
                                                    <Home className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEditAddress(address)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    if (confirm('Delete this address?')) {
                                                        deleteAddressMutation.mutate(address.id);
                                                    }
                                                }}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {addresses.length === 0 && (
                                <div className="text-center py-12">
                                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 dark:text-gray-400">
                                        No addresses saved. Add one to make ordering easier!
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Preferences */}
                <Card>
                    <CardContent className="p-6">
                        <NotificationPreferencesSettings />
                    </CardContent>
                </Card>

                {/* Address Modal with Map */}
                {showAddressModal && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => {
                                setShowAddressModal(false);
                                setEditingAddress(null);
                            }}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 space-y-4">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                                    </h2>

                                    {/* Map Section */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                <MapPin className="w-4 h-4 inline mr-1" />
                                                Pin Your Location
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleLocateMe}
                                                className="text-sm flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                                            >
                                                {loadingLocation ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Crosshair className="w-4 h-4" />
                                                )}
                                                Use My Location
                                            </button>
                                        </div>
                                        <div className="h-[250px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                                            <Map
                                                className="h-full w-full"
                                                center={[addressForm.latitude, addressForm.longitude]}
                                                zoom={15}
                                                markers={[{ lat: addressForm.latitude, lng: addressForm.longitude, isDraggable: true }]}
                                                onMarkerDragEnd={fetchAddressFromCoords}
                                                onMapClick={fetchAddressFromCoords}
                                            />
                                            {loadingLocation && (
                                                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                                                    <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                                        <span className="text-sm">Finding address...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Drag the marker or click on the map to set your delivery location
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-foreground">Label *</label>
                                            <input
                                                type="text"
                                                value={addressForm.label}
                                                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                                                placeholder="Home, Office, etc."
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-foreground">Address Line 1 *</label>
                                            <input
                                                type="text"
                                                value={addressForm.address_line_1}
                                                onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-foreground">Address Line 2</label>
                                            <input
                                                type="text"
                                                value={addressForm.address_line_2}
                                                onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground">City *</label>
                                            <input
                                                type="text"
                                                value={addressForm.city}
                                                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground">Province *</label>
                                            <input
                                                type="text"
                                                value={addressForm.province}
                                                onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground">Postal Code</label>
                                            <input
                                                type="text"
                                                value={addressForm.postal_code}
                                                onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground">Country</label>
                                            <input
                                                type="text"
                                                value={addressForm.country}
                                                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium mb-1 text-foreground">Delivery Instructions</label>
                                            <textarea
                                                value={addressForm.delivery_instructions}
                                                onChange={(e) => setAddressForm({ ...addressForm, delivery_instructions: e.target.value })}
                                                rows={2}
                                                placeholder="e.g., Ring the doorbell, leave at gate..."
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={addressForm.is_default}
                                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                                            className="w-5 h-5 rounded text-purple-600"
                                        />
                                        <span className="text-sm text-muted-foreground">Set as default address</span>
                                    </label>

                                    <div className="flex gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleSaveAddress}
                                            className="flex-1"
                                            disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                                        >
                                            {(createAddressMutation.isPending || updateAddressMutation.isPending) ? 'Saving...' : (editingAddress ? 'Update' : 'Add')} Address
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </div>
        </CustomerLayout>
    );
}
