import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Shield, Coffee, Phone, MapPin, Building } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { cn } from '@/app/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const baseSchema = {
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
  role: z.enum(['customer', 'employee', 'admin']),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
};

const customerSchema = z.object({
  ...baseSchema,
  phone: z.string().min(10, 'Please enter a valid phone number'),
}).refine(data => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

const employeeSchema = z.object({
  ...baseSchema,
  phone: z.string().min(10, 'Please enter a valid phone number'),
  employee_id: z.string().min(3, 'Employee ID must be at least 3 characters'),
  department: z.string().min(2, 'Please select a department'),
}).refine(data => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

const adminSchema = z.object({
  ...baseSchema,
  phone: z.string().min(10, 'Please enter a valid phone number'),
  admin_code: z.string().min(6, 'Admin code is required'),
  restaurant_location: z.string().min(2, 'Please specify restaurant location'),
}).refine(data => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type CustomerForm = z.infer<typeof customerSchema>;
type EmployeeForm = z.infer<typeof employeeSchema>;
type AdminForm = z.infer<typeof adminSchema>;

// Combined form type with all possible fields
type RegisterForm = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'customer' | 'employee' | 'admin';
  terms: boolean;
  phone: string;
  employee_id?: string;
  department?: string;
  admin_code?: string;
  restaurant_location?: string;
};

const roleConfig = {
  customer: {
    icon: Coffee,
    label: 'Customer',
    description: 'Join to order food and track deliveries',
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-500/20 to-teal-600/20',
    schema: customerSchema,
  },
  employee: {
    icon: User,
    label: 'Employee',
    description: 'Get access to POS and order management',
    gradient: 'from-blue-500 to-indigo-600',
    bgGradient: 'from-blue-500/20 to-indigo-600/20',
    schema: employeeSchema,
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'Full system management access',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-purple-500/20 to-pink-600/20',
    schema: adminSchema,
  },
};

const departments = [
  'Kitchen',
  'Service',
  'Cashier',
  'Delivery',
  'Management',
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<RegisterForm>({
    resolver: zodResolver(roleConfig.customer.schema),
    defaultValues: {
      role: 'customer',
      terms: false,
    },
  });

  const selectedRole = watch('role');
  const currentRoleConfig = roleConfig[selectedRole];

  // Update form validation schema when role changes
  React.useEffect(() => {
    reset({
      role: selectedRole,
      terms: false,
    });
  }, [selectedRole, reset]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      router.post('/register', data, {
        onSuccess: () => {
          toast.success(`Account created successfully! Please check your email to verify your account.`);
          router.visit('/login');
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

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
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
          <h1 className="text-3xl font-bold text-white mb-2">Join NKH Restaurant</h1>
          <p className="text-gray-400">Create your account to get started</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                  currentStep >= step
                    ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/10 text-gray-400 border border-white/20'
                )}
              >
                {step}
              </div>
              {step < 2 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2 transition-all duration-200',
                    currentStep > step ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500' : 'bg-white/20'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      I want to register as:
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

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <Input
                      {...register('name')}
                      type="text"
                      label="Full Name"
                      placeholder="Enter your full name"
                      leftIcon={<User className="w-4 h-4" />}
                      error={errors.name?.message}
                      className="text-white placeholder:text-gray-400"
                    />

                    <Input
                      {...register('email')}
                      type="email"
                      label="Email Address"
                      placeholder="Enter your email"
                      leftIcon={<Mail className="w-4 h-4" />}
                      error={errors.email?.message}
                      className="text-white placeholder:text-gray-400"
                    />

                    <Input
                      {...register('phone')}
                      type="tel"
                      label="Phone Number"
                      placeholder="Enter your phone number"
                      leftIcon={<Phone className="w-4 h-4" />}
                      error={errors.phone?.message}
                      className="text-white placeholder:text-gray-400"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={nextStep}
                    className="w-full h-12 text-base font-semibold"
                    variant="primary"
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Password Fields */}
                  <div className="space-y-4">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      label="Password"
                      placeholder="Create a strong password"
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

                    <Input
                      {...register('password_confirmation')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm Password"
                      placeholder="Confirm your password"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={errors.password_confirmation?.message}
                      className="text-white placeholder:text-gray-400"
                    />
                  </div>

                  {/* Role-specific Fields */}
                  {selectedRole === 'employee' && (
                    <div className="space-y-4">
                      <Input
                        {...register('employee_id')}
                        type="text"
                        label="Employee ID"
                        placeholder="Enter your employee ID"
                        leftIcon={<User className="w-4 h-4" />}
                        error={errors.employee_id?.message}
                        className="text-white placeholder:text-gray-400"
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                        <select
                          {...register('department')}
                          className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white backdrop-blur-md focus:border-fuchsia-400/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
                        >
                          <option value="" className="bg-gray-800">Select department</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept} className="bg-gray-800">{dept}</option>
                          ))}
                        </select>
                        {errors.department && (
                          <p className="mt-1 text-xs text-rose-400">{errors.department.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRole === 'admin' && (
                    <div className="space-y-4">
                      <Input
                        {...register('admin_code')}
                        type="password"
                        label="Admin Code"
                        placeholder="Enter admin access code"
                        leftIcon={<Shield className="w-4 h-4" />}
                        error={errors.admin_code?.message}
                        className="text-white placeholder:text-gray-400"
                      />
                      <Input
                        {...register('restaurant_location')}
                        type="text"
                        label="Restaurant Location"
                        placeholder="Enter restaurant location"
                        leftIcon={<Building className="w-4 h-4" />}
                        error={errors.restaurant_location?.message}
                        className="text-white placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  {/* Terms and Conditions */}
                  <div>
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        {...register('terms')}
                        type="checkbox"
                        className="w-4 h-4 mt-1 rounded border-gray-300 text-fuchsia-600 focus:ring-fuchsia-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-300 leading-relaxed">
                        I agree to the{' '}
                        <Link href="/terms" className="text-fuchsia-400 hover:text-fuchsia-300 underline">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-fuchsia-400 hover:text-fuchsia-300 underline">
                          Privacy Policy
                        </Link>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="mt-1 text-xs text-rose-400">{errors.terms.message}</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="secondary"
                      className="flex-1 h-12"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      loading={isLoading}
                      className="flex-1 h-12 text-base font-semibold"
                      variant="primary"
                    >
                      {isLoading ? 'Creating Account...' : `Create ${currentRoleConfig.label} Account`}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <p className="text-xs text-gray-400 text-center">
            🔒 Your information is secure and encrypted. We never share your data with third parties.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
