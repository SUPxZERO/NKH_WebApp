import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { PageProps } from '@inertiajs/core';

// Define the shape of our Inertia shared props
interface SharedProps extends PageProps {
    locale: string;
    translations: Record<string, any>;
}

interface LanguageContextType {
    locale: string;
    translations: Record<string, any>;
    setLocale: (newLocale: string) => void;
    t(key: string, replacements?: Record<string, any>): any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    // 1. Receive Initial State from Inertia
    const { props } = usePage<SharedProps>();
    const [translations, setTranslations] = useState<Record<string, any>>(props.translations || {});

    // Sync state if props change (e.g. after navigation)
    useEffect(() => {
        if (props.translations) {
            setTranslations(props.translations);
        }
    }, [props.translations]);

    const locale = props.locale || 'en';

    // 2. Change Language Action
    const setLocale = (newLocale: string) => {
        if (newLocale === locale) return;

        // Optimistically update cookie (optional, primarily handled by server)
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

        // Update Axios Header for subsequent requests
        if (typeof window !== 'undefined' && (window as any).axios) {
            (window as any).axios.defaults.headers.common['X-Inertia-Locale'] = newLocale;
        }

        // Reload page to fetch new JSON and run middleware
        router.reload({
            headers: {
                'X-Inertia-Locale': newLocale
            },
            onFinish: () => {
                // Determine if we need a full refresh if simple reload isn't enough
                window.location.reload();
            }
        });
    };

    // 3. Translation Helper
    const t = (key: string, replacements: Record<string, any> = {}): any => {
        const keys = key.split('.');
        let value: any = translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Fallback to key if not found
            }
        }

        if (typeof value !== 'string') return key;

        const replacementKeys = Object.keys(replacements);
        if (replacementKeys.length === 0) return value;

        // Check if any replacement is a React element
        const hasReactElement = replacementKeys.some(k => React.isValidElement(replacements[k]));

        if (!hasReactElement) {
            let result = value;
            replacementKeys.forEach(param => {
                result = result.replace(`:${param}`, String(replacements[param]));
            });
            return result;
        }

        // Handle React elements by splitting the string
        let parts: (string | React.ReactNode)[] = [value];

        replacementKeys.forEach(param => {
            const nextParts: (string | React.ReactNode)[] = [];
            parts.forEach(part => {
                if (typeof part === 'string') {
                    const split = part.split(`:${param}`);
                    for (let i = 0; i < split.length; i++) {
                        if (split[i] !== '') nextParts.push(split[i]);
                        if (i < split.length - 1) nextParts.push(replacements[param]);
                    }
                } else {
                    nextParts.push(part);
                }
            });
            parts = nextParts;
        });

        return (
            <React.Fragment>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>{part}</React.Fragment>
                ))}
            </React.Fragment>
        );
    };

    return (
        <LanguageContext.Provider value={{ locale, translations, setLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        // Safe fallback for components rendered outside LanguageProvider (e.g. global ErrorBoundary)
        return {
            locale: 'en',
            translations: {},
            setLocale: () => { },
            t: (key: string) => key,
        };
    }
    return context;
};
