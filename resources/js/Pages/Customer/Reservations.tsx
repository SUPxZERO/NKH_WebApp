import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    Users,
    MapPin,
    Plus,
    X,
    CheckCircle,
    AlertCircle,
    Utensils
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiDelete } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];

export default function Reservations() {
    const queryClient = useQueryClient();
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [partySize, setPartySize] = useState(2);
    const [specialRequests, setSpecialRequests] = useState('');
    const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

    // Fetch locations
    const { data: locationsData } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch existing reservations
    const { data: reservationsData } = useQuery({
        queryKey: ['customer', 'reservations'],
        queryFn: () => apiGet('/api/customer/reservations')
    });

    const locations = locationsData?.data || [];
    const reservations = reservationsData?.data || [];

    // Generate time slots (11:00 AM to 10:00 PM every 30 mins)
    const availableSlots = React.useMemo(() => {
        const slots = [];
        for (let hour = 11; hour <= 22; hour++) {
            for (let minute of [0, 30]) {
                if (hour === 22 && minute === 30) break; // Stop at 22:00
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(time);
            }
        }
        return slots;
    }, []);

    // Create reservation mutation
    const createReservationMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/customer/reservations', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'reservations'] });
            setShowBookingModal(false);
            resetForm();
        }
    });

    // Cancel reservation mutation
    const cancelReservationMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/customer/reservations/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', 'reservations'] });
        }
    });

    const resetForm = () => {
        setSelectedDate('');
        setSelectedTime('');
        setPartySize(2);
        setSpecialRequests('');
        setSelectedLocation(null);
    };

    const handleBookReservation = () => {
        if (!selectedLocation || !selectedDate || !selectedTime || !partySize) {
            alert('Please fill in all required fields');
            return;
        }

        // ✅ FIX: Backend expects 'reserved_for' as combined ISO datetime (Y-m-d\TH:i)
        const reservedFor = `${selectedDate}T${selectedTime}`;

        // ✅ FIX: Backend expects 'guest_count' NOT 'party_size'
        // ✅ FIX: Backend expects 'notes' NOT 'special_requests'
        const payload = {
            location_id: selectedLocation,
            reserved_for: reservedFor,        // ✅ Combined datetime
            guest_count: partySize,           // ✅ Renamed from party_size
            notes: specialRequests || null   // ✅ Renamed from special_requests
        };

        console.log('📋 Reservation payload:', payload);

        createReservationMutation.mutate(payload, {
            onError: (error: any) => {
                console.error('❌ Reservation failed:', error);
                const errorMsg = error?.response?.data?.message ||
                    error?.response?.data?.errors ||
                    'Failed to create reservation';
                alert(`Reservation Failed: ${JSON.stringify(errorMsg)}`);
            }
        });
    };

    const handleCancelReservation = (reservation: any) => {
        if (confirm('Are you sure you want to cancel this reservation?')) {
            cancelReservationMutation.mutate(reservation.id);
        }
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];
    // Get maximum date (3 months from now)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    // Group reservations by status using unified reserved_for datetime
    const upcomingReservations = reservations.filter((r: any) => {
        if (!r.reserved_for) return false;
        const dt = new Date(r.reserved_for);
        return ['pending', 'confirmed'].includes(r.status) && dt >= new Date();
    });

    const pastReservations = reservations.filter((r: any) => {
        if (!r.reserved_for) return ['completed', 'cancelled', 'no_show'].includes(r.status);
        const dt = new Date(r.reserved_for);
        return dt < new Date() || ['completed', 'cancelled', 'no_show'].includes(r.status);
    });

    return (
        <CustomerLayout>
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Calendar className="w-8 h-8 text-purple-600" />
                            My Reservations
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Book a table and manage your reservations
                        </p>
                    </div>
                    <Button onClick={() => setShowBookingModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        New Reservation
                    </Button>
                </div>

                {/* Upcoming Reservations */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Upcoming Reservations
                    </h2>
                    {upcomingReservations.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upcomingReservations.map((reservation: any) => (
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
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                        {reservation.location?.name || 'Restaurant'}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">
                                                        #{reservation.code}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-semibold",
                                                    reservation.status === 'confirmed'
                                                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                        : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
                                                )}>
                                                    {reservation.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {reservation.reserved_for && new Date(reservation.reserved_for).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{reservation.reserved_for && new Date(reservation.reserved_for).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                    <Users className="w-4 h-4" />
                                                    <span>{reservation.guest_count} {reservation.guest_count === 1 ? 'Guest' : 'Guests'}</span>
                                                </div>
                                                {reservation.table && (
                                                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                        <Utensils className="w-4 h-4" />
                                                        <span>Table {reservation.table.number}</span>
                                                    </div>
                                                )}
                                                {reservation.notes && (
                                                    <p className="text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                        <strong>Special Requests:</strong> {reservation.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {reservation.can_cancel && (
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCancelReservation(reservation)}
                                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Cancel Reservation
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
                            <CardContent className="p-12 text-center">
                                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    No upcoming reservations
                                </p>
                                <Button onClick={() => setShowBookingModal(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Make a Reservation
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Past Reservations */}
                {pastReservations.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            Past Reservations
                        </h2>
                        <div className="space-y-2">
                            {pastReservations.slice(0, 5).map((reservation: any) => (
                                <Card key={reservation.id} className="opacity-75">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                        {reservation.reserved_for && new Date(reservation.reserved_for).getDate()}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {reservation.reserved_for && new Date(reservation.reserved_for).toLocaleDateString('en-US', { month: 'short' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-xs font-semibold",
                                                reservation.status === 'confirmed'
                                                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                                                    : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400",
                                                reservation.status === 'cancelled' && "bg-red-100 dark:bg-red-900/20 text-red-600",
                                                reservation.status === 'no_show' && "bg-orange-100 dark:bg-orange-900/20 text-orange-600"
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
                {showBookingModal && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                            onClick={() => setShowBookingModal(false)}
                        />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            Book a Table
                                        </h2>
                                        <button
                                            onClick={() => setShowBookingModal(false)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Location Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <MapPin className="w-4 h-4 inline mr-2" />
                                            Location *
                                        </label>
                                        <select
                                            value={selectedLocation || ''}
                                            onChange={(e) => setSelectedLocation(Number(e.target.value))}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Select a location</option>
                                            {locations.map((location: any) => (
                                                <option key={location.id} value={location.id}>
                                                    {location.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Selection */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={today}
                                            max={maxDateStr}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        {selectedDate && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {DAYS[new Date(selectedDate + 'T00:00').getDay()]}
                                            </p>
                                        )}
                                    </div>

                                    {/* Party Size */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            <Users className="w-4 h-4 inline mr-2" />
                                            Number of Guests *
                                        </label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {PARTY_SIZES.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setPartySize(size)}
                                                    className={cn(
                                                        "px-4 py-3 rounded-lg border-2 font-medium transition-all",
                                                        partySize === size
                                                            ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                                            : "border-gray-300 dark:border-gray-600 hover:border-purple-300"
                                                    )}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Available Time Slots */}
                                    {selectedLocation && selectedDate && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                <Clock className="w-4 h-4 inline mr-2" />
                                                Available Times
                                            </label>
                                            {availableSlots.length > 0 ? (
                                                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                                    {availableSlots.map((slot: string) => (
                                                        <button
                                                            key={slot}
                                                            onClick={() => setSelectedTime(slot)}
                                                            className={cn(
                                                                "px-4 py-3 rounded-lg border-2 font-medium transition-all",
                                                                selectedTime === slot
                                                                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-600"
                                                                    : "border-gray-300 dark:border-gray-600 hover:border-purple-300"
                                                            )}
                                                        >
                                                            {slot}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 text-gray-500">
                                                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                                    No available time slots for this date
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Special Requests */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Special Requests (Optional)
                                        </label>
                                        <textarea
                                            value={specialRequests}
                                            onChange={(e) => setSpecialRequests(e.target.value)}
                                            rows={3}
                                            placeholder="e.g., Window seat, high chair needed, birthday celebration..."
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowBookingModal(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleBookReservation}
                                            disabled={!selectedLocation || !selectedDate || !selectedTime || createReservationMutation.isPending}
                                            className="flex-1"
                                        >
                                            {createReservationMutation.isPending ? (
                                                'Booking...'
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Confirm Reservation
                                                </>
                                            )}
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
