import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePage, router } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    User,
    Moon,
    Sun,
    Globe,
    Lock,
    Mail,
    Phone,
    Calendar,
    Eye,
    EyeOff,
    Check,
    Shield,
    Trash2,
    AlertTriangle,
    Loader2,
    X,
    MapPin,
    Edit,
    Home,
    Crosshair,
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPut, apiPost, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useTranslation } from '@/app/hooks/useTranslation';
import Map from '@/app/components/ui/Map';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';
import NotificationPreferencesSettings from '@/app/components/customer/NotificationPreferencesSettings';
import AddressManagerEnhanced from '@/app/components/customer/AddressManagerEnhanced';

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

interface Address {
    id: number;
    label: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    province: string;
    postal_code: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    delivery_instructions?: string;
    is_default: boolean;
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

// Will be dynamically created in component with translations

export default function Settings() {
    const queryClient = useQueryClient();
    const { props } = usePage();
    const user = (props.auth as any)?.user;
    const translationContext = useTranslation();
    const t = translationContext?.t || ((key: string) => key);
    const { locale, setLocale } = translationContext || { locale: 'en', setLocale: () => { } };

    const sections: SettingSection[] = [
        { id: 'profile', title: t('customer.profile.title'), icon: User, description: t('customer.profile.subtitle') },
        { id: 'addresses', title: t('customer.profile.addresses.title'), icon: MapPin, description: t('customer.profile.addresses.title') },
        { id: 'notifications', title: t('customer.settings.sections.notifications'), icon: Bell, description: t('customer.settings.sections.notifications_desc') },
        { id: 'privacy', title: t('customer.settings.sections.privacy'), icon: Shield, description: t('customer.settings.sections.privacy_desc') },
        { id: 'appearance', title: t('customer.settings.sections.appearance'), icon: Moon, description: t('customer.settings.sections.appearance_desc') },
        // { id: 'language', title: t('customer.settings.sections.language'), icon: Globe, description: t('customer.settings.sections.language_desc') },
        { id: 'security', title: t('customer.settings.sections.account'), icon: Lock, description: t('customer.settings.sections.account_desc') },
    ];

    const [activeSection, setActiveSection] = useState('profile');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const section = new URLSearchParams(window.location.search).get('section');
        if (section && sections.some((s) => s.id === section)) {
            setActiveSection(section);
        }
    }, [sections]);

    const handleSectionChange = (sectionId: string) => {
        setActiveSection(sectionId);
        if (typeof window === 'undefined') {
            return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('section', sectionId);
        window.history.replaceState({}, '', url.toString());
    };

    // Local settings state
    const [privacy, setPrivacy] = useState(defaultSettings.privacy);
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(defaultSettings.theme);
    const [language, setLanguage] = useState(defaultSettings.language);

    // Profile form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        birth_date: '',
        gender: '',
        marketing_consent: false,
    });

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Fetch profile
    const { data: profileData, isLoading: isProfileLoading } = useQuery({
        queryKey: ['customer', 'profile'],
        queryFn: () => apiGet('/api/customer/profile')
    });

    // Handle nested data structure from API - could be { data: ... } or direct object
    const profile = profileData?.data ?? profileData;

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
            setPrivacy(settingsData.privacy);
            setTheme(settingsData.theme);
            setLanguage(settingsData.language);

            // Apply theme
            applyTheme(settingsData.theme);
        }
    }, [settingsData]);

    // Update profile when data loads
    useEffect(() => {
        if (profile) {
            const userData = profile.user || profile;
            setFormData({
                name: userData?.name || '',
                email: userData?.email || '',
                phone: userData?.phone || profile?.phone || '',
                birth_date: profile?.birth_date || '',
                gender: profile?.gender || '',
                marketing_consent: profile?.marketing_consent || false,
            });
        }
    }, [profile]);

    // Apply theme function
    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        localStorage.setItem('theme', newTheme);
    };

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/customer/profile', data),
        onSuccess: () => {
            toastSuccess(t('customer.profile.messages.update_success'));
            queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
            setEditMode(false);
        },
        onError: () => toastError(t('customer.profile.messages.update_error'))
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
            toastSuccess(t('customer.settings.messages.privacy_updated'));
        },
        onError: () => {
            toastError(t('customer.settings.messages.privacy_error'));
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
            toastSuccess(t('customer.settings.messages.theme_updated'));
        },
        onError: () => {
            toastError(t('customer.settings.messages.theme_error'));
        },
    });

    // Update language mutation
    const updateLanguageMutation = useMutation({
        mutationFn: async (newLanguage: string) => {
            setLanguage(newLanguage);
            // Use the actual language context to change language
            setLocale(newLanguage);
            return apiPut('/api/customer/settings/language', { language: newLanguage });
        },
        onSuccess: () => {
            toastSuccess(t('customer.settings.messages.language_updated'));
        },
        onError: () => {
            toastError(t('customer.settings.messages.language_error'));
        },
    });

    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/customer/change-password', passwordForm);
        },
        onSuccess: () => {
            toastSuccess(t('customer.settings.messages.password_changed'));
            setShowPasswordModal(false);
            setPasswordForm({
                current_password: '',
                new_password: '',
                new_password_confirmation: '',
            });
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || t('customer.settings.messages.password_error');
            toastError(message);
        },
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(formData);
    };

    // Handle delete account

    const handleDeleteAccount = () => {
        router.delete('/profile', {
            onSuccess: () => {
                router.visit('/');
            }
        });
    };

    const renderSectionContent = () => {
        if (isLoading && ['privacy', 'appearance', 'language'].includes(activeSection)) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                </div>
            );
        }

        switch (activeSection) {
            case 'profile':
                return (
                    <div className="space-y-4">
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-200/50 dark:border-fuchsia-900/40">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {t('customer.profile.personal_info')}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {t('customer.profile.subtitle')}
                                    </p>
                                </div>
                                {!editMode && !isProfileLoading && (
                                    <Button onClick={() => setEditMode(true)} variant="outline" size="sm" className="self-start sm:self-auto">
                                        <Edit className="w-4 h-4 mr-2" />
                                        {t('customer.profile.edit')}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {isProfileLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700" />
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-center mb-4">
                                        <ProfilePictureUpload
                                            name={formData.name || ''}
                                            currentAvatar={(profile?.user || profile)?.avatar || (profile?.user || profile)?.image_path}
                                            size="xl"
                                            onUploadSuccess={() => queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                <User className="w-4 h-4 inline mr-2" />
                                                {t('customer.profile.full_name')}
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                disabled={!editMode}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700/50 focus:ring-2 focus:ring-fuchsia-500/40 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                <Mail className="w-4 h-4 inline mr-2" />
                                                {t('customer.profile.email')}
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                disabled={!editMode}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700/50 focus:ring-2 focus:ring-fuchsia-500/40 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                <Phone className="w-4 h-4 inline mr-2" />
                                                {t('customer.profile.phone')}
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                disabled={!editMode}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700/50 focus:ring-2 focus:ring-fuchsia-500/40 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                <Calendar className="w-4 h-4 inline mr-2" />
                                                {t('customer.profile.birth_date')}
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.birth_date}
                                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                                disabled={!editMode}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700/50 focus:ring-2 focus:ring-fuchsia-500/40 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                {t('customer.profile.gender')}
                                            </label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                disabled={!editMode}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-foreground disabled:bg-gray-100 dark:disabled:bg-gray-700/50 focus:ring-2 focus:ring-fuchsia-500/40 focus:outline-none"
                                            >
                                                <option value="">{t('customer.profile.genders.na')}</option>
                                                <option value="male">{t('customer.profile.genders.male')}</option>
                                                <option value="female">{t('customer.profile.genders.female')}</option>
                                                <option value="other">{t('customer.profile.genders.other')}</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                checked={formData.marketing_consent}
                                                onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                                                disabled={!editMode}
                                                className="w-4 h-4 rounded text-fuchsia-600"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {t('customer.profile.marketing_consent')}
                                            </span>
                                        </div>
                                    </div>

                                    {editMode && (
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setEditMode(false)}
                                                className="flex-1"
                                                disabled={updateProfileMutation.isPending}
                                            >
                                                {t('customer.profile.cancel')}
                                            </Button>
                                            <Button
                                                onClick={handleSaveProfile}
                                                className="flex-1"
                                                disabled={updateProfileMutation.isPending}
                                            >
                                                {updateProfileMutation.isPending ? t('customer.profile.saving') : t('customer.profile.save')}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );

            case 'addresses':
                return (
                    <div className="space-y-4">
                        <AddressManagerEnhanced
                            onSelect={() => { }}
                            allowAdd={true}
                            allowEdit={true}
                            allowDelete={true}
                            className="bg-transparent border-none shadow-none"
                        />
                    </div>
                );

            case 'notifications':
                return <NotificationPreferencesSettings />;

            case 'appearance':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customer.settings.appearance.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('customer.settings.appearance.subtitle')}
                        </p>

                        <div className="mt-6 space-y-4">
                            {/* Theme Selection */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <p className="font-medium text-gray-900 dark:text-white mb-4">{t('customer.settings.appearance.theme')}</p>
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
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{t('customer.settings.appearance.light')}</p>
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
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{t('customer.settings.appearance.dark')}</p>
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
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{t('customer.settings.appearance.system')}</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customer.settings.privacy.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('customer.settings.privacy.subtitle')}
                        </p>

                        <div className="space-y-3 mt-6">
                            {[
                                { key: 'showProfile', label: t('customer.settings.privacy.public_profile'), desc: t('customer.settings.privacy.public_profile_desc') },
                                { key: 'shareOrderHistory', label: t('customer.settings.privacy.share_history'), desc: t('customer.settings.privacy.share_history_desc') },
                                { key: 'allowAnalytics', label: t('customer.settings.privacy.analytics'), desc: t('customer.settings.privacy.analytics_desc') },
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

                    </div>
                );

            case 'language':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customer.settings.language.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('customer.settings.language.subtitle')}
                        </p>

                        <div className="space-y-2 mt-6">
                            {[
                                { code: 'en', name: t('customer.settings.language.english'), native: 'English' },
                                { code: 'km', name: t('customer.settings.language.khmer'), native: 'ភាសាខ្មែរ' },
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => updateLanguageMutation.mutate(lang.code)}
                                    disabled={updateLanguageMutation.isPending}
                                    className={cn(
                                        'flex items-center justify-between w-full p-4 rounded-xl transition-all',
                                        locale === lang.code
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
                                    {locale === lang.code && (
                                        <Check className="w-5 h-5 text-fuchsia-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('customer.settings.account.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('customer.settings.account.subtitle')}
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

                        {/* Password */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            <p className="font-medium text-gray-900 dark:text-white mb-3">{t('customer.settings.account.password')}</p>
                            <Button
                                onClick={() => setShowPasswordModal(true)}
                                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white"
                            >
                                {t('customer.settings.account.change_password')}
                            </Button>
                        </div>

                        {/* Danger Zone */}
                        <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-300">{t('customer.settings.account.danger_zone')}</p>
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        {t('customer.settings.account.danger_desc')}
                                    </p>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        {t('customer.settings.account.delete_account')}
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
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                                {t('customer.settings.title')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">
                                {t('customer.settings.subtitle')}
                            </p>
                        </div>
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
                                        onClick={() => handleSectionChange(section.id)}
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
                                                onClick={() => handleSectionChange(section.id)}
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
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('customer.settings.modals.change_password.title')}</h3>
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
                                            {t('customer.settings.modals.change_password.current')}
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
                                            {t('customer.settings.modals.change_password.new')}
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
                                            {t('customer.settings.modals.change_password.confirm')}
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
                                            {t('customer.settings.modals.change_password.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={changePasswordMutation.isPending}
                                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            {changePasswordMutation.isPending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                t('customer.settings.modals.change_password.submit')
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
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('customer.settings.modals.delete_confirm.title')}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                                        {t('customer.settings.modals.delete_confirm.message')}
                                    </p>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        {t('customer.settings.modals.delete_confirm.cancel')}
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
                                    >
                                        {t('customer.settings.modals.delete_confirm.confirm')}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </CustomerLayout >
        </RequireAuth >
    );
}
