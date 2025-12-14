import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePage, router } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Settings as SettingsIcon,
    Bell,
    Moon,
    Sun,
    Globe,
    Lock,
    Smartphone,
    Mail,
    Eye,
    EyeOff,
    Save,
    Check,
    ChevronRight,
    Shield,
    Trash2,
    AlertTriangle,
    Loader2,
    X,
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPut, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface SettingSection {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
}

interface UserSettings {
    notifications: {
        orderUpdates: boolean;
        promotions: boolean;
        newsletter: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
    };
    privacy: {
        showProfile: boolean;
        shareOrderHistory: boolean;
        allowAnalytics: boolean;
    };
    theme: 'light' | 'dark' | 'system';
    language: string;
}

const defaultSettings: UserSettings = {
    notifications: {
        orderUpdates: true,
        promotions: true,
        newsletter: false,
        smsNotifications: false,
        pushNotifications: true,
    },
    privacy: {
        showProfile: true,
        shareOrderHistory: false,
        allowAnalytics: true,
    },
    theme: 'system',
    language: 'en',
};

const sections: SettingSection[] = [
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Manage your notification preferences' },
    { id: 'appearance', title: 'Appearance', icon: Moon, description: 'Customize how the app looks' },
    { id: 'privacy', title: 'Privacy & Security', icon: Shield, description: 'Control your privacy settings' },
    { id: 'language', title: 'Language', icon: Globe, description: 'Choose your preferred language' },
    { id: 'account', title: 'Account', icon: Lock, description: 'Manage your account settings' },
];

