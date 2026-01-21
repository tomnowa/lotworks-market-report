'use client';

import { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

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
  // Create color scale based on user percentages
  const colorScale = useMemo(() => {
    const percentages = data.map(d => d.percentage);
    const minPercent = Math.min(...percentages);
    const maxPercent = Math.max(...percentages);

    return scaleLinear<string>()
      .domain([minPercent, maxPercent])
      .range(['#f1f5f9', '#1e40af']); // Light blue to dark blue
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

  const handleMouseMove = (event: React.MouseEvent, geo: any) => {
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
      tooltip.style.left = `${event.pageX + 10}px`;
      tooltip.style.top = `${event.pageY - 10}px`;
    }
  };

  return (
    <div className="w-full h-full relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 20],
        }}
        width={800}
        height={400}
        style={{ width: '100%', height: '100%' }}
      >
        <Sphere id="sphere" stroke="#e2e8f0" strokeWidth={0.5} fill="#f8fafc" />
        <Graticule stroke="#e2e8f0" strokeWidth={0.5} />
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
                  onMouseEnter={(event) => {
                    const tooltip = getTooltipContent(geo);
                    // Create a simple tooltip
                    const tooltipEl = document.createElement('div');
                    tooltipEl.innerHTML = tooltip;
                    tooltipEl.style.position = 'fixed';
                    tooltipEl.style.background = 'rgba(15, 23, 42, 0.95)';
                    tooltipEl.style.color = 'white';
                    tooltipEl.style.padding = '8px 12px';
                    tooltipEl.style.borderRadius = '6px';
                    tooltipEl.style.fontSize = '12px';
                    tooltipEl.style.pointerEvents = 'none';
                    tooltipEl.style.zIndex = '1000';
                    tooltipEl.style.left = `${event.pageX + 10}px`;
                    tooltipEl.style.top = `${event.pageY - 10}px`;
                    tooltipEl.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    tooltipEl.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                    tooltipEl.id = 'map-tooltip';
                    document.body.appendChild(tooltipEl);
                  }}
                  onMouseMove={(event) => handleMouseMove(event, geo)}
                  onMouseLeave={() => {
                    const tooltip = document.getElementById('map-tooltip');
                    if (tooltip) {
                      document.body.removeChild(tooltip);
                    }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center gap-3 text-xs text-slate-700">
          <span className="font-medium">Less visitors</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#f1f5f9' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#cbd5e1' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#94a3b8' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#64748b' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#475569' }}></div>
            <div className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: '#1e40af' }}></div>
          </div>
          <span className="font-medium">More visitors</span>
        </div>
      </div>
    </div>
  );
}