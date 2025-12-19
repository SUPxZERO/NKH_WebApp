/**
 * Help Overlay Component
 *
 * Shows all available keyboard shortcuts organized by category.
 * Triggered by "?" key.
 *
 * Features:
 * - Role-aware (only shows shortcuts user has access to)
 * - Organized by category
 * - Platform-specific key labels
 * - Searchable
 * - Keyboard-accessible
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  formatKeyBinding,
  canUseShortcut,
  groupShortcutsByCategory,
} from '@/app/utils/shortcuts';
import { ALL_SHORTCUTS } from '@/app/config/shortcuts.config';
import { cn } from '@/app/utils/cn';
import { Button } from '@/app/components/ui/Button';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  actions: 'Actions',
  forms: 'Forms',
  tables: 'Data Tables',
  modals: 'Modals & Dialogs',
  clipboard: 'Clipboard',
  system: 'System',
};

const CATEGORY_ORDER = ['system', 'navigation', 'actions', 'forms', 'tables', 'modals', 'clipboard'];

export const HelpOverlay: React.FC = () => {
  const { props } = usePage();
  const user = props.auth?.user || null;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  // Filter shortcuts by user role and permission
  const availableShortcuts = useMemo(() => {
    return ALL_SHORTCUTS.filter((shortcut) => {
      // Only show shortcuts with key bindings
      if (!('binding' in shortcut) || !shortcut.binding) return false;

      // Check if user can use this shortcut
      return canUseShortcut(shortcut, user);
    });
  }, [user]);

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const filtered = searchQuery
      ? availableShortcuts.filter(
        (s) =>
          ('binding' in s &&
            s.binding?.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : availableShortcuts;

    return groupShortcutsByCategory(filtered);
  }, [availableShortcuts, searchQuery]);

  // Use direct hotkey for help overlay - '?' key (shift+/)
  useHotkeys(
    '?',
    (e) => {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      setSearchQuery('');
    },
    {
      enabled: true,
      enableOnFormTags: false,
      enableOnContentEditable: false,
      preventDefault: true,
    },
    []
  );

  useHotkeys(
    'esc',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      setIsOpen(false);
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen]
  );

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Help Overlay */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Keyboard Shortcuts</h2>
                      <p className="text-sm text-muted-foreground">
                        {availableShortcuts.length} shortcuts available for your role
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 rounded-lg"
                    aria-label="Close help"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {Object.keys(groupedShortcuts).length === 0 ? (
                  <div className="text-center py-12">
                    <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No shortcuts found</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {CATEGORY_ORDER.filter((cat) => groupedShortcuts[cat]).map((category) => {
                      const shortcuts = groupedShortcuts[category];
                      if (!shortcuts || shortcuts.length === 0) return null;

                      return (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">
                            {CATEGORY_LABELS[category] || category}
                          </h3>
                          <div className="space-y-2">
                            {shortcuts.map((shortcut) => {
                              const binding =
                                'binding' in shortcut && shortcut.binding
                                  ? shortcut.binding
                                  : null;
                              if (!binding) return null;

                              return (
                                <div
                                  key={shortcut.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">
                                      {binding.description}
                                    </p>
                                    {shortcut.group && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {shortcut.group}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <kbd className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-mono font-medium text-foreground shadow-sm">
                                      {formatKeyBinding(binding.key)}
                                    </kbd>
                                    {binding.altKey && (
                                      <>
                                        <span className="text-xs text-muted-foreground">or</span>
                                        <kbd className="px-3 py-1.5 bg-background border border-border rounded-md text-sm font-mono font-medium text-foreground shadow-sm">
                                          {formatKeyBinding(binding.altKey)}
                                        </kbd>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 bg-background border border-border rounded font-mono">
                        ?
                      </kbd>
                      Toggle this help
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-1 bg-background border border-border rounded font-mono">
                        Esc
                      </kbd>
                      Close
                    </span>
                  </div>
                  <span>
                    Showing {Object.values(groupedShortcuts).flat().length} of{' '}
                    {availableShortcuts.length} shortcuts
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default HelpOverlay;
