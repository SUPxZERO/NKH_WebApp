import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/app/utils/cn';
import {
    Search, Filter, Calendar, User, Shield, X, ChevronDown,
    Zap, Trash2, Clock, AlertTriangle, SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/app/context/LanguageContext';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface AuditFiltersProps {
    onFiltersChange: (filters: FilterState) => void;
    availableFilters?: {
        actions?: string[];
        users?: Array<{ id: number; name: string }>;
        guards?: string[];
        sources?: string[];
        roles?: string[];
    };
    className?: string;
}

export interface FilterState {
    search: string;
    action: string;
    user_id: string;
    guard: string;
    source: string;
    role: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    riskLevel: string;
    status: string;
}

const defaultFilters: FilterState = {
    search: '',
    action: 'all',
    user_id: 'all',
    guard: 'all',
    source: 'all',
    role: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: '',
    riskLevel: 'all',
    status: 'all'
};

const SelectFilter: React.FC<{
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder: string;
    icon?: React.ElementType;
    className?: string;
}> = ({ value, onChange, options, placeholder, icon: Icon, className }) => (
    <div className={cn('relative', className)}>
        {Icon && (
            <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                'w-full h-10 rounded-lg border border-border bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                'transition-colors appearance-none cursor-pointer',
                Icon ? 'pl-9 pr-8' : 'pl-3 pr-8'
            )}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.count !== undefined && ` (${opt.count})`}
                </option>
            ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
);

