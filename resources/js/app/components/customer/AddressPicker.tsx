import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2, X, Navigation, AlertCircle, ExternalLink, Crosshair, Map } from 'lucide-react';
import { cn } from '@/app/utils/cn';

// Types
export interface AddressData {
    address: string;
    lat: number;
    lng: number;
    display_name?: string;
    address_line_1?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    country?: string;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
    address?: {
        house_number?: string;
        road?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        province?: string;
        postcode?: string;
        country?: string;
    };
}

interface AddressPickerProps {
    initialAddress?: string;
    initialLat?: number;
    initialLng?: number;
    onChange: (data: AddressData | null) => void;
    label?: string;
    placeholder?: string;
    showMap?: boolean;
    mapHeight?: number;
    disabled?: boolean;
    error?: string;
    className?: string;
    defaultCenter?: [number, number];
    defaultZoom?: number;
}

// Nominatim API search function
async function searchNominatim(query: string): Promise<NominatimResult[]> {
    if (!query || query.length < 3) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!response.ok) throw new Error('Nominatim search failed');
        return await response.json();
    } catch (error) {
        console.error('Nominatim search error:', error);
        return [];
    }
}

// Reverse geocoding function
async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

// Parse Nominatim result to AddressData
function parseNominatimResult(result: NominatimResult): AddressData {
    const addr = result.address || {};
    const addressLine1Parts: string[] = [];
    if (addr.house_number) addressLine1Parts.push(addr.house_number);
    if (addr.road) addressLine1Parts.push(addr.road);

    return {
        address: result.display_name,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        address_line_1: addressLine1Parts.join(' ') || addr.road || addr.suburb || '',
        city: addr.city || addr.town || addr.village || '',
        province: addr.state || addr.province || '',
        postal_code: addr.postcode || '',
        country: addr.country || '',
    };
}

