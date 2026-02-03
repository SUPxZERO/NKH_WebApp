
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, router } from '@inertiajs/react';
import { Mail, ArrowLeft, CheckCircle, Sparkles, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Logo } from '@/Components/brand';

import { useTranslation } from '@/app/hooks/useTranslation';

const forgotPasswordSchema = z.object({
  email: z.string().email(), // Email validation message will be handled dynamically if possible or in schema builder
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const { t } = useTranslation();
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
          toast.success(t('auth.reset_link_sent') as string);
        },
        onError: (errors) => {
          toast.error(errors.email || t('auth.reset_link_failed') as string);
        },
        onFinish: () => setIsLoading(false),
      });
    } catch (error) {
      toast.error(t('auth.something_wrong') as string);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#0f0f13]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#0f0f13] to-[#0f0f13]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md z-10"
      >
        {/* Header */}
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
            {t('auth.forgot_password_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-lg"
          >
            {emailSent
              ? t('auth.check_email')
              : t('auth.enter_email_reset')
            }
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
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/30 via-purple-500/30 to-pink-500/30 rounded-[28px] blur-xl opacity-75" />

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
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300 ml-1">
                        {t('auth.email_label')}
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 rounded-xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-center">
                          <Mail className="absolute left-4 w-5 h-5 text-gray-500 group-focus-within:text-fuchsia-400 transition-colors" />
                          <input
                            {...register('email')}
                            type="email"
                            placeholder={t('auth.email_placeholder') as string}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-fuchsia-500/50 focus:bg-white/[0.05] transition-all"
                          />
                        </div>
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-400 ml-1">{errors.email.message || t('auth.validation.email_invalid')}</p>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={cn(
                        "relative w-full h-14 rounded-xl font-semibold text-white overflow-hidden group transition-all shadow-lg shadow-fuchsia-500/20",
                        "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600",
                        "hover:shadow-fuchsia-500/40",
                        isLoading && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="relative flex items-center justify-center gap-2">
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('auth.sending')}
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            {t('auth.send_reset_link')}
                          </>
                        )}
                      </span>
                    </motion.button>
                  </form>

                  <div className="mt-8 text-center">
                    <Link
                      href="/login"
                      className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      {t('auth.back_to_sign_in')}
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
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="relative inline-flex items-center justify-center w-20 h-20"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-lg opacity-50" />
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center relative z-10 shadow-xl">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3">{t('auth.email_sent_title')}</h3>
                    <p className="text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('auth.email_sent_desc', { email: getValues('email') }) }}>
                    </p>
                  </div>

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
                          {t('auth.resending')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          {t('auth.resend_email')}
                        </>
                      )}
                    </motion.button>

                    <Link
                      href="/login"
                      className="block w-full text-center text-sm text-fuchsia-400 hover:text-fuchsia-300 transition-colors font-medium py-2"
                    >
                      {t('auth.back_to_sign_in')}
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl"
        >
          <p className="text-xs text-gray-500 text-center">
            💡 {t('auth.didnt_receive_email')}{' '}
            <a href="mailto:support@nkhrestaurant.com" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium">
              support@nkhrestaurant.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
