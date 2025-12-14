import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Mail, Coffee, CheckCircle, RefreshCw, Sparkles, LogOut, ArrowRight, Send } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const { props } = usePage();
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const user = props.auth?.user as any;

  const resendVerification = async () => {
    setIsResending(true);
    try {
      router.post('/email/verification-notification', {}, {
        onSuccess: () => {
          setEmailSent(true);
          toast.success('Verification email sent!');
        },
        onError: () => {
          toast.error('Failed to send verification email. Please try again.');
        },
        onFinish: () => setIsResending(false),
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a0f]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-blue-900/40" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-blue-600/30 to-cyan-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-fuchsia-600/30 to-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
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
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="relative inline-flex items-center justify-center w-20 h-20 mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl rotate-6 blur-sm opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl" />
            <Mail className="relative w-10 h-10 text-white" />
            <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-white mb-3 tracking-tight"
          >
            Verify Email
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg"
          >
            We've sent a verification link to your email
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-fuchsia-500/20 rounded-[28px] blur-xl" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <div className="text-center space-y-6">
              {/* Email Icon Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="relative inline-flex items-center justify-center w-24 h-24"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full" />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Mail className="relative w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              {/* Message */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Check Your Inbox</h3>
                <p className="text-gray-400 leading-relaxed">
                  We've sent a verification link to{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 font-semibold">
                    {user?.email}
                  </span>
                  . Click the link to verify your account.
                </p>
              </div>

              {/* Success Message */}
              {emailSent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Verification email sent!</span>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <motion.button
                  type="button"
                  onClick={resendVerification}
                  disabled={isResending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all",
                    "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600",
                    "hover:shadow-xl hover:shadow-blue-500/25",
                    isResending && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isResending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Resend Verification Email
                      </>
                    )}
                  </span>
                </motion.button>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => router.visit('/dashboard')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 rounded-xl font-medium text-white bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-all flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => router.post('/logout')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-12 rounded-xl font-medium text-gray-400 hover:text-white bg-transparent border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">
              💡 Didn't receive the email? Check your spam folder or try resending.
            </p>
            <p className="text-xs text-gray-500">
              Need help? Contact{' '}
              <a
                href="mailto:support@nkhrestaurant.com"
                className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
              >
                support@nkhrestaurant.com
              </a>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
