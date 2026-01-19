'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye,
  MousePointerClick,
  Target,
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Building2,
  AlertCircle,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Flame,
  Lightbulb,
  AlertTriangle,
  BarChart3,
  FileWarning,
  Info,
  LayoutDashboard,
  Map,
  PieChart as PieChartIcon,
  Menu,
  X,
} from 'lucide-react';
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
  Legend,
} from 'recharts';
import type { MarketReport, CommunityPerformance, TopLot } from '@/types';

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
  icon: React.ElementType;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, description: 'Executive summary' },
  { id: 'details', label: 'Map Details', icon: Map, description: 'Communities & lots' },
  { id: 'analytics', label: 'Analytics', icon: PieChartIcon, description: 'Traffic & demographics' },
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
      <FileWarning className="w-10 h-10 mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-slate-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-slate-700 max-w-xs">
      <p className="font-semibold text-sm mb-2 text-slate-200">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm py-0.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400 truncate">{entry.name}:</span>
          <span className="font-bold ml-auto">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  accent = false,
}: { 
  title: string; 
  value: string | number; 
  change?: number; 
  icon: React.ElementType; 
  accent?: boolean;
}) {
  const hasChange = change !== undefined && !isNaN(change);
  const isPositive = hasChange && change >= 0;
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;
  
  return (
    <div className={`rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
      accent 
        ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 text-white shadow-lg border border-slate-700' 
        : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accent ? 'bg-lime-400/20' : 'bg-emerald-50'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-lime-400' : 'text-emerald-600'}`} />
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
  const configs: Record<string, { icon: React.ElementType; bg: string; border: string; iconBg: string }> = {
    trending: { icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600' },
    hot: { icon: Flame, bg: 'bg-orange-50', border: 'border-orange-200', iconBg: 'bg-orange-100 text-orange-600' },
    opportunity: { icon: Lightbulb, bg: 'bg-blue-50', border: 'border-blue-200', iconBg: 'bg-blue-100 text-blue-600' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', iconBg: 'bg-amber-100 text-amber-600' },
  };
  
  const config = configs[type] || configs.trending;
  const Icon = config.icon;
  
  return (
    <div className={`rounded-xl p-4 border transition-all duration-200 hover:shadow-md ${config.bg} ${config.border}`}>
      <div className="flex gap-3">
        <div className={`p-2 rounded-lg h-fit flex-shrink-0 ${config.iconBg}`}>
          <Icon className="w-4 h-4" />
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
  height = "h-64"
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  isEmpty?: boolean;
  className?: string;
  height?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className={height}>
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
        <Calendar className="w-4 h-4 text-slate-400" />
        <span className="font-medium">
          {formatDateForDisplay(startDate)} – {formatDateForDisplay(endDate)}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
                  <Info className="w-3.5 h-3.5" />
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
        <Building2 className="w-4 h-4 text-emerald-600" />
        <span className="text-sm flex-1 text-left font-medium text-slate-700 truncate">{selected}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
// DATA TABLE
// ============================================================================

function DataTable<T extends object>({ 
  data, 
  columns, 
  title,
  subtitle,
  itemsPerPage = ITEMS_PER_PAGE 
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
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
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
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {data.length} total
          </span>
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
                      <ArrowUpDown className={`w-3 h-3 transition-colors ${sortKey === col.key ? 'text-emerald-600' : 'text-slate-300'}`} />
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
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-200">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-4 h-4" />
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
  
  const topCommunities = [...communityPerf]
    .sort((a, b) => b.mapLoads - a.mapLoads)
    .slice(0, 6)
    .map(c => c.name);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Map Loads"
          value={report.summary?.totalMapLoads ?? 0}
          change={report.summary?.mapLoadsChange}
          icon={Eye}
          accent
        />
        <StatCard
          title="Lot Clicks"
          value={report.summary?.totalLotClicks ?? 0}
          change={report.summary?.lotClicksChange}
          icon={MousePointerClick}
        />
        <StatCard
          title="Avg. Time on Map"
          value={report.summary?.avgTimeOnMap || '—'}
          change={report.summary?.avgTimeChange}
          icon={Clock}
        />
        <StatCard
          title="Click Rate"
          value={`${(report.summary?.clickThroughRate ?? 0).toFixed(1)}%`}
          change={report.summary?.clickRateChange}
          icon={Target}
        />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-800">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight, i) => (
              <InsightCard key={i} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Map Load Trend */}
      <ChartCard 
        title="Map Load Trend" 
        subtitle="Daily views by community"
        isEmpty={viewsData.length === 0}
        height="h-80"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={viewsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#0f172a" strokeWidth={2.5} dot={false} />
            {topCommunities.slice(0, 5).map((community, i) => {
              const key = community.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
              return (
                <Line 
                  key={community}
                  type="monotone" 
                  dataKey={key}
                  name={community}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={1.5} 
                  dot={false}
                  strokeOpacity={0.8}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{communityPerf.length}</div>
          <div className="text-sm text-slate-500 mt-1">Active Communities</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-800">{(report.topLots || []).length}</div>
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

function MapDetailsContent({ report }: { report: MarketReport }) {
  const communityPerf = report.communityPerformance || [];
  const topLots = report.topLots || [];
  const viewsData = report.viewsOverTime || [];
  
  const maxLoads = Math.max(...communityPerf.map(c => c.mapLoads), 1);
  const maxClicks = Math.max(...communityPerf.map(c => c.lotClicks), 1);
  const maxLotClicks = Math.max(...topLots.map(l => l.clicks), 1);
  
  const topCommunities = [...communityPerf]
    .sort((a, b) => b.mapLoads - a.mapLoads)
    .slice(0, 8)
    .map(c => c.name);

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
            width: '80px',
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

      {/* Lot Click Ranking */}
      <DataTable<TopLot>
        title="Lot Click Ranking"
        subtitle={`${topLots.length} lots tracked`}
        data={topLots}
        columns={[
          {
            key: 'rank',
            label: '#',
            width: '60px',
            render: (item) => (
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                item.rank <= 3 
                  ? 'bg-gradient-to-br from-lime-400 to-emerald-500 text-slate-900' 
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
              <div className="font-medium text-slate-800 truncate max-w-[200px]" title={item.lot}>{item.lot}</div>
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

      {/* Views Over Time Detail Chart */}
      <ChartCard 
        title="Views Over Time" 
        subtitle="Detailed breakdown by community"
        isEmpty={viewsData.length === 0}
        height="h-96"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={viewsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#0f172a" strokeWidth={2.5} dot={false} />
            {topCommunities.map((community, i) => {
              const key = community.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
              return (
                <Line 
                  key={community}
                  type="monotone" 
                  dataKey={key}
                  name={community}
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={1.5} 
                  dot={false}
                  strokeOpacity={0.8}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
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
  const browsers = report.browserBreakdown || [];
  const osList = report.osBreakdown || [];
  const traffic = report.trafficSources || [];
  
  const maxDayClicks = Math.max(...clicksByDay.map(d => d.clicks), 1);

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
            <BarChart data={clicksByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false}
                tickFormatter={v => v?.slice(0, 3)}
              />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="clicks" name="Clicks" radius={[4, 4, 0, 0]}>
                {clicksByDay.map((entry, i) => (
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
                    {d.device === 'Mobile' && <Smartphone className="w-5 h-5 text-blue-500" />}
                    {d.device === 'Desktop' && <Monitor className="w-5 h-5 text-red-500" />}
                    {d.device === 'Tablet' && <Tablet className="w-5 h-5 text-amber-500" />}
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
        <ChartCard title="Top Countries" isEmpty={countries.length === 0} height="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countries.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="country" 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                tickLine={false} 
                axisLine={false} 
                width={90}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

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
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="users" name="Users" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: OS + Traffic */}
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
                <span className="w-20 text-sm text-slate-600 text-right">
                  {formatCompactNumber(os.users)} <span className="text-slate-400">({os.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <SectionHeader title="Traffic Sources" subtitle="Where visitors come from" />
          {traffic.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-3">
              {traffic.slice(0, 6).map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">{t.source}</div>
                    <div className="text-xs text-slate-500">{t.medium}</div>
                  </div>
                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min(t.percentage, 100)}%` }} 
                    />
                  </div>
                  <span className="w-20 text-sm text-slate-600 text-right font-medium">
                    {t.sessions.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
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
  onToggleCollapse
}: { 
  activeTab: TabId; 
  onTabChange: (tab: TabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">LotWorks</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Market Report</div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center mx-auto">
            <BarChart3 className="w-4 h-4 text-slate-900" />
          </div>
        )}
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
              title={collapsed ? tab.label : undefined}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                isActive ? 'bg-emerald-100' : 'bg-slate-100 group-hover:bg-slate-200'
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
              </div>
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : ''}`}>{tab.label}</div>
                  <div className="text-[11px] text-slate-400">{tab.description}</div>
                </div>
              )}
              {!collapsed && isActive && (
                <div className="w-1.5 h-8 bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Collapse Toggle */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
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
  onClose
}: { 
  activeTab: TabId; 
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden animate-in slide-in-from-left duration-300">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-slate-900" />
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">LotWorks</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Market Report</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
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
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="flex-1 text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs text-slate-400">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
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
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading report for {selectedClient}...</p>
          <p className="text-slate-400 text-sm mt-1">Fetching data from Google Analytics</p>
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
            <AlertCircle className="w-8 h-8 text-red-500" />
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
      <div className="hidden lg:block">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
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
              <Menu className="w-5 h-5 text-slate-600" />
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
              <RefreshCw className={`w-5 h-5 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={handleExport}
              disabled={!report}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
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
              {lastUpdated && (
                <span className="text-slate-400 ml-2">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && <OverviewContent report={report} />}
          {activeTab === 'details' && <MapDetailsContent report={report} />}
          {activeTab === 'analytics' && <AnalyticsContent report={report} />}
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-3 px-4 lg:px-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Powered by <span className="font-semibold text-slate-700">LotWorks</span></span>
            <span>Data excludes tree tracking maps</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
