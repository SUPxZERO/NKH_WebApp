import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

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

const typeIcons: Record<string, React.ElementType> = {
    order: ShoppingBag,
    promotion: Ticket,
    reward: Star,
    system: Megaphone,
};

const typeColors: Record<string, string> = {
    order: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    promotion: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30',
    reward: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30',
    system: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30',
};

export default function SendNotificationPanel() {
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
    const { data: optionsData } = useQuery({
        queryKey: ['notification-options'],
        queryFn: async () => {
            const response = await apiGet('/api/admin/notifications/targeted/options') as { data: TargetOptions };
            return response.data;
        },
    });

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
    const { data: searchResults, refetch: searchUsers } = useQuery({
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
            toastSuccess(data.message || 'Notification sent successfully!');
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        },
        onError: () => {
            toastError('Failed to send notification');
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
        if (isExpanded && targetType) {
            previewMutation.mutate();
        }
    }, [targetType, selectedRoles, selectedTiers, selectedLocations, selectedUsers.length, isExpanded]);

    useEffect(() => {
        if (userSearch.length >= 2) {
            const timer = setTimeout(() => searchUsers(), 300);
            return () => clearTimeout(timer);
        }
    }, [userSearch]);

    const options = optionsData;
    const TypeIcon = typeIcons[notificationType] || Bell;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500">
                        <Send className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Send Notification</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Send targeted notifications to users
                        </p>
                    </div>
                </div>
                <ChevronDown className={cn(
                    "w-5 h-5 text-gray-500 transition-transform",
                    isExpanded && "rotate-180"
                )} />
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">

                            {/* Target Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Send To
                                </label>
                                <select
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    {options && Object.entries(options.target_types).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Role Selection */}
                            {targetType === 'by_role' && options && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Roles
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
                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                                    selectedRoles.includes(key)
                                                        ? "bg-fuchsia-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tier Selection */}
                            {targetType === 'by_tier' && options && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Customer Tiers
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(options.tiers).map(([key, label]) => (
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
                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                                                    selectedTiers.includes(key)
                                                        ? "bg-fuchsia-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                )}
                                            >
                                                <Crown className="w-3 h-3" />
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Location Selection */}
                            {targetType === 'by_location' && options && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Select Locations
                                    </label>
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
                                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                                                    selectedLocations.includes(loc.id)
                                                        ? "bg-fuchsia-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                )}
                                            >
                                                <Building className="w-3 h-3" />
                                                {loc.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* User Search */}
                            {targetType === 'specific_users' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Search & Select Users
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchResults && searchResults.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => {
                                                        if (!selectedUsers.find(u => u.id === user.id)) {
                                                            setSelectedUsers(prev => [...prev, user]);
                                                        }
                                                        setUserSearch('');
                                                    }}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.email}</p>
                                                    </div>
                                                    {selectedUsers.find(u => u.id === user.id) && (
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Users */}
                                    {selectedUsers.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedUsers.map((user) => (
                                                <span
                                                    key={user.id}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-300 rounded-full text-sm"
                                                >
                                                    {user.name}
                                                    <button
                                                        onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                                                        className="hover:text-fuchsia-900"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Preview */}
                            {previewMutation.data && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-fuchsia-500" />
                                        <span className="font-medium text-fuchsia-600">
                                            {(previewMutation.data as any)?.data?.total_recipients || 0} recipients
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Notification Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Notification Type
                                </label>
                                <div className="flex gap-2">
                                    {options && Object.entries(options.notification_types).map(([key, label]) => {
                                        const Icon = typeIcons[key] || Bell;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setNotificationType(key)}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                    notificationType === key
                                                        ? typeColors[key]
                                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Notification title..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Message *
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Notification message..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                            </div>

                            {/* Action URL */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Action URL (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={actionUrl}
                                    onChange={(e) => setActionUrl(e.target.value)}
                                    placeholder="/menu or https://example.com"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => resetForm()}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => sendMutation.mutate()}
                                    disabled={!title || !message || sendMutation.isPending}
                                    className={cn(
                                        "flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                                        title && message
                                            ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:from-fuchsia-600 hover:to-pink-600"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Send Notification
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
