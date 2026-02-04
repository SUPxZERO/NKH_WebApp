import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { usePage } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Save,
    User,
    Mail,
    Phone,
    Bell,
    Moon,
    Shield,
    Globe,
    Check,
    Sun,
    Briefcase,
    Clock,
    AlertCircle,
    ChevronRight,
    Loader2,
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPut } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/app/components/ui/Card';
import SecuritySettings from './Settings/SecuritySettings';
import NotificationPreferences from './Settings/NotificationPreferences';
import { useLanguage } from '@/app/context/LanguageContext';

interface SettingSection {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
}

const sections: SettingSection[] = [
    { id: 'profile', title: 'employee.settings.sections.profile.title', icon: User, description: 'employee.settings.sections.profile.description' },
    { id: 'work', title: 'employee.settings.sections.work.title', icon: Briefcase, description: 'employee.settings.sections.work.description' },
    { id: 'notifications', title: 'employee.settings.sections.notifications.title', icon: Bell, description: 'employee.settings.sections.notifications.description' },
    { id: 'security', title: 'employee.settings.sections.security.title', icon: Shield, description: 'employee.settings.sections.security.description' },
    { id: 'appearance', title: 'employee.settings.sections.appearance.title', icon: Moon, description: 'employee.settings.sections.appearance.description' },
    { id: 'language', title: 'employee.settings.sections.language.title', icon: Globe, description: 'employee.settings.sections.language.description' },
];

const workStations = [
    { id: 'pos', label: 'employee.settings.workstations.pos', icon: '💳' },
    { id: 'kitchen', label: 'employee.settings.workstations.kitchen', icon: '👨‍🍳' },
    { id: 'delivery', label: 'employee.settings.workstations.delivery', icon: '🚗' },
    { id: 'service', label: 'employee.settings.workstations.service', icon: '🍽️' },
];

const shiftTimes = [
    { id: 'morning', label: 'employee.settings.shifts.morning.label', time: 'employee.settings.shifts.morning.time', icon: '🌅' },
    { id: 'afternoon', label: 'employee.settings.shifts.afternoon.label', time: 'employee.settings.shifts.afternoon.time', icon: '☀️' },
    { id: 'evening', label: 'employee.settings.shifts.evening.label', time: 'employee.settings.shifts.evening.time', icon: '🌙' },
];

const daysOfWeek = [
    { id: 'mon', label: 'employee.settings.days.mon' },
    { id: 'tue', label: 'employee.settings.days.tue' },
    { id: 'wed', label: 'employee.settings.days.wed' },
    { id: 'thu', label: 'employee.settings.days.thu' },
    { id: 'fri', label: 'employee.settings.days.fri' },
    { id: 'sat', label: 'employee.settings.days.sat' },
    { id: 'sun', label: 'employee.settings.days.sun' },
];

