'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
// MDI Icons imported from @mdi/js above
import Icon from '@mdi/react';
import {
  mdiRobotExcitedOutline,
  mdiEye,
  mdiCursorPointer,
  mdiTarget,
  mdiCalendar,
  mdiChevronDown,
  mdiDownload,
  mdiRefresh,
  mdiOfficeBuilding,
  mdiAlertCircle,
  mdiClock,
  mdiMonitor,
  mdiCellphone,
  mdiTablet,
  mdiTrendingUp,
  mdiTrendingDown,
  mdiChevronLeft,
  mdiChevronRight,
  mdiChevronDoubleLeft,
  mdiChevronDoubleRight,
  mdiArrowUpDown,
  mdiFire,
  mdiLightbulb,
  mdiAlert,
  mdiChartBar,
  mdiFileAlert,
  mdiInformation,
  mdiViewDashboard,
  mdiMap,
  mdiChartPie,
  mdiMenu,
  mdiClose,
  mdiFilter,
} from '@mdi/js';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { MarketReport, CommunityPerformance, TopLot } from '@/types';
import dynamic from 'next/dynamic';

// Dynamic import for maps to avoid SSR issues with Leaflet
const CityMap = dynamic(() => import('@/components/CityMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="text-slate-400 text-sm">Loading map...</div>
    </div>
  )
});

const ChoroplethMap = dynamic(() => import('@/components/ChoroplethMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
      <div className="text-slate-400 text-sm">Loading map...</div>
    </div>
  )
});

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CLIENT = 'Pacesetter Homes';
const ITEMS_PER_PAGE = 10;

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', 
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

const DEVICE_COLORS: Record<string, string> = {
  Mobile: '#3b82f6',
  Desktop: '#ef4444',
  Tablet: '#f59e0b',
};

type TabId = 'overview' | 'details' | 'analytics';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: mdiViewDashboard, description: 'Executive Summary' },
  { id: 'details', label: 'Map Details', icon: mdiMap, description: 'Communities & Lots' },
  { id: 'analytics', label: 'Analytics', icon: mdiChartPie, description: 'Traffic & Demographics' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString();
}

