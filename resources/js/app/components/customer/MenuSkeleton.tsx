import React from 'react';
import { cn } from '@/app/utils/cn';

interface MenuSkeletonProps {
    count?: number;
    layout?: 'grid' | 'list';
}

export function MenuSkeleton({ count = 8, layout = 'grid' }: MenuSkeletonProps) {
    if (layout === 'list') {
        return (
            <div className="flex flex-col gap-3">
                {[...Array(count)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        {/* Image skeleton */}
                        <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse flex-shrink-0" />

                        {/* Content skeleton */}
                        <div className="flex-1 space-y-2 py-1">
                            <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                            <div className="h-4 w-1/2 bg-gray-100 dark:bg-gray-700/70 rounded animate-pulse" />
                            <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-700/70 rounded animate-pulse" />

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    <div className="h-4 w-16 bg-gray-100 dark:bg-gray-700/70 rounded animate-pulse" />
                                </div>
                                <div className="h-7 w-16 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-lg animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Image skeleton */}
                    <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 animate-pulse relative">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>

                    {/* Content skeleton */}
                    <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="h-3 w-3/4 bg-gray-100 dark:bg-gray-700/70 rounded animate-pulse" />

                        <div className="flex items-center justify-between pt-2">
                            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-5 w-14 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MenuSkeleton;
