import * as React from 'react';
import { useForm } from 'react-hook-form';
const { useState } = React;
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Shield, Coffee } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { cn } from '@/app/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'employee', 'admin']),
  remember: z.boolean().optional(),
});

type SignInForm = z.infer<typeof signInSchema>;

const roleConfig = {
  customer: {
    icon: Coffee,
    label: 'Customer',
    description: 'Order food and track deliveries',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-600/20',
  },
  employee: {
    icon: User,
    label: 'Employee',
    description: 'Access POS and manage orders',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/20 to-indigo-600/20',
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'Full system management access',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/20 to-pink-600/20',
  },
};

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      router.post('/login', data, {
        onSuccess: () => {
          toast.success(`Welcome back! Redirecting to ${data.role} dashboard...`);
          // Redirect based on role
          const redirectPaths = {
            admin: '/admin/dashboard',
            employee: '/employee/pos',
            customer: '/dashboard',
          };
          router.visit(redirectPaths[data.role]);
        },
        onError: (errors) => {
          toast.error(errors.email || errors.password || 'Invalid credentials');
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000" />
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/25"
          >
            <Coffee className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your NKH Restaurant account</p>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                I am signing in as:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(roleConfig).map(([role, config]) => {
                  const Icon = config.icon;
                  const isSelected = selectedRole === role;
                  return (
                    <motion.button
                      key={role}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setValue('role', role as any)}
                      className={cn(
                        'relative p-3 rounded-2xl border transition-all duration-200 text-center',
                        isSelected
                          ? `bg-gradient-to-r ${config.bgGradient} border-white/30 shadow-lg`
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 mx-auto mb-1', isSelected ? 'text-white' : 'text-gray-400')} />
                      <div className={cn('text-xs font-medium', isSelected ? 'text-white' : 'text-gray-400')}>
                        {config.label}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={selectedRole}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="text-xs text-gray-400 mt-2 text-center"
                >
                  {currentRoleConfig.description}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Email Input */}
            <div>
              <Input
                {...register('email')}
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                className="text-white placeholder:text-gray-400"
              />
            </div>

            {/* Password Input */}
            <div>
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={errors.password?.message}
                className="text-white placeholder:text-gray-400"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  {...register('remember')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              loading={isLoading}
              className="w-full h-12 text-base font-semibold"
              variant="primary"
            >
              {isLoading ? 'Signing in...' : `Sign in as ${currentRoleConfig.label}`}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors"
              >
                Create one here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Demo Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <p className="text-xs text-gray-400 text-center mb-2">Demo Credentials:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-emerald-400 font-medium">Customer</p>
              <p className="text-gray-500">demo@customer.com</p>
            </div>
            <div className="text-center">
              <p className="text-blue-400 font-medium">Employee</p>
              <p className="text-gray-500">demo@employee.com</p>
            </div>
            <div className="text-center">
              <p className="text-purple-400 font-medium">Admin</p>
              <p className="text-gray-500">demo@admin.com</p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-xs mt-2">Password: demo123</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
