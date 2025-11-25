import React from 'react';

export function MenuSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 overflow-hidden">
                    {/* Image skeleton */}
                    <div className="h-56 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />

                    {/* Content skeleton */}
                    <div className="p-4 space-y-3">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default MenuSkeleton;
