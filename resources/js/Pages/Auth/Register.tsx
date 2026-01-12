import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { PageProps } from '@/types';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Customer registration schema - only customers can register publicly
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine(data => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type RegisterForm = z.infer<typeof registerSchema>;

// Premium Input Component
// Premium Input Component
const InputField = React.forwardRef(({
  icon: Icon,
  label,
  error,
  type = 'text',
  showToggle = false,
  toggleValue = false,
  onToggle = () => { },
  ...props
}: any, ref: any) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-300">{label}</label>
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-center">
        <Icon className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors duration-200" />
        <input
          ref={ref}
          type={showToggle ? (toggleValue ? 'text' : 'password') : type}
          className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all duration-200"
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 text-gray-500 hover:text-white transition-colors"
          >
            {toggleValue ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
    </div>
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-rose-400 flex items-center gap-1"
      >
        {error}
      </motion.p>
    )}
  </div>
));

// Set display name for debugging
InputField.displayName = 'InputField';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { props } = usePage<PageProps<{ csrf_token: string }>>();
  const csrfToken = props.csrf_token;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      terms: false,
    },
  });

  const termsAccepted = watch('terms');




  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      router.post(route('register'), {
        ...data,
        role: 'customer', // Always register as customer
        _token: csrfToken
      }, {
        onSuccess: () => {
          toast.success('Welcome to NKH Restaurant!');

          // Check for pending checkout redirect
          const pendingCheckout = localStorage.getItem('pendingCheckout');
          const redirectUrl = localStorage.getItem('checkoutRedirectUrl');

          if (pendingCheckout === 'true' && redirectUrl) {
            // Clear the pending state
            localStorage.removeItem('pendingCheckout');
            localStorage.removeItem('checkoutRedirectUrl');

            // Show helpful message
            toast.success('Continuing to checkout...', { duration: 2000 });

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
          const firstError = Object.values(errors)[0] as string;
          toast.error(firstError || 'Registration failed. Please try again.');
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium animated gradient background */}
      {/* Premium animated gradient background - Brand Colors */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/40 via-transparent to-pink-900/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-fuchsia-600/30 to-pink-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-purple-600/30 to-fuchsia-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-gradient-to-br from-pink-600/20 to-purple-600/10 rounded-full blur-[80px] animate-pulse delay-500" />
        </div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        {/* Logo and Title - Using Actual NKH Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center mb-5"
          >
            {/* Outer glow ring */}
            <div className="absolute -inset-4 bg-gradient-to-r from-fuchsia-500/30 to-pink-500/30 rounded-full blur-2xl animate-pulse" />

            {/* Logo background */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl rotate-3 blur-sm opacity-50" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-fuchsia-500/30">
                <img
                  src="/Nkhlogo.png"
                  alt="NKH Restaurant"
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                />
              </div>
            </div>

            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-white mb-2 tracking-tight"
          >
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">NKH Restaurant</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Create your account to start ordering
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
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 via-pink-500/20 to-purple-500/20 rounded-[28px] blur-xl" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <InputField
                icon={User}
                label="Full Name"
                placeholder="Enter your full name"
                error={errors.name?.message}
                {...register('name')}
              />

              {/* Email */}
              <InputField
                icon={Mail}
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Phone */}
              <InputField
                icon={Phone}
                label="Phone Number"
                type="tel"
                placeholder="Enter your phone number"
                error={errors.phone?.message}
                {...register('phone')}
              />

              {/* Password */}
              <InputField
                icon={Lock}
                label="Password"
                placeholder="Create a strong password"
                showToggle
                toggleValue={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Confirm Password */}
              <InputField
                icon={Lock}
                label="Confirm Password"
                placeholder="Confirm your password"
                showToggle
                toggleValue={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                error={errors.password_confirmation?.message}
                {...register('password_confirmation')}
              />

              {/* Terms & Conditions */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    {...register('terms')}
                    type="checkbox"
                    className="sr-only"
                  />
                  <div className={cn(
                    "w-5 h-5 rounded-md border bg-white/[0.03] transition-all flex items-center justify-center",
                    termsAccepted
                      ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 border-transparent"
                      : "border-white/20"
                  )}>
                    <Check className={cn(
                      "w-3.5 h-3.5 text-white transition-opacity",
                      termsAccepted ? "opacity-100" : "opacity-0"
                    )} />
                  </div>
                </div>
                <span className="text-sm text-gray-400 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-fuchsia-400 hover:text-fuchsia-300 underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-fuchsia-400 hover:text-fuchsia-300 underline">Privacy Policy</Link>
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-rose-400">{errors.terms.message}</p>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all",
                  "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600",
                  "hover:shadow-xl hover:shadow-fuchsia-500/25",
                  isLoading && "opacity-70 cursor-not-allowed"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-fuchsia-500" />
            Your information is secure and encrypted
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
