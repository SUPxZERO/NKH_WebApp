/**
 * Telegram WebApp Authentication Hook
 * 
 * This hook detects if the app is running inside Telegram WebApp
 * and automatically initializes a session with the backend.
 * 
 * Use this in your main App component or layout to ensure
 * Telegram users are authenticated on first load.
 */

import { useEffect, useState } from 'react';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: TelegramUser;
        auth_date?: number;
        hash?: string;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    MainButton: {
        text: string;
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
    };
    BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
    };
}

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

interface TelegramAuthState {
    isLoading: boolean;
    isInTelegram: boolean;
    isAuthenticated: boolean;
    isGuest: boolean;
    user: TelegramUser | null;
    error: string | null;
}

export function useTelegramAuth(): TelegramAuthState {
    const [state, setState] = useState<TelegramAuthState>({
        isLoading: true,
        isInTelegram: false,
        isAuthenticated: false,
        isGuest: false,
        user: null,
        error: null,
    });

    useEffect(() => {
        const initTelegramAuth = async () => {
            // Check if running in Telegram WebApp
            const tg = window.Telegram?.WebApp;

            if (!tg || !tg.initData) {
                // Not in Telegram
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    isInTelegram: false,
                }));
                return;
            }

            // We're in Telegram!
            setState(prev => ({
                ...prev,
                isInTelegram: true,
                user: tg.initDataUnsafe.user || null,
            }));

            // Tell Telegram the app is ready
            tg.ready();
            tg.expand();

            try {
                // Initialize session with backend
                const response = await fetch('/api/telegram-webapp/init', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    credentials: 'include', // Important: include cookies for session
                    body: JSON.stringify({
                        initData: tg.initData,
                        user_id: tg.initDataUnsafe.user?.id,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isAuthenticated: true,
                        isGuest: data.data?.is_guest ?? true,
                        user: tg.initDataUnsafe.user || null,
                    }));

                    console.log('[TelegramAuth] Session established:', data.data);
                } else {
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        error: data.error || 'Failed to authenticate',
                    }));
                    console.error('[TelegramAuth] Failed:', data.error);
                }
            } catch (error) {
                console.error('[TelegramAuth] Error:', error);
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Network error',
                }));
            }
        };

        initTelegramAuth();
    }, []);

    return state;
}

/**
 * Check if we're running in Telegram (synchronous, no API call)
 */
export function isInTelegram(): boolean {
    return !!(window.Telegram?.WebApp?.initData);
}

/**
 * Get Telegram user data directly (synchronous)
 */
export function getTelegramUser(): TelegramUser | null {
    return window.Telegram?.WebApp?.initDataUnsafe?.user || null;
}

/**
 * Get raw initData string
 */
export function getTelegramInitData(): string | null {
    return window.Telegram?.WebApp?.initData || null;
}
