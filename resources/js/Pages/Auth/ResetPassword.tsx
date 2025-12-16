
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Shield, Check } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Logo } from '@/Components/brand';

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  token: z.string().min(1, 'Reset token is required'),
}).refine((data: any) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const { props } = usePage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = (props.token as string) || '';
  const email = (props.email as string) || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      email,
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);
    try {
      router.post('/reset-password', data, {
        onSuccess: () => {
          toast.success('Password reset successfully! Please sign in with your new password.');
          router.visit('/login');
        },
        onError: (errors) => {
          const firstError = Object.values(errors)[0] as string;
          toast.error(firstError || 'Failed to reset password. Please try again.');
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordValue = watch('password') || '';
  const passwordStrength = getPasswordStrength(passwordValue);
  const strengthColors = ['bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-fuchsia-500'];
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f0f13]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#0f0f13] to-[#0f0f13]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <Logo variant="glow" size="2xl" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-3 tracking-tight font-display"
          >
            New Password
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg"
          >
            Create a strong new password for your account
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/30 via-purple-500/30 to-pink-500/30 rounded-[28px] blur-xl opacity-75" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <input {...register('token')} type="hidden" />

              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-medium">Resetting password for</p>
                <p className="text-white font-semibold text-lg">{email}</p>
                <input {...register('email')} type="hidden" />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 ml-1">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-500 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Strength Meter */}
                {passwordValue && (
                  <div className="mt-3 px-1">
                    <div className="flex gap-1.5 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-300",
                            i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-white/10'
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn(
                      "text-xs font-medium",
                      passwordStrength >= 4 ? 'text-fuchsia-400' : passwordStrength >= 3 ? 'text-blue-400' : 'text-amber-400'
                    )}>
                      {strengthLabels[passwordStrength - 1] || 'Very Weak'} password
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-rose-400 ml-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 ml-1">
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      {...register('password_confirmation')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your new password"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-gray-500 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {errors.password_confirmation && (
                  <p className="text-xs text-rose-400 ml-1">{errors.password_confirmation.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all shadow-lg shadow-fuchsia-500/20",
                  "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600",
                  "hover:shadow-fuchsia-500/40",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20">
              <Shield className="w-5 h-5 text-fuchsia-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-2">Security Tips</h3>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500" />
                  Use 8+ characters with mixed case
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-500" />
                  Include numbers and special characters
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
