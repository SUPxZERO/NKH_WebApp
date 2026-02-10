import React, { PropsWithChildren, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useModalHotkeys } from '@/app/hooks/useShortcuts';
import { useTranslation } from '@/app/hooks/useTranslation';

export interface ModalProps {
  open?: boolean;
  isOpen?: boolean; // Backward compatibility
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hideClose?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'max-w-[95vw] sm:max-w-md',
  md: 'max-w-[95vw] sm:max-w-lg',
  lg: 'max-w-[95vw] sm:max-w-2xl',
  xl: 'max-w-[95vw] sm:max-w-4xl',
  full: 'max-w-[98vw] sm:max-w-[96vw] h-[95vh] sm:h-[92vh]',
};

export function Modal({
  open,
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  hideClose,
  children,
  className
}: PropsWithChildren<ModalProps>) {
  const isModalOpen = open ?? isOpen ?? false;
  const { t } = useTranslation();

  useModalHotkeys(
    isModalOpen,
    {
      onClose,
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    }
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal Content */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-describedby={description ? 'modal-description' : undefined}
            className={cn(
              'relative w-full rounded-xl sm:rounded-2xl',
              'bg-card text-card-foreground',
              'border border-border',
              'shadow-theme-xl',
              'overflow-hidden',
              'max-h-[90vh] sm:max-h-[85vh]',
              'flex flex-col',
              sizeMap[size],
              className,
            )}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            {(title || !hideClose) && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex-1 pr-4">
                  {title && (
                    <h2 id="modal-title" className="font-semibold text-lg text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    aria-label={t('common.ui.modal.close') as string}
                    onClick={onClose}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className={cn(
              'px-4 py-4 sm:px-6 sm:py-6',
              'overflow-y-auto flex-1',
              'overscroll-contain'
            )}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Modal footer component for action buttons
export function ModalFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-secondary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Modal;
