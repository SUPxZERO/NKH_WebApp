import React, { useEffect, useRef, useState, useCallback } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { cn } from '@/app/utils/cn';

// Extend window to access L
declare global {
    interface Window {
        L: any;
    }
}

interface MapMarker {
    id?: number | string;
    lat: number;
    lng: number;
    title?: string;
    isDraggable?: boolean;
    color?: string; // Color for marker icon
    icon?: string; // Custom icon HTML
}

interface RoutePolyline {
    from: [number, number];
    to: [number, number];
    color?: string;
    weight?: number;
}

interface MapProps {
    markers?: MapMarker[];
    center?: [number, number];
    zoom?: number;
    className?: string;
    onMarkerDragEnd?: (lat: number, lng: number) => void;
    onMapClick?: (lat: number, lng: number) => void;
    onMarkerClick?: (marker: MapMarker) => void;
    readOnly?: boolean;
    clusterMarkers?: boolean; // Enable marker clustering
    showUserLocation?: boolean; // Show user's current location
    userLocation?: [number, number]; // User's coordinates
    routes?: RoutePolyline[]; // Routes between markers
    markerColorMap?: Record<string, string>; // status -> color mapping
}

export default function Map({
    markers = [],
    center = [11.5564, 104.9282], // Default to Phnom Penh
    zoom = 13,
    className,
    onMarkerDragEnd,
    onMapClick,
    onMarkerClick,
    readOnly = false,
    clusterMarkers = false,
    showUserLocation = false,
    userLocation,
    routes = [],
    markerColorMap,
}: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const markerClusterGroupRef = useRef<any>(null);
    const userMarkerRef = useRef<any>(null);
    const routeLinesRef = useRef<any[]>([]);
    const [L, setL] = useState<any>(null);

    // Load Leaflet and MarkerCluster
    useEffect(() => {
        Promise.all([
            import('leaflet'),
            clusterMarkers ? import('leaflet.markercluster') : Promise.resolve(null)
        ]).then(([leaflet]) => {
            setL(leaflet.default);
        });
    }, [clusterMarkers]);

    // Initialize Map
    useEffect(() => {
        if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

        // Fix icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        const map = L.map(mapContainerRef.current).setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // Map Click Event
        map.on('click', (e: any) => {
            if (!readOnly && onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        });

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [L]);

    // Create custom colored marker icon
    const createColoredIcon = useCallback((color: string = '#3B82F6') => {
        if (!L) return null;

        const svgIcon = `
            <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.5 0C5.596 0 0 5.596 0 12.5c0 8.437 12.5 28.5 12.5 28.5S25 20.937 25 12.5C25 5.596 19.404 0 12.5 0z" 
                      fill="${color}" stroke="#FFF" stroke-width="2"/>
                <circle cx="12.5" cy="12.5" r="4" fill="#FFF"/>
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            className: 'custom-marker-icon',
            iconSize: [25, 41],
            iconAnchor: [12.5, 41],
            popupAnchor: [0, -41],
        });
    }, [L]);

    // Create user location icon
    const createUserLocationIcon = useCallback(() => {
        if (!L) return null;

        const svgIcon = `
            <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="#FFF" stroke-width="3" opacity="0.8"/>
                <circle cx="10" cy="10" r="3" fill="#FFF"/>
            </svg>
        `;

        return L.divIcon({
            html: svgIcon,
            className: 'user-location-marker',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        });
    }, [L]);

    // Update User Location Marker
    useEffect(() => {
        if (!L || !mapInstanceRef.current) return;

        // Remove old user marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
            userMarkerRef.current = null;
        }

        // Add new user marker if location available
        if (showUserLocation && userLocation) {
            const userIcon = createUserLocationIcon();
            const marker = L.marker([userLocation[0], userLocation[1]], {
                icon: userIcon,
                zIndexOffset: 1000, // Always on top
            }).addTo(mapInstanceRef.current);

            marker.bindPopup('Your Location');
            userMarkerRef.current = marker;
        }
    }, [L, showUserLocation, userLocation, createUserLocationIcon]);

    // Update Routes/Polylines
    useEffect(() => {
        if (!L || !mapInstanceRef.current) return;

        // Clear existing routes
        routeLinesRef.current.forEach(line => line.remove());
        routeLinesRef.current = [];

        // Add new routes
        routes.forEach(route => {
            const polyline = L.polyline(
                [route.from, route.to],
                {
                    color: route.color || '#3B82F6',
                    weight: route.weight || 3,
                    opacity: 0.7,
                    dashArray: '10, 10',
                }
            ).addTo(mapInstanceRef.current);

            routeLinesRef.current.push(polyline);
        });
    }, [L, routes]);

    // Update Markers
    useEffect(() => {
        if (!L || !mapInstanceRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach(markerProps => {
            const markerColor = markerProps.color ||
                (markerColorMap && markerProps.id ? markerColorMap[markerProps.id as string] : '#3B82F6');

            const icon = markerProps.icon ?
                L.divIcon({ html: markerProps.icon, className: 'custom-marker' }) :
                createColoredIcon(markerColor);

            const marker = L.marker([markerProps.lat, markerProps.lng], {
                draggable: !!markerProps.isDraggable && !readOnly,
                title: markerProps.title || '',
                icon: icon,
            }).addTo(mapInstanceRef.current);

            if (markerProps.title) {
                marker.bindPopup(markerProps.title);
            }

            if (markerProps.isDraggable && !readOnly && onMarkerDragEnd) {
                marker.on('dragend', (e: any) => {
                    const latLng = e.target.getLatLng();
                    onMarkerDragEnd(latLng.lat, latLng.lng);
                });
            }

            if (onMarkerClick) {
                marker.on('click', () => {
                    onMarkerClick(markerProps);
                });
            }

            markersRef.current.push(marker);
        });

        // Fit bounds if multiple markers
        if (markers.length > 1) {
            const group = new L.featureGroup(markersRef.current);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } else if (markers.length === 1) {
            // If just one marker, center on it but don't force zoom change
            mapInstanceRef.current.panTo([markers[0].lat, markers[0].lng]);
        }

    }, [L, markers, readOnly, onMarkerDragEnd, onMarkerClick, createColoredIcon, markerColorMap]);

    // Update Center/Zoom
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        // Only flyTo if center changed significantly to avoid jitter during drag
        const currentCenter = mapInstanceRef.current.getCenter();
        if (Math.abs(currentCenter.lat - center[0]) > 0.0001 || Math.abs(currentCenter.lng - center[1]) > 0.0001) {
            mapInstanceRef.current.setView(center, zoom);
        }
    }, [center, zoom]);

    return (
        <div
            ref={mapContainerRef}
            className={cn("w-full h-full min-h-[300px] rounded-xl z-0", className)}
        />
    );
}
