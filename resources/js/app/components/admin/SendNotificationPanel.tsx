import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Bell,
    Users,
    UserCheck,
    Building,
    Crown,
    Search,
    X,
    ChevronDown,
    Loader2,
    CheckCircle,
    AlertCircle,
    Mail,
    Megaphone,
    ShoppingBag,
    Star,
    Ticket,
    RefreshCw,
    Info,
    Sparkles,
    Target,
    Zap,
} from 'lucide-react';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

interface TargetOptions {
    target_types: Record<string, string>;
    roles: Record<string, string>;
    tiers: Record<string, string>;
    locations: { id: number; name: string }[];
    notification_types: Record<string, string>;
}

interface User {
    id: number;
    name: string;
    email: string;
}

// Fallback data when API fails
const buildFallbackOptions = (t: (key: string, params?: Record<string, any>) => string): TargetOptions => ({
    target_types: {
        all_users: t('admin.notifications.send_notification.target_types.all_users'),
        all_customers: t('admin.notifications.send_notification.target_types.all_customers'),
        all_employees: t('admin.notifications.send_notification.target_types.all_employees'),
        by_role: t('admin.notifications.send_notification.target_types.by_role'),
        by_tier: t('admin.notifications.send_notification.target_types.by_tier'),
        by_location: t('admin.notifications.send_notification.target_types.by_location'),
        specific_users: t('admin.notifications.send_notification.target_types.specific_users'),
        recent_customers: t('admin.notifications.send_notification.target_types.recent_customers'),
    },
    roles: {
        admin: t('admin.notifications.send_notification.roles.admin'),
        manager: t('admin.notifications.send_notification.roles.manager'),
        waiter: t('admin.notifications.send_notification.roles.waiter'),
        chef: t('admin.notifications.send_notification.roles.chef'),
        cashier: t('admin.notifications.send_notification.roles.cashier'),
        delivery: t('admin.notifications.send_notification.roles.delivery'),
    },
    tiers: {
        bronze: t('admin.notifications.send_notification.tiers.bronze'),
        silver: t('admin.notifications.send_notification.tiers.silver'),
        gold: t('admin.notifications.send_notification.tiers.gold'),
        platinum: t('admin.notifications.send_notification.tiers.platinum'),
    },
    locations: [],
    notification_types: {
        order: t('admin.notifications.send_notification.notification_types.order'),
        promotion: t('admin.notifications.send_notification.notification_types.promotion'),
        reward: t('admin.notifications.send_notification.notification_types.reward'),
        system: t('admin.notifications.send_notification.notification_types.system'),
    },
});

const typeIcons: Record<string, React.ElementType> = {
    order: ShoppingBag,
    promotion: Ticket,
    reward: Star,
    system: Megaphone,
};