export default function Settings() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();
    const { props } = usePage<{ auth: { user: any } }>();
    const user = props.auth?.user;
    const [activeSection, setActiveSection] = useState('profile');

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Work preferences state
    const [workPrefs, setWorkPrefs] = useState({
        preferred_stations: ['pos'] as string[],
        preferred_shifts: ['morning'] as string[],
        available_days: ['mon', 'tue', 'wed', 'thu', 'fri'] as string[],
        max_hours_per_week: 40,
    });

    // Emergency Contact state
    const [emergencyContact, setEmergencyContact] = useState({
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
    });

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [language, setLanguage] = useState('en');

    // Fetch work preferences from API
    const { data: workPrefsData, isLoading: workPrefsLoading } = useQuery({
        queryKey: ['employeeWorkPrefs'],
        queryFn: async () => {
            try {
                const res = await apiGet('/api/employee/settings/work-preferences') as { data: any };
                return res.data;
            } catch (e) {
                return null;
            }
        },
    });

    // Fetch emergency contact from API
    const { data: emergencyData, isLoading: emergencyLoading } = useQuery({
        queryKey: ['employeeEmergencyContact'],
        queryFn: async () => {
            try {
                const res = await apiGet('/api/employee/settings/emergency-contact') as { data: any };
                return res.data;
            } catch (e) {
                return null;
            }
        },
    });

    // Load settings from API on mount
    useEffect(() => {
        if (workPrefsData) {
            setWorkPrefs({
                preferred_stations: workPrefsData.preferred_stations || ['pos'],
                preferred_shifts: workPrefsData.preferred_shifts || ['morning'],
                available_days: workPrefsData.available_days || ['mon', 'tue', 'wed', 'thu', 'fri'],
                max_hours_per_week: workPrefsData.max_hours_per_week || 40,
            });
        }
    }, [workPrefsData]);

    useEffect(() => {
        if (emergencyData) {
            setEmergencyContact({
                emergency_contact_name: emergencyData.emergency_contact_name || '',
                emergency_contact_phone: emergencyData.emergency_contact_phone || '',
                emergency_contact_relation: emergencyData.emergency_contact_relation || '',
            });
        }
    }, [emergencyData]);

    // Load theme/language from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
        if (savedTheme) setTheme(savedTheme);

        const savedLang = localStorage.getItem('language');
        if (savedLang) setLanguage(savedLang);
    }, []);

    // Theme Logic
    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark');
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
    };

    // Profile Update Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/user/profile', data),
        onSuccess: () => {
            toastSuccess(t('employee.common.success'));
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: () => toastError(t('employee.common.error'))
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(profileForm);
    };

    // Save work preferences mutation
    const saveWorkPrefsMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/employee/settings/work-preferences', data),
        onSuccess: () => {
            toastSuccess(t('employee.settings.work_saved'));
            queryClient.invalidateQueries({ queryKey: ['employeeWorkPrefs'] });
        },
        onError: () => toastError(t('employee.common.error'))
    });

    // Save emergency contact mutation
    const saveEmergencyMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/employee/settings/emergency-contact', data),
        onSuccess: () => {
            toastSuccess(t('employee.settings.emergency_saved'));
            queryClient.invalidateQueries({ queryKey: ['employeeEmergencyContact'] });
        },
        onError: () => toastError(t('employee.settings.emergency_failed'))
    });

    const handleSaveWorkPrefs = () => {
        saveWorkPrefsMutation.mutate(workPrefs);
    };

    const handleSaveEmergencyContact = () => {
        saveEmergencyMutation.mutate(emergencyContact);
    };

    // Toggle array value
    const toggleArrayValue = (arr: string[], value: string) => {
        if (arr.includes(value)) {
            return arr.filter(v => v !== value);
        }
        return [...arr, value];
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                {t('employee.settings.profile.title')}
                            </h2>

                            <div className="flex items-center gap-6 mb-8">
                                <ProfilePictureUpload
                                    name={profileForm.name}
                                    currentAvatar={user?.avatar}
                                    size="lg"
                                />
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{profileForm.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400">{profileForm.email}</p>
                                    <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                        {t('employee.settings.profile.employee_badge')}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        {t('employee.settings.profile.full_name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Mail className="w-4 h-4 inline mr-2" />
                                        {t('employee.settings.profile.email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={profileForm.email}
                                        disabled
                                        className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Phone className="w-4 h-4 inline mr-2" />
                                        {t('employee.settings.profile.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        placeholder={t('employee.settings.profile.phone_placeholder')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSaveProfile}
                                disabled={updateProfileMutation.isPending}
                                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                                {updateProfileMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {updateProfileMutation.isPending ? t('employee.common.loading') : t('employee.common.save')}
                            </Button>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                {t('employee.settings.emergency.title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('employee.settings.emergency.name')}</label>
                                    <input
                                        type="text"
                                        value={emergencyContact.emergency_contact_name}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_name: e.target.value })}
                                        placeholder={t('employee.settings.emergency.name_placeholder')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('employee.settings.emergency.phone')}</label>
                                    <input
                                        type="tel"
                                        value={emergencyContact.emergency_contact_phone}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_phone: e.target.value })}
                                        placeholder={t('employee.settings.emergency.phone_placeholder')}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('employee.settings.emergency.relationship')}</label>
                                    <select
                                        value={emergencyContact.emergency_contact_relation}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_relation: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{t('employee.settings.emergency.select')}</option>
                                        <option value="spouse">{t('employee.settings.emergency.relationship_options.spouse')}</option>
                                        <option value="parent">{t('employee.settings.emergency.relationship_options.parent')}</option>
                                        <option value="sibling">{t('employee.settings.emergency.relationship_options.sibling')}</option>
                                        <option value="friend">{t('employee.settings.emergency.relationship_options.friend')}</option>
                                        <option value="other">{t('employee.settings.emergency.relationship_options.other')}</option>
                                    </select>
                                </div>
                            </div>
                            <Button
                                onClick={handleSaveEmergencyContact}
                                disabled={saveEmergencyMutation.isPending}
                                className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                                {saveEmergencyMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                )}
                                {saveEmergencyMutation.isPending ? t('employee.common.loading') : t('employee.settings.emergency_save')}
                            </Button>
                        </div>
                    </div>
                );

            case 'work':
                return (
                    <div className="space-y-6">
                        {/* Preferred Work Stations */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-500" />
                                {t('employee.settings.work.title')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('employee.settings.work.description')}</p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {workStations.map((station) => (
                                    <button
                                        key={station.id}
                                        onClick={() => setWorkPrefs({
                                            ...workPrefs,
                                            preferred_stations: toggleArrayValue(workPrefs.preferred_stations, station.id)
                                        })}
                                        className={cn(
                                            'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                                            workPrefs.preferred_stations.includes(station.id)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <span className="text-2xl">{station.icon}</span>
                                        <span className={cn(
                                            "text-sm font-medium",
                                            workPrefs.preferred_stations.includes(station.id)
                                                ? "text-blue-700 dark:text-blue-300"
                                                : "text-gray-600 dark:text-gray-400"
                                        )}>
                                            {t(station.label)}
                                        </span>
                                        {workPrefs.preferred_stations.includes(station.id) && (
                                            <Check className="w-4 h-4 text-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Preferred Shift Times */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                {t('employee.settings.shifts.title')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('employee.settings.shifts.description')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {shiftTimes.map((shift) => (
                                    <button
                                        key={shift.id}
                                        onClick={() => setWorkPrefs({
                                            ...workPrefs,
                                            preferred_shifts: toggleArrayValue(workPrefs.preferred_shifts, shift.id)
                                        })}
                                        className={cn(
                                            'p-4 rounded-xl border-2 transition-all flex items-center gap-4',
                                            workPrefs.preferred_shifts.includes(shift.id)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        )}
                                    >
                                        <span className="text-2xl">{shift.icon}</span>
                                        <div className="text-left">
                                            <p className={cn(
                                                "font-medium",
                                                workPrefs.preferred_shifts.includes(shift.id)
                                                    ? "text-blue-700 dark:text-blue-300"
                                                    : "text-gray-700 dark:text-gray-300"
                                            )}>{t(shift.label)}</p>
                                            <p className="text-xs text-gray-500">{t(shift.time)}</p>
                                        </div>
                                        {workPrefs.preferred_shifts.includes(shift.id) && (
                                            <Check className="w-4 h-4 text-blue-500 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Available Days */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('employee.settings.days.title')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('employee.settings.days.description')}</p>

                            <div className="flex flex-wrap gap-2">
                                {daysOfWeek.map((day) => (
                                    <button
                                        key={day.id}
                                        onClick={() => setWorkPrefs({
                                            ...workPrefs,
                                            available_days: toggleArrayValue(workPrefs.available_days, day.id)
                                        })}
                                        className={cn(
                                            'w-12 h-12 rounded-xl border-2 font-medium transition-all',
                                            workPrefs.available_days.includes(day.id)
                                                ? 'border-blue-500 bg-blue-500 text-white'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                        )}
                                    >
                                        {t(day.label)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max Hours */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('employee.settings.max_hours.title')}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('employee.settings.max_hours.description')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        value={workPrefs.max_hours_per_week}
                                        onChange={(e) => setWorkPrefs({ ...workPrefs, max_hours_per_week: parseInt(e.target.value) || 0 })}
                                        min={10}
                                        max={60}
                                        className="w-20 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-lg font-semibold text-gray-900 dark:text-white"
                                    />
                                    <span className="text-gray-500">{t('employee.settings.max_hours.unit')}</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveWorkPrefs}
                            disabled={saveWorkPrefsMutation.isPending}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                            {saveWorkPrefsMutation.isPending ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {saveWorkPrefsMutation.isPending ? t('employee.common.loading') : t('employee.settings.work_save')}
                        </Button>
                    </div>
                );

            case 'security':
                return <SecuritySettings />;

            case 'notifications':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <NotificationPreferences />
                    </div>
                );

            case 'appearance':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('employee.settings.appearance.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('employee.settings.appearance.description')}</p>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'light', icon: Sun, label: 'employee.settings.appearance.options.light', desc: 'employee.settings.appearance.options.light_desc' },
                                { id: 'dark', icon: Moon, label: 'employee.settings.appearance.options.dark', desc: 'employee.settings.appearance.options.dark_desc' },
                                { id: 'system', icon: SettingsIcon, label: 'employee.settings.appearance.options.system', desc: 'employee.settings.appearance.options.system_desc' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => applyTheme(item.id as any)}
                                    className={cn(
                                        'p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3',
                                        theme === item.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    )}
                                >
                                    <item.icon className={cn("w-8 h-8", theme === item.id ? "text-blue-600" : "text-gray-500")} />
                                    <div className="text-center">
                                        <p className={cn("font-semibold", theme === item.id ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300")}>
                                            {t(item.label)}
                                        </p>
                                        <p className="text-xs text-gray-500">{t(item.desc)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'language':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('employee.settings.language.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('employee.settings.language.description')}</p>
                        <div className="space-y-2">
                            {[
                                { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
                                { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: '🇰🇭' },
                                { code: 'zh', name: 'Chinese', native: '中文', flag: '🇨🇳' },
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setLanguage(lang.code);
                                        localStorage.setItem('language', lang.code);
                                        toastSuccess(t('employee.settings.language.changed', { name: lang.name }));
                                    }}
                                    className={cn(
                                        'flex items-center justify-between w-full p-4 rounded-xl transition-all',
                                        language === lang.code
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent hover:border-gray-300'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div className="text-left">
                                            <p className="font-medium text-gray-900 dark:text-white">{lang.name}</p>
                                            <p className="text-sm text-gray-500">{lang.native}</p>
                                        </div>
                                    </div>
                                    {language === lang.code && (
                                        <Check className="w-5 h-5 text-blue-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                            <SettingsIcon className="w-6 h-6 text-white" />
                        </div>
                        {t('employee.settings.title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-15">{t('employee.settings.title')}</p>
                </div>

                {/* Mobile Section Tabs */}
                <div className="lg:hidden overflow-x-auto -mx-4 px-4 mb-6">
                    <div className="flex gap-2 min-w-max pb-2">
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
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
                                            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium text-sm">{t(section.title)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation Sidebar - Desktop */}
                    <Card hover={false} className="hidden lg:block lg:col-span-1 h-fit bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
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
                                                    ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            )}
                                        >
                                            <Icon className={cn('w-5 h-5', isActive && 'text-blue-500')} />
                                            <span className="font-medium">{t(section.title)}</span>
                                            {isActive && <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderSectionContent()}
                        </motion.div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
