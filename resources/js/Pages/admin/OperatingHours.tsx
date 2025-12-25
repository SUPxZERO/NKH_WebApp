import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Clock, Copy, Save, MapPin, Coffee, ShoppingBag, Truck, CheckCircle, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { toastSuccess, toastError } from '@/app/utils/toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SERVICE_TYPES = [
    { value: 'dine-in', label: 'Dine-In', icon: Coffee, color: 'purple', gradient: 'from-purple-500 to-fuchsia-600' },
    { value: 'pickup', label: 'Pickup', icon: ShoppingBag, color: 'blue', gradient: 'from-blue-500 to-cyan-600' },
    { value: 'delivery', label: 'Delivery', icon: Truck, color: 'emerald', gradient: 'from-emerald-500 to-green-600' }
];

interface OperatingHour {
    id?: number;
    day_of_week: number;
    service_type: string;
    opening_time: string;
    closing_time: string;
}

// Enhanced StatCard Component - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index }: any) => {
    const colorStyles: Record<string, any> = {
        purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
    };
    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 hidden sm:block">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">{title}</p>
                        <p className={cn("text-sm sm:text-lg md:text-xl lg:text-3xl font-bold truncate", styles.text)}>{value}</p>
                    </div>
                    <div className={cn("p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

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
    useEffect(() => {
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

    const activeDaysCount = Object.keys(schedules).length;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
                            >
                                <Clock className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                                <span className="truncate">Operating Hours</span>
                            </motion.h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-2 hidden sm:block">
                                Configure business hours for each location
                            </p>
                        </div>
                        {hasChanges && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                <Button
                                    onClick={handleSave}
                                    disabled={saveMutation.isPending}
                                    className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 flex-shrink-0"
                                >
                                    <Save className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-6">
                        <StatCard
                            title="Location"
                            value={locations.find((l: any) => l.id === selectedLocation)?.name || '...'}
                            icon={MapPin}
                            color="purple"
                            index={0}
                        />
                        <StatCard
                            title="Service"
                            value={SERVICE_TYPES.find(s => s.value === selectedServiceType)?.label}
                            icon={selectedServiceType === 'dine-in' ? Coffee : selectedServiceType === 'pickup' ? ShoppingBag : Truck}
                            color="blue"
                            index={1}
                        />
                        <StatCard
                            title="Open Days"
                            value={`${activeDaysCount}/7`}
                            icon={Clock}
                            color="emerald"
                            index={2}
                        />
                    </div>

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-sm"
                    >
                        <div className="flex flex-col gap-4 sm:gap-6">
                            <div className="w-full">
                                <label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2 block">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(Number(e.target.value))}
                                        className="w-full pl-10 pr-4 py-2 sm:py-2.5 h-10 bg-background/50 border border-border rounded-lg sm:rounded-xl text-sm text-foreground focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                    >
                                        {locations.map((location: any) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="w-full">
                                <label className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2 block">Service Type</label>
                                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                                    {SERVICE_TYPES.map((service) => {
                                        const Icon = service.icon;
                                        const isActive = selectedServiceType === service.value;
                                        return (
                                            <button
                                                key={service.value}
                                                onClick={() => setSelectedServiceType(service.value)}
                                                className={cn(
                                                    "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none justify-center",
                                                    isActive
                                                        ? `bg-gradient-to-r ${service.gradient} text-white shadow-lg`
                                                        : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="hidden xs:inline sm:inline">{service.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Weekly Schedule */}
                    {isLoading ? (
                        <div className="space-y-3 sm:space-y-4">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="h-16 sm:h-20 bg-muted/20 animate-pulse rounded-xl sm:rounded-2xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:gap-4">
                            {DAYS.map((day, index) => {
                                const isActive = !!schedules[index];
                                const schedule = schedules[index];

                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className={cn(
                                            "group bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm transition-all duration-300",
                                            isActive
                                                ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
                                                : "border-border/50 bg-card/30 hover:bg-card/50 opacity-80"
                                        )}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                                {/* Day Toggle */}
                                                <label className="flex items-center gap-3 sm:gap-4 cursor-pointer min-w-[120px] sm:min-w-[150px]">
                                                    <div className={cn(
                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                                                        isActive
                                                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                                                            : "bg-secondary text-muted-foreground"
                                                    )}>
                                                        <span className="font-bold text-sm sm:text-lg">{day.substring(0, 3)}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={() => toggleDay(index)}
                                                            className="hidden"
                                                        />
                                                        <span className={cn(
                                                            "font-medium text-sm sm:text-lg block truncate",
                                                            isActive ? "text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {day}
                                                        </span>
                                                        <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                                            {isActive ? 'Open' : 'Closed'}
                                                        </span>
                                                    </div>
                                                </label>

                                                {/* Time Inputs & Actions */}
                                                {isActive && (
                                                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-1">
                                                        <div className="flex items-center gap-1.5 sm:gap-3">
                                                            <div className="flex items-center gap-1 sm:gap-2 bg-background border border-border rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-500">
                                                                <span className="text-[9px] sm:text-xs text-muted-foreground font-bold">OPEN</span>
                                                                <input
                                                                    type="time"
                                                                    value={schedule.opening_time}
                                                                    onChange={(e) => updateSchedule(index, 'opening_time', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-0 text-xs sm:text-sm font-semibold text-foreground w-[70px] sm:w-auto"
                                                                />
                                                            </div>
                                                            <div className="w-2 sm:w-4 h-0.5 bg-border rounded-full" />
                                                            <div className="flex items-center gap-1 sm:gap-2 bg-background border border-border rounded-lg sm:rounded-xl px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-500">
                                                                <span className="text-[9px] sm:text-xs text-muted-foreground font-bold">CLOSE</span>
                                                                <input
                                                                    type="time"
                                                                    value={schedule.closing_time}
                                                                    onChange={(e) => updateSchedule(index, 'closing_time', e.target.value)}
                                                                    className="bg-transparent border-none focus:ring-0 p-0 text-xs sm:text-sm font-semibold text-foreground w-[70px] sm:w-auto"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Copy Button */}
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => handleCopyToAll(index)}
                                                            className="text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 border-border/50 flex-shrink-0"
                                                            disabled={copyMutation.isPending}
                                                        >
                                                            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
                                                            <span className="hidden sm:inline">Copy to All</span>
                                                        </Button>
                                                    </div>
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
