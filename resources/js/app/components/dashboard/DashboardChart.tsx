import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface DashboardChartProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    loading?: boolean;
    error?: string;
    onRefresh?: () => void;
    className?: string;
}

export function DashboardChart({
    title,
    description,
    children,
    loading = false,
    error,
    onRefresh,
    className,
}: DashboardChartProps) {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {description}
                            </p>
                        )}
                    </div>

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Refresh chart"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                Try again
                            </button>
                        )}
                    </div>
                ) : (
                    children
                )}
            </CardContent>
        </Card>
    );
}

export default DashboardChart;
