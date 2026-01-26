import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { AuditEventCard, AuditLog } from './AuditEventCard';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface AuditTimelineProps {
    logs: AuditLog[];
    isLoading?: boolean;
    className?: string;
}

interface GroupedLogs {
    date: string;
    label: string;
    logs: AuditLog[];
}

function groupLogsByDate(logs: AuditLog[]): GroupedLogs[] {
    const groups: Map<string, AuditLog[]> = new Map();

    logs.forEach(log => {
        const date = log.created_at.split('T')[0];
        if (!groups.has(date)) {
            groups.set(date, []);
        }
        groups.get(date)!.push(log);
    });

    return Array.from(groups.entries()).map(([date, logs]) => {
        const parsedDate = parseISO(date);
        let label = format(parsedDate, 'EEEE, MMMM d, yyyy');

        if (isToday(parsedDate)) {
            label = 'Today';
        } else if (isYesterday(parsedDate)) {
            label = 'Yesterday';
        }

        return { date, label, logs };
    });
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-3">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const EmptyState: React.FC = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
    >
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <svg
                className="w-8 h-8 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No audit logs found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
            No activity matches your current filters. Try adjusting your search criteria or clearing filters.
        </p>
    </motion.div>
);

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
    logs,
    isLoading = false,
    className
}) => {
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!logs || logs.length === 0) {
        return <EmptyState />;
    }

    const groupedLogs = groupLogsByDate(logs);

    return (
        <div className={cn('relative', className)}>
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border hidden sm:block" />

            <div className="space-y-6">
                {groupedLogs.map((group, groupIndex) => (
                    <div key={group.date}>
                        {/* Date Header */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.1 }}
                            className="flex items-center gap-3 mb-3"
                        >
                            <div className="relative z-10 w-10 h-10 rounded-full bg-card border-2 border-primary/20 flex items-center justify-center hidden sm:flex">
                                <span className="text-xs font-bold text-primary">
                                    {format(parseISO(group.date), 'd')}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-foreground bg-background px-2 py-1 rounded-md">
                                {group.label}
                            </h3>
                            <span className="text-xs text-muted-foreground">
                                {group.logs.length} event{group.logs.length !== 1 ? 's' : ''}
                            </span>
                        </motion.div>

                        {/* Events */}
                        <div className="space-y-2 sm:pl-14">
                            {group.logs.map((log, logIndex) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (groupIndex * 0.1) + (logIndex * 0.03) }}
                                >
                                    <AuditEventCard log={log} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AuditTimeline;
