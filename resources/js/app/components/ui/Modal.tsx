import React, { PropsWithChildren, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hideClose?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[96vw] h-[92vh]'
};

export function Modal({ open, onClose, title, size = 'md', hideClose, children, className }: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full rounded-3xl border border-white/10 bg-white/80 dark:bg-[#0b0b0b]/80 backdrop-blur-xl text-gray-900 dark:text-gray-100 shadow-2xl',
              'overflow-hidden',
              sizeMap[size],
              className,
            )}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          >
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="font-semibold text-lg">{title}</div>
                {!hideClose && (
                  <button
                    aria-label="Close"
                    onClick={onClose}
                    className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
