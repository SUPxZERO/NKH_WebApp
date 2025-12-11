import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePage } from '@inertiajs/react';
import {
    Settings as SettingsIcon,
    Save,
    User,
    Mail,
    Phone,
    Key,
    Lock,
    Loader2,
    Bell,
    Moon,
    Shield,
    Globe,
    Check,
    Sun,
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Button } from '@/app/components/ui/Button';
import { apiPut, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';
import { cn } from '@/app/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
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
    { id: 'notifications', title: 'Notifications', icon: Bell, description: 'Manage your notification preferences' },
    { id: 'security', title: 'Security', icon: Shield, description: 'Password and security settings' },
    { id: 'appearance', title: 'Appearance', icon: Moon, description: 'Customize application look' },
    { id: 'language', title: 'Language', icon: Globe, description: 'Choose your preferred language' },
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

    // Theme state
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [language, setLanguage] = useState('en');

    // Load initial settings (mock/localstorage for now)
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

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-fuchsia-500" />
                            Personal Information
                        </h2>

                        <div className="flex items-center gap-6 mb-8">
                            <ProfilePictureUpload
                                name={profileForm.name}
                                currentAvatar={user?.avatar}
                                size="lg"
                            />
                            <div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{profileForm.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400">{profileForm.email}</p>
                                <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    Employee
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    disabled
                                    readOnly
                                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                />
                                <p className="text-xs text-slate-500 mt-1">Contact admin to change email</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="mt-6 w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                );

            case 'security':
                return <SecuritySettings />;

            case 'notifications':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <NotificationPreferences />
                    </div>
                );

            case 'appearance':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Appearance</h3>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { id: 'light', icon: Sun, label: 'Light' },
                                { id: 'dark', icon: Moon, label: 'Dark' },
                                { id: 'system', icon: SettingsIcon, label: 'System' },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => applyTheme(item.id as any)}
                                    className={cn(
                                        'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                                        theme === item.id
                                            ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                    )}
                                >
                                    <item.icon className={cn("w-6 h-6", theme === item.id ? "text-fuchsia-600" : "text-slate-500")} />
                                    <span className={cn("text-sm font-medium", theme === item.id ? "text-fuchsia-700 dark:text-fuchsia-300" : "text-slate-600 dark:text-slate-400")}>
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'language':
                return (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Language</h3>
                        <div className="space-y-2">
                            {[
                                { code: 'en', name: 'English', native: 'English' },
                                { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ' },
                                { code: 'zh', name: 'Chinese', native: '中文' },
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
                                            ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 border-2 border-fuchsia-500'
                                            : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:border-slate-300'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-slate-500" />
                                        <div className="text-left">
                                            <p className="font-medium text-slate-900 dark:text-white">{lang.name}</p>
                                            <p className="text-sm text-slate-500">{lang.native}</p>
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

            default:
                return null;
        }
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-fuchsia-500" />
                        Settings
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile and preferences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Navigation Sidebar */}
                    <Card className="lg:col-span-1 h-fit bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
                                                    ? 'bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400'
                                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
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
