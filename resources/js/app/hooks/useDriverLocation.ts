import { useState, useEffect, useCallback } from 'react';

interface DriverLocation {
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp: number;
}

interface UseDriverLocationReturn {
    location: DriverLocation | null;
    loading: boolean;
    error: Error | null;
    requestPermission: () => void;
    isPermissionDenied: boolean;
}

const STORAGE_KEY = 'driver_last_location';
const UPDATE_THRESHOLD_METERS = 100; // Only update if moved > 100m
const UPDATE_INTERVAL_MS = 30000; // Update every 30 seconds minimum

/**
 * Custom hook to track driver's real-time location using browser Geolocation API
 * 
 * Features:
 * - Request location permission
 * - Watch position with continuous updates
 * - Debounced updates (every 30s or 100m movement)
 * - Error handling (permission denied, unavailable)
 * - Persist last known location to localStorage
 */
export function useDriverLocation(): UseDriverLocationReturn {
    const [location, setLocation] = useState<DriverLocation | null>(() => {
        // Load last known location from localStorage
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isPermissionDenied, setIsPermissionDenied] = useState(false);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    const calculateDistance = useCallback((
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ): number => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lng2 - lng1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }, []);

    /**
     * Handle successful position update
     */
    const handleSuccess = useCallback((position: GeolocationPosition) => {
        const newLocation: DriverLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
        };

        // Check if we should update (based on distance or time threshold)
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateTime;

        let shouldUpdate = timeSinceLastUpdate >= UPDATE_INTERVAL_MS;

        if (location && !shouldUpdate) {
            const distance = calculateDistance(
                location.lat,
                location.lng,
                newLocation.lat,
                newLocation.lng
            );
            shouldUpdate = distance >= UPDATE_THRESHOLD_METERS;
        }

        if (shouldUpdate || !location) {
            setLocation(newLocation);
            setLastUpdateTime(now);
            setLoading(false);
            setError(null);

            // Persist to localStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newLocation));
            } catch (err) {
                console.error('Failed to save location to localStorage:', err);
            }
        }
    }, [location, lastUpdateTime, calculateDistance]);

    /**
     * Handle geolocation error
     */
    const handleError = useCallback((err: GeolocationPositionError) => {
        setLoading(false);

        switch (err.code) {
            case err.PERMISSION_DENIED:
                setError(new Error('Location permission denied. Please enable location access.'));
                setIsPermissionDenied(true);
                break;
            case err.POSITION_UNAVAILABLE:
                setError(new Error('Location information unavailable.'));
                break;
            case err.TIMEOUT:
                setError(new Error('Location request timed out.'));
                break;
            default:
                setError(new Error('An unknown error occurred while getting location.'));
        }
    }, []);

    /**
     * Request location permission and start watching position
     */
    const requestPermission = useCallback(() => {
        if (!navigator.geolocation) {
            setError(new Error('Geolocation is not supported by your browser.'));
            return;
        }

        setLoading(true);
        setError(null);
        setIsPermissionDenied(false);

        // Get initial position
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });

        // Start watching position
        const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000, // Accept cached position up to 30s old
        });

        setWatchId(id);
    }, [handleSuccess, handleError]);

    /**
     * Cleanup: Stop watching position on unmount
     */
    useEffect(() => {
        // Auto-request permission on mount if geolocation is available
        if (navigator.geolocation && !location && !isPermissionDenied) {
            requestPermission();
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]); // Only run on mount/unmount

    return {
        location,
        loading,
        error,
        requestPermission,
        isPermissionDenied,
    };
}
