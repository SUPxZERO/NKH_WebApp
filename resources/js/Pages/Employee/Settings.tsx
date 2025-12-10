import React, { useState } from 'react';
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
    Loader2
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Button } from '@/app/components/ui/Button';
import { apiPut, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import ProfilePictureUpload from '@/app/components/ui/ProfilePictureUpload';

export default function Settings() {
    const queryClient = useQueryClient();
    const { props } = usePage<{ auth: { user: any } }>();
    const user = props.auth?.user;

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    // Profile Update Mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: any) => apiPut('/api/user/profile', data),
        onSuccess: () => {
            toastSuccess('Profile updated successfully');
            queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        onError: () => toastError('Failed to update profile')
    });

    // Password Update Mutation
    const updatePasswordMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/user/change-password', data),
        onSuccess: () => {
            toastSuccess('Password changed successfully');
            setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to change password')
    });

    const handleSaveProfile = () => {
        updateProfileMutation.mutate(profileForm);
    };

    const handleChangePassword = () => {
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            toastError('Passwords do not match');
            return;
        }
        updatePasswordMutation.mutate(passwordForm);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-blue-500" />
                        Settings
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your profile and security</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
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
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>

                    {/* Security Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 h-fit">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" />
                            Change Password
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password_confirmation}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleChangePassword}
                            disabled={updatePasswordMutation.isPending || !passwordForm.current_password || !passwordForm.new_password}
                            className="mt-6 w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                            <Key className="w-4 h-4 mr-2" />
                            {updatePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                        </Button>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
