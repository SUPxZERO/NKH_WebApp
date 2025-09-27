import React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  show: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
}

export function SuccessAnimation({ show, title = 'Success!', message, onComplete }: SuccessAnimationProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onAnimationComplete={() => {
        if (onComplete) {
          setTimeout(onComplete, 2000);
        }
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative"
      >
        {/* Sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: [0, (Math.cos(i * 45 * Math.PI / 180) * 60)],
              y: [0, (Math.sin(i * 45 * Math.PI / 180) * 60)]
            }}
            transition={{ 
              duration: 1.5,
              delay: 0.3 + i * 0.1,
              ease: 'easeOut'
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </motion.div>
        ))}

        {/* Main success circle */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
          >
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Ripple effect */}
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute inset-0 rounded-full border-4 border-emerald-400"
        />

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-6 text-center"
        >
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          {message && (
            <p className="text-sm text-gray-300 max-w-xs">{message}</p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default SuccessAnimation;