export default function AddressPicker({
    initialAddress = '',
    initialLat,
    initialLng,
    onChange,
    label,
    placeholder = 'Search for an address...',
    showMap = true,
    mapHeight = 250,
    disabled = false,
    error,
    className,
    defaultCenter = [11.5564, 104.9282],
}: AddressPickerProps) {
    const [searchQuery, setSearchQuery] = useState(initialAddress);
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
        initialLat && initialLng
            ? { address: initialAddress, lat: initialLat, lng: initialLng }
            : null
    );
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchNominatim(value);
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
            setIsSearching(false);
        }, 300);
    }, []);

    // Handle suggestion selection
    const handleSelectSuggestion = useCallback((result: NominatimResult) => {
        const addressData = parseNominatimResult(result);
        setSelectedAddress(addressData);
        setSearchQuery(result.display_name);
        setShowSuggestions(false);
        onChange(addressData);
    }, [onChange]);

    // Clear selection
    const handleClear = useCallback(() => {
        setSearchQuery('');
        setSelectedAddress(null);
        setSuggestions([]);
        setShowSuggestions(false);
        onChange(null);
    }, [onChange]);

    // Get current location using browser Geolocation API
    const handleGetCurrentLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsGettingLocation(true);

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000,
                });
            });

            const { latitude, longitude } = position.coords;

            const result = await reverseGeocode(latitude, longitude);

            if (result) {
                const addressData = parseNominatimResult(result);
                setSelectedAddress(addressData);
                setSearchQuery(result.display_name);
                onChange(addressData);
            } else {
                const addressData: AddressData = {
                    address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    lat: latitude,
                    lng: longitude,
                };
                setSelectedAddress(addressData);
                onChange(addressData);
            }
        } catch (error: any) {
            console.error('Geolocation error:', error);
            let message = 'Unable to get your location. ';
            if (error.code === 1) message += 'Please allow location access.';
            else if (error.code === 2) message += 'Position unavailable.';
            else if (error.code === 3) message += 'Request timed out.';
            alert(message);
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Handle map selection
    const handleMapSelect = async (lat: number, lng: number) => {
        const result = await reverseGeocode(lat, lng);

        if (result) {
            const addressData = parseNominatimResult(result);
            setSelectedAddress(addressData);
            setSearchQuery(result.display_name);
            onChange(addressData);
        } else {
            const addressData: AddressData = {
                address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                lat,
                lng,
            };
            setSelectedAddress(addressData);
            onChange(addressData);
        }
        setShowMapModal(false);
    };

    // Open in external map
    const openExternalMap = () => {
        if (selectedAddress) {
            window.open(
                `https://www.openstreetmap.org/?mlat=${selectedAddress.lat}&mlon=${selectedAddress.lng}#map=17/${selectedAddress.lat}/${selectedAddress.lng}`,
                '_blank'
            );
        }
    };

    return (
        <div className={cn('space-y-3', className)} ref={wrapperRef}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    {label}
                </label>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={disabled || isGettingLocation}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                        'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent',
                        'hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    {isGettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Crosshair className="w-4 h-4" />
                    )}
                    {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
                </button>

                <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    disabled={disabled}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                        'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent',
                        'hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                >
                    <Map className="w-4 h-4" />
                    Pick on Map
                </button>
            </div>

            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isSearching ? (
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        disabled={disabled}
                        placeholder={placeholder}
                        className={cn(
                            'w-full pl-10 pr-10 py-3 rounded-xl border transition-all duration-200',
                            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                            'placeholder-gray-500 dark:placeholder-gray-400',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                            disabled
                                ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400/50',
                            error && 'border-red-500 dark:border-red-500'
                        )}
                    />
                    {searchQuery && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((result) => (
                            <button
                                key={result.place_id}
                                type="button"
                                onClick={() => handleSelectSuggestion(result)}
                                className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-purple-500 mt-1 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-white truncate">
                                            {result.display_name.split(',')[0]}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {result.display_name}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </p>
            )}

            {/* Selected Address */}
            {selectedAddress && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Navigation className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {selectedAddress.address_line_1 || selectedAddress.address.split(',')[0]}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                    {selectedAddress.city && `${selectedAddress.city}, `}
                                    {selectedAddress.province && `${selectedAddress.province} `}
                                    {selectedAddress.postal_code}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-medium">
                                        📍 GPS: {selectedAddress.lat.toFixed(6)}, {selectedAddress.lng.toFixed(6)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={openExternalMap}
                            className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-600 transition-colors"
                            title="View on OpenStreetMap"
                        >
                            <ExternalLink className="w-5 h-5 text-purple-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* Map embed */}
            {showMap && selectedAddress && (
                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                    <iframe
                        width="100%"
                        height={mapHeight}
                        frameBorder="0"
                        scrolling="no"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedAddress.lng - 0.01}%2C${selectedAddress.lat - 0.01}%2C${selectedAddress.lng + 0.01}%2C${selectedAddress.lat + 0.01}&layer=mapnik&marker=${selectedAddress.lat}%2C${selectedAddress.lng}`}
                        style={{ border: 0 }}
                        title="Location Map"
                    />
                    {/* <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Powered by OpenStreetMap (FREE)
                        </span>
                        <a
                            href={`https://www.openstreetmap.org/?mlat=${selectedAddress.lat}&mlon=${selectedAddress.lng}#map=17/${selectedAddress.lat}/${selectedAddress.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            View larger <ExternalLink className="w-3 h-3" />
                        </a>
                    </div> */}
                </div>
            )}

            {/* Interactive Map Picker Modal */}
            {showMapModal && (
                <InteractiveMapModal
                    initialLat={selectedAddress?.lat || initialLat || defaultCenter[0]}
                    initialLng={selectedAddress?.lng || initialLng || defaultCenter[1]}
                    onSelect={handleMapSelect}
                    onClose={() => setShowMapModal(false)}
                />
            )}
        </div>
    );
}

// Interactive Map Modal using Leaflet from CDN
function InteractiveMapModal({
    initialLat,
    initialLng,
    onSelect,
    onClose,
}: {
    initialLat: number;
    initialLng: number;
    onSelect: (lat: number, lng: number) => void;
    onClose: () => void;
}) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPos, setCurrentPos] = useState({ lat: initialLat, lng: initialLng });
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Load Leaflet from CDN
    useEffect(() => {
        const loadLeaflet = async () => {
            // Check if Leaflet is already loaded
            if ((window as any).L) {
                initMap((window as any).L);
                return;
            }

            // Load Leaflet CSS
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(cssLink);

            // Load Leaflet JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                initMap((window as any).L);
            };
            document.head.appendChild(script);
        };

        const initMap = (L: any) => {
            if (!mapContainerRef.current || mapRef.current) return;

            // Create map
            const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 15);
            mapRef.current = map;

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);

            // Create draggable marker
            const marker = L.marker([initialLat, initialLng], {
                draggable: true,
            }).addTo(map);
            markerRef.current = marker;

            // Handle marker drag
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                setCurrentPos({ lat: pos.lat, lng: pos.lng });
            });

            // Handle map click - move marker to clicked location
            map.on('click', (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                setCurrentPos({ lat, lng });
            });

            setIsLoading(false);
        };

        loadLeaflet();

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [initialLat, initialLng]);

    // Get current location
    const handleGetLocation = async () => {
        if (!navigator.geolocation) return;

        setIsGettingLocation(true);
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                });
            });

            const { latitude, longitude } = position.coords;
            setCurrentPos({ lat: latitude, lng: longitude });

            // Update map and marker
            if (mapRef.current && markerRef.current) {
                mapRef.current.setView([latitude, longitude], 16);
                markerRef.current.setLatLng([latitude, longitude]);
            }
        } catch {
            alert('Unable to get location. Please allow location access.');
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handleConfirm = () => {
        onSelect(currentPos.lat, currentPos.lng);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-4 md:inset-10 z-[60] flex items-center justify-center">
                <div
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full h-full max-w-4xl max-h-[600px] overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Map className="w-5 h-5" />
                                Pick Location on Map
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-white/80 text-sm mt-1">
                            Click on the map or drag the marker to set your location
                        </p>
                    </div>

                    {/* Map Container */}
                    <div className="flex-1 relative">
                        {isLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                                <div className="text-center">
                                    <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto" />
                                    <p className="text-gray-500 mt-2">Loading map...</p>
                                </div>
                            </div>
                        )}
                        <div ref={mapContainerRef} className="w-full h-full" />
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex-shrink-0">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            {/* Current coordinates */}
                            <div className="text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Selected: </span>
                                <span className="font-mono text-purple-600 dark:text-purple-400">
                                    {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
                                </span>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={isGettingLocation}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                    {isGettingLocation ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Crosshair className="w-4 h-4" />
                                    )}
                                    My Location
                                </button>

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
