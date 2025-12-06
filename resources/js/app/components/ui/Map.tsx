import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
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
}

interface MapProps {
    markers?: MapMarker[];
    center?: [number, number];
    zoom?: number;
    className?: string;
    onMarkerDragEnd?: (lat: number, lng: number) => void;
    onMapClick?: (lat: number, lng: number) => void;
    readOnly?: boolean;
}

export default function Map({
    markers = [],
    center = [11.5564, 104.9282], // Default to Phnom Penh
    zoom = 13,
    className,
    onMarkerDragEnd,
    onMapClick,
    readOnly = false
}: MapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [L, setL] = useState<any>(null);

    // Load Leaflet
    useEffect(() => {
        import('leaflet').then((leaflet) => {
            setL(leaflet.default);
        });
    }, []);

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

    // Update Markers
    useEffect(() => {
        if (!L || !mapInstanceRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        markers.forEach(markerProps => {
            const marker = L.marker([markerProps.lat, markerProps.lng], {
                draggable: !!markerProps.isDraggable && !readOnly,
                title: markerProps.title || ''
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

            markersRef.current.push(marker);
        });

        // Fit bounds if multiple markers
        if (markers.length > 1) {
            const group = new L.featureGroup(markersRef.current);
            mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        } else if (markers.length === 1) {
            // If just one marker, center on it but don't force zoom change unless initial load or drastic change
            mapInstanceRef.current.panTo([markers[0].lat, markers[0].lng]);
        }

    }, [L, markers, readOnly, onMarkerDragEnd]);

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
