import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Mail, Lock, User, Shield, Coffee, Phone, Building, ArrowRight, ArrowLeft, Sparkles, Check } from 'lucide-react';
import { PageProps } from '@/types';
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
    description: 'Order food & track deliveries',
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    bgGlow: 'bg-emerald-500/30',
    borderColor: 'border-emerald-400/50',
    shadowColor: 'shadow-emerald-500/20',
    schema: customerSchema,
  },
  employee: {
    icon: User,
    label: 'Employee',
    description: 'POS & order management',
    gradient: 'from-blue-400 via-indigo-500 to-purple-500',
    bgGlow: 'bg-blue-500/30',
    borderColor: 'border-blue-400/50',
    shadowColor: 'shadow-blue-500/20',
    schema: employeeSchema,
  },
  admin: {
    icon: Shield,
    label: 'Admin',
    description: 'Full system control',
    gradient: 'from-fuchsia-400 via-pink-500 to-rose-500',
    bgGlow: 'bg-fuchsia-500/30',
    borderColor: 'border-fuchsia-400/50',
    shadowColor: 'shadow-fuchsia-500/20',
    schema: adminSchema,
  },
};

const departments = ['Kitchen', 'Service', 'Cashier', 'Delivery', 'Management'];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const { props } = usePage<PageProps<{ csrf_token: string }>>();
  const csrfToken = props.csrf_token;

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

  React.useEffect(() => {
    reset({
      role: selectedRole,
      terms: false,
    });
  }, [selectedRole, reset]);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      router.post(route('register'), { ...data, _token: csrfToken }, {
        onSuccess: () => {
          toast.success('Account created successfully!');
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

  // Input component for consistent styling
  const InputField = ({
    icon: Icon,
    label,
    error,
    type = 'text',
    showToggle = false,
    toggleValue = false,
    onToggle = () => { },
    ...props
  }: any) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
        <div className="relative flex items-center">
          <Icon className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
          <input
            type={showToggle ? (toggleValue ? 'text' : 'password') : type}
            className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
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
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-fuchsia-900/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/30 to-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-gradient-to-br from-emerald-600/20 to-teal-600/10 rounded-full blur-[100px] animate-pulse delay-500" />
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
        {/* Logo and Title */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center w-20 h-20 mb-5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl rotate-6 blur-sm opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl" />
            <Coffee className="relative w-10 h-10 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black text-white mb-2 tracking-tight"
          >
            Join NKH Restaurant
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Create your account to get started
          </motion.p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-6">
          {[1, 2].map((step) => (
            <React.Fragment key={step}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 + step * 0.1 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 relative',
                  currentStep >= step
                    ? 'text-white'
                    : 'text-gray-500'
                )}
              >
                {currentStep > step ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : currentStep === step ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full animate-pulse opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full" />
                    <span className="relative">{step}</span>
                  </>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    {step}
                  </div>
                )}
              </motion.div>
              {step < 2 && (
                <div
                  className={cn(
                    'w-16 h-1 mx-2 rounded-full transition-all duration-500',
                    currentStep > step
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : 'bg-white/10'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 rounded-[28px] blur-xl" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Register as
                      </label>
                      <div className="grid grid-cols-3 gap-3">
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
                                'relative p-4 rounded-2xl border transition-all duration-300 text-center overflow-hidden group',
                                isSelected
                                  ? `${config.borderColor} bg-gradient-to-br ${config.gradient}/20 shadow-lg ${config.shadowColor}`
                                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                              )}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="roleGlowReg"
                                  className={cn("absolute inset-0 rounded-2xl", config.bgGlow, "blur-xl opacity-50")}
                                />
                              )}
                              <div className="relative">
                                <Icon className={cn(
                                  'w-6 h-6 mx-auto mb-2 transition-all',
                                  isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                )} />
                                <div className={cn(
                                  'text-sm font-semibold transition-all',
                                  isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                )}>
                                  {config.label}
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Basic Info Fields */}
                    <InputField
                      icon={User}
                      label="Full Name"
                      placeholder="Enter your full name"
                      error={errors.name?.message}
                      {...register('name')}
                    />

                    <InputField
                      icon={Mail}
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      error={errors.email?.message}
                      {...register('email')}
                    />

                    <InputField
                      icon={Phone}
                      label="Phone Number"
                      type="tel"
                      placeholder="Enter your phone number"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />

                    {/* Continue Button */}
                    <motion.button
                      type="button"
                      onClick={nextStep}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 hover:shadow-xl hover:shadow-fuchsia-500/25"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center justify-center gap-2">
                        Continue
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* Password Fields */}
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

                    {/* Role-specific Fields */}
                    {selectedRole === 'employee' && (
                      <>
                        <InputField
                          icon={User}
                          label="Employee ID"
                          placeholder="Enter your employee ID"
                          error={errors.employee_id?.message}
                          {...register('employee_id')}
                        />
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-300">Department</label>
                          <select
                            {...register('department')}
                            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                          >
                            <option value="" className="bg-gray-900">Select department</option>
                            {departments.map((dept) => (
                              <option key={dept} value={dept} className="bg-gray-900">{dept}</option>
                            ))}
                          </select>
                          {errors.department && (
                            <p className="text-xs text-rose-400">{errors.department.message}</p>
                          )}
                        </div>
                      </>
                    )}

                    {selectedRole === 'admin' && (
                      <>
                        <InputField
                          icon={Shield}
                          label="Admin Code"
                          type="password"
                          placeholder="Enter admin access code"
                          error={errors.admin_code?.message}
                          {...register('admin_code')}
                        />
                        <InputField
                          icon={Building}
                          label="Restaurant Location"
                          placeholder="Enter restaurant location"
                          error={errors.restaurant_location?.message}
                          {...register('restaurant_location')}
                        />
                      </>
                    )}

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          {...register('terms')}
                          type="checkbox"
                          className="sr-only peer"
                        />
                        <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[0.03] peer-checked:bg-gradient-to-br peer-checked:from-fuchsia-500 peer-checked:to-pink-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
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

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-2">
                      <motion.button
                        type="button"
                        onClick={prevStep}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 h-14 rounded-xl font-semibold text-white bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "flex-1 h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all",
                          "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600",
                          "hover:shadow-xl hover:shadow-fuchsia-500/25",
                          isLoading && "opacity-70 cursor-not-allowed"
                        )}
                      >
                        <span className="flex items-center justify-center gap-2">
                          {isLoading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              Create Account
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </span>
                      </motion.button>
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
                  className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5" />
            Your information is secure and encrypted
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
