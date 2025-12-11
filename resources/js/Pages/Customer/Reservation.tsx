import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useLocations } from '@/app/hooks/useLocations';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input'; // Assuming these exist
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import { Calendar, Clock, Users, MapPin, CheckCircle, Info } from 'lucide-react';

export default function Reservation() {
    const { data: locations, isLoading: locationsLoading } = useLocations();

    const [locationId, setLocationId] = useState<number | ''>('');
    const [date, setDate] = useState<Date | null>(new Date());
    const [time, setTime] = useState<Date | null>(new Date());
    const [guestCount, setGuestCount] = useState<number>(2);
    const [notes, setNotes] = useState('');

    // Availability State
    const [checking, setChecking] = useState(false);
    const [availability, setAvailability] = useState<{ available: boolean; table_id?: number; table_code?: string; message?: string } | null>(null);
    const [booking, setBooking] = useState(false);

    // Normalize Date/Time for API
    const getFormattedDate = () => date ? format(date, 'yyyy-MM-dd') : '';
    const getFormattedTime = () => time ? format(time, 'HH:mm') : '';

    const handleCheckAvailability = async () => {
        if (!locationId || !date || !time || !guestCount) {
            toastError('Please fill in all fields');
            return;
        }

        setChecking(true);
        setAvailability(null);

        try {
            const params = {
                location_id: locationId,
                date: getFormattedDate(),
                time: getFormattedTime(),
                guest_count: guestCount
            };

            const response = await apiGet<any>('/api/customer/reservations/availability', { params });
            // Since apiGet usually auto-unwraps or returns axios response, explicit typing helps
            // Assuming simplified response logic
            if (response.data.available) {
                setAvailability(response.data);
            } else {
                setAvailability({ available: false, message: response.data.message || 'No tables available.' });
                toastError(response.data.message || 'No available tables for this time.');
            }
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to check availability');
            setAvailability({ available: false, message: 'Error checking availability.' });
        } finally {
            setChecking(false);
        }
    };

    const handleBookTable = async () => {
        if (!availability?.available || !locationId || !date || !time) return;

        setBooking(true);
        try {
            // Combine date and time for 'reserved_for' ISO string expected by store()
            // Y-m-d\TH:i
            const reservedFor = `${getFormattedDate()}T${getFormattedTime()}`;

            const response = await apiPost('/api/customer/reservations', {
                location_id: locationId,
                reserved_for: reservedFor,
                guest_count: guestCount,
                notes: notes
            });

            toastSuccess('Table reserved successfully!');
            router.get('/customer/reservations'); // Redirect to my reservations
        } catch (error: any) {
            toastError(error.response?.data?.message || 'Failed to book table');
        } finally {
            setBooking(false);
        }
    };

    // If only one location, auto select it
    React.useEffect(() => {
        if (locations && locations.length === 1) {
            setLocationId(locations[0].id);
        }
    }, [locations]);

    return (
        <CustomerLayout>
            <Head title="Book a Table" />

            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Reserve a Table</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Book your dining experience in advance</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Booking Form */}
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            {/* Location */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <select
                                        value={locationId}
                                        onChange={(e) => {
                                            setLocationId(Number(e.target.value));
                                            setAvailability(null);
                                        }}
                                        className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                        disabled={locationsLoading}
                                    >
                                        <option value="">Select a Location</option>
                                        {locations?.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 z-10 pointer-events-none">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <DatePicker
                                            selected={date}
                                            onChange={(d) => {
                                                setDate(d);
                                                setAvailability(null);
                                            }}
                                            minDate={new Date()}
                                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                            dateFormat="MMMM d, yyyy"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 z-10 pointer-events-none">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <DatePicker
                                            selected={time}
                                            onChange={(t) => {
                                                setTime(t);
                                                setAvailability(null);
                                            }}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={30}
                                            timeCaption="Time"
                                            dateFormat="h:mm aa"
                                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Guests */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number of Guests</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={guestCount}
                                        onChange={(e) => {
                                            setGuestCount(parseInt(e.target.value) || 1);
                                            setAvailability(null);
                                        }}
                                        className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleCheckAvailability}
                                disabled={checking || !locationId}
                                className="w-full"
                                variant="primary"
                            >
                                {checking ? 'Checking...' : 'Check Availability'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Confirmation / Status */}
                    <div className="space-y-6">
                        {availability?.available ? (
                            <Card className="border-green-500 border-2 bg-green-50 dark:bg-green-900/10">
                                <CardContent className="p-6">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <CheckCircle className="h-12 w-12 text-green-500" />
                                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-300">Table Available!</h3>
                                        <div className="text-gray-600 dark:text-gray-300 space-y-1">
                                            <p>{locations?.find(l => l.id === locationId)?.name}</p>
                                            <p className="font-bold text-lg">{format(date!, 'MMMM d, yyyy')} at {format(time!, 'h:mm aa')}</p>
                                            <p>{guestCount} Guests</p>
                                        </div>

                                        <div className="w-full pt-4 border-t border-green-200 dark:border-green-800">
                                            <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Special Requests (Optional)</label>
                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Allergies, high chair, occasion..."
                                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
                                                rows={3}
                                            />
                                        </div>

                                        <Button
                                            onClick={handleBookTable}
                                            disabled={booking}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {booking ? 'Booking...' : 'Confirm Reservation'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-gray-50 dark:bg-gray-800/50 border-dashed border-2 border-gray-200 dark:border-gray-700 h-full flex items-center justify-center">
                                <CardContent className="p-6 text-center text-gray-500 dark:text-gray-400">
                                    {checking ? (
                                        <Info className="h-12 w-12 mx-auto mb-2 animate-pulse text-blue-400" />
                                    ) : availability?.available === false ? (
                                        <div className="text-red-500">
                                            <Info className="h-12 w-12 mx-auto mb-2" />
                                            <p>{availability.message}</p>
                                            <p className="text-sm mt-2">Try a different time or date.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Select your preferences and check availability to proceed.</p>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
}
