import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Plus,
    X,
    CheckCircle,
    Utensils,
    Layers,
    Armchair,
    AlertCircle
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { apiGet, apiPost, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Floor {
    id: number;
    name: string;
    location_id: number;
}

interface Table {
    id: number;
    code: string;
    capacity: number;
    status: string;
    is_available: boolean;
}

interface Reservation {
    id: number;
    code: string;
    location?: { name: string };
    reserved_for: string;
    guest_count: number;
    status: string;
    notes?: string;
    table?: { code: string; number?: string };
    can_cancel?: boolean;
}

export default function Reservations() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Modal state
    const [showBookingModal, setShowBookingModal] = useState(false);

    // Booking form state
    const [locationId, setLocationId] = useState<number | ''>('');
    const [floorId, setFloorId] = useState<number | ''>('');
    const [tableId, setTableId] = useState<number | ''>('');
    const [date, setDate] = useState<Date | null>(null);
    const [time, setTime] = useState<Date | null>(null);
    const [guestCount, setGuestCount] = useState<number>(2);
    const [notes, setNotes] = useState('');

    // Floor/Table data state
    const [floors, setFloors] = useState<Floor[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [floorsLoading, setFloorsLoading] = useState(false);
    const [tablesLoading, setTablesLoading] = useState(false);

    // Fetch locations
    const { data: locationsData } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch existing reservations
    const { data: reservationsData, isLoading: reservationsLoading } = useQuery({
        queryKey: ['customer', 'reservations'],
        queryFn: () => apiGet('/api/customer/reservations')
    });

    const locations = locationsData?.data || [];
    const reservations: Reservation[] = reservationsData?.data || [];

    // Normalize Date/Time for API
    const getFormattedDate = () => date ? format(date, 'yyyy-MM-dd') : '';
    const getFormattedTime = () => time ? format(time, 'HH:mm') : '';

    // Fetch floors when location changes
    useEffect(() => {
        if (!locationId) {
            setFloors([]);
            setFloorId('');
            setTables([]);
            setTableId('');
            return;
        }

        const fetchFloors = async () => {
            setFloorsLoading(true);
            try {
                const response = await apiGet('/api/customer/reservations/floors', {
                    location_id: locationId
                });
                setFloors(response?.data || []);
                setFloorId('');
                setTables([]);
                setTableId('');
            } catch (error) {
                console.error('Failed to fetch floors:', error);
                setFloors([]);
            } finally {
                setFloorsLoading(false);
            }
        };

        fetchFloors();
    }, [locationId]);

    // Fetch tables when floor, date, time, or guest count changes
    useEffect(() => {
        if (!floorId) {
            setTables([]);
            setTableId('');
            return;
        }

        const fetchTables = async () => {
            setTablesLoading(true);
            try {
                const params: any = {
                    floor_id: floorId,
                    guest_count: guestCount
                };

                if (date && time) {
                    params.date = getFormattedDate();
                    params.time = getFormattedTime();
                }

                const response = await apiGet('/api/customer/reservations/tables', params);
                setTables(response?.data || []);
                setTableId('');
            } catch (error) {
                console.error('Failed to fetch tables:', error);
                setTables([]);
            } finally {
                setTablesLoading(false);
            }
        };

        fetchTables();
    }, [floorId, date, time, guestCount]);

    // Create reservation mutation
    const createReservationMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/customer/reservations', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'reservations'] });
            toastSuccess(t('customer_pages.reservations.messages.reserved_success'));
            closeModal();
        },
        onError: (error: any) => {
            const msg = error?.response?.data?.message || t('customer_pages.reservations.messages.failed_create');
            toastError(msg);
        }
    });

    // Cancel reservation mutation
    const cancelReservationMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/customer/reservations/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'reservations'] });
            toastSuccess(t('customer_pages.reservations.messages.cancelled'));
        },
        onError: (error: any) => {
            toastError(error?.response?.data?.message || t('customer_pages.reservations.messages.failed_cancel'));
        }
    });

    const resetForm = () => {
        setLocationId('');
        setFloorId('');
        setTableId('');
        setDate(null);
        setTime(null);
        setGuestCount(2);
        setNotes('');
        setFloors([]);
        setTables([]);
    };

    const closeModal = () => {
        setShowBookingModal(false);
        resetForm();
    };

    const handleBookReservation = () => {
        if (!locationId || !date || !time || !guestCount) {
            toastError(t('customer_pages.reservations.messages.fill_required'));
            return;
        }

        const reservedFor = `${getFormattedDate()}T${getFormattedTime()}`;

        const payload: any = {
            location_id: locationId,
            reserved_for: reservedFor,
            guest_count: guestCount,
            notes: notes || null
        };

        if (tableId) {
            payload.table_id = tableId;
        }

        if (floorId) {
            payload.floor_id = floorId;
        }

        createReservationMutation.mutate(payload);
    };

    const handleCancelReservation = (reservation: Reservation) => {
        if (confirm(t('customer_pages.reservations.actions.cancel_confirm'))) {
            cancelReservationMutation.mutate(reservation.id);
        }
    };

    // Auto-select single location
    useEffect(() => {
        if (showBookingModal && locations.length === 1 && !locationId) {
            setLocationId(locations[0].id);
        }
    }, [showBookingModal, locations]);

    // Group reservations by status
    const upcomingReservations = reservations.filter((r) => {
        if (!r.reserved_for) return false;
        const dt = new Date(r.reserved_for);
        return ['pending', 'confirmed'].includes(r.status) && dt >= new Date();
    });

    const pastReservations = reservations.filter((r) => {
        if (!r.reserved_for) return ['completed', 'cancelled', 'no_show'].includes(r.status);
        const dt = new Date(r.reserved_for);
        return dt < new Date() || ['completed', 'cancelled', 'no_show'].includes(r.status);
    });

    const selectedLocation = locations.find((l: any) => l.id === locationId);
    const selectedFloor = floors.find(f => f.id === floorId);
    const selectedTable = tables.find(t => t.id === tableId);
    const canBook = locationId && date && time && guestCount > 0;

    return (
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <Head title={t('customer_pages.reservations.title')} />

                <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-fuchsia-600" />
                                <span className="hidden sm:inline">{t('customer_pages.reservations.title')}</span>
                                <span className="sm:hidden">{t('customer_pages.reservations.title_short')}</span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 hidden sm:block">
                                {t('customer_pages.reservations.subtitle')}
                            </p>
                        </div>
                        <Button
                            onClick={() => setShowBookingModal(true)}
                            variant="primary"
                            size="sm"
                        >
                            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{t('customer_pages.reservations.new_reservation')}</span>
                            <span className="sm:hidden">{t('customer_pages.reservations.book')}</span>
                        </Button>
                    </div>

                    {/* Upcoming Reservations */}
                    <div>
                        <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                            {t('customer_pages.reservations.upcoming')}
                        </h2>
                        {reservationsLoading ? (
                            <Card>
                                <CardContent className="p-8 sm:p-12 text-center">
                                    <div className="w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('customer_pages.reservations.loading')}</p>
                                </CardContent>
                            </Card>
                        ) : upcomingReservations.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {upcomingReservations.map((reservation) => (
                                    <motion.div
                                        key={reservation.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <Card className={cn(
                                            "border-l-4",
                                            reservation.status === 'confirmed' ? "border-l-green-500" : "border-l-yellow-500"
                                        )}>
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">
                                                            {reservation.location?.name || 'Restaurant'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500">
                                                            #{reservation.code}
                                                        </p>
                                                    </div>
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold",
                                                        reservation.status === 'confirmed'
                                                            ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                            : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                                                    )}>
                                                        {reservation.status === 'confirmed' ? t('customer_pages.reservations.status.confirmed') : t('customer_pages.reservations.status.pending')}
                                                    </span>
                                                </div>

                                                <div className="space-y-1.5 text-xs sm:text-sm">
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>
                                                            {new Date(reservation.reserved_for).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{new Date(reservation.reserved_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <Users className="w-3.5 h-3.5" />
                                                        <span>{reservation.guest_count} {reservation.guest_count === 1 ? t('customer_pages.reservations.card.guest') : t('customer_pages.reservations.card.guests')}</span>
                                                    </div>
                                                    {reservation.table && (
                                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                            <Utensils className="w-3.5 h-3.5" />
                                                            <span>{t('customer_pages.reservations.card.table')} {reservation.table.code || reservation.table.number}</span>
                                                        </div>
                                                    )}
                                                    {reservation.notes && (
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            {reservation.notes}
                                                        </p>
                                                    )}
                                                </div>

                                                {reservation.can_cancel && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleCancelReservation(reservation)}
                                                            disabled={cancelReservationMutation.isPending}
                                                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-xs"
                                                        >
                                                            <X className="w-3.5 h-3.5 mr-1.5" />
                                                            {t('customer_pages.reservations.actions.cancel')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                        {t('customer_pages.reservations.no_upcoming')}
                                    </p>
                                    <Button onClick={() => setShowBookingModal(true)} variant="primary" size="sm">
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        {t('customer_pages.reservations.make_reservation')}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Past Reservations */}
                    {pastReservations.length > 0 && (
                        <div>
                            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                                {t('customer_pages.reservations.past')}
                            </h2>
                            <div className="space-y-2">
                                {pastReservations.slice(0, 5).map((reservation) => (
                                    <Card key={reservation.id} className="opacity-75">
                                        <CardContent className="p-3 sm:p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center min-w-[40px]">
                                                        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                                                            {new Date(reservation.reserved_for).getDate()}
                                                        </div>
                                                        <div className="text-[10px] sm:text-xs text-gray-500">
                                                            {new Date(reservation.reserved_for).toLocaleDateString('en-US', { month: 'short' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                            {reservation.location?.name || 'Restaurant'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {reservation.guest_count} {reservation.guest_count !== 1 ? t('customer_pages.reservations.card.guests') : t('customer_pages.reservations.card.guest')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-semibold",
                                                    reservation.status === 'completed' && "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400",
                                                    reservation.status === 'cancelled' && "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
                                                    reservation.status === 'no_show' && "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                                                )}>
                                                    {reservation.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Booking Modal */}
                    <AnimatePresence>
                        {showBookingModal && (
                            <>
                                <motion.div
                                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={closeModal}
                                />
                                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
                                    <motion.div
                                        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Modal Header - Drag handle for mobile */}
                                        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                                                    {t('customer_pages.reservations.modal.title')}
                                                </h2>
                                                <button
                                                    onClick={closeModal}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {/* Drag indicator for mobile */}
                                            <div className="sm:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2" />
                                        </div>

                                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                            {/* Quick Info Bar - Mobile */}
                                            <div className="sm:hidden flex flex-wrap gap-2 text-xs">
                                                {selectedLocation && (
                                                    <span className="px-2 py-1 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-lg">
                                                        {selectedLocation.name}
                                                    </span>
                                                )}
                                                {date && (
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                                                        {format(date, 'MMM d')}
                                                    </span>
                                                )}
                                                {time && (
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
                                                        {format(time, 'h:mm aa')}
                                                    </span>
                                                )}
                                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                                    {guestCount} {guestCount !== 1 ? t('customer_pages.reservations.card.guests') : t('customer_pages.reservations.card.guest')}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                                {/* Left Column - Basic Info */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700 text-sm">
                                                        {t('customer_pages.reservations.modal.basic_info')}
                                                    </h3>

                                                    {/* Location */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <MapPin className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.location')} *
                                                        </label>
                                                        <select
                                                            value={locationId}
                                                            onChange={(e) => setLocationId(Number(e.target.value) || '')}
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white py-2.5 px-3 text-sm"
                                                        >
                                                            <option value="">{t('customer_pages.reservations.modal.select')}</option>
                                                            {locations.map((loc: any) => (
                                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Date */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Calendar className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.date')} *
                                                        </label>
                                                        <DatePicker
                                                            selected={date}
                                                            onChange={(d) => setDate(d)}
                                                            minDate={new Date()}
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white py-2.5 px-3 text-sm"
                                                            dateFormat="MMM d, yyyy"
                                                            placeholderText="Select date"
                                                        />
                                                    </div>

                                                    {/* Time */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Clock className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.time')} *
                                                        </label>
                                                        <DatePicker
                                                            selected={time}
                                                            onChange={(t) => setTime(t)}
                                                            showTimeSelect
                                                            showTimeSelectOnly
                                                            timeIntervals={30}
                                                            timeCaption="Time"
                                                            dateFormat="h:mm aa"
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white py-2.5 px-3 text-sm"
                                                            placeholderText="Select time"
                                                        />
                                                    </div>

                                                    {/* Guests */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Users className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.guests')} *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="20"
                                                            value={guestCount}
                                                            onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white py-2.5 px-3 text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Middle Column - Floor & Table Selection */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-700 text-sm">
                                                        {t('customer_pages.reservations.modal.select_spot')}
                                                    </h3>

                                                    {/* Floor Selection */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Layers className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.floor')}
                                                        </label>
                                                        {!locationId ? (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                                                                {t('customer_pages.reservations.modal.select_location')}
                                                            </p>
                                                        ) : floorsLoading ? (
                                                            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                                                                <div className="w-3.5 h-3.5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                                                {t('customer_pages.reservations.loading')}
                                                            </div>
                                                        ) : floors.length === 0 ? (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                                                                {t('customer_pages.reservations.modal.no_floors')}
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {floors.map(floor => (
                                                                    <button
                                                                        key={floor.id}
                                                                        type="button"
                                                                        onClick={() => setFloorId(floor.id)}
                                                                        className={cn(
                                                                            "p-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                                                                            floorId === floor.id
                                                                                ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300"
                                                                                : "border-gray-200 dark:border-gray-600 hover:border-fuchsia-300 text-gray-700 dark:text-gray-300"
                                                                        )}
                                                                    >
                                                                        {floor.name}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Table Selection */}
                                                    <div className="space-y-1.5">
                                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            <Armchair className="inline w-3.5 h-3.5 mr-1" />
                                                            {t('customer_pages.reservations.modal.table')}
                                                        </label>
                                                        {!floorId ? (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                                                                {t('customer_pages.reservations.modal.select_floor')}
                                                            </p>
                                                        ) : tablesLoading ? (
                                                            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                                                                <div className="w-3.5 h-3.5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                                                {t('customer_pages.reservations.loading')}
                                                            </div>
                                                        ) : tables.length === 0 ? (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                                                                {t('customer_pages.reservations.modal.no_tables')}
                                                            </p>
                                                        ) : (
                                                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                                {tables.map(table => (
                                                                    <button
                                                                        key={table.id}
                                                                        type="button"
                                                                        onClick={() => table.is_available && setTableId(table.id)}
                                                                        disabled={!table.is_available}
                                                                        className={cn(
                                                                            "p-2.5 rounded-lg border-2 text-xs transition-all text-left",
                                                                            !table.is_available
                                                                                ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 text-red-400 cursor-not-allowed opacity-60"
                                                                                : tableId === table.id
                                                                                    ? "border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300"
                                                                                    : "border-gray-200 dark:border-gray-600 hover:border-fuchsia-300 text-gray-700 dark:text-gray-300"
                                                                        )}
                                                                    >
                                                                        <div className="font-semibold">{t('customer_pages.reservations.card.table')} {table.code}</div>
                                                                        <div className="text-[10px] mt-0.5">
                                                                            {table.capacity} {t('customer_pages.reservations.modal.seats')}
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right Column - Summary & Actions */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 border-gray-200 dark:border-gray-600 text-sm">
                                                        {t('customer_pages.reservations.modal.summary')}
                                                    </h3>

                                                    <div className="space-y-2 text-xs sm:text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">{t('customer_pages.reservations.modal.location')}</span>
                                                            <span className="font-medium">{selectedLocation?.name || '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">{t('customer_pages.reservations.modal.date')}</span>
                                                            <span className="font-medium">{date ? format(date, 'MMM d, yyyy') : '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">{t('customer_pages.reservations.modal.time')}</span>
                                                            <span className="font-medium">{time ? format(time, 'h:mm aa') : '—'}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-500">{t('customer_pages.reservations.modal.guests')}</span>
                                                            <span className="font-medium">{guestCount}</span>
                                                        </div>
                                                        {selectedFloor && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">{t('customer_pages.reservations.modal.floor')}</span>
                                                                <span className="font-medium">{selectedFloor.name}</span>
                                                            </div>
                                                        )}
                                                        {selectedTable && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-500">{t('customer_pages.reservations.modal.table')}</span>
                                                                <span className="font-medium">{selectedTable.code}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Notes */}
                                                    <div className="pt-2">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                                            {t('customer_pages.reservations.modal.special_requests')}
                                                        </label>
                                                        <textarea
                                                            value={notes}
                                                            onChange={(e) => setNotes(e.target.value)}
                                                            placeholder={t('customer_pages.reservations.modal.notes_placeholder')}
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-fuchsia-500 focus:ring-fuchsia-500 dark:bg-gray-700 dark:text-white text-xs"
                                                            rows={2}
                                                        />
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="space-y-2 pt-2">
                                                        <Button
                                                            onClick={handleBookReservation}
                                                            disabled={!canBook || createReservationMutation.isPending}
                                                            loading={createReservationMutation.isPending}
                                                            className="w-full"
                                                            variant="primary"
                                                            size="sm"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1.5" />
                                                            {t('customer_pages.reservations.modal.confirm')}
                                                        </Button>

                                                        <Button
                                                            onClick={closeModal}
                                                            variant="outline"
                                                            className="w-full"
                                                            size="sm"
                                                        >
                                                            {t('customer_pages.reservations.modal.cancel')}
                                                        </Button>

                                                        {!canBook && (
                                                            <p className="text-[10px] text-center text-amber-600 dark:text-amber-400">
                                                                {t('customer_pages.reservations.modal.fill_required')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </CustomerLayout>
        </RequireAuth>
    );
}
