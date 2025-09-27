import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import Button from './Button';
import { Card, CardContent } from './Card';
import { usePWA } from '@/app/utils/pwa';

export function PWAInstallPrompt() {
  const [dismissed, setDismissed] = useState(false);
  const { canInstall, promptInstall, isMobile } = usePWA();

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Remember dismissal for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if dismissed, can't install, or already dismissed this session
  if (dismissed || !canInstall || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <Card className="shadow-2xl border-fuchsia-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 flex items-center justify-center">
                {isMobile ? (
                  <Smartphone className="w-5 h-5 text-white" />
                ) : (
                  <Download className="w-5 h-5 text-white" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">
                  Install NKH Restaurant
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Get the full app experience with offline access and push notifications.
                </p>
                
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleInstall}>
                    Install
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismiss}>
                    Not now
                  </Button>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;