export const AuditFilters: React.FC<AuditFiltersProps> = ({
    onFiltersChange,
    availableFilters,
    className
}) => {
    const { t } = useLanguage();
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activePreset, setActivePreset] = useState<string | null>(null);

    // Notify parent of filter changes
    useEffect(() => {
        onFiltersChange(filters);
    }, [filters, onFiltersChange]);

    const quickPresets = useMemo(() => [
        { id: 'today', label: t('admin.analytics.audit.filters.presets.today') as string, icon: Clock, filters: { dateRange: 'today' } },
        { id: 'deletes', label: t('admin.analytics.audit.filters.presets.deletes') as string, icon: Trash2, filters: { action: 'deleted' } },
        { id: 'risky', label: t('admin.analytics.audit.filters.presets.high_risk') as string, icon: AlertTriangle, filters: { riskLevel: 'high' } },
        { id: 'failed', label: t('admin.analytics.audit.filters.presets.failed') as string, icon: X, filters: { status: 'failed' } },
    ], [t]);

    const datePresets = useMemo(() => [
        { value: 'all', label: t('admin.analytics.audit.filters.date_options.all') as string },
        { value: 'today', label: t('admin.analytics.audit.filters.date_options.today') as string },
        { value: 'yesterday', label: t('admin.analytics.audit.filters.date_options.yesterday') as string },
        { value: 'week', label: t('admin.analytics.audit.filters.date_options.week') as string },
        { value: 'month', label: t('admin.analytics.audit.filters.date_options.month') as string },
        { value: 'custom', label: t('admin.analytics.audit.filters.date_options.custom') as string }
    ], [t]);

    const actionOptions = useMemo(() => [
        { value: 'all', label: t('admin.analytics.audit.filters.action_options.all') as string },
        { value: 'created', label: t('admin.analytics.audit.filters.action_options.created') as string },
        { value: 'updated', label: t('admin.analytics.audit.filters.action_options.updated') as string },
        { value: 'deleted', label: t('admin.analytics.audit.filters.action_options.deleted') as string },
        { value: 'login', label: t('admin.analytics.audit.filters.action_options.login') as string },
        { value: 'logout', label: t('admin.analytics.audit.filters.action_options.logout') as string }
    ], [t]);

    const riskOptions = useMemo(() => [
        { value: 'all', label: t('admin.analytics.audit.filters.risk_options.all') as string },
        { value: 'low', label: t('admin.analytics.audit.filters.risk_options.low') as string },
        { value: 'medium', label: t('admin.analytics.audit.filters.risk_options.medium') as string },
        { value: 'high', label: t('admin.analytics.audit.filters.risk_options.high') as string },
        { value: 'critical', label: t('admin.analytics.audit.filters.risk_options.critical') as string }
    ], [t]);

    const updateFilter = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setActivePreset(null);
    };

    const applyPreset = (presetId: string, presetFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...presetFilters }));
        setActivePreset(presetId);
    };

    const clearFilters = () => {
        setFilters(defaultFilters);
        setActivePreset(null);
    };

    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (key === 'search' && value) return true;
        if (key !== 'search' && value !== 'all' && value !== '') return true;
        return false;
    });

    // Build user options from available filters
    const userOptions: FilterOption[] = [
        { value: 'all', label: t('admin.analytics.audit.filters.dynamic_options.all_users') as string },
        ...(availableFilters?.users?.map(u => ({ value: String(u.id), label: u.name })) || [])
    ];

    const guardOptions: FilterOption[] = [
        { value: 'all', label: t('admin.analytics.audit.filters.dynamic_options.all_guards') as string },
        ...(availableFilters?.guards?.map(g => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) })) || [])
    ];

    const sourceOptions: FilterOption[] = [
        { value: 'all', label: t('admin.analytics.audit.filters.dynamic_options.all_sources') as string },
        ...(availableFilters?.sources?.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) })) || [])
    ];

    // Status options needs translation too
    const statusOptions = useMemo(() => [
        { value: 'all', label: t('admin.analytics.audit.filters.status_options.all') as string },
        { value: 'success', label: t('admin.analytics.audit.filters.status_options.success') as string },
        { value: 'failed', label: t('admin.analytics.audit.filters.status_options.failed') as string }
    ], [t]);

    return (
        <div className={cn('space-y-3', className)}>
            {/* Search + Quick Presets Row */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('admin.analytics.audit.filters.search') as string}
                        value={filters.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className={cn(
                            'w-full h-10 pl-9 pr-4 rounded-lg border border-border bg-background text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                            'placeholder:text-muted-foreground transition-colors'
                        )}
                    />
                </div>

                {/* Quick Presets */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {quickPresets.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => applyPreset(preset.id, preset.filters as any)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium whitespace-nowrap',
                                'border transition-all',
                                activePreset === preset.id
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border hover:border-primary/50 text-foreground'
                            )}
                        >
                            <preset.icon className="w-4 h-4" />
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Filters Row */}
            <div className="flex flex-wrap gap-2">
                <SelectFilter
                    value={filters.action}
                    onChange={(v) => updateFilter('action', v)}
                    options={actionOptions}
                    placeholder={t('admin.analytics.audit.filters.labels.action') as string}
                    icon={Zap}
                    className="w-full sm:w-40"
                />
                <SelectFilter
                    value={filters.dateRange}
                    onChange={(v) => updateFilter('dateRange', v)}
                    options={datePresets}
                    placeholder={t('admin.analytics.audit.filters.labels.date') as string}
                    icon={Calendar}
                    className="w-full sm:w-40"
                />
                <SelectFilter
                    value={filters.riskLevel}
                    onChange={(v) => updateFilter('riskLevel', v)}
                    options={riskOptions}
                    placeholder={t('admin.analytics.audit.filters.labels.risk') as string}
                    icon={AlertTriangle}
                    className="w-full sm:w-40"
                />

                {/* Advanced Toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium',
                        'border border-border bg-background hover:border-primary/50 transition-colors',
                        showAdvanced && 'bg-muted'
                    )}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('admin.analytics.audit.filters.more')}</span>
                </button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 h-10 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        {t('admin.analytics.audit.filters.clear')}
                    </button>
                )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-2 pb-1 border-t border-border">
                            <div className="flex flex-wrap gap-2">
                                <SelectFilter
                                    value={filters.user_id}
                                    onChange={(v) => updateFilter('user_id', v)}
                                    options={userOptions}
                                    placeholder={t('admin.analytics.audit.filters.labels.user') as string}
                                    icon={User}
                                    className="w-full sm:w-44"
                                />
                                <SelectFilter
                                    value={filters.guard}
                                    onChange={(v) => updateFilter('guard', v)}
                                    options={guardOptions}
                                    placeholder={t('admin.analytics.audit.filters.labels.guard') as string}
                                    icon={Shield}
                                    className="w-full sm:w-36"
                                />
                                <SelectFilter
                                    value={filters.source}
                                    onChange={(v) => updateFilter('source', v)}
                                    options={sourceOptions}
                                    placeholder={t('admin.analytics.audit.filters.labels.source') as string}
                                    icon={Filter}
                                    className="w-full sm:w-36"
                                />
                                <SelectFilter
                                    value={filters.status}
                                    onChange={(v) => updateFilter('status', v)}
                                    options={statusOptions}
                                    placeholder={t('admin.analytics.audit.filters.labels.status') as string}
                                    className="w-full sm:w-32"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditFilters;
