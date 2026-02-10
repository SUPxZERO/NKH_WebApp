import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Shield, Sparkles, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { PageProps } from '@/types';
import { Button } from '@/app/components/ui/Button';
import { LoadingButton } from '@/Components/ui/LoadingButton'; // Sprint 3 Phase 2
import { cn } from '@/app/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { useTranslation } from '@/app/hooks/useTranslation';

// We'll define the schema creator function inside the component or just use static schema with dynamic messages if possible.
// Moving schema inside component to use translation hook for validation messages
type SignInForm = {
  email: string;
  password: string;
  role: 'customer' | 'employee' | 'admin';
  remember?: boolean;
};

const roleConfig = {
  customer: {
    icon: UtensilsCrossed,
    label: 'auth.roles.customer',
    description: 'auth.roles.customer_desc',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bgGlow: 'bg-emerald-500/30',
    borderColor: 'border-emerald-400/50',
    shadowColor: 'shadow-emerald-500/20',
  },
  employee: {
    icon: User,
    label: 'auth.roles.employee',
    description: 'auth.roles.employee_desc',
    gradient: 'from-blue-400 via-indigo-500 to-purple-500',
    bgGlow: 'bg-blue-500/30',
    borderColor: 'border-blue-400/50',
    shadowColor: 'shadow-blue-500/20',
  },
  admin: {
    icon: Shield,
    label: 'auth.roles.admin',
    description: 'auth.roles.admin_desc',
    gradient: 'from-fuchsia-400 via-pink-500 to-rose-500',
    bgGlow: 'bg-fuchsia-500/30',
    borderColor: 'border-fuchsia-400/50',
    shadowColor: 'shadow-fuchsia-500/20',
  },
};

