import React from 'react';
import { cn } from '@/app/utils/cn';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskIndicatorProps {
    level: RiskLevel;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const riskConfig: Record<RiskLevel, {
    label: string;
    icon: React.ElementType;
    dotClass: string;
    textClass: string;
    bgClass: string;
    description: string;
}> = {
    low: {
        label: 'Low Risk',
        icon: ShieldCheck,
        dotClass: 'bg-emerald-500',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-500/10 border-emerald-500/20',
        description: 'Normal activity'
    },
    medium: {
        label: 'Medium',
        icon: AlertTriangle,
        dotClass: 'bg-amber-500',
        textClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-500/10 border-amber-500/20',
        description: 'Review recommended'
    },
    high: {
        label: 'High Risk',
        icon: ShieldAlert,
        dotClass: 'bg-red-500',
        textClass: 'text-red-600 dark:text-red-400',
        bgClass: 'bg-red-500/10 border-red-500/20',
        description: 'Requires attention'
    },
    critical: {
        label: 'Critical',
        icon: AlertOctagon,
        dotClass: 'bg-red-600 animate-pulse',
        textClass: 'text-red-600 dark:text-red-400',
        bgClass: 'bg-red-500/20 border-red-500/30',
        description: 'Immediate action required'
    }
};

const sizes = {
    sm: { dot: 'w-2 h-2', icon: 'w-3 h-3', text: 'text-xs', padding: 'px-1.5 py-0.5' },
    md: { dot: 'w-2.5 h-2.5', icon: 'w-4 h-4', text: 'text-sm', padding: 'px-2 py-1' },
    lg: { dot: 'w-3 h-3', icon: 'w-5 h-5', text: 'text-base', padding: 'px-3 py-1.5' }
};

export const RiskIndicator: React.FC<RiskIndicatorProps> = ({
    level,
    showLabel = true,
    size = 'md',
    className
}) => {
    const config = riskConfig[level];
    const sizeConfig = sizes[size];

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border font-medium transition-all',
                config.bgClass,
                sizeConfig.padding,
                className
            )}
            title={config.description}
        >
            <span className={cn('rounded-full flex-shrink-0', config.dotClass, sizeConfig.dot)} />
            {showLabel && (
                <span className={cn(config.textClass, sizeConfig.text)}>
                    {config.label}
                </span>
            )}
        </div>
    );
};

// Helper to determine risk level from audit log data
export function calculateRiskLevel(log: {
    action: string;
    status?: string;
    user_role?: string;
    auditable_type?: string;
}): RiskLevel {
    const action = log.action.toLowerCase();

    // Critical: Failed auth or permission changes
    if (log.status === 'failed' && (action.includes('login') || action.includes('auth'))) {
        return 'critical';
    }

    // High: Delete operations or permission/role changes
    if (action.includes('delete') || action.includes('permission') || action.includes('role')) {
        return 'high';
    }

    // Medium: Updates to sensitive models
    const sensitiveModels = ['user', 'admin', 'payment', 'settings', 'config'];
    if (sensitiveModels.some(m => log.auditable_type?.toLowerCase().includes(m))) {
        if (action.includes('update')) return 'medium';
    }

    // Default: Low risk
    return 'low';
}

export default RiskIndicator;
