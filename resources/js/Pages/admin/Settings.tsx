import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon, Save, Plus, Trash2, MapPin, Globe, Shield, Bell, Palette } from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

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
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSetting, setNewSetting] = useState({ key: '', value: '' });

  // Fetch locations & settings
  const { data: locationsData } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/api/admin/locations') });
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

  // Mutations
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
              <p className="text-slate-400 mt-1">Configure system preferences and options</p>
            </div>
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
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
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
      </div>
    </AdminLayout>
  );
}
