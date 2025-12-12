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

interface SettingSection {
    id: string;
    title: string;
    icon: React.ElementType;
    description: string;
}

const sections: SettingSection[] = [
    { id: 'profile', title: 'Profile', icon: User, description: 'Manage your personal information' },
    { id: 'work', title: 'Work Preferences', icon: Briefcase, description: 'Set your work station and shift preferences' },
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Manage notification preferences' },
    { id: 'security', title: 'Security', icon: Shield, description: 'Password and security settings' },
    { id: 'appearance', title: 'Appearance', icon: Moon, description: 'Customize application look' },
    { id: 'language', title: 'Language', icon: Globe, description: 'Choose your preferred language' },
];

const workStations = [
    { id: 'pos', label: 'POS / Cashier', icon: '💳' },
    { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
    { id: 'delivery', label: 'Delivery', icon: '🚗' },
    { id: 'service', label: 'Table Service', icon: '🍽️' },
];

const shiftTimes = [
    { id: 'morning', label: 'Morning', time: '6AM - 2PM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '2PM - 10PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '6PM - 2AM', icon: '🌙' },
];

const daysOfWeek = [
    { id: 'mon', label: 'Mon' },
    { id: 'tue', label: 'Tue' },
    { id: 'wed', label: 'Wed' },
    { id: 'thu', label: 'Thu' },
    { id: 'fri', label: 'Fri' },
    { id: 'sat', label: 'Sat' },
    { id: 'sun', label: 'Sun' },
];

export default function Settings() {
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
            toastSuccess('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: () => toastError('Failed to update profile')
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(profileForm);
    };

    // Save work preferences mutation
    const saveWorkPrefsMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/employee/settings/work-preferences', data),
        onSuccess: () => {
            toastSuccess('Work preferences saved');
            queryClient.invalidateQueries({ queryKey: ['employeeWorkPrefs'] });
        },
        onError: () => toastError('Failed to save work preferences')
    });

    // Save emergency contact mutation
    const saveEmergencyMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/employee/settings/emergency-contact', data),
        onSuccess: () => {
            toastSuccess('Emergency contact saved');
            queryClient.invalidateQueries({ queryKey: ['employeeEmergencyContact'] });
        },
        onError: () => toastError('Failed to save emergency contact')
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
                                Personal Information
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
                                        Employee
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <User className="w-4 h-4 inline mr-2" />
                                        Full Name
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
                                        Email
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
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        placeholder="+855 12 345 6789"
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
                                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                            </Button>
                        </div>

                        {/* Emergency Contact */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                Emergency Contact
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Name</label>
                                    <input
                                        type="text"
                                        value={emergencyContact.emergency_contact_name}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={emergencyContact.emergency_contact_phone}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_phone: e.target.value })}
                                        placeholder="+855 12 345 6789"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Relationship</label>
                                    <select
                                        value={emergencyContact.emergency_contact_relation}
                                        onChange={(e) => setEmergencyContact({ ...emergencyContact, emergency_contact_relation: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="parent">Parent</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="friend">Friend</option>
                                        <option value="other">Other</option>
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
                                {saveEmergencyMutation.isPending ? 'Saving...' : 'Save Emergency Contact'}
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
                                Preferred Work Stations
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select the stations you prefer working at</p>

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
                                            {station.label}
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
                                Preferred Shift Times
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select your preferred working hours</p>

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
                                            )}>{shift.label}</p>
                                            <p className="text-xs text-gray-500">{shift.time}</p>
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Available Days</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Select the days you're available to work</p>

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
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Max Hours */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Maximum Hours Per Week</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Set your preferred maximum working hours</p>
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
                                    <span className="text-gray-500">hours</span>
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
                            {saveWorkPrefsMutation.isPending ? 'Saving...' : 'Save Work Preferences'}
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Appearance</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose how the app looks on your device</p>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'light', icon: Sun, label: 'Light', desc: 'Bright and clean' },
                                { id: 'dark', icon: Moon, label: 'Dark', desc: 'Easy on the eyes' },
                                { id: 'system', icon: SettingsIcon, label: 'System', desc: 'Match device' },
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
                                            {item.label}
                                        </p>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'language':
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Language</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose your preferred language</p>
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
                                        toastSuccess(`Language changed to ${lang.name}`);
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
                        Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-15">Manage your profile and preferences</p>
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
                                    <span className="font-medium text-sm">{section.title}</span>
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
                                            <span className="font-medium">{section.title}</span>
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
