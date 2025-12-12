import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/app/components/ui/Button';
import { apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Lock, Key, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export default function SecuritySettings() {
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Password strength checker
    const getPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const passwordStrength = getPasswordStrength(passwordForm.new_password);
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

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
        if (passwordForm.new_password.length < 8) {
            toastError('Password must be at least 8 characters');
            return;
        }
        updatePasswordMutation.mutate(passwordForm);
    };

    const passwordsMatch = passwordForm.new_password === passwordForm.new_password_confirmation && passwordForm.new_password_confirmation.length > 0;

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-500" />
                    Change Password
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your password to keep your account secure</p>

                <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={passwordForm.current_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {showCurrentPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={passwordForm.new_password}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter a new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                {showNewPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {passwordForm.new_password && (
                            <div className="mt-3">
                                <div className="flex gap-1 mb-1">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <div
                                            key={level}
                                            className={cn(
                                                'h-1 flex-1 rounded-full transition-all',
                                                level <= passwordStrength
                                                    ? strengthColors[passwordStrength - 1]
                                                    : 'bg-gray-200 dark:bg-gray-700'
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Strength: <span className={cn(
                                        passwordStrength >= 4 ? 'text-green-600' :
                                            passwordStrength >= 3 ? 'text-blue-600' :
                                                passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'
                                    )}>{strengthLabels[passwordStrength - 1] || 'Very Weak'}</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={passwordForm.new_password_confirmation}
                                onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                                className={cn(
                                    "w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all",
                                    passwordForm.new_password_confirmation && (passwordsMatch ? "border-green-500" : "border-red-500"),
                                    !passwordForm.new_password_confirmation && "border-gray-200 dark:border-gray-700"
                                )}
                                placeholder="Confirm your new password"
                            />
                            {passwordForm.new_password_confirmation && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {passwordsMatch ? (
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                            <span className="text-white text-xs">✕</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {passwordForm.new_password_confirmation && !passwordsMatch && (
                            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                        )}
                    </div>
                </div>

                <Button
                    onClick={handleChangePassword}
                    disabled={updatePasswordMutation.isPending || !passwordForm.current_password || !passwordForm.new_password || !passwordsMatch}
                    className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50"
                >
                    <Key className="w-4 h-4 mr-2" />
                    {updatePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                </Button>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5" />
                    Security Tips
                </h3>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Use at least 8 characters with a mix of letters, numbers, and symbols
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Don't use personal information like your name or birthday
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Use a unique password that you don't use elsewhere
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        Change your password regularly for better security
                    </li>
                </ul>
            </div>
        </div>
    );
}
