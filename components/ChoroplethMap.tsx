'use client';

import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from 'react-simple-maps';
import { scaleLinear, scaleLog } from 'd3-scale';

// World map topology data (simplified for performance)
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  country: string;
  users: number;
  percentage: number;
}

// Country name mapping to match GeoJSON properties
const COUNTRY_NAME_MAPPING: Record<string, string> = {
  'United States': 'United States of America',
  'United Kingdom': 'United Kingdom',
  'South Korea': 'Korea',
  'North Korea': 'Dem. Rep. Korea',
  'Russia': 'Russia',
  'Czech Republic': 'Czechia',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'North Macedonia': 'Macedonia',
  'Ivory Coast': "Côte d'Ivoire",
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Republic of the Congo': 'Congo',
  'Central African Republic': 'Central African Rep.',
  'South Sudan': 'S. Sudan',
  'Equatorial Guinea': 'Eq. Guinea',
  'Western Sahara': 'W. Sahara',
  'Solomon Islands': 'Solomon Is.',
  'French Southern and Antarctic Lands': 'Fr. S. Antarctic Lands',
  'Somaliland': 'Somalia', // Approximate
  'Kosovo': 'Kosovo',
  'Northern Cyprus': 'Cyprus', // Approximate
};

interface ChoroplethMapProps {
  data: CountryData[];
}

export default function ChoroplethMap({ data }: ChoroplethMapProps) {
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
    visible: boolean;
  } | null>(null);

  // Create color scale based on user percentages using log scale for better gradation
  const colorScale = useMemo(() => {
    const percentages = data.map(d => d.percentage);
    const minPercent = Math.min(...percentages);
    const maxPercent = Math.max(...percentages);

    // Use logarithmic scale for better differentiation of smaller values
    // Add small epsilon to avoid log(0)
    const minValue = Math.max(minPercent, 0.01);
    const maxValue = Math.max(maxPercent, minValue + 0.01);

    return scaleLog<string>()
      .domain([minValue, maxValue])
      .range(['#e2e8f0', '#1e40af']) // Light blue to dark blue
      .clamp(true); // Clamp values to range
  }, [data]);

  // Create a lookup map for quick country data access
  const countryDataMap = useMemo(() => {
    const map: Record<string, CountryData> = {};
    data.forEach(country => {
      const mappedName = COUNTRY_NAME_MAPPING[country.country] || country.country;
      map[mappedName] = country;
      // Also store with original name as fallback
      map[country.country] = country;
    });
    return map;
  }, [data]);

  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    const countryData = countryDataMap[countryName];

    if (countryData) {
      return colorScale(countryData.percentage);
    }

    // Default color for countries without data
    return '#f8fafc';
  };

  const getTooltipContent = (geo: any) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    const countryData = countryDataMap[countryName];

    if (countryData) {
      return `${countryData.country}: ${countryData.users.toLocaleString()} users (${countryData.percentage}%)`;
    }

    return `${countryName}: No data`;
  };

  const handleMouseEnter = (event: React.MouseEvent, geo: any) => {
    const content = getTooltipContent(geo);
    setTooltip({
      content,
      x: event.pageX + 10,
      y: event.pageY - 10,
      visible: true,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltip) {
      setTooltip(prev => prev ? {
        ...prev,
        x: event.pageX + 10,
        y: event.pageY - 10,
      } : null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 120,
            center: [0, 20],
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Sphere id="sphere" stroke="#e2e8f0" strokeWidth={0.5} fill="#f8fafc" />
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryName = geo.properties.NAME || geo.properties.name;
                const countryData = countryDataMap[countryName];

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(geo)}
                    stroke="#334155"
                    strokeWidth={0.3}
                    style={{
                      default: {
                        outline: 'none',
                      },
                      hover: {
                        outline: 'none',
                        fill: countryData ? '#1e40af' : '#e2e8f0',
                        stroke: '#1e293b',
                        strokeWidth: 0.8,
                        cursor: 'pointer',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(event) => handleMouseEnter(event, geo)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Legend below the map */}
      <div className="mt-4 bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center gap-3 text-xs text-slate-700">
          <span className="font-medium">Less visitors</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#e2e8f0' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#bfdbfe' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#93c5fd' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#60a5fa' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#3b82f6' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#1e40af' }}></div>
          </div>
          <span className="font-medium">More visitors</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 text-sm"
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}