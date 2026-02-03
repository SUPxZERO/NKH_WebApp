import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Home,
    Crosshair,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
    UserCircle
} from 'lucide-react';
import { Head } from '@inertiajs/react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import Map from '@/app/components/ui/Map';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';
import NotificationPreferencesSettings from '@/app/components/customer/NotificationPreferencesSettings';
import { useTranslation } from '@/app/hooks/useTranslation';

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
    const { t } = useTranslation();
    const [editMode, setEditMode] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Fetch profile
    const { data: profileData, isLoading: isProfileLoading } = useQuery({
        queryKey: ['customer', 'profile'],
        queryFn: () => apiGet('/api/customer/profile')
    });

    // Fetch addresses
    const { data: addressesData, isLoading: isAddressesLoading } = useQuery({
        queryKey: ['customer', 'addresses'],
        queryFn: () => apiGet('/api/customer/addresses')
    });

    // Handle nested data structure from API - could be { data: ... } or direct object
    const profile = profileData?.data ?? profileData;
    const addresses = addressesData?.data || addressesData || [];

    // Profile form state - initialized empty, populated by useEffect
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        preferred_language: 'en',
        marketing_consent: false,
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
            // Handle both nested user object and flat structure
            const userData = profile.user || profile;
            setFormData({
                name: userData?.name || '',
                email: userData?.email || '',
                phone: userData?.phone || profile?.phone || '',
                birth_date: profile?.birth_date || '',
                gender: profile?.gender || '',
                preferred_language: profile?.preferred_language || 'en',
                marketing_consent: profile?.marketing_consent || false,
            });
        }
    }, [profile]);

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/customer/profile', data),
        onSuccess: () => {
            toastSuccess(t('profile.messages.update_success'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
            setEditMode(false);
        },
        onError: () => toastError(t('profile.messages.update_error'))
    });

    // Address mutations
    const createAddressMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/customer/addresses', data),
        onSuccess: () => {
            toastSuccess(t('profile.messages.address_added'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            setShowAddressModal(false);
            resetAddressForm();
        },
        onError: () => toastError(t('profile.messages.address_add_error'))
    });

    const updateAddressMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            apiPut(`/api/customer/addresses/${id}`, data),
        onSuccess: () => {
            toastSuccess(t('profile.messages.address_updated'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
            setShowAddressModal(false);
            setEditingAddress(null);
            resetAddressForm();
        },
        onError: () => toastError(t('profile.messages.address_update_error'))
    });

    const deleteAddressMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/customer/addresses/${id}`),
        onSuccess: () => {
            toastSuccess(t('profile.messages.address_deleted'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
        },
        onError: () => toastError(t('profile.messages.address_delete_error'))
    });

    const setDefaultMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/customer/addresses/${id}/set-default`, {}),
        onSuccess: () => {
            toastSuccess(t('profile.messages.default_updated'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
        },
        onError: () => toastError(t('profile.messages.default_error'))
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
            toastError(t('profile.messages.geo_not_supported'));
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
                toastError(t('profile.messages.geo_error'));
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // Get user data from profile (handles both nested and flat structures)
    const userData = profile?.user || profile;

    return (
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <Head>
                    <title>{t('profile.title')} - NKH Restaurant</title>
                </Head>
                <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                                <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                                {t('profile.title')}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                                {t('profile.subtitle')}
                            </p>
                        </div>
                        {!editMode && !isProfileLoading && (
                            <Button onClick={() => setEditMode(true)} variant="outline" size="sm" className="self-start sm:self-auto">
                                <Edit className="w-4 h-4 mr-2" />
                                {t('profile.edit')}
                            </Button>
                        )}
                    </div>

                    {/* Loading State */}
                    {isProfileLoading && (
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <div className="animate-pulse space-y-4">
                                    <div className="flex justify-center">
                                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Personal Information */}
                    {!isProfileLoading && (
                        <Card>
                            <CardContent className="p-4 sm:p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    {t('profile.personal_info')}
                                </h2>

                                <div className="flex justify-center mb-4 sm:mb-6">
                                    <ProfilePictureUpload
                                        name={userData?.name || formData.name || ''}
                                        currentAvatar={userData?.avatar || userData?.image_path}
                                        size="xl"
                                        onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            <User className="w-4 h-4 inline mr-2" />
                                            {t('profile.full_name')}
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
                                            {t('profile.email')}
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
                                            {t('profile.phone')}
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
                                            {t('profile.birth_date')}
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
                                            {t('profile.gender')}
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            disabled={!editMode}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                                        >
                                            <option value="">{t('profile.genders.na')}</option>
                                            <option value="male">{t('profile.genders.male')}</option>
                                            <option value="female">{t('profile.genders.female')}</option>
                                            <option value="other">{t('profile.genders.other')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('profile.language')}
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
                                            {t('profile.marketing_consent')}
                                        </span>
                                    </label>
                                </div>

                                {editMode && (
                                    <div className="flex gap-3 mt-6">
                                        <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {updateProfileMutation.isPending ? t('profile.saving') : t('profile.save')}
                                        </Button>
                                        <Button variant="outline" onClick={() => setEditMode(false)}>
                                            {t('profile.cancel')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Addresses */}
                    <Card>
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                                    {t('profile.addresses.title')}
                                </h2>
                                <Button onClick={handleAddAddress} variant="outline" size="sm" className="self-start sm:self-auto">
                                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                                    <span className="sm:inline">{t('profile.addresses.add')}</span>
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {addresses.map((address: Address) => (
                                    <motion.div
                                        key={address.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 sm:p-4"
                                        whileHover={{ scale: 1.005 }}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {address.label}
                                                    </h3>
                                                    {address.is_default && (
                                                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded-full">
                                                            {t('profile.addresses.default')}
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
                                                        {t('profile.addresses.instructions')}: {address.delivery_instructions}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-0">
                                                {!address.is_default && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setDefaultMutation.mutate(address.id)}
                                                        title={t('profile.addresses.set_default')}
                                                        className="p-1.5 sm:p-2"
                                                    >
                                                        <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditAddress(address)}
                                                    className="p-1.5 sm:p-2"
                                                >
                                                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        if (confirm(t('profile.addresses.delete_confirm'))) {
                                                            deleteAddressMutation.mutate(address.id);
                                                        }
                                                    }}
                                                    className="text-red-600 hover:bg-red-50 p-1.5 sm:p-2"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}

                                {addresses.length === 0 && (
                                    <div className="text-center py-6 sm:py-12">
                                        <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                            {t('profile.addresses.no_addresses')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <Card>
                        <CardContent className="p-4 sm:p-6">
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
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                                <motion.div
                                    className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                            {editingAddress ? t('profile.addresses.edit') : t('profile.addresses.add')}
                                        </h2>

                                        {/* Map Section */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <MapPin className="w-4 h-4 inline mr-1" />
                                                    {t('profile.addresses.pin_location')}
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
                                                    {t('profile.addresses.use_my_location')}
                                                </button>
                                            </div>
                                            <div className="h-[160px] sm:h-[250px] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
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
                                                            <span className="text-sm">{t('profile.addresses.finding')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {t('profile.addresses.drag_marker')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.label')} *</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.label}
                                                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                                                    placeholder={t('profile.addresses.label_placeholder')}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.line1')} *</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.address_line_1}
                                                    onChange={(e) => setAddressForm({ ...addressForm, address_line_1: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.line2')}</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.address_line_2}
                                                    onChange={(e) => setAddressForm({ ...addressForm, address_line_2: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.city')} *</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.city}
                                                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.province')} *</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.province}
                                                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.postal_code')}</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.postal_code}
                                                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.country')}</label>
                                                <input
                                                    type="text"
                                                    value={addressForm.country}
                                                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium mb-1 text-foreground">{t('profile.addresses.delivery_instructions')}</label>
                                                <textarea
                                                    value={addressForm.delivery_instructions}
                                                    onChange={(e) => setAddressForm({ ...addressForm, delivery_instructions: e.target.value })}
                                                    rows={2}
                                                    placeholder={t('profile.addresses.delivery_instructions_placeholder')}
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
                                            <span className="text-sm text-muted-foreground">{t('profile.addresses.set_default')}</span>
                                        </label>

                                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                                            <Button variant="outline" onClick={() => setShowAddressModal(false)} className="flex-1">
                                                {t('profile.cancel')}
                                            </Button>
                                            <Button
                                                onClick={handleSaveAddress}
                                                className="flex-1"
                                                disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                                            >
                                                {(createAddressMutation.isPending || updateAddressMutation.isPending) ? t('profile.saving') : (editingAddress ? t('profile.addresses.update') : t('profile.addresses.add_btn'))} {t('profile.addresses.address_suffix')}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </div>
            </CustomerLayout>
        </RequireAuth>
    );
}
