/**
 * useShortcuts Hook - Core Hook Layer
 *
 * Provides three layers of shortcut registration:
 * 1. useGlobalHotkeys() - Application-wide shortcuts
 * 2. useRouteHotkeys() - Route-specific shortcuts
 * 3. useComponentHotkeys() - Component-scoped shortcuts
 *
 * Features:
 * - Automatic cleanup on unmount
 * - Input field protection
 * - Role-based permission checking
 * - Conflict resolution
 * - Platform-agnostic (auto Ctrl/Cmd)
 */

import { useCallback, useRef } from 'react';
import { useHotkeys, Options as HotkeysOptions } from 'react-hotkeys-hook';
import { ShortcutDefinition, CommandDefinition, ShortcutContext } from '@/app/types/shortcuts';
import { useAuth } from './useAuth';
import {
  isUserInInputField,
  shouldExecuteShortcut,
  getShortcutContext,
  debugLog,
  isSequenceShortcut,
} from '@/app/utils/shortcuts';

/**
 * Options for shortcut hooks
 */
interface UseShortcutOptions {
  /** Enable/disable shortcut */
  enabled?: boolean;

  /** Enable input field protection (default: true) */
  enableOnFormTags?: boolean | string[];

  /** Enable when content is editable (default: false) */
  enableOnContentEditable?: boolean;

  /** Prevent default browser behavior (default: from shortcut definition) */
  preventDefault?: boolean;

  /** Stop event propagation (default: from shortcut definition) */
  stopPropagation?: boolean;

  /** Additional context for availability checks */
  context?: Record<string, any>;

  /** Debug mode */
  debug?: boolean;
}

/**
 * Base shortcut hook - Internal use only
 */
