import { useEffect, useCallback } from 'react';
import { toastSuccess } from '@/app/utils/toast';

interface UseFormPersistenceOptions<T> {
    key: string;
    data: T;
    excludeFields?: (keyof T)[];
    clearOnSubmit?: boolean;
}

/**
 * Sprint 3: Form State Persistence Hook
 * 
 * Automatically saves form data to localStorage and restores on page refresh.
 * Prevents data loss when users accidentally refresh the page.
 * 
 * @example
 * const { restore, clear } = useFormPersistence({
 *   key: 'checkout',
 *   data: formData,
 *   excludeFields: ['creditCard', 'cvv'], // Don't persist sensitive data
 * });
 * 
 * // Restore on mount
 * useEffect(() => {
 *   const saved = restore();
 *   if (saved) {
 *     setFormData(saved);
 *   }
 * }, []);
 */
export function useFormPersistence<T extends Record<string, any>>({
    key,
    data,
    excludeFields = [],
    clearOnSubmit = true
}: UseFormPersistenceOptions<T>) {

    const storageKey = `form_persist_${key}`;

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (!data) return;

        try {
            // Create a copy and remove excluded fields
            const dataToSave = { ...data };
            excludeFields.forEach(field => {
                delete dataToSave[field];
            });

            // Add timestamp for expiration checking
            const persistData = {
                data: dataToSave,
                timestamp: Date.now(),
                version: '1.0' // For future schema changes
            };

            localStorage.setItem(storageKey, JSON.stringify(persistData));
        } catch (error) {
            console.error('Failed to persist form data:', error);
        }
    }, [data, storageKey, excludeFields]);

    // Restore from localStorage
    const restore = useCallback((): T | null => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) return null;

            const persistData = JSON.parse(saved);

            // Check if data is expired (older than 24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            const age = Date.now() - persistData.timestamp;

            if (age > maxAge) {
                // Data too old, clear it
                localStorage.removeItem(storageKey);
                return null;
            }

            return persistData.data as T;
        } catch (error) {
            console.error('Failed to restore form data:', error);
            return null;
        }
    }, [storageKey]);

    // Clear persisted data
    const clear = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Failed to clear persisted data:', error);
        }
    }, [storageKey]);

    // Check if there's persisted data available
    const hasSavedData = useCallback((): boolean => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved !== null;
        } catch {
            return false;
        }
    }, [storageKey]);

    return {
        restore,
        clear,
        hasSavedData
    };
}

/**
 * Helper hook to auto-restore on component mount
 */
export function useAutoRestore<T extends Record<string, any>>(
    key: string,
    setter: (data: T) => void,
    excludeFields?: (keyof T)[]
) {
    const { restore, hasSavedData } = useFormPersistence({
        key,
        data: {} as T,
        excludeFields
    });

    useEffect(() => {
        if (hasSavedData()) {
            const saved = restore();
            if (saved) {
                setter(saved);
                toastSuccess('Form data restored from previous session');
            }
        }
    }, []); // Only run once on mount
}