export default function Settings() {
    const queryClient = useQueryClient();
    const { props } = usePage();
    const user = (props.auth as any)?.user;

    const [activeSection, setActiveSection] = useState('notifications');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    // Local settings state
    const [notifications, setNotifications] = useState(defaultSettings.notifications);
    const [privacy, setPrivacy] = useState(defaultSettings.privacy);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(defaultSettings.theme);
    const [language, setLanguage] = useState(defaultSettings.language);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Phone form
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');

    // Fetch settings from API
    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['userSettings'],
        queryFn: async () => {
            const response = await apiGet('/api/customer/settings') as { success: boolean; data: UserSettings };
            return response.data;
        },
    });

    // Update state when settings are fetched
    useEffect(() => {
        if (settingsData) {
            setNotifications(settingsData.notifications);
            setPrivacy(settingsData.privacy);
            setTheme(settingsData.theme);
            setLanguage(settingsData.language);

            // Apply theme
            applyTheme(settingsData.theme);
        }
    }, [settingsData]);

    // Check initial dark mode
    useEffect(() => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
    }, []);

    // Apply theme function
    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            setIsDarkMode(true);
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
            setIsDarkMode(false);
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark');
                setIsDarkMode(true);
            } else {
                document.documentElement.classList.remove('dark');
                setIsDarkMode(false);
            }
        }
        localStorage.setItem('theme', newTheme);
    };

    // Save all settings mutation
    const saveSettingsMutation = useMutation({
        mutationFn: async () => {
            return apiPut('/api/customer/settings', {
                notifications,
                privacy,
                theme,
                language,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userSettings'] });
            toastSuccess('Settings saved successfully!');
        },
        onError: () => {
            toastError('Failed to save settings. Please try again.');
        },
    });

    // Update notifications mutation
    const updateNotificationsMutation = useMutation({
        mutationFn: async (key: keyof typeof notifications) => {
            const newValue = !notifications[key];
            const newNotifications = { ...notifications, [key]: newValue };
            setNotifications(newNotifications);
            return apiPut('/api/customer/settings/notifications', newNotifications);
        },
        onSuccess: () => {
            toastSuccess('Notification preference updated');
        },
        onError: () => {
            toastError('Failed to update notification preference');
        },
    });

    // Update privacy mutation
    const updatePrivacyMutation = useMutation({
        mutationFn: async (key: keyof typeof privacy) => {
            const newValue = !privacy[key];
            const newPrivacy = { ...privacy, [key]: newValue };
            setPrivacy(newPrivacy);
            return apiPut('/api/customer/settings/privacy', newPrivacy);
        },
        onSuccess: () => {
            toastSuccess('Privacy setting updated');
        },
        onError: () => {
            toastError('Failed to update privacy setting');
        },
    });

    // Update theme mutation
    const updateThemeMutation = useMutation({
        mutationFn: async (newTheme: 'light' | 'dark' | 'system') => {
            setTheme(newTheme);
            applyTheme(newTheme);
            return apiPut('/api/customer/settings/theme', { theme: newTheme });
        },
        onSuccess: () => {
            toastSuccess('Theme updated');
        },
        onError: () => {
            toastError('Failed to update theme');
        },
    });

    // Update language mutation
    const updateLanguageMutation = useMutation({
        mutationFn: async (newLanguage: string) => {
            setLanguage(newLanguage);
            localStorage.setItem('language', newLanguage);
            return apiPut('/api/customer/settings/language', { language: newLanguage });
        },
        onSuccess: () => {
            toastSuccess('Language updated');
        },
        onError: () => {
            toastError('Failed to update language');
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/customer/change-password', passwordForm);
        },
        onSuccess: () => {
            toastSuccess('Password changed successfully!');
            setShowPasswordModal(false);
            setPasswordForm({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Failed to change password';
            toastError(message);
        },
    });

    // Update phone mutation
    const updatePhoneMutation = useMutation({
        mutationFn: async () => {
            return apiPut('/api/customer/phone', { phone: phoneNumber });
        },
        onSuccess: () => {
            toastSuccess('Phone number updated!');
            setShowPhoneModal(false);
        },
        onError: () => {
            toastError('Failed to update phone number');
        },
    });

    // Handle delete account
    const handleDeleteAccount = () => {
        router.delete('/profile', {
            onSuccess: () => {
                router.visit('/');
            }
        });
    };

    const renderSectionContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                </div>
            );
        }

        switch (activeSection) {
            case 'notifications':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose what notifications you'd like to receive
                        </p>

                        <div className="space-y-3 mt-6">
                            {[
                                { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified about your order status' },
                                { key: 'promotions', label: 'Promotions & Offers', desc: 'Receive special deals and discounts' },
                                { key: 'newsletter', label: 'Newsletter', desc: 'Weekly updates and new menu items' },
                                { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive text messages for updates' },
                                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser notifications' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationsMutation.mutate(item.key as keyof typeof notifications)}
                                        disabled={updateNotificationsMutation.isPending}
                                        className={cn(
                                            'w-12 h-6 rounded-full transition-colors relative',
                                            notifications[item.key as keyof typeof notifications] ? 'bg-fuchsia-500' : 'bg-gray-300 dark:bg-gray-600'
                                        )}
                                    >
                                        <div className={cn(
                                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                                            notifications[item.key as keyof typeof notifications] ? 'left-7' : 'left-1'
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Customize how the application looks on your device
                        </p>

                        <div className="mt-6 space-y-4">
                            {/* Theme Selection */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <p className="font-medium text-gray-900 dark:text-white mb-4">Theme</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => updateThemeMutation.mutate('light')}
                                        disabled={updateThemeMutation.isPending}
                                        className={cn(
                                            'p-4 rounded-xl border-2 transition-all',
                                            theme === 'light'
                                                ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <Sun className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Light</p>
                                    </button>
                                    <button
                                        onClick={() => updateThemeMutation.mutate('dark')}
                                        disabled={updateThemeMutation.isPending}
                                        className={cn(
                                            'p-4 rounded-xl border-2 transition-all',
                                            theme === 'dark'
                                                ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <Moon className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Dark</p>
                                    </button>
                                    <button
                                        onClick={() => updateThemeMutation.mutate('system')}
                                        disabled={updateThemeMutation.isPending}
                                        className={cn(
                                            'p-4 rounded-xl border-2 transition-all',
                                            theme === 'system'
                                                ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                                            <Sun className="w-4 h-4 text-yellow-500" />
                                            <Moon className="w-4 h-4 text-purple-500 -ml-1" />
                                        </div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">System</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy & Security</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Control your privacy and security preferences
                        </p>

                        <div className="space-y-3 mt-6">
                            {[
                                { key: 'showProfile', label: 'Public Profile', desc: 'Allow others to see your profile' },
                                { key: 'shareOrderHistory', label: 'Share Order History', desc: 'Share order data for recommendations' },
                                { key: 'allowAnalytics', label: 'Usage Analytics', desc: 'Help us improve with anonymous usage data' },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => updatePrivacyMutation.mutate(item.key as keyof typeof privacy)}
                                        disabled={updatePrivacyMutation.isPending}
                                        className={cn(
                                            'w-12 h-6 rounded-full transition-colors relative',
                                            privacy[item.key as keyof typeof privacy] ? 'bg-fuchsia-500' : 'bg-gray-300 dark:bg-gray-600'
                                        )}
                                    >
                                        <div className={cn(
                                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                                            privacy[item.key as keyof typeof privacy] ? 'left-7' : 'left-1'
                                        )} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Change Password Link */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="flex items-center justify-between w-full"
                            >
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-gray-500" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                                        <p className="text-sm text-gray-500">Update your account password</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                );

            case 'language':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose your preferred language
                        </p>

                        <div className="space-y-2 mt-6">
                            {[
                                { code: 'en', name: 'English', native: 'English' },
                                { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ' },
                                { code: 'zh', name: 'Chinese', native: '中文' },
                                { code: 'ja', name: 'Japanese', native: '日本語' },
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => updateLanguageMutation.mutate(lang.code)}
                                    disabled={updateLanguageMutation.isPending}
                                    className={cn(
                                        'flex items-center justify-between w-full p-4 rounded-xl transition-all',
                                        language === lang.code
                                            ? 'bg-fuchsia-100 dark:bg-fuchsia-900/20 border-2 border-fuchsia-500'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-gray-500" />
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-white">{lang.name}</p>
                                            <p className="text-sm text-gray-500">{lang.native}</p>
                                        </div>
                                    </div>
                                    {language === lang.code && (
                                        <Check className="w-5 h-5 text-fuchsia-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'account':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Account Settings</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage your account information
                        </p>

                        {/* Account Info */}
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                                    {user?.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</p>
                                    <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Linked Accounts */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="font-medium text-gray-900 dark:text-white mb-3">Linked Accounts</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Email</span>
                                    </div>
                                    <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Smartphone className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Phone</span>
                                    </div>
                                    {user?.phone ? (
                                        <span className="text-sm text-green-600 dark:text-green-400">{user.phone}</span>
                                    ) : (
                                        <button
                                            onClick={() => setShowPhoneModal(true)}
                                            className="text-sm text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                                        >
                                            Add
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-300">Danger Zone</p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <CustomerLayout>
            <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                            Settings
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                            Manage your account preferences
                        </p>
                    </div>
                    <Button
                        onClick={() => saveSettingsMutation.mutate()}
                        className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white w-full sm:w-auto"
                        disabled={saveSettingsMutation.isPending}
                    >
                        {saveSettingsMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save All
                            </>
                        )}
                    </Button>
                </div>

                {/* Mobile Section Tabs */}
                <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-2">
                    <div className="flex gap-2 min-w-max">
                        {sections.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap',
                                        isActive
                                            ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{section.title}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Desktop Sidebar */}
                    <Card hover={false} className="hidden lg:block lg:col-span-1 h-fit bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    const isActive = activeSection === section.id;
                                    return (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                                                isActive
                                                    ? 'bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 text-fuchsia-600 dark:text-fuchsia-400'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            )}
                                        >
                                            <Icon className={cn('w-5 h-5', isActive && 'text-fuchsia-500')} />
                                            <span className="font-medium">{section.title}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Main Content */}
                    <Card hover={false} className="lg:col-span-3 bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50">
                        <CardContent className="p-4 sm:p-6">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderSectionContent()}
                            </motion.div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Password Change Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
                                <button
                                    onClick={() => setShowPasswordModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); changePasswordMutation.mutate(); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordForm.current_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordForm.new_password}
                                            onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                            required
                                            minLength={8}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                        >
                                            {showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.new_password_confirmation}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={changePasswordMutation.isPending}
                                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        {changePasswordMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Change Password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Phone Number Modal */}
            <AnimatePresence>
                {showPhoneModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add Phone Number</h3>
                                <button
                                    onClick={() => setShowPhoneModal(false)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={(e) => { e.preventDefault(); updatePhoneMutation.mutate(); }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="+855 12 345 6789"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPhoneModal(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updatePhoneMutation.isPending}
                                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        {updatePhoneMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            'Save Phone'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Account?</h3>
                                <p className="text-gray-500 dark:text-gray-400 mt-2">
                                    This action cannot be undone. All your data, orders, and preferences will be permanently deleted.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </CustomerLayout>
    );
}
