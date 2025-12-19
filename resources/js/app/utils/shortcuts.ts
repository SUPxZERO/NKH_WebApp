/**
 * Keyboard Shortcut System - Utility Functions
 *
 * Core utilities for shortcut management, conflict resolution,
 * platform detection, and input field protection.
 */

import { ShortcutDefinition, CommandDefinition, UserRole, ShortcutContext } from '@/app/types/shortcuts';

/**
 * Detect if user is on Mac
 */
export const isMac = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
};

/**
 * Get modifier key label for current platform
 */
export const getModKeyLabel = (): string => {
  return isMac() ? '⌘' : 'Ctrl';
};

/**
 * Convert key binding to display format
 * Example: "mod+k" -> "⌘K" (Mac) or "Ctrl+K" (Windows)
 */
export const formatKeyBinding = (key: string): string => {
  const modKey = getModKeyLabel();

  return key
    .split('+')
    .map((part) => {
      switch (part.toLowerCase()) {
        case 'mod':
        case 'ctrl':
        case 'cmd':
        case 'meta':
          return modKey;
        case 'shift':
          return '⇧';
        case 'alt':
          return isMac() ? '⌥' : 'Alt';
        case 'escape':
        case 'esc':
          return 'Esc';
        case 'enter':
        case 'return':
          return '↵';
        case 'backspace':
          return '⌫';
        case 'delete':
          return 'Del';
        case 'tab':
          return '⇥';
        case 'space':
          return 'Space';
        case 'arrowup':
        case 'up':
          return '↑';
        case 'arrowdown':
        case 'down':
          return '↓';
        case 'arrowleft':
        case 'left':
          return '←';
        case 'arrowright':
        case 'right':
          return '→';
        default:
          return part.toUpperCase();
      }
    })
    .join(isMac() ? '' : '+');
};

/**
 * Check if element is an input field where shortcuts should be disabled
 */
export const isInputField = (element: Element | null): boolean => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();
  const isEditable = (element as HTMLElement).isContentEditable;

  // Check if it's an input, textarea, or contenteditable
  if (tagName === 'input' || tagName === 'textarea' || isEditable) {
    return true;
  }

  // Check if inside a contenteditable parent
  let parent = element.parentElement;
  while (parent) {
    if (parent.isContentEditable) {
      return true;
    }
    parent = parent.parentElement;
  }

  return false;
};

/**
 * Check if user is currently focused on an input field
 */
export const isUserInInputField = (): boolean => {
  const activeElement = document.activeElement;
  return isInputField(activeElement);
};

/**
 * Check if a modal is currently open
 */
export const isModalOpen = (): boolean => {
  // Check for common modal indicators
  const modalSelectors = [
    '[role="dialog"]',
    '[role="alertdialog"]',
    '.modal',
    '[data-modal="true"]',
    '[aria-modal="true"]',
  ];

  for (const selector of modalSelectors) {
    const modal = document.querySelector(selector);
    if (modal && getComputedStyle(modal).display !== 'none') {
      return true;
    }
  }

  return false;
};

/**
 * Get current shortcut context
 */
export const getShortcutContext = (user: any, route?: string): ShortcutContext => {
  return {
    user,
    route: route || window.location.pathname,
    inInputField: isUserInInputField(),
    modalOpen: isModalOpen(),
  };
};

/**
 * Check if user has permission to use shortcut
 */
export const canUseShortcut = (
  shortcut: ShortcutDefinition | CommandDefinition,
  user: any
): boolean => {
  // Check if shortcut is enabled
  if (shortcut.enabled === false) {
    return false;
  }

  // Check role-based permissions
  if (shortcut.allowedRoles && shortcut.allowedRoles.length > 0) {
    const userRole = user?.role as UserRole;
    if (!userRole || !shortcut.allowedRoles.includes(userRole)) {
      return false;
    }
  }

  // Check custom permission function
  if (shortcut.permission && !shortcut.permission(user)) {
    return false;
  }

  // Check availability
  if (shortcut.available && !shortcut.available()) {
    return false;
  }

  return true;
};

/**
 * Check if shortcut should execute in current context
 */
export const shouldExecuteShortcut = (
  shortcut: ShortcutDefinition | CommandDefinition,
  context: ShortcutContext
): boolean => {
  // Don't execute if user doesn't have permission
  if (!canUseShortcut(shortcut, context.user)) {
    return false;
  }

  // Don't execute global shortcuts in input fields (except system shortcuts)
  if (
    context.inInputField &&
    shortcut.category !== 'system' &&
    shortcut.category !== 'forms' &&
    shortcut.category !== 'modals'
  ) {
    return false;
  }

  // Only execute modal shortcuts when modal is open
  if (shortcut.scope === 'modal' && !context.modalOpen) {
    return false;
  }

  return true;
};

