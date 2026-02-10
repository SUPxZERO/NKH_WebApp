import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Logo } from '@/Components/brand';

export default function Terms() {
  const { t } = useTranslation();

  const sections = [
    { key: 'intro', icon: '1' },
    { key: 'use_of_service', icon: '2' },
    { key: 'user_accounts', icon: '3' },
    { key: 'ordering_payment', icon: '4' },
    { key: 'cancellation_refunds', icon: '5' },
    { key: 'intellectual_property', icon: '6' },
    { key: 'limitation_liability', icon: '7' },
    { key: 'contact', icon: '8' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f0f13]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-[#0f0f13] to-[#0f0f13]" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-fuchsia-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Back Link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-fuchsia-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('legal.back_home')}
          </Link>

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo variant="glow" size="xl" />
          </div>

          {/* Title */}
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/30">
                <FileText className="w-8 h-8 text-fuchsia-400" />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white mb-3 tracking-tight font-display">
              {t('legal.terms.title')}
            </h1>
            <p className="text-gray-400">
              {t('legal.terms.last_updated')}
            </p>
          </div>
        </motion.div>

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-pink-500/20 rounded-[28px] blur-xl opacity-50" />

          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/10 rounded-[24px] p-8 shadow-2xl">
            <div className="space-y-8">
              {sections.map((section, index) => (
                <motion.section
                  key={section.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white mb-3">
                        {t(`legal.terms.sections.${section.key}.title`)}
                      </h2>
                      <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                        {t(`legal.terms.sections.${section.key}.content`)}
                      </p>
                    </div>
                  </div>
                </motion.section>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/privacy"
            className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
          >
            {t('legal.privacy.title')} &rarr;
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
