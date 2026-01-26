import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import {
    ChevronDown, User, Globe, Monitor, Route, Clock, Hash,
    Plus, Pencil, Trash2, LogIn, Shield, Eye, Settings
} from 'lucide-react';
import { RiskIndicator, calculateRiskLevel, RiskLevel } from './RiskIndicator';
import { DiffViewer } from './DiffViewer';
import { formatDistanceToNow } from 'date-fns';

export interface AuditLog {
    id: number;
    user_id?: number;
    user?: { name: string; email: string; avatar?: string };
    action: string;
    auditable_type?: string;
    auditable_id?: number;
    ip_address?: string;
    user_agent?: string | null;
    route?: string;
    method?: string;
    source?: string;
    guard?: string;
    user_role?: string;
    status?: string;
    before_data?: Record<string, any>;
    after_data?: Record<string, any>;
    change_summary?: string;
    created_at: string;
    metadata?: any;
}

interface AuditEventCardProps {
    log: AuditLog;
    isExpanded?: boolean;
    onToggle?: () => void;
    className?: string;
}

// Action configuration
const actionConfig: Record<string, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    label: string;
}> = {
    created: {
        icon: Plus,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        label: 'Created'
    },
    updated: {
        icon: Pencil,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        label: 'Updated'
    },
    deleted: {
        icon: Trash2,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20',
        label: 'Deleted'
    },
    login: {
        icon: LogIn,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-500/10 border-purple-500/20',
        label: 'Login'
    },
    logout: {
        icon: LogIn,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-500/10 border-gray-500/20',
        label: 'Logout'
    },
    permission: {
        icon: Shield,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
        label: 'Permission'
    },
    viewed: {
        icon: Eye,
        color: 'text-cyan-600 dark:text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/20',
        label: 'Viewed'
    },
    default: {
        icon: Settings,
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-500/10 border-gray-500/20',
        label: 'Action'
    }
};

function getActionConfig(action: string) {
    const lower = action.toLowerCase();
    if (lower.includes('create')) return actionConfig.created;
    if (lower.includes('update')) return actionConfig.updated;
    if (lower.includes('delete')) return actionConfig.deleted;
    if (lower.includes('login')) return actionConfig.login;
    if (lower.includes('logout')) return actionConfig.logout;
    if (lower.includes('permission') || lower.includes('role')) return actionConfig.permission;
    if (lower.includes('view') || lower.includes('read')) return actionConfig.viewed;
    return actionConfig.default;
}

function getModelName(auditableType?: string): string {
    if (!auditableType) return 'Unknown';
    const parts = auditableType.split('\\');
    return parts[parts.length - 1];
}

function formatUserAgent(ua: string | null | undefined): string {
    if (!ua) return 'Unknown';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Mobile')) return 'Mobile';
    return 'Browser';
}

function getRelativeTime(dateStr: string): string {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
        return dateStr;
    }
}

export const AuditEventCard: React.FC<AuditEventCardProps> = ({
    log,
    isExpanded = false,
    onToggle,
    className
}) => {
    const [expanded, setExpanded] = useState(isExpanded);
    const actionCfg = getActionConfig(log.action);
    const ActionIcon = actionCfg.icon;
    const riskLevel = calculateRiskLevel(log);
    const modelName = getModelName(log.auditable_type);
    const hasChanges = log.before_data || log.after_data;

    const handleToggle = () => {
        setExpanded(!expanded);
        onToggle?.();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                'relative bg-card border border-border rounded-xl overflow-hidden transition-all',
                'hover:border-primary/20 hover:shadow-md',
                expanded && 'ring-1 ring-primary/20',
                className
            )}
        >
            {/* Main Card Content */}
            <button
                onClick={handleToggle}
                className="w-full text-left p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <div className="flex items-start gap-3">
                    {/* Action Icon */}
                    <div className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border',
                        actionCfg.bgColor
                    )}>
                        <ActionIcon className={cn('w-5 h-5', actionCfg.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Primary Line: User + Action + Target */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                                {log.user?.name || 'System'}
                            </span>
                            <span className={cn(
                                'px-2 py-0.5 rounded-md text-xs font-medium border',
                                actionCfg.bgColor, actionCfg.color
                            )}>
                                {log.action}
                            </span>
                            {log.auditable_type && (
                                <>
                                    <span className="text-muted-foreground text-sm">on</span>
                                    <span className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-foreground">
                                        {modelName}
                                        {log.auditable_id && <span className="text-muted-foreground"> #{log.auditable_id}</span>}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Secondary Line: Time + Risk */}
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {getRelativeTime(log.created_at)}
                            </span>
                            {riskLevel !== 'low' && (
                                <RiskIndicator level={riskLevel} size="sm" />
                            )}
                            {log.user_role && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {log.user_role}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expand Indicator */}
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        className="flex-shrink-0"
                    >
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                </div>
            </button>

            {/* Expanded Details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-0 border-t border-border">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">IP Address</p>
                                        <p className="text-xs font-mono">{log.ip_address || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Monitor className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Device</p>
                                        <p className="text-xs">{formatUserAgent(log.user_agent)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Route className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Route</p>
                                        <p className="text-xs font-mono truncate max-w-[120px]" title={log.route}>{log.route || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground font-medium">Source</p>
                                        <p className="text-xs">{log.source || log.guard || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Diff Viewer */}
                            {hasChanges && (
                                <div className="pt-3 border-t border-border">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Changes</h4>
                                    <DiffViewer
                                        before={log.before_data}
                                        after={log.after_data}
                                        changeSummary={log.change_summary}
                                    />
                                </div>
                            )}

                            {/* Exact Timestamp */}
                            <div className="pt-3 text-xs text-muted-foreground">
                                Exact time: {new Date(log.created_at).toLocaleString()}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AuditEventCard;
