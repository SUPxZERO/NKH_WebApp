/**
 * Shortcuts Provider
 * 
 * This provider registers all keyboard shortcuts and renders
 * the CommandPalette and HelpOverlay components.
 * 
 * It should be included in AppProviders to enable shortcuts globally.
 */

import React, { PropsWithChildren } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { CommandPalette } from '@/app/components/shortcuts/CommandPalette';
import { HelpOverlay } from '@/app/components/shortcuts/HelpOverlay';
import {
    ADMIN_NAVIGATION_SHORTCUTS,
    ADMIN_EXTENDED_NAVIGATION_SHORTCUTS,
    ADMIN_PAGE_ACTION_SHORTCUTS,
    EMPLOYEE_NAVIGATION_SHORTCUTS,
    CUSTOMER_NAVIGATION_SHORTCUTS,
} from '@/app/config/shortcuts.config';
import { ShortcutDefinition } from '@/app/types/shortcuts';
import { canUseShortcut, isUserInInputField, isSequenceShortcut } from '@/app/utils/shortcuts';
import { useAuth } from '@/app/hooks/useAuth';

/**
 * Component to register a single shortcut
 */
function ShortcutRegistrar({
    shortcut,
    user
}: {
    shortcut: ShortcutDefinition;
    user: any;
}) {
    if (!shortcut.binding) return null;

    const canUse = canUseShortcut(shortcut, user);
    const isSequence = isSequenceShortcut(shortcut.binding.key);

    useHotkeys(
        shortcut.binding.key,
        (e) => {
            if (!canUse) return;
            if (isUserInInputField()) return;

            e.preventDefault();
            shortcut.handler(e);
        },
        {
            enabled: canUse,
            enableOnFormTags: false,
            enableOnContentEditable: false,
            preventDefault: true,
            splitKey: isSequence ? ' ' : undefined,
        },
        [canUse, shortcut]
    );

    return null;
}

/**
 * Component to register all shortcuts for a set
 */
function ShortcutGroup({
    shortcuts,
    user
}: {
    shortcuts: ShortcutDefinition[];
    user: any;
}) {
    return (
        <>
            {shortcuts.map((shortcut) => (
                <ShortcutRegistrar
                    key={shortcut.id}
                    shortcut={shortcut}
                    user={user}
                />
            ))}
        </>
    );
}

export function ShortcutsProvider({ children }: PropsWithChildren) {
    const { user, hasRole } = useAuth();

    // Determine which shortcuts to register based on user role
    const isAdmin = hasRole(['admin', 'super-admin', 'manager']);
    const isEmployee = hasRole('employee');
    const isCustomer = hasRole('customer') || !user;

    return (
        <>
            {/* Register admin shortcuts */}
            {isAdmin && (
                <>
                    <ShortcutGroup shortcuts={ADMIN_NAVIGATION_SHORTCUTS} user={user} />
                    <ShortcutGroup shortcuts={ADMIN_EXTENDED_NAVIGATION_SHORTCUTS} user={user} />
                    <ShortcutGroup shortcuts={ADMIN_PAGE_ACTION_SHORTCUTS} user={user} />
                </>
            )}

            {/* Register employee shortcuts */}
            {isEmployee && (
                <ShortcutGroup shortcuts={EMPLOYEE_NAVIGATION_SHORTCUTS} user={user} />
            )}

            {/* Register customer shortcuts */}
            {isCustomer && (
                <ShortcutGroup shortcuts={CUSTOMER_NAVIGATION_SHORTCUTS} user={user} />
            )}

            {children}
            <CommandPalette />
            <HelpOverlay />
        </>
    );
}

export default ShortcutsProvider;
