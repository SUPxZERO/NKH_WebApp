import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from '@inertiajs/react';
import { Mail, ArrowLeft, Coffee, CheckCircle, Sparkles, Send, ArrowRight, RefreshCw } from 'lucide-react';
import { cn } from '@/app/utils/cn';
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
    getValues,
    formState: { errors },
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-fuchsia-900/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/30 to-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
          <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-gradient-to-br from-amber-600/20 to-orange-600/10 rounded-full blur-[100px] animate-pulse delay-500" />
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl rotate-6 blur-sm opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl" />
            <Mail className="relative w-10 h-10 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-3 tracking-tight"
          >
            Reset Password
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg"
          >
            {emailSent
              ? 'Check your email for reset instructions'
              : 'Enter your email to receive a reset link'
            }
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
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-fuchsia-500/20 rounded-[28px] blur-xl" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <AnimatePresence mode="wait">
              {!emailSent ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center">
                          <Mail className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            {...register('email')}
                            type="email"
                            placeholder="Enter your email address"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                          />
                        </div>
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-400">{errors.email.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all",
                        "bg-gradient-to-r from-amber-600 via-orange-600 to-fuchsia-600",
                        "hover:shadow-xl hover:shadow-amber-500/25",
                        isLoading && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending Reset Link...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Reset Link
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  {/* Back to Sign In */}
                  <div className="mt-8 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      Back to Sign In
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-6"
                >
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative inline-flex items-center justify-center w-20 h-20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full blur-lg opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full" />
                    <CheckCircle className="relative w-10 h-10 text-white" />
                  </motion.div>

                  {/* Success Message */}
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">Email Sent!</h3>
                    <p className="text-gray-400 leading-relaxed">
                      We've sent a password reset link to{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 font-semibold">
                        {getValues('email')}
                      </span>
                      . Check your inbox and follow the instructions.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={resendEmail}
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 rounded-xl font-semibold text-white bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Resend Email
                        </>
                      )}
                    </motion.button>

                    <Link
                      href="/login"
                      className="block w-full text-center text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium py-2"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <p className="text-xs text-gray-500 text-center">
            💡 Didn't receive the email? Check your spam folder or contact{' '}
            <a href="mailto:support@nkhrestaurant.com" className="text-fuchsia-400 hover:text-fuchsia-300">
              support@nkhrestaurant.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
