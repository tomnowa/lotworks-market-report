'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityData {
  city: string;
  country: string;
  lat: number;
  lng: number;
  users: number;
  percentage: number;
}

interface CityMapProps {
  data: CityData[];
}

export default function CityMap({ data }: CityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map centered on North America
    const map = L.map(mapRef.current, {
      center: [39.8283, -98.5795], // Center of USA
      zoom: 3,
      scrollWheelZoom: true,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles with a light/gray style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker) {
        map.removeLayer(layer);
      }
    });

    // Calculate max users for scaling
    const maxUsers = Math.max(...data.map(d => d.users), 1);

    // Add markers for each city
    data.forEach((city) => {
      if (city.lat === 0 && city.lng === 0) return; // Skip cities without coordinates

      // Scale radius based on users (min 5, max 25)
      const radius = Math.max(5, Math.min(25, (city.users / maxUsers) * 25 + 5));

      const marker = L.circleMarker([city.lat, city.lng], {
        radius: radius,
        fillColor: '#3b82f6',
        color: '#3b82f6',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
      });

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${city.city}</div>
          <div style="color: #64748b; font-size: 12px;">${city.country}</div>
          <div style="margin-top: 8px; font-size: 13px;">
            <span style="font-weight: 600; color: #3b82f6;">${city.users.toLocaleString()}</span> users
            <span style="color: #94a3b8;">(${city.percentage}%)</span>
          </div>
        </div>
      `);

      marker.addTo(map);
    });

    // Fit bounds to show all markers if there are any valid coordinates
    const validCities = data.filter(c => c.lat !== 0 || c.lng !== 0);
    if (validCities.length > 0) {
      const bounds = L.latLngBounds(validCities.map(c => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
    }
  }, [data]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
}
