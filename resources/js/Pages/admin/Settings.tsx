import React, { useState } from 'react';
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
      toastSuccess('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: () => toastError('Failed to update profile')
  });

  // Password Update Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/user/change-password', data),
    onSuccess: () => {
      toastSuccess('Password changed successfully');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to change password')
  });

  // Settings Mutations
  const saveMutation = useMutation({
    mutationFn: (data: { settings: { key: string; value: any }[]; location_id?: number | null }) =>
      apiPost('/api/admin/settings/bulk-update', data),
    onSuccess: () => {
      toastSuccess('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditedValues({});
    },
    onError: () => toastError('Failed to save settings')
  });

  const createMutation = useMutation({
    mutationFn: (data: { key: string; value: any; location_id?: number | null }) =>
      apiPost('/api/admin/settings', data),
    onSuccess: () => {
      toastSuccess('Setting created');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddModal(false);
      setNewSetting({ key: '', value: '' });
    },
    onError: () => toastError('Failed to create setting')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/settings/${id}`),
    onSuccess: () => {
      toastSuccess('Setting deleted');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toastError('Failed to delete setting')
  });

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const settings = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
    saveMutation.mutate({ settings, location_id: selectedLocation });
  };

  const handleDelete = (setting: Setting) => {
    if (confirm(`Delete setting "${setting.key}"?`)) {
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
      toastError('Passwords do not match');
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
        toastError("Unable to retrieve your location");
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
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <SettingsIcon className="w-8 h-8 text-purple-400" />
                Settings
              </h1>
              <p className="text-slate-400 mt-1">Manage your profile and system settings</p>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5 w-fit">
            <button
              onClick={() => setActiveSection('profile')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeSection === 'profile'
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <User className="w-4 h-4" />
              My Profile
            </button>
            <button
              onClick={() => setActiveSection('system')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                activeSection === 'system'
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/10"
              )}
            >
              <SettingsIcon className="w-4 h-4" />
              System Settings
            </button>
          </div>
        </div>

        {activeSection === 'profile' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  Personal Information
                </h2>

                <div className="flex items-center gap-6 mb-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {getInitials(profileForm.name || 'AD')}
                    </div>
                    <button className="absolute bottom-0 right-0 w-7 h-7 bg-purple-600 rounded-full flex items-center justify-center border-2 border-slate-900 hover:bg-purple-700 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{profileForm.name}</h3>
                    <p className="text-gray-400">{profileForm.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      Administrator
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Phone className="w-4 h-4 inline mr-2" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="mt-6 bg-purple-600 hover:bg-purple-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>

              {/* Location */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    My Location
                  </h2>
                  <button
                    onClick={handleLocateMe}
                    className="text-sm flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium"
                  >
                    {loadingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                    Use My Location
                  </button>
                </div>

                <div className="h-[300px] rounded-xl overflow-hidden border border-white/10 relative mb-4">
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
                      <div className="flex items-center gap-2 text-white bg-slate-800 px-4 py-2 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Finding location...</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    placeholder="Your address will appear here after selecting on map"
                  />
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>Lat: {profileForm.latitude?.toFixed(6)}</span>
                  <span>Lng: {profileForm.longitude?.toFixed(6)}</span>
                </div>
              </div>
            </div>

            {/* Security Card */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-purple-400" />
                  Change Password
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.current_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordForm.new_password_confirmation}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-900 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={updatePasswordMutation.isPending || !passwordForm.current_password || !passwordForm.new_password}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {updatePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold text-white mb-4">Account Info</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Role</span>
                    <span className="text-white font-medium">Administrator</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Member Since</span>
                    <span className="text-white font-medium">
                      {new Date(user?.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Login</span>
                    <span className="text-white font-medium">Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* System Settings Section */
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                {hasChanges && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Button onClick={handleSave} disabled={saveMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700">
                      <Save className="w-4 h-4 mr-2" />
                      {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </motion.div>
                )}
                <Button onClick={() => setShowAddModal(true)} variant="secondary"
                  className="border-white/10 hover:bg-white/10">
                  <Plus className="w-4 h-4 mr-2" /> Add Setting
                </Button>
              </div>
            </div>

            {/* Location Filter */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm mb-6">
              <div className="flex items-center gap-4">
                <MapPin className="w-5 h-5 text-gray-400" />
                <select value={selectedLocation || ''} onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
                  className="flex-1 px-4 py-2 border border-white/10 rounded-lg bg-slate-900/50 text-white focus:ring-2 focus:ring-purple-500">
                  <option value="">Global Settings</option>
                  {locations.map((location: any) => (
                    <option key={location.id} value={location.id}>{location.name} (Location-specific)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Tabs */}
            {categories.length > 0 && (
              <div className="flex gap-2 overflow-x-auto mb-6">
                {categories.map((category) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <button key={category} onClick={() => setActiveTab(category)}
                      className={cn("flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap",
                        activeTab === category
                          ? "bg-purple-600 text-white shadow-lg"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10")}>
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{category}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Settings List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-white/5 border border-white/10 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : currentSettings.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center backdrop-blur-sm">
                <SettingsIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No settings found</h3>
                <p className="text-gray-400 text-sm mt-1">Click "Add Setting" to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSettings.map((setting) => {
                  const currentValue = editedValues[setting.key] ?? setting.value;
                  const isEdited = setting.key in editedValues;

                  return (
                    <motion.div key={setting.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn("bg-white/5 border rounded-xl p-4 backdrop-blur-sm transition-all",
                        isEdited ? "border-purple-500 bg-purple-500/10" : "border-white/10 hover:bg-white/10")}>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-white capitalize">{setting.label}</label>
                            {isEdited && (
                              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Modified</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{setting.key}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {typeof currentValue === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={currentValue}
                                onChange={(e) => handleValueChange(setting.key, e.target.checked)}
                                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-white/20" />
                              <span className="text-sm text-gray-400">{currentValue ? 'Enabled' : 'Disabled'}</span>
                            </label>
                          ) : (
                            <input type="text"
                              value={typeof currentValue === 'object' ? JSON.stringify(currentValue) : currentValue}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="px-4 py-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:ring-2 focus:ring-purple-500 min-w-[300px]" />
                          )}

                          <Button size="sm" variant="danger" onClick={() => handleDelete(setting)}
                            className="h-9 w-9 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()}>
                    <div className="p-6 space-y-4">
                      <h2 className="text-2xl font-bold text-white">Add New Setting</h2>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Key *</label>
                        <input type="text" value={newSetting.key}
                          onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                          placeholder="e.g., general.site_name"
                          className="w-full px-4 py-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:ring-2 focus:ring-purple-500" />
                        <p className="text-xs text-gray-500 mt-1">Use format: category.setting_name</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Value *</label>
                        <input type="text" value={newSetting.value}
                          onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                          placeholder="Setting value"
                          className="w-full px-4 py-2 border border-white/10 rounded-lg bg-slate-900 text-white focus:ring-2 focus:ring-purple-500" />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1 border-white/10">
                          Cancel
                        </Button>
                        <Button onClick={handleCreate}
                          disabled={!newSetting.key || !newSetting.value || createMutation.isPending}
                          className="flex-1 bg-purple-600 hover:bg-purple-700">
                          {createMutation.isPending ? 'Creating...' : 'Create'}
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
    </AdminLayout>
  );
}