function getHeatmapColor(value: number, max: number, colorType: 'green' | 'yellow' | 'blue' | 'purple' = 'green'): string {
  if (max === 0 || value === 0) return 'transparent';
  const intensity = Math.min(value / max, 1);
  
  const colors = {
    green: { r: 16, g: 185, b: 129 },
    yellow: { r: 245, g: 158, b: 11 },
    blue: { r: 59, g: 130, b: 246 },
    purple: { r: 139, g: 92, b: 246 },
  };
  
  const c = colors[colorType];
  const alpha = 0.15 + (intensity * 0.5);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function exportReportToCSV(report: MarketReport) {
  const sections: string[] = [];
  const orgName = report?.organization?.name || 'Unknown';
  const dateStart = report?.dateRange?.start || '';
  const dateEnd = report?.dateRange?.end || '';
  
  sections.push(`Website Market Report - ${orgName}`);
  sections.push(`Date Range: ${dateStart} to ${dateEnd}`);
  sections.push(`Generated: ${new Date().toLocaleString()}`);
  sections.push('');
  
  sections.push('SUMMARY');
  sections.push('Metric,Value');
  sections.push(`Map Loads,${report?.summary?.totalMapLoads ?? 0}`);
  sections.push(`Lot Clicks,${report?.summary?.totalLotClicks ?? 0}`);
  sections.push(`Click Rate,${report?.summary?.clickThroughRate ?? 0}%`);
  sections.push(`Avg Time on Map,${report?.summary?.avgTimeOnMap || 'N/A'}`);
  sections.push(`Top Community,${report?.summary?.topCommunity || 'N/A'}`);
  sections.push('');
  
  sections.push('COMMUNITY PERFORMANCE');
  sections.push('Community,Map Loads,Lot Clicks,Click Rate %');
  (report?.communityPerformance || []).forEach(c => {
    sections.push(`"${c.name}",${c.mapLoads},${c.lotClicks},${c.ctr}`);
  });
  sections.push('');
  
  sections.push('TOP CLICKED LOTS');
  sections.push('Rank,Lot,Community,Clicks,Share %');
  (report?.topLots || []).forEach(l => {
    sections.push(`${l.rank},"${l.lot}","${l.community}",${l.clicks},${l.share}`);
  });
  sections.push('');
  
  sections.push('CLICKS BY DAY OF WEEK');
  sections.push('Day,Clicks');
  (report?.clicksByDayOfWeek || []).forEach(d => {
    sections.push(`${d.day},${d.clicks}`);
  });
  sections.push('');
  
  sections.push('DEVICE BREAKDOWN');
  sections.push('Device,Users,Percentage');
  (report?.deviceBreakdown || []).forEach(d => {
    sections.push(`${d.device},${d.users},${d.percentage}%`);
  });
  sections.push('');
  
  sections.push('TOP COUNTRIES');
  sections.push('Country,Users,Percentage');
  (report?.countryBreakdown || []).forEach(c => {
    sections.push(`"${c.country}",${c.users},${c.percentage}%`);
  });
  sections.push('');
  
  sections.push('TRAFFIC SOURCES');
  sections.push('Source,Medium,Sessions,Percentage');
  (report?.trafficSources || []).forEach(t => {
    sections.push(`"${t.source}","${t.medium}",${t.sessions},${t.percentage}%`);
  });
  
  const csv = sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename = `${orgName.replace(/\s+/g, '_')}_Report_${formatDateToISO(new Date())}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// SHARED UI COMPONENTS
// ============================================================================

function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
      <Icon path={mdiFileAlert} size={2.5} color="#64748b" style={{ opacity: 0.5 }} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ChartTooltipWithPercent({ active, payload, label, showPercent = false }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number; payload?: Record<string, unknown> }>; label?: string; showPercent?: boolean }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 max-w-xs">
      <p className="font-semibold text-sm mb-2 text-slate-200">{label}</p>
      {payload.map((entry, i) => {
        const percentage = entry.payload?.percentage as number | undefined;
        return (
          <div key={i} className="flex items-center gap-2 text-sm py-0.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 truncate">{entry.name}:</span>
            <span className="font-bold ml-auto">
              {entry.value?.toLocaleString()}
              {showPercent && typeof percentage === 'number' ? (
                <span className="text-slate-400 ml-1">({percentage}%)</span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  title,
  value,
  change,
  icon: iconPath,
  accent = false,
  tooltip,
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  accent?: boolean;
  tooltip?: string;
}) {
  const hasChange = change !== undefined && !isNaN(change);
  const isPositive = hasChange && change >= 0;
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 relative group ${
        accent
          ? 'text-white shadow-lg border'
          : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
      }`}
      style={accent ? { backgroundColor: '#192a54', borderColor: '#192a54' } : {}}
    >
      {tooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accent ? 'bg-lime-400/20' : 'bg-emerald-50'}`}>
          <Icon path={iconPath} size={1} color={accent ? '#DBDB34' : '#4B5FD7'} />
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {isPositive ? <Icon path={mdiTrendingUp} size={0.75} /> : <Icon path={mdiTrendingDown} size={0.75} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div className={`text-3xl font-bold mb-1 tracking-tight ${accent ? 'text-white' : 'text-slate-800'}`}>
        {displayValue}
      </div>
      <div className={`text-sm font-medium ${accent ? 'text-slate-400' : 'text-slate-500'}`}>{title}</div>
    </div>
  );
}

function InsightCard({ type, title, description }: { type: string; title: string; description: string }) {
  const configs: Record<string, { icon: string; bg: string; border: string; iconBg: string }> = {
    trending: { icon: mdiTrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600' },
    hot: { icon: mdiFire, bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100 text-orange-600' },
    opportunity: { icon: mdiLightbulb, bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100 text-blue-600' },
    warning: { icon: mdiAlert, bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100 text-amber-600' },
  };
  
  const config = configs[type] || configs.trending;

  return (
    <div className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${config.bg} ${config.border}`}>
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg h-fit flex-shrink-0 ${config.iconBg}`}>
          <Icon path={config.icon} size={1} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 mb-1 leading-tight">{title}</div>
          <div className="text-sm text-slate-600 leading-relaxed">{description}</div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ChartCard({ 
  title, 
  subtitle, 
  children, 
  isEmpty = false,
  className = "",
  height = "h-64",
  action
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  isEmpty?: boolean;
  className?: string;
  height?: string;
  action?: React.ReactNode;
}) {
  // Convert Tailwind height class to inline style if it's an arbitrary value
  const heightStyle = height.startsWith('h-[') 
    ? { height: height.match(/\[(.*?)\]/)?.[1] || '400px', minHeight: height.match(/\[(.*?)\]/)?.[1] || '400px' }
    : {};
  
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} action={action} />
      <div className={height.startsWith('h-[') ? '' : height} style={Object.keys(heightStyle).length > 0 ? heightStyle : undefined}>
        {isEmpty ? <EmptyState /> : children}
      </div>
    </div>
  );
}

// ============================================================================
// DATE RANGE PICKER
// ============================================================================

function DateRangePicker({ 
  startDate, 
  endDate, 
  onChange, 
  disabled 
}: { 
  startDate: Date; 
  endDate: Date; 
  onChange: (start: Date, end: Date) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 60 days', days: 60 },
    { label: 'Last 90 days', days: 90 },
    { label: 'This Month', days: -1 },
    { label: 'Last Month', days: -2 },
  ];
  
  const handlePreset = (days: number) => {
    const now = new Date();
    let start: Date, end: Date;
    
    if (days === -1) {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    } else if (days === -2) {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      end = now;
      start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }
    
    onChange(start, end);
    setIsOpen(false);
  };
  
  const handleApply = () => {
    if (tempStart > tempEnd) {
      onChange(tempEnd, tempStart);
    } else {
      onChange(tempStart, tempEnd);
    }
    setIsOpen(false);
  };

  const handleOpen = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(true);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && handleOpen()}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        <Icon path={mdiCalendar} size={1} color="#94a3b8" />
        <span className="font-medium">
          {formatDateForDisplay(startDate)} – {formatDateForDisplay(endDate)}
        </span>
        <Icon path={mdiChevronDown} size={1} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Select</div>
              <div className="grid grid-cols-2 gap-1">
                {presets.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handlePreset(preset.days)}
                    className="text-left px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Start Date</label>
                <input
                  type="date"
                  value={formatDateToISO(tempStart)}
                  onChange={(e) => setTempStart(new Date(e.target.value + 'T00:00:00'))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">End Date</label>
                <input
                  type="date"
                  value={formatDateToISO(tempEnd)}
                  onChange={(e) => setTempEnd(new Date(e.target.value + 'T00:00:00'))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              {tempStart > tempEnd && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <Icon path={mdiInformation} size={0.875} />
                  Dates will be swapped automatically
                </div>
              )}
              <button
                onClick={handleApply}
                className="w-full py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Apply Date Range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// CLIENT SELECTOR
// ============================================================================

function ClientSelector({ 
  clients, 
  selected, 
  onChange,
  disabled 
}: { 
  clients: string[]; 
  selected: string; 
  onChange: (client: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const filtered = clients.filter(c => 
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon path={mdiOfficeBuilding} size={1} color="#059669" />
        <span className="text-sm flex-1 text-left font-medium text-slate-700 truncate">{selected}</span>
        <Icon path={mdiChevronDown} size={1} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-slate-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-sm text-slate-400 text-center">
                  No clients found
                </div>
              ) : (
                filtered.map(client => (
                  <button
                    key={client}
                    onClick={() => { onChange(client); handleClose(); }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-all ${
                      client === selected 
                        ? 'bg-emerald-50 text-emerald-700 font-semibold' 
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {client}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// COMMUNITY FILTER
// ============================================================================

function CommunityFilter({
  communities,
  selected,
  onChange,
}: {
  communities: string[];
  selected: string[];
  onChange: (communities: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleCommunity = (community: string) => {
    if (selected.includes(community)) {
      onChange(selected.filter(c => c !== community));
    } else {
      onChange([...selected, community]);
    }
  };

  const clearAll = () => onChange([]);
  const selectAll = () => onChange([...communities]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          selected.length > 0
            ? 'border'
            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
        }`}
        style={selected.length > 0 ? {
          backgroundColor: '#4B5FD715',
          color: '#4B5FD7',
          borderColor: '#4B5FD720'
        } : {}}
      >
        <Icon path={mdiFilter} size={0.875} />
        {selected.length === 0 ? 'Filter' : `${selected.length} selected`}
        <Icon path={mdiChevronDown} size={0.875} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-2 border-b border-slate-100 flex gap-2">
              <button
                onClick={selectAll}
                className="flex-1 text-xs py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="flex-1 text-xs py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {communities.map(community => (
                <label
                  key={community}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(community)}
                    onChange={() => toggleCommunity(community)}
                    className="w-4 h-4 rounded border-slate-300 focus:ring-blue-500"
                    style={{
                      accentColor: '#4B5FD7'
                    }}
                  />
                  <span className="text-sm text-slate-700 truncate">{community}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// DATA TABLE
// ============================================================================

function DataTable<T extends object>({ 
  data, 
  columns, 
  title,
  subtitle,
  itemsPerPage = ITEMS_PER_PAGE,
  filterComponent,
}: { 
  data: T[]; 
  columns: { 
    key: string; 
    label: string; 
    render?: (item: T, index: number) => React.ReactNode; 
    sortable?: boolean; 
    align?: 'left' | 'right' | 'center';
    width?: string;
  }[];
  title: string;
  subtitle?: string;
  itemsPerPage?: number;
  filterComponent?: React.ReactNode;
}) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    setPage(0);
  }, [data.length]);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [data, sortKey, sortDir]);
  
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const pageData = sortedData.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(0);
  };
  
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">{title}</h3>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
            </div>
            {filterComponent}
          </div>
        </div>
        <EmptyState message="No data to display" />
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {filterComponent}
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {data.length} total
            </span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/30">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.sortable ? 'cursor-pointer hover:bg-slate-100 select-none transition-colors' : ''} text-slate-500`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                    {col.label}
                    {col.sortable && (
                      <Icon path={mdiArrowUpDown} size={0.75} color={sortKey === col.key ? '#059669' : '#cbd5e1'} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {pageData.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={`px-4 py-3.5 text-sm ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(item, page * itemsPerPage + index) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {page * itemsPerPage + 1}–{Math.min((page + 1) * itemsPerPage, data.length)} of {data.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon path={mdiChevronDoubleLeft} size={1} />
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon path={mdiChevronLeft} size={1} />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-200">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon path={mdiChevronRight} size={1} />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon path={mdiChevronDoubleRight} size={1} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TAB CONTENT: OVERVIEW
// ============================================================================

function OverviewContent({ report }: { report: MarketReport }) {
  const insights = report.insights || [];
  const viewsData = report.viewsOverTime || [];
  const communityPerf = report.communityPerformance || [];
  const devices = report.deviceBreakdown || [];
  const orgName = report.organization?.name || '';
  
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  
  // Map Load Trend Legend Logic:
  // - topCommunities: Top 8 communities by map loads (displayed in legend)
  // - selectedCommunities: Top 5 enabled by default on chart load
  // - Users can click legend buttons to toggle visibility
  const topCommunities = useMemo(() => 
    [...communityPerf]
      .sort((a, b) => b.mapLoads - a.mapLoads)
      .slice(0, 8)
      .map(c => c.name),
    [communityPerf]
  );
  
  // Reset and initialize selected communities when organization changes
  useEffect(() => {
    if (topCommunities.length > 0) {
      setSelectedCommunities(topCommunities.slice(0, Math.min(5, topCommunities.length)));
    } else {
      setSelectedCommunities([]);
    }
  }, [orgName]); // Only reset when organization changes
  
  // Also initialize if topCommunities loads after initial render
  useEffect(() => {
    if (topCommunities.length > 0 && selectedCommunities.length === 0) {
      setSelectedCommunities(topCommunities.slice(0, Math.min(5, topCommunities.length)));
    }
  }, [topCommunities, selectedCommunities.length]);
  
  const visibleCommunities = selectedCommunities.length > 0 
    ? selectedCommunities.filter(c => topCommunities.includes(c)) 
    : topCommunities.slice(0, 5);

  const handleLegendClick = (community: string) => {
    setSelectedCommunities(prev => {
      if (prev.includes(community)) {
        // Don't allow deselecting all - keep at least one
        const newSelection = prev.filter(c => c !== community);
        return newSelection.length > 0 ? newSelection : prev;
      } else {
        return [...prev, community];
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Map Loads"
          value={report.summary?.totalMapLoads ?? 0}
          change={report.summary?.mapLoadsChange}
          icon={mdiEye}
          accent
          tooltip="Number of times your maps were loaded"
        />
        <StatCard
          title="Lot Clicks"
          value={report.summary?.totalLotClicks ?? 0}
          change={report.summary?.lotClicksChange}
          icon={mdiCursorPointer}
          tooltip="Number of times visitors clicked on your lots"
        />
        <StatCard
          title="Avg. Time on Map"
          value={report.summary?.avgTimeOnMap || '—'}
          change={report.summary?.avgTimeChange}
          icon={mdiClock}
          tooltip="Average time spent on your maps"
        />
        <StatCard
          title="Click Rate"
          value={`${(report.summary?.clickThroughRate ?? 0).toFixed(1)}%`}
          change={report.summary?.clickRateChange}
          icon={mdiTarget}
          tooltip="Percentage of visitors who clicked on your lots"
        />
      </div>

      {/* LotWorks AI Insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#4B5FD720' }}>
              <Icon
                path={mdiRobotExcitedOutline}
                size={1}
                color="#4B5FD7"
              />
            </div>
            <h2 className="text-lg font-bold text-slate-800">LotWorks AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Map Load Trend - No Total line, clickable legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Map Load Trend</h2>
            <p className="text-sm text-slate-500">Click community names to show/hide</p>
          </div>
        </div>
        
        {/* Custom Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {topCommunities.map((community, i) => {
            const isActive = visibleCommunities.includes(community);
            return (
              <button
                key={community}
                onClick={() => handleLegendClick(community)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                  isActive
                    ? 'bg-white border-2 shadow-sm'
                    : 'bg-slate-100 border-2 border-transparent opacity-50'
                }`}
                style={{ borderColor: isActive ? CHART_COLORS[i % CHART_COLORS.length] : 'transparent' }}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className={isActive ? 'text-slate-800' : 'text-slate-500'}>{community}</span>
              </button>
            );
          })}
        </div>
        
        <div className="h-80">
          {viewsData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipWithPercent />} />
                {topCommunities.map((community, i) => {
                  const key = community.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
                  const isVisible = visibleCommunities.includes(community);
                  return (
                    <Line 
                      key={community}
                      type="monotone" 
                      dataKey={key}
                      name={community}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                      strokeWidth={isVisible ? 2 : 0}
                      dot={false}
                      strokeOpacity={isVisible ? 1 : 0}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{communityPerf.length}</div>
          <div className="text-sm text-slate-500 mt-1">Active Communities</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{report.summary?.totalLotsWithClicks || 0}</div>
          <div className="text-sm text-slate-500 mt-1">Lots with Clicks</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-xl font-bold text-emerald-700 truncate" title={report.summary?.topCommunity}>
            {report.summary?.topCommunity || 'N/A'}
          </div>
          <div className="text-sm text-emerald-600 mt-1">Top Community</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <div className="text-3xl font-bold text-blue-700">
            {devices.find(d => d.device === 'Mobile')?.percentage ?? 0}%
          </div>
          <div className="text-sm text-blue-600 mt-1">Mobile Users</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB CONTENT: MAP DETAILS
// ============================================================================

function MapDetailsContent({ 
  report,
  client,
  startDate,
  endDate,
}: { 
  report: MarketReport;
  client: string;
  startDate: string;
  endDate: string;
}) {
  const communityPerf = report.communityPerformance || [];
  const defaultLots = report.topLots || [];
  
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  const [filteredLots, setFilteredLots] = useState(defaultLots);
  const [loadingLots, setLoadingLots] = useState(false);
  
  const maxLoads = Math.max(...communityPerf.map(c => c.mapLoads), 1);
  const maxClicks = Math.max(...communityPerf.map(c => c.lotClicks), 1);
  
  const communities = useMemo(() => 
    [...communityPerf]
      .sort((a, b) => b.mapLoads - a.mapLoads)
      .map(c => c.name),
    [communityPerf]
  );
  
  // Reset to default lots when org changes
  useEffect(() => {
    setFilteredLots(defaultLots);
    setSelectedCommunities([]);
  }, [client]);
  
  // Fetch lots when community filter changes
  useEffect(() => {
    if (selectedCommunities.length === 0) {
      setFilteredLots(defaultLots);
      return;
    }
    
    const fetchFilteredLots = async () => {
      setLoadingLots(true);
      try {
        const params = new URLSearchParams({
          client,
          start_date: startDate,
          end_date: endDate,
          communities: selectedCommunities.join(','),
        });
        
        const response = await fetch(`/api/lots?${params}`);
        if (response.ok) {
          const data = await response.json();
          setFilteredLots(data.lots || []);
        }
      } catch (error) {
        console.error('Error fetching lots:', error);
        // Fall back to filtering existing data
        setFilteredLots(defaultLots.filter(lot => selectedCommunities.includes(lot.community)));
      } finally {
        setLoadingLots(false);
      }
    };
    
    fetchFilteredLots();
  }, [selectedCommunities, client, startDate, endDate, defaultLots]);
  
  // Recalculate ranks for filtered lots
  const rankedFilteredLots = useMemo(() => {
    return filteredLots.map((lot, index) => ({
      ...lot,
      rank: index + 1,
    }));
  }, [filteredLots]);
  
  const maxLotClicks = Math.max(...rankedFilteredLots.map(l => l.clicks), 1);

  return (
    <div className="space-y-6">
      {/* Community Performance */}
      <DataTable<CommunityPerformance>
        title="Community Performance"
        subtitle={`${communityPerf.length} communities tracked`}
        data={communityPerf}
        columns={[
          {
            key: 'name',
            label: 'Community',
            render: (item) => (
              <div className="min-w-0">
                <div className="font-medium text-slate-800 truncate">{item.name}</div>
                {item.path && <div className="text-xs text-slate-400 truncate max-w-[200px]">{item.path}</div>}
              </div>
            )
          },
          {
            key: 'mapLoads',
            label: 'Map Loads',
            align: 'right',
            sortable: true,
            width: '140px',
            render: (item) => (
              <span 
                className="inline-block px-2.5 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: getHeatmapColor(item.mapLoads, maxLoads, 'green') }}
              >
                {formatCompactNumber(item.mapLoads)}
              </span>
            )
          },
          {
            key: 'lotClicks',
            label: 'Lot Clicks',
            align: 'right',
            sortable: true,  
            width: '140px',
            render: (item) => (
              <span 
                className="inline-block px-2.5 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: getHeatmapColor(item.lotClicks, maxClicks, 'yellow') }}
              >
                {formatCompactNumber(item.lotClicks)}
              </span>
            )
          },
          {
            key: 'ctr',
            label: 'CTR',
            align: 'right',
            sortable: true,
            width: '100px',
            render: (item) => (
              <span className={`font-semibold ${
                item.ctr >= 20 ? 'text-emerald-600' : item.ctr >= 10 ? 'text-amber-600' : 'text-slate-500'
              }`}>
                {item.ctr?.toFixed(1)}%
              </span>
            )
          }
        ]}
      />

      {/* Lot Click Ranking with Community Filter */}
      <DataTable<TopLot>
        title={loadingLots ? "Lot Click Ranking (Loading...)" : "Lot Click Ranking"}
        subtitle={selectedCommunities.length > 0 
          ? `Top 50 lots from ${selectedCommunities.length} ${selectedCommunities.length === 1 ? 'community' : 'communities'}`
          : `Top 50 lots tracked`
        }
        data={rankedFilteredLots}
        filterComponent={
          <CommunityFilter
            communities={communities}
            selected={selectedCommunities}
            onChange={setSelectedCommunities}
          />
        }
        columns={[
          {
            key: 'rank',
            label: '#',
            width: '60px',
            render: (item) => (
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                item.rank === 1
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900'
                  : item.rank === 2
                  ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700'
                  : item.rank === 3
                  ? 'bg-gradient-to-br from-amber-600 to-orange-500 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {item.rank}
              </span>
            )
          },
          {
            key: 'lot',
            label: 'Lot',
            render: (item) => (
              <div className="font-medium text-slate-800">
                <div className="truncate max-w-[200px] md:max-w-[300px]" title={`${item.lot}`}>
                  {item.lot}                  
                </div>
              </div>
            )
          },
          {
            key: 'community',
            label: 'Community',            
            render: (item) => <span className="text-slate-600 truncate block max-w-[150px]" title={item.community}>{item.community}</span>
          },
          {
            key: 'clicks',
            label: 'Clicks',
            align: 'right',
            sortable: true,
            render: (item) => (
              <span 
                className="inline-block px-2.5 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: getHeatmapColor(item.clicks, maxLotClicks, 'green') }}
              >
                {item.clicks}
              </span>
            )
          },
          {
            key: 'share',
            label: 'Share',
            align: 'right',
            sortable: true,
            width: '80px',
            render: (item) => <span className="text-slate-600">{item.share}%</span>
          }
        ]}
      />
    </div>
  );
}

// ============================================================================
// TAB CONTENT: ANALYTICS
// ============================================================================

function AnalyticsContent({ report }: { report: MarketReport }) {
  const clicksByDay = report.clicksByDayOfWeek || [];
  const devices = report.deviceBreakdown || [];
  const countries = report.countryBreakdown || [];
  const cities = report.cityBreakdown || [];
  const browsers = report.browserBreakdown || [];
  const osList = report.osBreakdown || [];
  const traffic = report.trafficSources || [];

  // Pagination state for cities chart
  const [citiesPage, setCitiesPage] = useState(0);
  const CITIES_PER_PAGE = 12; // Show 12 cities per page (doubled from 6)

  // Use the cities data directly
  const displayCities = cities;
  const isUsingMockData = false;

  const maxDayClicks = Math.max(...clicksByDay.map(d => d.clicks), 1);
  const totalDayClicks = clicksByDay.reduce((sum, d) => sum + d.clicks, 0);

  // Add percentage to day data for tooltip
  const clicksByDayWithPercent = clicksByDay.map(d => ({
    ...d,
    percentage: totalDayClicks > 0 ? Math.round((d.clicks / totalDayClicks) * 1000) / 10 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Day of Week + Device */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Lot Clicks by Day" 
          subtitle="When users engage most"
          isEmpty={clicksByDay.length === 0}
          height="h-72"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clicksByDayWithPercent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false}
                tickFormatter={v => v?.slice(0, 3)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltipWithPercent showPercent />} />
              <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]}>
                {clicksByDayWithPercent.map((entry, i) => (
                  <Cell key={i} fill={getHeatmapColor(entry.clicks, maxDayClicks, 'green')} stroke="#10b981" strokeWidth={1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Device Category" isEmpty={devices.length === 0} height="h-72">
          <div className="flex items-center h-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="users"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {devices.map((entry, i) => (
                      <Cell key={i} fill={DEVICE_COLORS[entry.device] || CHART_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-3">
              {devices.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                       style={{ backgroundColor: `${DEVICE_COLORS[d.device] || CHART_COLORS[i]}15` }}>
                    {d.device === 'Mobile' && <Icon path={mdiCellphone} size={1.25} color="#3b82f6" />}
                    {d.device === 'Desktop' && <Icon path={mdiMonitor} size={1.25} color="#ef4444" />}
                    {d.device === 'Tablet' && <Icon path={mdiTablet} size={1.25} color="#f59e0b" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{d.device}</div>
                    <div className="text-sm text-slate-500">{d.users.toLocaleString()} users</div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">{d.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Row 2: Countries + Browsers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <ChartCard title="Browser Usage" isEmpty={browsers.length === 0} height="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={browsers.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="browser" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={false} 
                width={70}
              />
              <Tooltip content={<ChartTooltipWithPercent showPercent />} />
              <Bar dataKey="users" name="Users" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: OS + Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OS Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader title="Operating System" subtitle="User platform distribution" />
          <div className="space-y-4">
            {osList.slice(0, 6).map((os, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-20 text-sm text-slate-700 font-medium truncate" title={os.os}>{os.os}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${os.percentage}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length]
                    }}
                  />
                </div>
                <span className="w-24 text-sm text-slate-600 text-right">
                  {formatCompactNumber(os.users)} <span className="text-slate-400">({os.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader title="Traffic Sources" subtitle="Where visitors came from" />
          {traffic.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {traffic.slice(0, 5).map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{t.source}</div>
                    <div className="text-xs text-slate-500">{t.medium}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{t.sessions.toLocaleString()}</div>
                    <div className="text-xs text-slate-500">{t.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Top Cities + Active Users by Country Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Cities"
          subtitle={`${displayCities.length} cities with activity`}
          height="h-[400px]"
        >
          {displayCities.length === 0 ? (
            <EmptyState message="No city data available for the selected time period." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayCities.slice(citiesPage * CITIES_PER_PAGE, (citiesPage + 1) * CITIES_PER_PAGE)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="city"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<ChartTooltipWithPercent showPercent />} />
                  <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Pagination Controls */}
              {displayCities.length > CITIES_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setCitiesPage(p => Math.max(0, p - 1))}
                    disabled={citiesPage === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Icon path={mdiChevronLeft} size={1} />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg">
                    {citiesPage + 1} / {Math.ceil(displayCities.length / CITIES_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => setCitiesPage(p => Math.min(Math.ceil(displayCities.length / CITIES_PER_PAGE) - 1, p + 1))}
                    disabled={citiesPage >= Math.ceil(displayCities.length / CITIES_PER_PAGE) - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <Icon path={mdiChevronRight} size={1} />
                  </button>
                </div>
              )}
            </>
          )}
        </ChartCard>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader
            title="Active Users by Country"
            subtitle={`${countries.length} countries tracked`}
          />
          <div className="h-[400px]">
            {countries.length === 0 ? (
              <EmptyState message="No country data available" />
            ) : (
              <ChoroplethMap data={countries} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

function Sidebar({ 
  activeTab, 
  onTabChange,
  collapsed,
  onToggleCollapse,
  lastUpdated,
}: { 
  activeTab: TabId; 
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  lastUpdated: Date | null;
}) {
  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center">
              <svg width="20" height="13" viewBox="0 0 52 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path d="M13.6111 0L0 5.17937L16.8565 42H25.2778L13.6111 0Z" fill="#192A54"/>
                <path d="M30.5278 23.5278L33.8333 9.52778L40.8333 35.1726H35.7377L30.5278 23.5278Z" fill="#192A54"/>
                <path d="M21 22.5556L25.6667 39.2778L33.1009 7.53369L23.0247 11.2063L21 22.5556Z" fill="#4B5FD7"/>
                <path d="M51.4171 2.16626L44.4485 4.80303L38.8889 23.917L41.4167 32.8615L51.4171 2.16626Z" fill="#4B5FD7"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">LotWorks Insights</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Website Market Report</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mx-auto">
            <svg width="20" height="13" viewBox="0 0 52 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-4">
              <path d="M13.6111 0L0 5.17937L16.8565 42H25.2778L13.6111 0Z" fill="#192A54"/>
              <path d="M30.5278 23.5278L33.8333 9.52778L40.8333 35.1726H35.7377L30.5278 23.5278Z" fill="#192A54"/>
              <path d="M21 22.5556L25.6667 39.2778L33.1009 7.53369L23.0247 11.2063L21 22.5556Z" fill="#4B5FD7"/>
              <path d="M51.4171 2.16626L44.4485 4.80303L38.8889 23.917L41.4167 32.8615L51.4171 2.16626Z" fill="#4B5FD7"/>
            </svg>
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'text-slate-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
              style={isActive ? { backgroundColor: '#4B5FD715' } : {}}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              title={collapsed ? tab.label : undefined}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive ? '' : 'bg-slate-100 group-hover:bg-slate-200'
              }`}
              style={isActive ? { backgroundColor: '#4B5FD720' } : {}}>
                <Icon path={tab.icon} size={1} color={isActive ? '#4B5FD7' : '#64748b'} />
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${isActive ? '' : ''}`}
                  style={isActive ? { color: '#4B5FD7' } : {}}>{tab.label}</div>
                  <div className="text-[11px] text-slate-400">{tab.description}</div>
                </div>
              )}
              {!collapsed && isActive && (
                <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: '#4B5FD7' }} />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Footer section with collapse toggle */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        {/* Collapse Toggle - styled like tab buttons */}
        <div className="p-3">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            title={collapsed ? 'Expand' : undefined}
          >
            <div className="p-2 rounded-lg transition-colors bg-slate-100 group-hover:bg-slate-200">
              {collapsed ? (
                <Icon path={mdiChevronRight} size={1} color="#64748b" />
              ) : (
                <Icon path={mdiChevronLeft} size={1} color="#64748b" />
              )}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold">Collapse</div>
              </div>
            )}
          </button>
        </div>
        
        {/* Powered by section */}
        <div className="px-4 py-3 border-t border-slate-100">
          {!collapsed ? (
            <div className="space-y-1">
              <div className="text-xs text-slate-500">
                Powered by <span className="font-semibold text-slate-700">LotWorks</span>
              </div>
              {lastUpdated && (
                <div className="text-[10px] text-slate-400">
                  Updated {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center" title={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : undefined}>
              <Icon path={mdiClock} size={1} color="#94a3b8" style={{ margin: '0 auto' }} />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// MOBILE NAVIGATION
// ============================================================================

function MobileNav({ 
  activeTab, 
  onTabChange,
  isOpen,
  onClose,
  lastUpdated,
}: { 
  activeTab: TabId; 
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  onClose: () => void;
  lastUpdated: Date | null;
}) {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden animate-in slide-in-from-left duration-300 flex flex-col">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
              <Icon path={mdiChartBar} size={1} color="#0f172a" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">LotWorks</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Market Report</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <Icon path={mdiClose} size={1.25} color="#64748b" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon path={tab.icon} size={1.25} color={isActive ? '#059669' : '#94a3b8'} />
                <div className="flex-1 text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs text-slate-400">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
        
        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <div className="text-xs text-slate-500">
            Powered by <span className="font-semibold text-slate-700">LotWorks</span>
          </div>
          {lastUpdated && (
            <div className="text-[10px] text-slate-400 mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================

export default function Dashboard() {
  // State
  const [report, setReport] = useState<MarketReport | null>(null);
  const [clients, setClients] = useState<string[]>([DEFAULT_CLIENT]);
  const [selectedClient, setSelectedClient] = useState(DEFAULT_CLIENT);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Loading subtitles
  const loadingSubtitles = [
    "Fetching analytics data from your maps...",
    "Analyzing your latest community trends...",
    "Preparing market report intelligence..."
  ];
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);

  // Cycle through loading subtitles while loading
  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentSubtitleIndex((prev) => (prev + 1) % loadingSubtitles.length);
    }, 2000); // Change subtitle every 2 seconds

    return () => clearInterval(interval);
  }, [loading, loadingSubtitles.length]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Fetch clients on mount - NO auto-matching, just use first client if default not found
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.ok ? res.json() : { clients: [DEFAULT_CLIENT] })
      .then(data => {
        const list = data.clients || [DEFAULT_CLIENT];
        setClients(list);
        // If default client not in list, use first available
        if (!list.includes(DEFAULT_CLIENT) && list.length > 0) {
          setSelectedClient(list[0]);
        }
      })
      .catch(() => setClients([DEFAULT_CLIENT]));
  }, []);

  // Fetch report function
  const fetchReport = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const params = new URLSearchParams({
        start_date: formatDateToISO(startDate),
        end_date: formatDateToISO(endDate),
      });
      
      const response = await fetch(`/api/report/${encodeURIComponent(selectedClient)}?${params}`);
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.details || `Failed to fetch report (${response.status})`);
      }
      
      const data = await response.json();
      setReport(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClient, startDate, endDate]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchReport(false);
  }, [fetchReport]);

  // Handlers
  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleRefresh = () => {
    fetchReport(true);
  };

  const handleExport = () => {
    if (report) {
      exportReportToCSV(report);
    }
  };

  // Loading state
  if (loading && !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#4B5FD7', borderTopColor: 'transparent' }} />
          <p className="text-slate-600 font-medium">Loading LotWorks Insights...</p>
          <p className="text-slate-400 text-sm mt-1">{loadingSubtitles[currentSubtitleIndex]}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md w-full text-center border border-slate-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon path={mdiAlertCircle} size={2} color="#ef4444" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Failed to Load Report</h2>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <button
            onClick={() => fetchReport(false)}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          lastUpdated={lastUpdated}
        />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        lastUpdated={lastUpdated}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            >
              <Icon path={mdiMenu} size={1.25} color="#475569" />
            </button>
            
            <ClientSelector
              clients={clients}
              selected={selectedClient}
              onChange={setSelectedClient}
              disabled={loading || refreshing}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              disabled={loading || refreshing}
            />
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <Icon path={mdiRefresh} size={1.25} color="#475569" className={refreshing ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={handleExport}
              disabled={!report}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-colors text-sm font-semibold disabled:opacity-50"
              style={{
                backgroundColor: '#4B5FD7',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3B4FB7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4B5FD7';
              }}
            >
              <Icon path={mdiDownload} size={1} />
              Export
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Refresh overlay */}
          {refreshing && (
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 flex items-center gap-4 border border-slate-200">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-700 font-medium">Updating report...</span>
              </div>
            </div>
          )}
          
          {/* Tab Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {report.organization?.name} • {report.dateRange?.start} – {report.dateRange?.end}
            </p>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewContent report={report} />}
          {activeTab === 'details' && (
            <MapDetailsContent 
              report={report} 
              client={selectedClient}
              startDate={formatDateToISO(startDate)}
              endDate={formatDateToISO(endDate)}
            />
          )}
          {activeTab === 'analytics' && <AnalyticsContent report={report} />}
        </main>
      </div>
    </div>
  );
}
