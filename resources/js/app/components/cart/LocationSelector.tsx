import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Location } from '@/app/types/domain';
import { MapPin, Clock, Phone } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/Loading';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/app/hooks/useTranslation';

interface LocationSelectorProps {
    selectedId?: number;
    onSelect: (locationId: number, locationName: string) => void;
}

export function LocationSelector({ selectedId, onSelect }: LocationSelectorProps) {
    const { t } = useTranslation();
    const { data: locations, isLoading, error } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const res = await apiGet<{ data: Location[] }>('/locations');
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {t('customer.cart.select_location_title')}
                </h3>
                <div className="space-y-2">
                    <Skeleton className="h-14 sm:h-20 w-full rounded-lg" />
                    <Skeleton className="h-14 sm:h-20 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-red-200 dark:border-red-700">
                <p className="text-red-600 text-center text-sm">{t('customer.cart.failed_load_locations')}</p>
            </div>
        );
    }

    if (!locations || locations.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 text-center text-sm">{t('customer.cart.no_locations')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                    {t('customer.cart.select_location_title')}
                </h3>
                {selectedId && (
                    <span className="text-xs text-fuchsia-600 font-medium hidden sm:inline">
                        ✓ {t('customer.cart.selected')}
                    </span>
                )}
            </div>

            <div className="space-y-2">
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
                            className={`w-full p-2.5 sm:p-4 rounded-lg border-2 transition-all text-left ${selectedId === location.id
                                ? 'border-fuchsia-500 bg-fuchsia-500/10'
                                : 'border-gray-200 dark:border-gray-700 hover:border-fuchsia-300'
                                }`}
                        >
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${selectedId === location.id ? 'bg-fuchsia-500/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                    <MapPin className={`w-4 sm:w-5 h-4 sm:h-5 ${selectedId === location.id ? 'text-fuchsia-600' : 'text-gray-600'}`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className={`text-sm sm:text-base font-semibold ${selectedId === location.id ? 'text-fuchsia-600' : 'text-gray-900 dark:text-white'}`}>
                                        {location.name}
                                    </div>

                                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{location.address}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        {location.is_active && (
                                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-0.5">
                                                <Clock className="w-2.5 h-2.5" />
                                                <span className="hidden sm:inline">{t('customer.cart.open')}</span>
                                                <span className="sm:hidden">{t('customer.cart.now')}</span>
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-400 hidden sm:flex items-center gap-0.5">
                                            <Phone className="w-2.5 h-2.5" />
                                            {location.phone}
                                        </span>
                                    </div>
                                </div>

                                {selectedId === location.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className="w-5 h-5 sm:w-6 sm:h-6 bg-fuchsia-500 rounded-full flex items-center justify-center flex-shrink-0"
                                    >
                                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <p className="mt-3 text-xs sm:text-sm text-amber-600 dark:text-amber-400 text-center bg-amber-500/10 rounded-lg py-2">
                    {t('customer.cart.please_select_location')}
                </p>
            )}
        </div>
    );
}