const useShortcutBase = (
  shortcut: ShortcutDefinition | CommandDefinition,
  handler?: () => void | Promise<void>,
  options: UseShortcutOptions = {}
) => {
  const { user } = useAuth();
  const {
    enabled = true,
    enableOnFormTags = false,
    enableOnContentEditable = false,
    preventDefault,
    stopPropagation,
    context: additionalContext = {},
    debug = false,
  } = options;

  // Use binding if it exists
  if (!('binding' in shortcut) || !shortcut.binding) {
    return; // No key binding, skip
  }

  const key = shortcut.binding.key;

  // Get shortcut context (sync so enabled state is correct on first render)
  const contextRef = useRef<ShortcutContext | null>(null);
  contextRef.current = {
    ...getShortcutContext(user),
    ...additionalContext,
  };

  // Hotkeys options
  const hotkeysOptions: HotkeysOptions = {
    enabled:
      enabled &&
      shortcut.enabled !== false &&
      Boolean(contextRef.current && shouldExecuteShortcut(shortcut, contextRef.current)),
    enableOnFormTags: enableOnFormTags as any,
    enableOnContentEditable,
    preventDefault: preventDefault ?? shortcut.preventDefault ?? false,
    // Sequence shortcuts (e.g., "g d") need different handling
    splitKey: isSequenceShortcut(key) ? ' ' : undefined,
  };

  // Wrapped handler with context checks
  const wrappedHandler = useCallback(
    (event?: KeyboardEvent) => {
      const context = contextRef.current;
      if (!context || !shouldExecuteShortcut(shortcut, context)) {
        if (debug) {
          debugLog(`Shortcut ${shortcut.id} blocked by context`, context);
        }
        return;
      }

      // Additional input field check (double protection)
      if (!enableOnFormTags && isUserInInputField()) {
        if (debug) {
          debugLog(`Shortcut ${shortcut.id} blocked - user in input field`);
        }
        return;
      }

      // Stop propagation if requested
      if (stopPropagation || shortcut.stopPropagation) {
        event?.stopPropagation();
      }

      // Execute confirmation if required
      if (shortcut.requiresConfirmation) {
        const confirmMessage =
          shortcut.confirmationMessage || 'Are you sure you want to perform this action?';
        if (!confirm(confirmMessage)) {
          if (debug) {
            debugLog(`Shortcut ${shortcut.id} cancelled by user`);
          }
          return;
        }
      }

      if (debug) {
        debugLog(`Executing shortcut ${shortcut.id}`, { key, user: user?.role });
      }

      // Execute handler
      try {
        const result = handler ? handler() : shortcut.handler(event);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Shortcut ${shortcut.id} handler error:`, error);
          });
        }
      } catch (error) {
        console.error(`Shortcut ${shortcut.id} handler error:`, error);
      }
    },
    [shortcut, handler, user, enableOnFormTags, stopPropagation, debug]
  );

  // Register hotkey
  useHotkeys(key, wrappedHandler, hotkeysOptions, [wrappedHandler]);
};

/**
 * useGlobalHotkeys - Register global shortcuts
 *
 * Use for application-wide shortcuts that should be available everywhere.
 * Examples: Command palette (Cmd+K), Help (?)
 */
export const useGlobalHotkeys = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[],
  options: UseShortcutOptions = {}
) => {
  shortcuts.forEach((shortcut) => {
    if (shortcut.scope === 'global') {
      useShortcutBase(shortcut, undefined, options);
    }
  });
};

/**
 * useRouteHotkeys - Register route-specific shortcuts
 *
 * Use for shortcuts that should only be active on specific routes.
 * Examples: Navigation shortcuts, page-specific actions
 */
export const useRouteHotkeys = (
  route: string,
  shortcuts: (ShortcutDefinition | CommandDefinition)[],
  options: UseShortcutOptions = {}
) => {
  const { user } = useAuth();

  shortcuts.forEach((shortcut) => {
    if (shortcut.scope === 'global' || shortcut.scope === 'route') {
      useShortcutBase(shortcut, undefined, {
        ...options,
        context: { route },
      });
    }
  });
};

/**
 * useComponentHotkeys - Register component-scoped shortcuts
 *
 * Use for shortcuts specific to a component (forms, tables, etc).
 * Automatically cleans up when component unmounts.
 */
export const useComponentHotkeys = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[],
  handlers: Record<string, () => void | Promise<void>>,
  options: UseShortcutOptions = {}
) => {
  shortcuts.forEach((shortcut) => {
    const handler = handlers[shortcut.id];
    if (handler) {
      useShortcutBase(shortcut, handler, options);
    }
  });
};

/**
 * useModalHotkeys - Register modal-specific shortcuts
 *
 * Use for shortcuts that should only work when a modal is open.
 * Examples: Esc to close, Cmd+Enter to submit
 */
export const useModalHotkeys = (
  isOpen: boolean,
  handlers: {
    onClose?: () => void;
    onConfirm?: () => void;
    [key: string]: (() => void) | undefined;
  },
  options: UseShortcutOptions = {}
) => {
  const closeShortcut: ShortcutDefinition = {
    id: 'modal-close',
    binding: { key: 'escape', description: 'Close modal' },
    category: 'modals',
    scope: 'modal',
    handler: () => handlers.onClose?.(),
    preventDefault: true,
  };

  const confirmShortcut: ShortcutDefinition = {
    id: 'modal-confirm',
    binding: { key: 'mod+enter', description: 'Confirm' },
    category: 'modals',
    scope: 'modal',
    handler: () => handlers.onConfirm?.(),
    preventDefault: true,
  };

  const modalOptions: UseShortcutOptions = {
    ...options,
    enabled: isOpen,
    context: {
      ...(options.context || {}),
      modalOpen: isOpen,
    },
  };

  if (isOpen && handlers.onClose) {
    useShortcutBase(closeShortcut, handlers.onClose, modalOptions);
  }

  if (isOpen && handlers.onConfirm) {
    useShortcutBase(confirmShortcut, handlers.onConfirm, modalOptions);
  }
};

/**
 * useFormHotkeys - Register form-specific shortcuts
 *
 * Use for form shortcuts that should work even in input fields.
 * Examples: Cmd+S to save, Cmd+Enter to submit, Esc to cancel
 */
export const useFormHotkeys = (
  handlers: {
    onSave?: () => void;
    onSubmit?: () => void;
    onCancel?: () => void;
  },
  options: UseShortcutOptions = {}
) => {
  const saveShortcut: ShortcutDefinition = {
    id: 'form-save',
    binding: { key: 'mod+s', description: 'Save form' },
    category: 'forms',
    scope: 'component',
    handler: () => handlers.onSave?.(),
    preventDefault: true,
  };

  const submitShortcut: ShortcutDefinition = {
    id: 'form-submit',
    binding: { key: 'mod+enter', description: 'Submit form' },
    category: 'forms',
    scope: 'component',
    handler: () => handlers.onSubmit?.(),
    preventDefault: true,
  };

  const cancelShortcut: ShortcutDefinition = {
    id: 'form-cancel',
    binding: { key: 'escape', description: 'Cancel' },
    category: 'forms',
    scope: 'component',
    handler: () => handlers.onCancel?.(),
    preventDefault: true,
  };

  // Enable on form tags for form shortcuts
  const formOptions = { ...options, enableOnFormTags: ['input', 'textarea', 'select'] };

  if (handlers.onSave) {
    useShortcutBase(saveShortcut, handlers.onSave, formOptions);
  }

  if (handlers.onSubmit) {
    useShortcutBase(submitShortcut, handlers.onSubmit, formOptions);
  }

  if (handlers.onCancel) {
    useShortcutBase(cancelShortcut, handlers.onCancel, options);
  }
};

/**
 * useTableHotkeys - Register table/data grid shortcuts
 *
 * Use for table-specific shortcuts (select all, copy, delete, etc).
 */
export const useTableHotkeys = (
  handlers: {
    onSelectAll?: () => void;
    onCopy?: () => void;
    onDelete?: () => void;
    onRefresh?: () => void;
    onNavigateUp?: () => void;
    onNavigateDown?: () => void;
  },
  options: UseShortcutOptions = {}
) => {
  const shortcuts: ShortcutDefinition[] = [
    {
      id: 'table-select-all',
      binding: { key: 'mod+a', description: 'Select all' },
      category: 'tables',
      scope: 'component',
      handler: () => handlers.onSelectAll?.(),
      preventDefault: true,
    },
    {
      id: 'table-copy',
      binding: { key: 'mod+c', description: 'Copy selection' },
      category: 'clipboard',
      scope: 'component',
      handler: () => handlers.onCopy?.(),
      preventDefault: true,
    },
    {
      id: 'table-delete',
      binding: { key: 'delete', description: 'Delete selection' },
      category: 'tables',
      scope: 'component',
      handler: () => handlers.onDelete?.(),
      requiresConfirmation: true,
      confirmationMessage: 'Delete selected items?',
    },
    {
      id: 'table-refresh',
      binding: { key: 'mod+r', description: 'Refresh table' },
      category: 'tables',
      scope: 'component',
      handler: () => handlers.onRefresh?.(),
      preventDefault: true,
    },
    {
      id: 'table-nav-up',
      binding: { key: 'up', description: 'Navigate up' },
      category: 'tables',
      scope: 'component',
      handler: () => handlers.onNavigateUp?.(),
      preventDefault: true,
    },
    {
      id: 'table-nav-down',
      binding: { key: 'down', description: 'Navigate down' },
      category: 'tables',
      scope: 'component',
      handler: () => handlers.onNavigateDown?.(),
      preventDefault: true,
    },
  ];

  shortcuts.forEach((shortcut) => {
    const handlerKey = shortcut.id.replace('table-', 'on') as keyof typeof handlers;
    const handler = handlers[handlerKey];
    if (handler) {
      useShortcutBase(shortcut, handler as any, options);
    }
  });
};
