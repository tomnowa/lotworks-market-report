'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CountryData {
  country: string;
  users: number;
  percentage: number;
}

// Approximate country centroids for major countries
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'United States': [39.8283, -98.5795],
  'Canada': [56.1304, -106.3468],
  'United Kingdom': [55.3781, -3.4360],
  'Germany': [51.1657, 10.4515],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Spain': [40.4637, -3.7492],
  'Netherlands': [52.1326, 5.2913],
  'Belgium': [50.5039, 4.4699],
  'Switzerland': [46.8182, 8.2275],
  'Austria': [47.5162, 14.5501],
  'Sweden': [60.1282, 18.6435],
  'Norway': [60.4720, 8.4689],
  'Denmark': [56.2639, 9.5018],
  'Finland': [61.9241, 25.7482],
  'Ireland': [53.4129, -8.2439],
  'Portugal': [39.3999, -8.2245],
  'Greece': [39.0742, 21.8243],
  'Poland': [51.9194, 19.1451],
  'Czech Republic': [49.8175, 15.4730],
  'Hungary': [47.1625, 19.5033],
  'Slovakia': [48.6690, 19.6990],
  'Slovenia': [46.1512, 14.9955],
  'Croatia': [45.1000, 15.2000],
  'Bosnia and Herzegovina': [43.9159, 17.6791],
  'Serbia': [44.0165, 21.0059],
  'Montenegro': [42.7087, 19.3744],
  'Kosovo': [42.6026, 20.9030],
  'North Macedonia': [41.6086, 21.7453],
  'Albania': [41.1533, 20.1683],
  'Bulgaria': [42.7339, 25.4858],
  'Romania': [45.9432, 24.9668],
  'Moldova': [47.4116, 28.3699],
  'Ukraine': [48.3794, 31.1656],
  'Belarus': [53.7098, 27.9534],
  'Lithuania': [55.1694, 23.8813],
  'Latvia': [56.8796, 24.6032],
  'Estonia': [58.5953, 25.0136],
  'Russia': [61.5240, 105.3188],
  'Australia': [-25.2744, 133.7751],
  'New Zealand': [-40.9006, 174.8860],
  'Japan': [36.2048, 138.2529],
  'South Korea': [35.9078, 127.7669],
  'China': [35.8617, 104.1954],
  'India': [20.5937, 78.9629],
  'Brazil': [-14.2350, -51.9253],
  'Mexico': [23.6345, -102.5528],
  'Argentina': [-38.4161, -63.6167],
  'Chile': [-35.6751, -71.5430],
  'Colombia': [4.5709, -74.2973],
  'Peru': [-9.1900, -75.0152],
  'Venezuela': [6.4238, -66.5897],
  'Ecuador': [-1.8312, -78.1834],
  'Bolivia': [-16.2902, -63.5887],
  'Paraguay': [-23.4425, -58.4438],
  'Uruguay': [-32.5228, -55.7658],
  'South Africa': [-30.5595, 22.9375],
  'Egypt': [26.0963, 29.9538],
  'Turkey': [38.9637, 35.2433],
  'Israel': [31.0461, 34.8516],
  'Saudi Arabia': [23.8859, 45.0792],
  'United Arab Emirates': [23.4241, 53.8478],
  'Thailand': [15.8700, 100.9925],
  'Singapore': [1.3521, 103.8198],
  'Malaysia': [4.2105, 101.9758],
  'Indonesia': [-0.7893, 113.9213],
  'Philippines': [12.8797, 121.7740],
  'Vietnam': [14.0583, 108.2772],
  'Pakistan': [30.3753, 69.3451],
  'Bangladesh': [23.6850, 90.3563],
  'Sri Lanka': [7.8731, 80.7718],
  'Nepal': [28.3949, 84.1240],
  'Bhutan': [27.5142, 90.4336],
  'Myanmar': [21.9162, 95.9560],
  'Cambodia': [12.5657, 104.9910],
  'Laos': [19.8563, 102.4955],
  'Mongolia': [46.8625, 103.8467],
  'Kazakhstan': [48.0196, 66.9237],
  'Uzbekistan': [41.3775, 64.5853],
  'Turkmenistan': [38.9697, 59.5563],
  'Kyrgyzstan': [41.2044, 74.7661],
  'Tajikistan': [38.8610, 71.2761],
  'Afghanistan': [33.9391, 67.7100],
  'Iran': [32.4279, 53.6880],
  'Iraq': [33.2232, 43.6793],
  'Jordan': [30.5852, 36.2384],
  'Lebanon': [33.8547, 35.8623],
  'Syria': [34.8021, 38.9968],
  'Palestine': [31.9522, 35.2332],
  'Yemen': [15.5527, 48.5164],
  'Oman': [21.4735, 55.9754],
  'Qatar': [25.3548, 51.1839],
  'Bahrain': [26.0667, 50.5577],
  'Kuwait': [29.3117, 47.4818],
  'Morocco': [31.7917, -5.2250],
  'Algeria': [28.0339, 1.6596],
  'Tunisia': [33.8869, 9.5375],
  'Libya': [26.3351, 17.2283],
  'Ethiopia': [9.1450, 38.7379],
  'Kenya': [-1.2864, 36.8172],
  'Tanzania': [-6.3690, 34.8888],
  'Uganda': [1.3733, 32.2903],
  'Rwanda': [-1.9403, 29.8739],
  'Burundi': [-3.3731, 29.9189],
  'Democratic Republic of the Congo': [-4.0383, 21.7587],
  'Republic of the Congo': [-0.2280, 15.8277],
  'Gabon': [-0.8037, 11.6094],
  'Cameroon': [7.3697, 12.3547],
  'Nigeria': [9.0820, 8.6753],
  'Ghana': [7.9465, -1.0232],
  'Ivory Coast': [7.5399, -5.5471],
  'Senegal': [14.4974, -14.4524],
  'Mali': [17.5707, -3.9962],
  'Niger': [17.6078, 8.0817],
  'Chad': [15.4542, 18.7322],
  'Sudan': [12.8628, 30.2176],
  'South Sudan': [6.8770, 31.3070],
  'Somalia': [5.1521, 46.1996],
  'Djibouti': [11.8251, 42.5903],
  'Eritrea': [15.1794, 39.7823],
  'Zimbabwe': [-19.0154, 29.1549],
  'Zambia': [-13.1339, 27.8493],
  'Malawi': [-13.2543, 34.3015],
  'Mozambique': [-18.6657, 35.5296],
  'Namibia': [-22.9576, 18.4904],
  'Botswana': [-22.3285, 24.6849],
  'Angola': [-11.2027, 17.8739],
  'Madagascar': [-18.7669, 46.8691],
  'Mauritius': [-20.3484, 57.5522],
  'Seychelles': [-4.6796, 55.4920],
  'Comoros': [-11.6455, 43.3333],
  'Mayotte': [-12.8275, 45.1662],
  'Réunion': [-21.1151, 55.5364],
  'Cuba': [21.5218, -77.7812],
  'Haiti': [18.9712, -72.2852],
  'Dominican Republic': [18.7357, -70.1627],
  'Jamaica': [18.1096, -77.2975],
  'Trinidad and Tobago': [10.6918, -61.2225],
  'Barbados': [13.1939, -59.5432],
  'Bahamas': [25.0343, -77.3963],
  'Belize': [17.1899, -88.4976],
  'Guatemala': [15.7835, -90.2308],
  'El Salvador': [13.7942, -88.8965],
  'Honduras': [15.2000, -86.2419],
  'Nicaragua': [12.8654, -85.2072],
  'Costa Rica': [9.7489, -83.7534],
  'Panama': [8.5380, -80.7821],
  'Other': [0, 0], // Default for unknown countries
};

