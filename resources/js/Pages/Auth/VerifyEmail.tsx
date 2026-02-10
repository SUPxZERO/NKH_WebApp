import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react'; // Link import removed as unused
import { Mail, CheckCircle, LogOut, ArrowRight, Send } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Logo } from '@/Components/brand';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function VerifyEmail() {
  const { props } = usePage();
  const { t } = useTranslation();
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const user = props.auth?.user as any;

  const resendVerification = async () => {
    setIsResending(true);
    try {
      router.post('/email/verification-notification', {}, {
        onSuccess: () => {
          setEmailSent(true);
          toast.success(t('auth.verification_sent') as string);
        },
        onError: () => {
          toast.error(t('auth.verify_email_failed') as string);
        },
        onFinish: () => setIsResending(false),
      });
    } catch (error) {
      toast.error(t('auth.something_wrong') as string);
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f0f13]">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#0f0f13] to-[#0f0f13]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
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
            {t('auth.verify_email_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg"
          >
            {t('auth.verify_email_subtitle')}
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/30 via-pink-500/30 to-purple-500/30 rounded-[28px] blur-xl opacity-75" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <div className="text-center space-y-6">

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="relative inline-flex items-center justify-center w-24 h-24"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-full" />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Mail className="relative w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-3">{t('auth.check_inbox_title')}</h3>
                <p className="text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('auth.check_inbox_desc', { email: user?.email }) }} />
              </div>

              {emailSent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">{t('auth.verification_sent')}</span>
                  </div>
                </motion.div>
              )}

              <div className="space-y-3 pt-2">
                <motion.button
                  type="button"
                  onClick={resendVerification}
                  disabled={isResending}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all shadow-lg shadow-fuchsia-500/20",
                    "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600",
                    "hover:shadow-fuchsia-500/40",
                    isResending && "opacity-70 cursor-not-allowed"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isResending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('auth.resending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t('auth.resend_verification')}
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
                    {t('auth.continue')}
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
                    {t('auth.sign_out')}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-500">
              {t('auth.hint_prefix')}{' '}{t('auth.didnt_receive_email')}
            </p>
            <p className="text-xs text-gray-500">
              {t('auth.need_help')} {' '}
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