const typeColors: Record<string, string> = {
    order: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    promotion: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    reward: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    system: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

const targetIcons: Record<string, React.ElementType> = {
    all_users: Users,
    all_customers: UserCheck,
    all_employees: Users,
    by_role: Target,
    by_tier: Crown,
    by_location: Building,
    specific_users: Search,
    recent_customers: Zap,
};

export default function SendNotificationPanel() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const [isExpanded, setIsExpanded] = useState(false);

    // Form state
    const [targetType, setTargetType] = useState('all_customers');
    const [notificationType, setNotificationType] = useState('system');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [actionUrl, setActionUrl] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState('');

    // Fetch options
    const { data: optionsData, isLoading: optionsLoading, isError: optionsError, refetch: refetchOptions } = useQuery({
        queryKey: ['notification-options'],
        queryFn: async () => {
            const response = await apiGet('/api/admin/notifications/targeted/options') as { data: TargetOptions };
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 2,
    });

    // Use fetched options or fallback
    const options = useMemo(() => {
        const localOptions = buildFallbackOptions(t);

        if (optionsData) {
            // Helper to merge API keys with local translations
            const mergeWithTranslation = (apiObj: Record<string, string>, localObj: Record<string, string>) => {
                return Object.keys(apiObj).reduce((acc, key) => {
                    acc[key] = localObj[key] || apiObj[key];
                    return acc;
                }, {} as Record<string, string>);
            };

            return {
                ...optionsData,
                // Use API keys (to ensure backend compatibility) but prefer translated labels from localOptions
                target_types: mergeWithTranslation(optionsData.target_types, localOptions.target_types),
                roles: mergeWithTranslation(optionsData.roles, localOptions.roles),
                tiers: mergeWithTranslation(optionsData.tiers, localOptions.tiers),
                notification_types: mergeWithTranslation(optionsData.notification_types, localOptions.notification_types),
                // Keep locations from API as they are dynamic
                locations: optionsData.locations,
            };
        }
        return localOptions;
    }, [optionsData, t]);

    // Preview recipients
    const previewMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/admin/notifications/targeted/preview', {
                target_type: targetType,
                roles: selectedRoles,
                tiers: selectedTiers,
                location_ids: selectedLocations,
                user_ids: selectedUsers.map(u => u.id),
            });
        },
    });

    // Search users
    const { data: searchResults, refetch: searchUsers, isFetching: isSearching } = useQuery({
        queryKey: ['user-search', userSearch],
        queryFn: async () => {
            if (userSearch.length < 2) return [];
            const response = await apiGet(`/api/admin/notifications/targeted/search-users?search=${userSearch}`) as { data: User[] };
            return response.data;
        },
        enabled: false,
    });

    // Send notification
    const sendMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/admin/notifications/targeted/send', {
                target_type: targetType,
                type: notificationType,
                title,
                message,
                action_url: actionUrl || null,
                roles: selectedRoles,
                tiers: selectedTiers,
                location_ids: selectedLocations,
                user_ids: selectedUsers.map(u => u.id),
            });
        },
        onSuccess: (data: any) => {
            toastSuccess(data.message || t('admin.notifications.send_notification.toasts.sent'));
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        },
        onError: () => {
            toastError(t('admin.notifications.send_notification.toasts.send_failed'));
        },
    });

    const resetForm = () => {
        setTitle('');
        setMessage('');
        setActionUrl('');
        setSelectedRoles([]);
        setSelectedTiers([]);
        setSelectedLocations([]);
        setSelectedUsers([]);
        setIsExpanded(false);
    };

    // Auto-preview when target changes
    useEffect(() => {
        if (isExpanded && targetType && optionsData) {
            const timer = setTimeout(() => previewMutation.mutate(), 300);
            return () => clearTimeout(timer);
        }
    }, [targetType, selectedRoles, selectedTiers, selectedLocations, selectedUsers.length, isExpanded, optionsData]);

    useEffect(() => {
        if (userSearch.length >= 2) {
            const timer = setTimeout(() => searchUsers(), 300);
            return () => clearTimeout(timer);
        }
    }, [userSearch]);

    const recipientCount = (previewMutation.data as any)?.data?.total_recipients || 0;
    const TargetIcon = targetIcons[targetType] || Users;
    const TypeIcon = typeIcons[notificationType] || Bell;

    return (
        <div className="bg-white dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-lg shadow-gray-200/20 dark:shadow-black/20">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all duration-200"
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 shadow-lg shadow-fuchsia-500/30">
                            <Send className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 animate-pulse" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t('admin.notifications.send_notification.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('admin.notifications.send_notification.subtitle')}
                        </p>
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 pt-0 space-y-5 border-t border-gray-200/50 dark:border-gray-700/50">

                            {/* Loading / Error State for Options */}
                            {optionsLoading && (
                                <div className="flex items-center justify-center gap-3 py-4 text-gray-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{t('admin.notifications.send_notification.loading_options')}</span>
                                </div>
                            )}

                            {optionsError && (
                                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-600/30">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{t('admin.notifications.send_notification.fallback_notice')}</span>
                                    </div>
                                    <button
                                        onClick={() => refetchOptions()}
                                        className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        {t('admin.notifications.send_notification.retry')}
                                    </button>
                                </div>
                            )}

                            {/* Target Selection - Enhanced Dropdown */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Target className="w-4 h-4 text-fuchsia-500" />
                                    {t('admin.notifications.send_notification.send_to')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={targetType}
                                        onChange={(e) => setTargetType(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 transition-all"
                                    >
                                        {Object.entries(options.target_types).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <TargetIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Role Selection - Improved Chips */}
                            {targetType === 'by_role' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        {t('admin.notifications.send_notification.select_roles')}
                                        {selectedRoles.length > 0 && (
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                {t('admin.notifications.send_notification.selected_count', { count: selectedRoles.length })}
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(options.roles).map(([key, label]) => (
                                            <button
                                                key={key}
                                                onClick={() => {
                                                    setSelectedRoles(prev =>
                                                        prev.includes(key)
                                                            ? prev.filter(r => r !== key)
                                                            : [...prev, key]
                                                    );
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border",
                                                    selectedRoles.includes(key)
                                                        ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white border-transparent shadow-lg shadow-fuchsia-500/30"
                                                        : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-fuchsia-300 dark:hover:border-fuchsia-500/50"
                                                )}
                                            >
                                                {selectedRoles.includes(key) && <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Tier Selection - Improved Chips */}
                            {targetType === 'by_tier' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        {t('admin.notifications.send_notification.select_tiers')}
                                        {selectedTiers.length > 0 && (
                                            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                                {t('admin.notifications.send_notification.selected_count', { count: selectedTiers.length })}
                                            </span>
                                        )}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(options.tiers).map(([key, label]) => {
                                            const tierColors: Record<string, string> = {
                                                bronze: 'from-amber-600 to-orange-600 shadow-amber-500/30',
                                                silver: 'from-slate-400 to-slate-500 shadow-slate-400/30',
                                                gold: 'from-yellow-400 to-amber-500 shadow-yellow-400/30',
                                                platinum: 'from-indigo-400 to-purple-500 shadow-indigo-400/30',
                                            };
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        setSelectedTiers(prev =>
                                                            prev.includes(key)
                                                                ? prev.filter(t => t !== key)
                                                                : [...prev, key]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 border",
                                                        selectedTiers.includes(key)
                                                            ? `bg-gradient-to-r ${tierColors[key]} text-white border-transparent shadow-lg`
                                                            : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-fuchsia-300"
                                                    )}
                                                >
                                                    <Crown className="w-3.5 h-3.5" />
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Location Selection */}
                            {targetType === 'by_location' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-2"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Building className="w-4 h-4 text-emerald-500" />
                                        {t('admin.notifications.send_notification.select_locations')}
                                    </label>
                                    {options.locations.length === 0 ? (
                                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-gray-500 text-sm">
                                            <Building className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                            {t('admin.notifications.send_notification.no_locations')}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {options.locations.map((loc) => (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => {
                                                        setSelectedLocations(prev =>
                                                            prev.includes(loc.id)
                                                                ? prev.filter(l => l !== loc.id)
                                                                : [...prev, loc.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 border",
                                                        selectedLocations.includes(loc.id)
                                                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent shadow-lg shadow-emerald-500/30"
                                                            : "bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-emerald-300"
                                                    )}
                                                >
                                                    <Building className="w-3.5 h-3.5" />
                                                    {loc.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* User Search - Enhanced */}
                            {targetType === 'specific_users' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3"
                                >
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        <Search className="w-4 h-4 text-purple-500" />
                                        {t('admin.notifications.send_notification.search_users')}
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder={t('admin.notifications.send_notification.search_placeholder')}
                                            className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 transition-all"
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                                        )}
                                    </div>

                                    {/* Search Results */}
                                    <AnimatePresence>
                                        {searchResults && searchResults.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -5 }}
                                                className="border border-gray-200 dark:border-gray-600 rounded-xl max-h-48 overflow-y-auto bg-white dark:bg-gray-800 shadow-lg"
                                            >
                                                {searchResults.map((user) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => {
                                                            if (!selectedUsers.find(u => u.id === user.id)) {
                                                                setSelectedUsers(prev => [...prev, user]);
                                                            }
                                                            setUserSearch('');
                                                        }}
                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-medium text-sm">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                                            </div>
                                                        </div>
                                                        {selectedUsers.find(u => u.id === user.id) && (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Selected Users */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {selectedUsers.map((user) => (
                                                <motion.span
                                                    key={user.id}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    exit={{ scale: 0 }}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 dark:from-fuchsia-900/30 dark:to-pink-900/30 border border-fuchsia-200 dark:border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-full text-sm"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-xs font-medium">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {user.name}
                                                    <button
                                                        onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                                                        className="p-0.5 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800/50 rounded-full transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </motion.span>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Recipients Preview */}
                            <AnimatePresence>
                                {(previewMutation.isPending || recipientCount > 0) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-4 bg-gradient-to-r from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-xl border border-fuchsia-200/50 dark:border-fuchsia-700/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            {previewMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 text-fuchsia-500 animate-spin" />
                                                    <span className="text-sm text-fuchsia-700 dark:text-fuchsia-300">{t('admin.notifications.send_notification.preview.calculating')}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-800/50 rounded-lg">
                                                        <Users className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                                            {recipientCount.toLocaleString()}
                                                        </span>
                                                        <span className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70 ml-1.5">
                                                            {recipientCount === 1
                                                                ? t('admin.notifications.send_notification.preview.recipient_one')
                                                                : t('admin.notifications.send_notification.preview.recipient_other')}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Notification Type - Enhanced */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    {t('admin.notifications.send_notification.notification_type')}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {Object.entries(options.notification_types).map(([key, label]) => {
                                        const Icon = typeIcons[key] || Bell;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setNotificationType(key)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                                                    notificationType === key
                                                        ? `${typeColors[key]} border-transparent shadow-md`
                                                        : "bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                                )}
                                            >
                                                <Icon className="w-5 h-5" />
                                                <span className="text-xs">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title Input */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    {t('admin.notifications.send_notification.title_label')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('admin.notifications.send_notification.title_placeholder')}
                                    maxLength={255}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 transition-all"
                                />
                                <div className="text-right text-xs text-gray-400">
                                    {t('admin.notifications.send_notification.char_count', { count: title.length, total: 255 })}
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Megaphone className="w-4 h-4 text-gray-500" />
                                    {t('admin.notifications.send_notification.message_label')} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={t('admin.notifications.send_notification.message_placeholder')}
                                    rows={4}
                                    maxLength={1000}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 transition-all"
                                />
                                <div className="text-right text-xs text-gray-400">
                                    {t('admin.notifications.send_notification.char_count', { count: message.length, total: 1000 })}
                                </div>
                            </div>

                            {/* Action URL */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <Info className="w-4 h-4 text-gray-400" />
                                    {t('admin.notifications.send_notification.action_url_label')}
                                    <span className="text-xs text-gray-400">({t('admin.notifications.send_notification.optional')})</span>
                                </label>
                                <input
                                    type="text"
                                    value={actionUrl}
                                    onChange={(e) => setActionUrl(e.target.value)}
                                    placeholder={t('admin.notifications.send_notification.action_url_placeholder')}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 focus:border-fuchsia-500 transition-all"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                <button
                                    onClick={() => resetForm()}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 font-medium"
                                >
                                    {t('admin.notifications.send_notification.cancel')}
                                </button>
                                <button
                                    onClick={() => sendMutation.mutate()}
                                    disabled={!title || !message || sendMutation.isPending}
                                    className={cn(
                                        "flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg",
                                        title && message
                                            ? "bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 text-white hover:shadow-xl hover:shadow-fuchsia-500/25 hover:scale-[1.02]"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
                                    )}
                                >
                                    {sendMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('admin.notifications.send_notification.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            {t('admin.notifications.send_notification.send_button')}
                                            {recipientCount > 0 && (
                                                <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                                    {t('admin.notifications.send_notification.to_count', { count: recipientCount })}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