interface CountryMapProps {
  data: CountryData[];
}

export default function CountryMap({ data }: CountryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map centered on the world
    const map = L.map(mapRef.current, {
      center: [20, 0], // Center of world
      zoom: 2,
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

    // Add markers for each country
    data.forEach((countryData) => {
      const coords = COUNTRY_COORDINATES[countryData.country];
      if (!coords || (coords[0] === 0 && coords[1] === 0)) return; // Skip countries without coordinates

      // Scale radius based on users (min 8, max 40)
      const radius = Math.max(8, Math.min(40, (countryData.users / maxUsers) * 40 + 8));

      const marker = L.circleMarker(coords, {
        radius: radius,
        fillColor: '#ef4444', // Red color for countries
        color: '#ef4444',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6,
      });

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${countryData.country}</div>
          <div style="margin-top: 8px; font-size: 13px;">
            <span style="font-weight: 600; color: #ef4444;">${countryData.users.toLocaleString()}</span> users
            <span style="color: #94a3b8;">(${countryData.percentage}%)</span>
          </div>
        </div>
      `);

      marker.addTo(map);
    });

    // Fit bounds to show all markers if there are any valid coordinates
    const validCountries = data.filter(c => {
      const coords = COUNTRY_COORDINATES[c.country];
      return coords && (coords[0] !== 0 || coords[1] !== 0);
    });
    if (validCountries.length > 0) {
      const bounds = L.latLngBounds(validCountries.map(c => COUNTRY_COORDINATES[c.country]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 3 });
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