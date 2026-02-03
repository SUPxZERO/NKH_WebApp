import React, { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePage } from '@inertiajs/react';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  MapPin,
  Globe,
  Shield,
  Bell,
  Palette,
  User,
  Mail,
  Phone,
  Camera,
  Crosshair,
  Loader2,
  Key,
  Lock
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import Map from '@/app/components/ui/Map';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';

interface Setting {
  id: number;
  category: string;
  key: string;
  label: string;
  value: any;
  location_id: number | null;
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { props } = usePage<{ auth: { user: any } }>();
  const user = props.auth?.user;

  const [activeSection, setActiveSection] = useState<'profile' | 'system'>('profile');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '' });
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    latitude: user?.latitude || 11.5564,
    longitude: user?.longitude || 104.9282,
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Fetch locations & settings
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/admin/locations')
  });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings', selectedLocation],
    queryFn: () => apiGet(`/api/admin/settings?location_id=${selectedLocation || ''}`),
  });

  const locations = locationsData?.data || [];
  const settingsByCategory: Record<string, Setting[]> = settingsData?.data || {};
  const categories = Object.keys(settingsByCategory);

  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeTab)) {
      setActiveTab(categories[0]);
    }
  }, [categories]);

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiPut('/api/user/profile', data),
    onSuccess: () => {
      toastSuccess(t('admin.settings.messages.profile_updated') as string);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => toastError(t('admin.settings.messages.profile_update_failed') as string)
  });

  // Password Update Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/user/change-password', data),
    onSuccess: () => {
      toastSuccess(t('admin.settings.messages.password_changed') as string);
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.settings.messages.password_change_failed') as string)
  });

  // Settings Mutations
  const saveMutation = useMutation({
    mutationFn: (data: { settings: { key: string; value: any }[]; location_id?: number | null }) =>
      apiPost('/api/admin/settings/bulk-update', data),
    onSuccess: () => {
      toastSuccess(t('admin.settings.messages.settings_saved') as string);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditedValues({});
    },
    onError: () => toastError(t('admin.settings.messages.settings_save_failed') as string)
  });

  const createMutation = useMutation({
    mutationFn: (data: { key: string; value: any; location_id?: number | null }) =>
      apiPost('/api/admin/settings', data),
    onSuccess: () => {
      toastSuccess(t('admin.settings.messages.setting_created') as string);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddModal(false);
      setNewSetting({ key: '', value: '' });
    },
    onError: () => toastError(t('admin.settings.messages.setting_create_failed') as string)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/settings/${id}`),
    onSuccess: () => {
      toastSuccess(t('admin.settings.messages.setting_deleted') as string);
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toastError(t('admin.settings.messages.setting_delete_failed') as string)
  });

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const settings = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
    saveMutation.mutate({ settings, location_id: selectedLocation });
  };

  const handleDelete = (setting: Setting) => {
    if (confirm(`${t('admin.categories.actions.confirm_delete') as string} "${setting.key}"?`)) { // Reusing delete text or create new key if specific needed
      deleteMutation.mutate(setting.id);
    }
  };

  const handleCreate = () => {
    createMutation.mutate({ key: newSetting.key, value: newSetting.value, location_id: selectedLocation });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileForm);
  };

  const handleChangePassword = () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toastError(t('admin.settings.messages.passwords_mismatch') as string);
      return;
    }
    updatePasswordMutation.mutate(passwordForm);
  };

  // Geocoding: Fetch address from coordinates
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setLoadingLocation(true);
    setProfileForm(prev => ({ ...prev, latitude: lat, longitude: lng }));

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();

      if (data.display_name) {
        setProfileForm(prev => ({
          ...prev,
          address: data.display_name
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
      toastError(t('admin.settings.messages.geolocation_error') as string);
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
        toastError(t('admin.settings.messages.location_error') as string);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const hasChanges = Object.keys(editedValues).length > 0;
  const currentSettings = settingsByCategory[activeTab] || [];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      general: Globe,
      security: Shield,
      notifications: Bell,
      appearance: Palette
    };
    return icons[category] || SettingsIcon;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-pink-500/10 dark:bg-pink-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
                  <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent truncate">
                    {t('admin.settings.title')}
                  </span>
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.settings.subtitle')}</p>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1.5 sm:gap-2 bg-card border border-border rounded-lg sm:rounded-xl p-1 sm:p-1.5 w-full sm:w-fit">
              <button
                onClick={() => setActiveSection('profile')}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
                  activeSection === 'profile'
                    ? "bg-purple-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t('admin.settings.tabs.profile')}
              </button>
              <button
                onClick={() => setActiveSection('system')}
                className={cn(
                  "flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all",
                  activeSection === 'system'
                    ? "bg-purple-600 text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t('admin.settings.tabs.system')}
              </button>
            </div>
          </div>

          {activeSection === 'profile' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Personal Info */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    {t('admin.settings.profile.title')}
                  </h2>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                    {/* Avatar */}
                    <ProfilePictureUpload
                      name={profileForm.name}
                      currentAvatar={user?.avatar}
                      size="lg"
                    />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground">{profileForm.name}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">{profileForm.email}</p>
                      <span className="inline-block mt-0.5 sm:mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        {t('layout.user_menu.roles.admin')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-2" />
                        {t('admin.settings.profile.form.full_name')}
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-2" />
                        {t('admin.settings.profile.form.email')}
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-2" />
                        {t('admin.settings.profile.form.phone')}
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="mt-4 sm:mt-6 h-10 text-sm bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isPending ? t('admin.settings.profile.actions.saving') : t('admin.settings.profile.actions.save')}
                  </Button>
                </div>

                {/* Location */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                    <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      {t('admin.settings.profile.location.title')}
                    </h2>
                    <button
                      onClick={handleLocateMe}
                      className="text-xs sm:text-sm flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    >
                      {loadingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <Crosshair className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      {t('admin.settings.profile.location.use_my_location')}
                    </button>
                  </div>

                  <div className="h-[200px] sm:h-[300px] rounded-xl overflow-hidden border border-border relative mb-3 sm:mb-4">
                    <Map
                      className="h-full w-full"
                      center={[profileForm.latitude, profileForm.longitude]}
                      zoom={14}
                      markers={[{ lat: profileForm.latitude, lng: profileForm.longitude, isDraggable: true }]}
                      onMarkerDragEnd={fetchAddressFromCoords}
                      onMapClick={fetchAddressFromCoords}
                    />
                    {loadingLocation && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
                        <div className="flex items-center gap-2 text-white bg-secondary px-3 py-1.5 rounded-lg">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs sm:text-sm">{t('admin.settings.profile.location.finding_location')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.profile.location.address')}</label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      rows={2}
                      className="w-full px-3 sm:px-4 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500"
                      placeholder={t('admin.settings.profile.location.address_placeholder') as string || "Your address will appear here after selecting on map"}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{t('admin.settings.profile.location.lat')}: {profileForm.latitude?.toFixed(6)}</span>
                    <span>{t('admin.settings.profile.location.lng')}: {profileForm.longitude?.toFixed(6)}</span>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    {t('admin.settings.profile.security.title')}
                  </h2>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.profile.security.current')}</label>
                      <input
                        type="password"
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.profile.security.new')}</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.profile.security.confirm')}</label>
                      <input
                        type="password"
                        value={passwordForm.new_password_confirmation}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 h-10 text-sm bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={updatePasswordMutation.isPending || !passwordForm.current_password || !passwordForm.new_password}
                    className="w-full mt-4 sm:mt-6 h-10 text-sm bg-purple-600 hover:bg-purple-700"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {updatePasswordMutation.isPending ? t('admin.settings.profile.security.changing') : t('admin.settings.profile.security.button')}
                  </Button>
                </div>

                {/* Quick Stats */}
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">{t('admin.settings.profile.account.title')}</h2>
                  <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.settings.profile.account.role')}</span>
                      <span className="text-foreground font-medium">{t('admin.settings.profile.account.role')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.settings.profile.account.member_since')}</span>
                      <span className="text-foreground font-medium">
                        {new Date(user?.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('admin.settings.profile.account.last_login')}</span>
                      <span className="text-foreground font-medium">{t('admin.settings.profile.account.today')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* System Settings Section */
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  {hasChanges && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1">
                      <Button onClick={handleSave} disabled={saveMutation.isPending}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 sm:h-10 text-sm">
                        <Save className="w-4 h-4 mr-2" />
                        {saveMutation.isPending ? t('admin.settings.system.actions.saving') : t('admin.settings.system.actions.save_changes')}
                      </Button>
                    </motion.div>
                  )}
                  <Button onClick={() => setShowAddModal(true)} variant="secondary"
                    className="flex-1 border-border hover:bg-secondary h-9 sm:h-10 text-sm">
                    <Plus className="w-4 h-4 mr-2" /> {t('admin.settings.system.actions.add_setting')}
                  </Button>
                </div>
              </div>

              {/* Location Filter */}
              <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                  <select value={selectedLocation || ''} onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
                    className="flex-1 px-3 sm:px-4 py-2 h-9 sm:h-10 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500">
                    <option value="">{t('admin.settings.system.filter.global')}</option>
                    {locations.map((location: any) => (
                      <option key={location.id} value={location.id}>{location.name} ({t('admin.settings.system.filter.location_specific')})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Tabs */}
              {categories.length > 0 && (
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6">
                  {categories.map((category) => {
                    const Icon = getCategoryIcon(category);
                    return (
                      <button key={category} onClick={() => setActiveTab(category)}
                        className={cn("flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap text-xs sm:text-sm",
                          activeTab === category
                            ? "bg-purple-600 text-white shadow-lg"
                            : "bg-card text-muted-foreground hover:bg-secondary border border-border")}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="capitalize">{category}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Settings List */}
              {isLoading ? (
                <div className="space-y-2 sm:space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 sm:h-20 bg-card border border-border rounded-lg sm:rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : currentSettings.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center backdrop-blur-sm">
                  <SettingsIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-foreground font-medium text-sm sm:text-base">{t('admin.settings.system.empty.no_settings')}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">{t('admin.settings.system.empty.click_add')}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {currentSettings.map((setting) => {
                    const currentValue = editedValues[setting.key] ?? setting.value;
                    const isEdited = setting.key in editedValues;

                    return (
                      <motion.div key={setting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={cn("bg-card border rounded-lg sm:rounded-xl p-3 sm:p-4 backdrop-blur-sm transition-all",
                          isEdited ? "border-purple-500 bg-purple-500/10" : "border-border hover:bg-secondary")}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="flex-1 space-y-0.5 sm:space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="font-medium text-sm text-foreground capitalize truncate">{setting.label}</label>
                              {isEdited && (
                                <span className="text-[10px] sm:text-xs bg-purple-600 text-white px-1.5 sm:px-2 py-0.5 rounded-full">{t('admin.settings.system.list.modified')}</span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-xs text-muted-foreground font-mono truncate">{setting.key}</div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3">
                            {typeof currentValue === 'boolean' ? (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={currentValue}
                                  onChange={(e) => handleValueChange(setting.key, e.target.checked)}
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded text-purple-600 focus:ring-purple-500 bg-background border-border" />
                                <span className="text-xs sm:text-sm text-muted-foreground">{currentValue ? t('admin.settings.system.list.on') : t('admin.settings.system.list.off')}</span>
                              </label>
                            ) : (
                              <input type="text"
                                value={typeof currentValue === 'object' ? JSON.stringify(currentValue) : currentValue}
                                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 h-9 sm:h-10 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500 sm:min-w-[200px] md:min-w-[300px]" />
                            )}

                            <Button size="sm" variant="danger" onClick={() => handleDelete(setting)}
                              className="h-9 w-9 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex-shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Add Setting Modal */}
              {showAddModal && (
                <>
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowAddModal(false)} />
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
                    <motion.div className="bg-card border border-border rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full"
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
                      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('admin.settings.system.modal.title')}</h2>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.system.modal.key')} *</label>
                          <input type="text" value={newSetting.key}
                            onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                            placeholder={t('admin.settings.system.modal.key_placeholder') as string || "e.g., general.site_name"}
                            className="w-full px-3 sm:px-4 py-2 h-10 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500" />
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{t('admin.settings.system.modal.key_hint')}</p>
                        </div>

                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5 sm:mb-2">{t('admin.settings.system.modal.value')} *</label>
                          <input type="text" value={newSetting.value}
                            onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                            placeholder={(t('admin.settings.system.modal.value_placeholder') as string) || "Setting value"}
                            className="w-full px-3 sm:px-4 py-2 h-10 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-purple-500" />
                        </div>

                        <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                          <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1 h-10 text-sm border-border">
                            {t('admin.settings.system.actions.cancel')}
                          </Button>
                          <Button onClick={handleCreate}
                            disabled={!newSetting.key || !newSetting.value || createMutation.isPending}
                            className="flex-1 h-10 text-sm bg-purple-600 hover:bg-purple-700">
                            {createMutation.isPending ? t('admin.settings.system.actions.creating') : t('admin.settings.system.actions.create')}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
