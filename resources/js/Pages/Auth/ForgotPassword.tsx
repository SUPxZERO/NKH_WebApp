import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from '@inertiajs/react';
import { Mail, ArrowLeft, Coffee, CheckCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    try {
      router.post('/forgot-password', data, {
        onSuccess: () => {
          setEmailSent(true);
          toast.success('Password reset link sent to your email!');
        },
        onError: (errors) => {
          toast.error(errors.email || 'Failed to send reset link. Please try again.');
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const resendEmail = () => {
    const email = getValues('email');
    if (email) {
      onSubmit({ email });
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
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">
            {emailSent 
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a password reset link'
            }
          </p>
        </div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {!emailSent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email Input */}
                  <Input
                    {...register('email')}
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email address"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    className="text-white placeholder:text-gray-400"
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    loading={isLoading}
                    className="w-full h-12 text-base font-semibold"
                    variant="primary"
                  >
                    {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                  </Button>
                </form>

                {/* Back to Sign In */}
                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center space-y-6"
              >
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>

                {/* Success Message */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Email Sent!</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    We've sent a password reset link to <span className="text-white font-medium">{getValues('email')}</span>.
                    Check your inbox and follow the instructions to reset your password.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={resendEmail}
                    loading={isLoading}
                    variant="secondary"
                    className="w-full h-12"
                  >
                    {isLoading ? 'Resending...' : 'Resend Email'}
                  </Button>
                  
                  <Link
                    href="/login"
                    className="block w-full text-center text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <p className="text-xs text-gray-400 text-center">
            💡 Didn't receive the email? Check your spam folder or contact support at{' '}
            <a href="mailto:support@nkhrestaurant.com" className="text-fuchsia-400 hover:text-fuchsia-300">
              support@nkhrestaurant.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
