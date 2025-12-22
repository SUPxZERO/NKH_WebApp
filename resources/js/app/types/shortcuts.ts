/**
 * Keyboard Shortcut System - Type Definitions
 *
 * This file defines the type system for the keyboard shortcut infrastructure.
 * It ensures type safety across all shortcut registrations and executions.
 */

/**
 * User roles in the application
 */
export type UserRole = 'admin' | 'employee' | 'customer' | 'super-admin' | 'manager';

/**
 * Shortcut scope determines where shortcuts are active
 */
export type ShortcutScope = 'global' | 'route' | 'component' | 'modal';

/**
 * Shortcut category for grouping in help UI
 */
export type ShortcutCategory =
  | 'navigation'
  | 'actions'
  | 'forms'
  | 'tables'
  | 'modals'
  | 'clipboard'
  | 'system';

/**
 * Platform-specific key combinations
 */
export interface KeyBinding {
  /** Primary key combination (e.g., "ctrl+k", "cmd+s") */
  key: string;
  /** Alternative key combination */
  altKey?: string;
  /** Description for display in UI */
  description: string;
}

/**
 * Permission check function
 */
export type PermissionCheck = (user: any) => boolean;

/**
 * Context-aware availability check
 */
export type AvailabilityCheck = () => boolean;

/**
 * Shortcut action handler
 */
export type ShortcutHandler = (event?: KeyboardEvent) => void | Promise<void>;

/**
 * Core shortcut definition
 */
export interface ShortcutDefinition {
  /** Unique identifier */
  id: string;

  /** Key binding configuration */
  binding: KeyBinding;

  /** Shortcut category */
  category: ShortcutCategory;

  /** Shortcut scope */
  scope: ShortcutScope;

  /** Action handler */
  handler: ShortcutHandler;

  /** Roles that can access this shortcut */
  allowedRoles?: UserRole[];

  /** Permission check (optional, more granular than roles) */
  permission?: PermissionCheck;

  /** Context availability check */
  available?: AvailabilityCheck;

  /** Whether this shortcut is enabled */
  enabled?: boolean;

  /** Priority (higher = executes first if conflicting) */
  priority?: number;

  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;

  /** Whether to stop event propagation */
  stopPropagation?: boolean;

  /** Group for command palette */
  group?: string;

  /** Icon for command palette */
  icon?: React.ComponentType<any>;

  /** Whether shortcut requires confirmation */
  requiresConfirmation?: boolean;

  /** Confirmation message */
  confirmationMessage?: string;

  /** Keywords for fuzzy search in command palette */
  keywords?: string[];

  /** Whether this shortcut should appear in command palette */
  showInPalette?: boolean;
}

/**
 * Command palette command (can have no key binding)
 */
export interface CommandDefinition extends Omit<ShortcutDefinition, 'binding'> {
  /** Optional key binding */
  binding?: KeyBinding;

  /** Keywords for fuzzy search */
  keywords?: string[];

  /** Whether command should appear in palette */
  showInPalette?: boolean;
}

/**
 * Shortcut registry configuration
 */
export interface ShortcutRegistryConfig {
  /** Enable debug logging */
  debug?: boolean;

  /** Disable all shortcuts (useful for testing) */
  disabled?: boolean;

  /** Custom key for platform detection */
  modKey?: 'ctrl' | 'cmd' | 'meta';
}

/**
 * Shortcut context for hooks
 */
export interface ShortcutContext {
  /** Current user */
  user: any;

  /** Current route/page */
  route?: string;

  /** Whether user is in an input field */
  inInputField: boolean;

  /** Whether a modal is open */
  modalOpen: boolean;

  /** Custom context data */
  [key: string]: any;
}

/**
 * Clipboard data types
 */
export type ClipboardDataType = 'text' | 'csv' | 'json' | 'html';

/**
 * Clipboard copy options
 */
export interface ClipboardCopyOptions {
  /** Data type */
  type?: ClipboardDataType;

  /** Success message */
  successMessage?: string;

  /** Error message */
  errorMessage?: string;

  /** Show toast notification */
  showToast?: boolean;
}

/**
 * Help overlay section
 */
export interface HelpSection {
  /** Section title */
  title: string;

  /** Section shortcuts */
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

/**
 * Command palette result
 */
export interface CommandResult {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: React.ComponentType<any>;
  keywords?: string[];
  shortcut?: string;
  handler: () => void;
  available: boolean;
}

/**
 * Fuzzy search options
 */
export interface FuzzySearchOptions {
  /** Threshold for match quality (0-1) */
  threshold?: number;

  /** Keys to search in */
  keys?: string[];

  /** Maximum results */
  limit?: number;
}

/**
 * Shortcut conflict
 */
export interface ShortcutConflict {
  key: string;
  shortcuts: ShortcutDefinition[];
  resolved: boolean;
  winner?: ShortcutDefinition;
}
