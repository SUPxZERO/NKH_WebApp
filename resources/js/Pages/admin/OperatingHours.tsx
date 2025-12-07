import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Clock,
    Copy,
    Save,
    MapPin,
    Coffee,
    ShoppingBag,
    Truck,
    Plus,
    X
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { toastSuccess, toastError } from '@/app/utils/toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SERVICE_TYPES = [
    { value: 'dine-in', label: 'Dine-In', icon: Coffee, color: 'purple' },
    { value: 'pickup', label: 'Pickup', icon: ShoppingBag, color: 'blue' },
    { value: 'delivery', label: 'Delivery', icon: Truck, color: 'green' }
];

interface OperatingHour {
    id?: number;
    day_of_week: number;
    service_type: string;
    opening_time: string;
    closing_time: string;
}

export default function OperatingHours() {
    const queryClient = useQueryClient();
    const [selectedLocation, setSelectedLocation] = useState<number>(1);
    const [selectedServiceType, setSelectedServiceType] = useState('dine-in');
    const [schedules, setSchedules] = useState<Record<number, OperatingHour>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // Fetch locations
    const { data: locationsData } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
    });

    // Fetch operating hours for selected location
    const { data: hoursData, isLoading } = useQuery({
        queryKey: ['operating-hours', selectedLocation],
        queryFn: () => apiGet(`/api/admin/operating-hours/location/${selectedLocation}`),
        enabled: !!selectedLocation
    });

    const locations = locationsData?.data || [];
    const existingHours: Record<number, any> = hoursData?.data || {};

    // Initialize schedules when data loads
    React.useEffect(() => {
        if (existingHours) {
            const newSchedules: Record<number, OperatingHour> = {};
            DAYS.forEach((_, dayIndex) => {
                const dayHours = existingHours[dayIndex] || [];
                const serviceHour = dayHours.find((h: any) => h.service_type === selectedServiceType);
                if (serviceHour) {
                    newSchedules[dayIndex] = {
                        id: serviceHour.id,
                        day_of_week: dayIndex,
                        service_type: selectedServiceType,
                        opening_time: serviceHour.opening_time.substring(0, 5),
                        closing_time: serviceHour.closing_time.substring(0, 5)
                    };
                }
            });
            setSchedules(newSchedules);
            setHasChanges(false);
        }
    }, [existingHours, selectedServiceType]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: { location_id: number; service_type: string; hours: OperatingHour[] }) =>
            apiPost('/api/admin/operating-hours/bulk-update', data),
        onSuccess: () => {
            toastSuccess('Operating hours saved');
            queryClient.invalidateQueries({ queryKey: ['operating-hours', selectedLocation] });
            setHasChanges(false);
        },
        onError: () => toastError('Failed to save operating hours')
    });

    // Copy to all days mutation
    const copyMutation = useMutation({
        mutationFn: (data: { location_id: number; source_day: number; service_type: string }) =>
            apiPost('/api/admin/operating-hours/copy-to-all-days', data),
        onSuccess: () => {
            toastSuccess('Hours copied to all days');
            queryClient.invalidateQueries({ queryKey: ['operating-hours', selectedLocation] });
        },
        onError: () => toastError('Failed to copy hours')
    });

    const updateSchedule = (day: number, field: 'opening_time' | 'closing_time', value: string) => {
        setSchedules(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                day_of_week: day,
                service_type: selectedServiceType,
                [field]: value
            }
        }));
        setHasChanges(true);
    };

    const toggleDay = (day: number) => {
        if (schedules[day]) {
            const newSchedules = { ...schedules };
            delete newSchedules[day];
            setSchedules(newSchedules);
        } else {
            setSchedules(prev => ({
                ...prev,
                [day]: {
                    day_of_week: day,
                    service_type: selectedServiceType,
                    opening_time: '09:00',
                    closing_time: '22:00'
                }
            }));
        }
        setHasChanges(true);
    };

    const handleSave = () => {
        const hours = Object.values(schedules);
        saveMutation.mutate({
            location_id: selectedLocation,
            service_type: selectedServiceType,
            hours
        });
    };

    const handleCopyToAll = (sourceDay: number) => {
        if (!schedules[sourceDay]) {
            toastError('Please set hours for this day first');
            return;
        }
        if (confirm(`Copy ${DAYS[sourceDay]}'s hours to all other days?`)) {
            copyMutation.mutate({
                location_id: selectedLocation,
                source_day: sourceDay,
                service_type: selectedServiceType
            });
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors">
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                Operating Hours
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">
                                Manage business hours by location and service type
                            </p>
                        </div>
                        {hasChanges && (
                            <Button
                                onClick={handleSave}
                                disabled={saveMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        )}
                    </div>

                    {/* Location Selector */}
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(Number(e.target.value))}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                            >
                                {locations.map((location: any) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Type Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {SERVICE_TYPES.map((service) => {
                            const Icon = service.icon;
                            const isActive = selectedServiceType === service.value;
                            return (
                                <button
                                    key={service.value}
                                    onClick={() => setSelectedServiceType(service.value)}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap",
                                        isActive
                                            ? "bg-purple-600 text-white shadow-lg"
                                            : "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                    {service.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Weekly Schedule */}
                    {isLoading ? (
                        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                            <div className="animate-pulse space-y-4">
                                {[...Array(7)].map((_, i) => (
                                    <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {DAYS.map((day, index) => {
                                const isActive = !!schedules[index];
                                const schedule = schedules[index];

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className={cn(
                                            "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm transition-all",
                                            isActive && "ring-2 ring-purple-500 dark:ring-purple-400"
                                        )}>
                                            <div className="flex flex-wrap items-center gap-4">
                                                {/* Toggle */}
                                                <label className="flex items-center gap-3 cursor-pointer min-w-[140px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => toggleDay(index)}
                                                        className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20"
                                                    />
                                                    <span className={cn(
                                                        "font-semibold",
                                                        isActive ? "text-gray-900 dark:text-white" : "text-gray-400"
                                                    )}>
                                                        {day}
                                                    </span>
                                                </label>

                                                {/* Time Inputs */}
                                                {isActive ? (
                                                    <>
                                                        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                                                            <input
                                                                type="time"
                                                                value={schedule.opening_time}
                                                                onChange={(e) => updateSchedule(index, 'opening_time', e.target.value)}
                                                                className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                            />
                                                            <span className="text-gray-500 dark:text-gray-400">to</span>
                                                            <input
                                                                type="time"
                                                                value={schedule.closing_time}
                                                                onChange={(e) => updateSchedule(index, 'closing_time', e.target.value)}
                                                                className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                                            />
                                                        </div>

                                                        {/* Copy Button */}
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleCopyToAll(index)}
                                                            disabled={copyMutation.isPending}
                                                        >
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Copy to All
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 italic">Closed</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
