import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Building, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock,
  Plus,
  Settings,
  BarChart3,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import EnhancedButton from '@/app/components/ui/EnhancedButton';
import Modal from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/app/libs/apiClient';
import { ApiResponse } from '@/app/types/domain';

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  status: 'active' | 'inactive' | 'maintenance';
  manager_name: string;
  today_revenue: number;
  today_orders: number;
  staff_count: number;
  avg_prep_time: number;
  rating: number;
  is_online: boolean;
  last_sync: string;
}

interface LocationMetrics {
  revenue: number;
  orders: number;
  customers: number;
  avg_order_value: number;
  peak_hours: string[];
}

export function MultiLocationManager() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'analytics'>('grid');
  const qc = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['admin.locations'],
    queryFn: () => apiGet<ApiResponse<Location[]>>('/admin/locations').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: locationMetrics } = useQuery({
    queryKey: ['admin.location-metrics'],
    queryFn: () => apiGet<ApiResponse<Record<number, LocationMetrics>>>('/admin/locations/metrics').then(r => r.data),
    refetchInterval: 60000,
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ locationId, data }: { locationId: number; data: Partial<Location> }) =>
      apiPatch(`/admin/locations/${locationId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin.locations'] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-500/20';
      case 'inactive': return 'text-gray-400 bg-gray-500/20';
      case 'maintenance': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getTotalMetrics = () => {
    return locations.reduce((acc, location) => ({
      revenue: acc.revenue + location.today_revenue,
      orders: acc.orders + location.today_orders,
      staff: acc.staff + location.staff_count,
      avgRating: acc.avgRating + location.rating
    }), { revenue: 0, orders: 0, staff: 0, avgRating: 0 });
  };

  const totals = getTotalMetrics();
  const avgRating = locations.length > 0 ? totals.avgRating / locations.length : 0;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Multi-Location Management</h2>
              <p className="text-gray-400">Monitor and manage all restaurant locations</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-fuchsia-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'analytics' 
                      ? 'bg-fuchsia-600 text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Analytics
                </button>
              </div>
              
              <EnhancedButton
                variant="gradient"
                onClick={() => setShowAddModal(true)}
                leftIcon={<Plus className="w-4 h-4" />}
                haptic
              >
                Add Location
              </EnhancedButton>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">${totals.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Revenue Today</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.orders}</div>
                  <div className="text-sm text-gray-400">Total Orders Today</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-fuchsia-500/20">
                  <Users className="w-5 h-5 text-fuchsia-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totals.staff}</div>
                  <div className="text-sm text-gray-400">Total Staff</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-400">Avg Rating</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations Grid/Analytics */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {locations.map((location) => (
              <motion.div
                key={location.id}
                layout
                className="group"
              >
                <Card className="hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all duration-300">
                  <CardContent className="p-6">
                    {/* Location Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{location.name}</h3>
                          <p className="text-sm text-gray-400">{location.city}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {location.is_online ? (
                          <Wifi className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-rose-400" />
                        )}
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                          {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    {/* Location Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{location.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>Manager: {location.manager_name}</span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <div className="text-lg font-bold text-emerald-400">
                          ${location.today_revenue.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">Revenue</div>
                      </div>
                      
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <div className="text-lg font-bold text-blue-400">
                          {location.today_orders}
                        </div>
                        <div className="text-xs text-gray-400">Orders</div>
                      </div>
                      
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <div className="text-lg font-bold text-fuchsia-400">
                          {location.staff_count}
                        </div>
                        <div className="text-xs text-gray-400">Staff</div>
                      </div>
                      
                      <div className="text-center p-3 rounded-xl bg-white/5">
                        <div className="text-lg font-bold text-orange-400">
                          {location.avg_prep_time}min
                        </div>
                        <div className="text-xs text-gray-400">Prep Time</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <EnhancedButton
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedLocation(location)}
                        leftIcon={<BarChart3 className="w-4 h-4" />}
                      >
                        Analytics
                      </EnhancedButton>
                      
                      <EnhancedButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Navigate to location settings */}}
                        haptic
                      >
                        <Settings className="w-4 h-4" />
                      </EnhancedButton>
                    </div>

                    {/* Status Indicators */}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Last sync: {new Date(location.last_sync).toLocaleTimeString()}</span>
                        <div className="flex items-center gap-1">
                          {!location.is_online && (
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                          )}
                          <span className={location.is_online ? 'text-emerald-400' : 'text-rose-400'}>
                            {location.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Location Performance Analytics</h3>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h4 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h4>
                  <p className="text-gray-400 mb-4">
                    Comprehensive location comparison, performance trends, and predictive analytics.
                  </p>
                  <EnhancedButton variant="gradient">
                    Enable Analytics
                  </EnhancedButton>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Location Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Location"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Location Name" placeholder="Downtown Branch" />
            <Input label="Manager Name" placeholder="John Doe" />
            <Input label="Address" placeholder="123 Main St" />
            <Input label="City" placeholder="New York" />
            <Input label="Phone" placeholder="+1 (555) 123-4567" />
            <Input label="Email" placeholder="downtown@restaurant.com" />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <EnhancedButton
              variant="secondary"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </EnhancedButton>
            <EnhancedButton
              variant="gradient"
              leftIcon={<Plus className="w-4 h-4" />}
              haptic
              soundEffect="success"
            >
              Add Location
            </EnhancedButton>
          </div>
        </div>
      </Modal>

      {/* Location Detail Modal */}
      <Modal
        open={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        title={`${selectedLocation?.name} Analytics`}
        size="xl"
      >
        {selectedLocation && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-fuchsia-400" />
              <h4 className="text-lg font-semibold mb-2">Detailed Analytics</h4>
              <p className="text-gray-400">
                Location-specific performance metrics and insights for {selectedLocation.name}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MultiLocationManager;
