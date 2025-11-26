import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Location } from '@/app/types/domain';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationSelectorProps {
    selectedId?: number;
    onSelect: (locationId: number, locationName: string) => void;
}

export function LocationSelector({ selectedId, onSelect }: LocationSelectorProps) {
    const { data: locations, isLoading, error } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const res = await apiGet<{ data: Location[] }>('/locations');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Select Restaurant Location
                </h3>
                <Skeleton className="h-24 w-full rounded-xl mb-3" />
                <Skeleton className="h-24 w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-red-200 dark:border-red-700">
                <p className="text-red-600 text-center">Failed to load locations. Please refresh the page.</p>
            </div>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 text-center">No locations available at the moment.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Select Restaurant Location
                </h3>
                {selectedId && (
                    <span className="text-xs text-fuchsia-600 font-medium">
                        ✓ Selected
                    </span>
                )}
            </div>

            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {locations.map((location) => (
                        <motion.button
                            key={location.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => onSelect(location.id, location.name)}
                            className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedId === location.id
                                    ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-md'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${selectedId === location.id ? 'bg-fuchsia-500/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <MapPin className={`w-5 h-5 ${selectedId === location.id ? 'text-fuchsia-600' : 'text-gray-600'}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold ${selectedId === location.id ? 'text-fuchsia-600' : 'text-gray-900 dark:text-white'}`}>
                                        {location.name}
                                    </div>

                                    {location.address && (
                                        <div className="text-sm text-gray-500 mt-1 flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                            <span className="break-words">{location.address}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-3 mt-2">
                                        {location.phone && (
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {location.phone}
                                            </div>
                                        )}

                                        {location.is_active && (
                                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Open Now
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedId === location.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className="w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {!selectedId && (
                <p className="mt-4 text-sm text-amber-600 dark:text-amber-400 text-center bg-amber-500/10 rounded-lg p-3">
                    ⚠️ Please select a location to continue
                </p>
            )}
        </div>
    );
}
