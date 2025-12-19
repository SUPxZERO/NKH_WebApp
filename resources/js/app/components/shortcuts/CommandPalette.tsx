/**
 * Command Palette Component
 *
 * A powerful, keyboard-driven command palette (Cmd/Ctrl+K)
 * Features:
 * - Fuzzy search
 * - Keyboard navigation
 * - Role-aware commands
 * - Context-aware filtering
 * - Async command execution
 * - Visual keyboard hints
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon, Loader2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { CommandDefinition } from '@/app/types/shortcuts';
import { fuzzySearchShortcuts, formatKeyBinding, canUseShortcut } from '@/app/utils/shortcuts';
import { ALL_SHORTCUTS, GLOBAL_SHORTCUTS } from '@/app/config/shortcuts.config';
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { cn } from '@/app/utils/cn';

interface CommandPaletteProps {
  /** Additional custom commands */
  customCommands?: CommandDefinition[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ customCommands = [] }) => {
  const { props } = usePage();
  const user = props.auth?.user || null;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

   const paletteShortcut = useMemo(() => {
     return GLOBAL_SHORTCUTS.find((s) => s.id === 'command-palette')!;
   }, []);

  // Merge default and custom commands
  const allCommands = useMemo(() => {
    const commands = [...ALL_SHORTCUTS, ...customCommands] as CommandDefinition[];

    // Filter by role and availability
    return commands.filter((cmd) => {
      // Only show commands that should appear in palette
      if (cmd.showInPalette === false) return false;

      // Check permissions
      return canUseShortcut(cmd, user);
    });
  }, [customCommands, user]);

  // Fuzzy search results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show all commands when no query
      return allCommands.slice(0, 10);
    }
    return fuzzySearchShortcuts(allCommands, query).slice(0, 10);
  }, [query, allCommands]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Execute command
  const executeCommand = useCallback(
    async (command: CommandDefinition) => {
      setExecuting(true);

      try {
        const result = command.handler();
        if (result instanceof Promise) {
          await result;
        }
        setIsOpen(false);
        setQuery('');
        setSelectedIndex(0);
      } catch (error) {
        console.error('Command execution failed:', error);
      } finally {
        setExecuting(false);
      }
    },
    []
  );

  useComponentHotkeys(
    [paletteShortcut],
    {
      'command-palette': () => {
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      },
    },
    {
      enableOnFormTags: isOpen ? true : false,
      enableOnContentEditable: isOpen ? true : false,
    }
  );

  useHotkeys(
    'down',
    (e) => {
      if (!isOpen) return;
      if (results.length === 0) return;
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, results.length]
  );

  useHotkeys(
    'up',
    (e) => {
      if (!isOpen) return;
      if (results.length === 0) return;
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, results.length]
  );

  useHotkeys(
    'enter',
    (e) => {
      if (!isOpen) return;
      const selected = results[selectedIndex];
      if (!selected) return;
      e.preventDefault();
      executeCommand(selected);
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, results, selectedIndex, executeCommand]
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

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;

    const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="w-full max-w-2xl mx-4"
              role="dialog"
              aria-modal="true"
              aria-label="Command palette"
            >
              <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                  <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search commands..."
                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {executing && <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />}
                </div>

                {/* Results */}
                <div
                  ref={listRef}
                  className="max-h-[400px] overflow-y-auto overscroll-contain"
                  role="listbox"
                >
                  {results.length === 0 ? (
                    <div className="px-4 py-12 text-center text-muted-foreground">
                      <CommandIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">No commands found</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {results.map((command, index) => {
                        const Icon = command.icon;
                        const isSelected = index === selectedIndex;
                        const keyBinding =
                          'binding' in command && command.binding
                            ? formatKeyBinding(command.binding.key)
                            : null;

                        return (
                          <button
                            key={command.id}
                            onClick={() => executeCommand(command)}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                              isSelected
                                ? 'bg-primary/10 text-foreground'
                                : 'text-foreground/80 hover:bg-muted/50'
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {/* Icon */}
                            {Icon && (
                              <div
                                className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                  isSelected
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted/50 text-muted-foreground'
                                )}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {'binding' in command && command.binding
                                    ? command.binding.description
                                    : command.id}
                                </span>
                                {command.group && (
                                  <span className="text-xs text-muted-foreground">
                                    {command.group}
                                  </span>
                                )}
                              </div>
                              {command.keywords && command.keywords.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {command.keywords.slice(0, 3).join(', ')}
                                </div>
                              )}
                            </div>

                            {/* Keyboard Hint */}
                            {keyBinding && (
                              <kbd
                                className={cn(
                                  'px-2 py-1 text-xs font-mono rounded border',
                                  isSelected
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : 'bg-muted/30 border-border text-muted-foreground'
                                )}
                              >
                                {keyBinding}
                              </kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">
                        ↑↓
                      </kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">
                        ↵
                      </kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-background border border-border rounded font-mono">
                        Esc
                      </kbd>
                      Close
                    </span>
                  </div>
                  <span>{results.length} results</span>
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

export default CommandPalette;