/**
 * Detect shortcut conflicts
 */
export const detectConflicts = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[]
): Map<string, (ShortcutDefinition | CommandDefinition)[]> => {
  const conflicts = new Map<string, (ShortcutDefinition | CommandDefinition)[]>();

  shortcuts.forEach((shortcut) => {
    if (!('binding' in shortcut) || !shortcut.binding) return;

    const key = shortcut.binding.key.toLowerCase();

    if (!conflicts.has(key)) {
      conflicts.set(key, []);
    }

    conflicts.get(key)!.push(shortcut);
  });

  // Filter to only actual conflicts (more than one shortcut per key)
  const actualConflicts = new Map<string, (ShortcutDefinition | CommandDefinition)[]>();
  conflicts.forEach((shortcuts, key) => {
    if (shortcuts.length > 1) {
      actualConflicts.set(key, shortcuts);
    }
  });

  return actualConflicts;
};

/**
 * Resolve shortcut conflicts by priority
 */
export const resolveConflict = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[]
): ShortcutDefinition | CommandDefinition | null => {
  if (shortcuts.length === 0) return null;
  if (shortcuts.length === 1) return shortcuts[0];

  // Sort by priority (higher first)
  const sorted = [...shortcuts].sort((a, b) => {
    const aPriority = a.priority || 0;
    const bPriority = b.priority || 0;
    return bPriority - aPriority;
  });

  return sorted[0];
};

/**
 * Filter shortcuts by role
 */
export const filterShortcutsByRole = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[],
  userRole: UserRole
): (ShortcutDefinition | CommandDefinition)[] => {
  return shortcuts.filter((shortcut) => {
    if (!shortcut.allowedRoles || shortcut.allowedRoles.length === 0) {
      return true; // No role restriction
    }
    return shortcut.allowedRoles.includes(userRole);
  });
};

/**
 * Group shortcuts by category
 */
export const groupShortcutsByCategory = (
  shortcuts: (ShortcutDefinition | CommandDefinition)[]
): Record<string, (ShortcutDefinition | CommandDefinition)[]> => {
  const grouped: Record<string, (ShortcutDefinition | CommandDefinition)[]> = {};

  shortcuts.forEach((shortcut) => {
    const category = shortcut.category;
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(shortcut);
  });

  return grouped;
};

/**
 * Fuzzy search shortcuts by keyword
 */
export const fuzzySearchShortcuts = (
  shortcuts: CommandDefinition[],
  query: string
): CommandDefinition[] => {
  if (!query.trim()) return shortcuts;

  const lowerQuery = query.toLowerCase().trim();
  const tokens = lowerQuery.split(/\s+/);

  return shortcuts
    .map((shortcut) => {
      let score = 0;

      // Check ID
      if (shortcut.id.toLowerCase().includes(lowerQuery)) {
        score += 10;
      }

      // Check description
      if ('binding' in shortcut && shortcut.binding?.description.toLowerCase().includes(lowerQuery)) {
        score += 8;
      }

      // Check keywords
      if (shortcut.keywords) {
        shortcut.keywords.forEach((keyword) => {
          if (keyword.toLowerCase().includes(lowerQuery)) {
            score += 5;
          }
        });
      }

      // Check group
      if (shortcut.group?.toLowerCase().includes(lowerQuery)) {
        score += 3;
      }

      // Token matching (all tokens must match somewhere)
      const allTokensMatch = tokens.every((token) => {
        const text = [
          shortcut.id,
          'binding' in shortcut ? shortcut.binding?.description : '',
          ...(shortcut.keywords || []),
          shortcut.group || '',
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(token);
      });

      if (allTokensMatch && tokens.length > 1) {
        score += tokens.length * 2;
      }

      return { shortcut, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.shortcut);
};

/**
 * Parse sequence shortcuts (e.g., "g d" for Go → Dashboard)
 */
export const isSequenceShortcut = (key: string): boolean => {
  return key.includes(' ') && !key.includes('+');
};

/**
 * Debug log for shortcuts (only when debug mode is enabled)
 */
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Shortcuts] ${message}`, data || '');
  }
};

/**
 * Sanitize data for clipboard (remove sensitive fields)
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'private_key',
  'privateKey',
  'ssn',
  'credit_card',
  'creditCard',
  'cvv',
  'pin',
];

export const sanitizeForClipboard = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForClipboard);
  }

  const sanitized: any = {};
  Object.keys(data).forEach((key) => {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeForClipboard(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
};

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      const stringValue = value?.toString() || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Check if clipboard API is available
 */
export const isClipboardAvailable = (): boolean => {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator;
};