export default function SignIn() {

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const { props } = usePage<PageProps<{ csrf_token: string }>>();
  const csrfToken = props.csrf_token;

  const signInSchema = z.object({
    email: z.string().email(t('auth.validation.email_invalid') as string),
    password: z.string().min(6, t('auth.validation.password_min') as string),
    role: z.enum(['customer', 'employee', 'admin']),
    remember: z.boolean().optional(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      role: 'customer',
      remember: false,
    },
  });

  const selectedRole = watch('role');
  const currentRoleConfig = roleConfig[selectedRole];

  const onSubmit = async (data: SignInForm) => {
    setIsLoading(true);
    try {
      router.post(route('login'), { ...data, _token: csrfToken }, {
        onSuccess: () => {
          toast.success(t('auth.welcome_back_toast') as string);

          // Check for pending checkout redirect
          const pendingCheckout = localStorage.getItem('pendingCheckout');
          const redirectUrl = localStorage.getItem('checkoutRedirectUrl');

          if (pendingCheckout === 'true' && redirectUrl) {
            // Clear the pending state
            localStorage.removeItem('pendingCheckout');
            localStorage.removeItem('checkoutRedirectUrl');

            // Show helpful message
            toast.success(t('auth.continuing_checkout') as string, { duration: 2000 });

            // Redirect to checkout
            setTimeout(() => {
              // Sprint 3: Use router.visit instead of window.location.href
              router.visit(redirectUrl, {
                replace: true,
                preserveScroll: false
              });
            }, 500);
          }
          // Otherwise, default Inertia redirect will happen
        },
        onError: (errors) => {
          toast.error(errors.email || errors.password || t('auth.invalid_credentials') as string);
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error(t('auth.something_wrong') as string);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Premium animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-fuchsia-900/40" />
        {/* Hide some blobs on mobile */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="hidden sm:block absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/30 to-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="hidden md:block absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-gradient-to-br from-emerald-600/20 to-teal-600/10 rounded-full blur-[100px] animate-pulse delay-500" />
        </div>
        {/* Grid pattern overlay - smaller on mobile */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo and Title - Using Actual NKH Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center mb-4 sm:mb-6"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-fuchsia-500/30 to-pink-500/30 rounded-full blur-xl sm:blur-2xl animate-pulse" />

            {/* Logo background */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-xl sm:rounded-2xl rotate-3 blur-sm opacity-50" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-fuchsia-500/30">
                <img
                  src="/Nkhlogo.png"
                  alt={t('auth.brand_alt') as string}
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                />
              </div>
            </div>

            {/* Hide sparkles on small mobile */}
            <Sparkles className="hidden sm:block absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight"
          >
            {t('auth.welcome_back')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm sm:text-base lg:text-lg px-4"
          >
            {t('auth.sign_in_subtitle', { brand: '' })}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 font-semibold">
              {t('auth.brand_name')}
            </span>
          </motion.p>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl sm:rounded-[28px] blur-xl" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl lg:rounded-[24px] p-5 sm:p-6 lg:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-3 sm:mb-4">
                  {t('auth.sign_in_as')}
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {Object.entries(roleConfig).map(([role, config]) => {
                    const Icon = config.icon;
                    const isSelected = selectedRole === role;
                    return (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setValue('role', role as any)}
                        className={cn(
                          'relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 text-center overflow-hidden group',
                          isSelected
                            ? `${config.borderColor} bg-gradient-to-br ${config.gradient}/20 shadow-lg ${config.shadowColor}`
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="roleGlow"
                            className={cn("absolute inset-0 rounded-xl sm:rounded-2xl", config.bgGlow, "blur-xl opacity-50")}
                          />
                        )}
                        <div className="relative">
                          <Icon className={cn(
                            'w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2 transition-all',
                            isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          )} />
                          <div className={cn(
                            'text-[11px] sm:text-sm font-semibold transition-all',
                            isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          )}>
                            {t(`auth.roles.${role}` as any)}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={selectedRole}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3 text-center"
                  >
                    {t(`auth.roles.${selectedRole}_desc` as any)}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">
                  {t('auth.email_label')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder={t('auth.email_placeholder') as string}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                    />
                  </div>
                </div>
                {errors.email && (
                  <p className="text-[10px] sm:text-xs text-rose-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-300">
                  {t('auth.password_label')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.password_placeholder') as string}
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm sm:text-base placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 text-gray-500 hover:text-white transition-colors"
                      aria-label={showPassword ? t('common.ui.input.actions.hide_password') as string : t('common.ui.input.actions.show_password') as string}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="text-[10px] sm:text-xs text-rose-400">{errors.password.message}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      {...register('remember')}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-gradient-to-br peer-checked:from-fuchsia-500 peer-checked:to-pink-500 peer-checked:border-transparent transition-all peer-focus:ring-2 peer-focus:ring-fuchsia-500/30">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{t('auth.remember_me')}</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs sm:text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium whitespace-nowrap"
                >
                  {t('auth.forgot_password')}
                </Link>
              </div>

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                loading={isLoading}
                loadingText={t('auth.signing_in') as string}
                className={cn(
                  "w-full h-12 sm:h-14 rounded-xl font-semibold text-white transition-all text-sm sm:text-base",
                  "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600",
                  "hover:shadow-xl hover:shadow-fuchsia-500/25"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="hidden sm:inline">{t('auth.sign_in_as_role', { role: t(`auth.roles.${selectedRole}` as any) })}</span>
                  <span className="sm:hidden">{t('auth.sign_in_btn')}</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </LoadingButton>
            </form>

            {/* Register Link */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">
                {t('auth.dont_have_account')}{' '}
                <Link
                  href="/register"
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
                >
                  {t('auth.create_one')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <p className="text-[10px] sm:text-xs text-gray-500 text-center mb-3 sm:mb-4 font-medium uppercase tracking-wider">{t('auth.quick_demo')}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'customer', email: 'demo@customer.com', color: 'emerald' },
              { role: 'employee', email: 'demo@employee.com', color: 'blue' },
              { role: 'admin', email: 'demo@admin.com', color: 'purple' },
            ].map(({ role, email, color }) => (
              <motion.button
                key={role}
                type="button"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setValue('role', role as any);
                  setValue('email', email);
                  setValue('password', 'demo123');
                }}
                className={cn(
                  `p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all group`,
                  `bg-${color}-500/5 hover:bg-${color}-500/15 border-${color}-500/20 hover:border-${color}-400/40`
                )}
                style={{
                  backgroundColor: color === 'emerald' ? 'rgba(16, 185, 129, 0.05)' : color === 'blue' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(168, 85, 247, 0.05)',
                  borderColor: color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : color === 'blue' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                }}
              >
                <p className={cn(
                  "font-semibold text-[11px] sm:text-sm capitalize",
                  color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                )}>{t(`auth.roles.${role}` as any)}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
