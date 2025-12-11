import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/app/components/ui/Button';
import { apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Lock, Key, Eye, EyeOff } from 'lucide-react';

export default function SecuritySettings() {
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Password Update Mutation
    const updatePasswordMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/user/change-password', data),
        onSuccess: () => {
            toastSuccess('Password changed successfully');
            setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to change password')
    });

    const handleChangePassword = () => {
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            toastError('Passwords do not match');
            return;
        }
        updatePasswordMutation.mutate(passwordForm);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-slate-200 dark:border-slate-700 h-fit">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-fuchsia-500" />
                Change Password
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                    <div className="relative">
                        <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordForm.current_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                            className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                    <div className="relative">
                        <input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordForm.new_password}
                            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                            className="w-full px-4 py-2 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                        >
                            {showNewPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
                    <input
                        type="password"
                        value={passwordForm.new_password_confirmation}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
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
    );
}
