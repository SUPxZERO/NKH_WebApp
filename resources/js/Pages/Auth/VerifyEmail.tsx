import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Mail, Coffee, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
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
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-gray-400">We've sent a verification link to your email address</p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl"
        >
          <div className="text-center space-y-6">
            {/* Email Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>

            {/* Message */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Check Your Inbox</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                We've sent a verification link to{' '}
                <span className="text-white font-medium">{user?.email}</span>.
                Click the link in the email to verify your account.
              </p>
            </div>

            {/* Success Message */}
            {emailSent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20"
              >
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verification email sent!</span>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="button"
                onClick={resendVerification}
                loading={isResending}
                variant="primary"
                className="w-full h-12"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => router.visit('/dashboard')}
                  variant="secondary"
                  className="flex-1 h-11"
                >
                  Continue to Dashboard
                </Button>
                
                <Button
                  type="button"
                  onClick={() => router.post('/logout')}
                  variant="ghost"
                  className="flex-1 h-11"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10"
        >
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400">
              💡 Didn't receive the email? Check your spam folder or try resending.
            </p>
            <p className="text-xs text-gray-400">
              Need help? Contact support at{' '}
              <a 
                href="mailto:support@nkhrestaurant.com" 
                className="text-fuchsia-400 hover:text-fuchsia-300 underline"
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
