import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  MapPin,
  X,
  Check
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
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

  // Fetch locations
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/admin/locations')
  });

  // Fetch settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings', selectedLocation],
    queryFn: () => apiGet(`/api/admin/settings?location_id=${selectedLocation || ''}`),
  });

  const locations = locationsData?.data || [];
  const settingsByCategory: Record<string, Setting[]> = settingsData?.data || {};
  const categories = Object.keys(settingsByCategory);

  // Use first category as default if activeTab doesn't exist
  React.useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeTab)) {
      setActiveTab(categories[0]);
    }
  }, [categories]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: { settings: { key: string; value: any }[]; location_id?: number | null }) =>
      apiPost('/api/admin/settings/bulk-update', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setEditedValues({});
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { key: string; value: any; location_id?: number | null }) =>
      apiPost('/api/admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowAddModal(false);
      setNewSetting({ key: '', value: '' });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/settings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const handleValueChange = (key: string, value: any) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const settings = Object.entries(editedValues).map(([key, value]) => ({ key, value }));
    saveMutation.mutate({
      settings,
      location_id: selectedLocation
    });
  };

  const handleDelete = (setting: Setting) => {
    if (confirm(`Delete setting "${setting.key}"?`)) {
      deleteMutation.mutate(setting.id);
    }
  };

  const handleCreate = () => {
    createMutation.mutate({
      key: newSetting.key,
      value: newSetting.value,
      location_id: selectedLocation
    });
  };

  const hasChanges = Object.keys(editedValues).length > 0;
  const currentSettings = settingsByCategory[activeTab] || [];

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-purple-600" />
              System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Configure application settings and preferences
            </p>
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </div>
        </div>

        {/* Location Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <MapPin className="w-5 h-5 text-gray-400" />
              <select
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value ? Number(e.target.value) : null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Global Settings</option>
                {locations.map((location: any) => (
                  <option key={location.id} value={location.id}>
                    {location.name} (Location-specific)
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={cn(
                  "px-6 py-3 font-medium transition-all whitespace-nowrap capitalize",
                  activeTab === category
                    ? "border-b-2 border-purple-600 text-purple-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Settings List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : currentSettings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No settings found. Click "Add Setting" to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {currentSettings.map((setting) => {
              const currentValue = editedValues[setting.key] ?? setting.value;
              const isEdited = setting.key in editedValues;

              return (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className={cn(isEdited && "ring-2 ring-purple-500")}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <label className="font-medium text-gray-900 dark:text-white capitalize">
                              {setting.label}
                            </label>
                            {isEdited && (
                              <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded-full">
                                Modified
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {setting.key}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {typeof currentValue === 'boolean' ? (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentValue}
                                onChange={(e) => handleValueChange(setting.key, e.target.checked)}
                                className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {currentValue ? 'Enabled' : 'Disabled'}
                              </span>
                            </label>
                          ) : (
                            <input
                              type="text"
                              value={typeof currentValue === 'object' ? JSON.stringify(currentValue) : currentValue}
                              onChange={(e) => handleValueChange(setting.key, e.target.value)}
                              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-w-[300px]"
                            />
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(setting)}
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add Setting Modal */}
        {showAddModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setShowAddModal(false)}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Add New Setting
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Key *
                    </label>
                    <input
                      type="text"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                      placeholder="e.g., general.site_name"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use format: category.setting_name
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Value *
                    </label>
                    <input
                      type="text"
                      value={newSetting.value}
                      onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                      placeholder="Setting value"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!newSetting.key || !newSetting.value || createMutation.isPending}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
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
