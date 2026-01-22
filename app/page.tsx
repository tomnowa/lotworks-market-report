'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  mdiTelevision,
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
  mdiBellRing,
  mdiEmail,
  mdiCheck,
  mdiAccountGroup,
  mdiAccountArrowRight,
  mdiChartLineVariant,
  mdiPulse,
  mdiCalendarClock,
  mdiSpeedometer,
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
  'Smart tv': '#8b5cf6',
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
      <p className="mt-3 text-slate-500 text-sm">{message}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ 
  title, 
  subtitle,
  children, 
  isEmpty = false,
  height = "h-64"
}: { 
  title: string; 
  subtitle?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  height?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${height}`}>
      <SectionHeader title={title} subtitle={subtitle} />
      {isEmpty ? <EmptyState /> : children}
    </div>
  );
}

function ChartTooltipWithPercent({ active, payload, label, showPercent = false }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-sm">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-medium">{p.value?.toLocaleString()}</span>
          {showPercent && p.payload?.percentage != null && (
            <span className="text-slate-400">({p.payload.percentage}%)</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon, 
  accent = false,
  tooltip 
}: { 
  title: string; 
  value: string | number; 
  change?: number;
  icon: string;
  accent?: boolean;
  tooltip?: string;
}) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  
  return (
    <div 
      className={`rounded-2xl p-5 transition-all ${
        accent 
          ? 'text-white shadow-lg' 
          : 'bg-white border border-slate-200 shadow-sm'
      }`}
      style={accent ? { backgroundColor: '#4B5FD7' } : {}}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-sm font-medium mb-1 ${accent ? 'text-white/80' : 'text-slate-500'}`}>
            {title}
          </div>
          <div className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-800'}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${
              accent 
                ? (isPositive ? 'text-emerald-200' : isNegative ? 'text-red-200' : 'text-white/60')
                : (isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-slate-400')
            }`}>
              {change !== 0 && (
                <Icon path={isPositive ? mdiTrendingUp : mdiTrendingDown} size={0.75} />
              )}
              <span>{isPositive ? '+' : ''}{change}% vs prev period</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${accent ? 'bg-white/20' : 'bg-slate-100'}`}>
          <Icon path={icon} size={1.25} color={accent ? 'white' : '#64748b'} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ type, title, description }: { type: 'hot' | 'tip' | 'warning' | 'info'; title: string; description: string }) {
  const config = {
    hot: { icon: mdiFire, bg: 'bg-orange-50', border: 'border-orange-200', iconColor: '#f97316', titleColor: 'text-orange-800' },
    tip: { icon: mdiLightbulb, bg: 'bg-emerald-50', border: 'border-emerald-200', iconColor: '#10b981', titleColor: 'text-emerald-800' },
    warning: { icon: mdiAlert, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: '#f59e0b', titleColor: 'text-amber-800' },
    info: { icon: mdiInformation, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: '#3b82f6', titleColor: 'text-blue-800' },
  };
  const c = config[type];
  
  return (
    <div className={`rounded-xl p-4 ${c.bg} border ${c.border}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon path={c.icon} size={1} color={c.iconColor} />
        </div>
        <div>
          <div className={`font-semibold ${c.titleColor}`}>{title}</div>
          <div className="text-sm text-slate-600 mt-0.5">{description}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMAIL ALERTS SCHEDULER MODAL
// ============================================================================

interface AlertConfig {
  enabled: boolean;
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  alerts: {
    mapLoadsDropped: boolean;
    mapLoadsThreshold: number;
    clickRateDropped: boolean;
    clickRateThreshold: number;
    newTopCommunity: boolean;
    weeklyDigest: boolean;
  };
}

function EmailSchedulerModal({ 
  isOpen, 
  onClose,
  clientName 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  clientName: string;
}) {
  const [config, setConfig] = useState<AlertConfig>({
    enabled: false,
    email: '',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    dayOfMonth: 1,
    time: '09:00',
    alerts: {
      mapLoadsDropped: true,
      mapLoadsThreshold: 20,
      clickRateDropped: true,
      clickRateThreshold: 15,
      newTopCommunity: true,
      weeklyDigest: true,
    }
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In production, this would call an API
    console.log('Saving alert config:', config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100">
                <Icon path={mdiBellRing} size={1.25} color="#4B5FD7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Email Alerts</h2>
                <p className="text-sm text-slate-500">Configure automated reports for {clientName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
              <Icon path={mdiClose} size={1} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-semibold text-slate-800">Enable Email Alerts</div>
              <div className="text-sm text-slate-500">Receive automated insights in your inbox</div>
            </div>
            <button
              onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
              className={`w-12 h-7 rounded-full transition-colors relative ${config.enabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {config.enabled && (
            <>
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <div className="relative">
                  <Icon path={mdiEmail} size={1} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig(c => ({ ...c, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Report Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setConfig(c => ({ ...c, frequency: freq }))}
                      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        config.frequency === freq
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Selection */}
              {config.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Day of Week</label>
                  <select
                    value={config.dayOfWeek}
                    onChange={(e) => setConfig(c => ({ ...c, dayOfWeek: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                      <option key={day} value={i}>{day}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Send Time</label>
                <input
                  type="time"
                  value={config.time}
                  onChange={(e) => setConfig(c => ({ ...c, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Alert Types */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Alert Types</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.alerts.mapLoadsDropped}
                      onChange={(e) => setConfig(c => ({ ...c, alerts: { ...c.alerts, mapLoadsDropped: e.target.checked }}))}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">Map Loads Drop Alert</div>
                      <div className="text-sm text-slate-500">Notify when map loads drop by more than {config.alerts.mapLoadsThreshold}%</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.alerts.clickRateDropped}
                      onChange={(e) => setConfig(c => ({ ...c, alerts: { ...c.alerts, clickRateDropped: e.target.checked }}))}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">Click Rate Alert</div>
                      <div className="text-sm text-slate-500">Notify when click rate drops below threshold</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={config.alerts.newTopCommunity}
                      onChange={(e) => setConfig(c => ({ ...c, alerts: { ...c.alerts, newTopCommunity: e.target.checked }}))}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">Top Community Change</div>
                      <div className="text-sm text-slate-500">Notify when a new community takes the lead</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-200">
                    <input
                      type="checkbox"
                      checked={config.alerts.weeklyDigest}
                      onChange={(e) => setConfig(c => ({ ...c, alerts: { ...c.alerts, weeklyDigest: e.target.checked }}))}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-indigo-800">Performance Digest</div>
                      <div className="text-sm text-indigo-600">Full summary report with AI insights</div>
                    </div>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={config.enabled && !config.email}
              className="px-5 py-2.5 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Icon path={mdiCheck} size={1} />
                  Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PEAK ACTIVITY HOURS HEATMAP
// ============================================================================

function PeakActivityHeatmap({ data }: { data?: Record<string, Record<number, number>> }) {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number; value: number } | null>(null);
  
  // Generate sample data if none provided - in production this comes from GA4 API
  const heatmapData = useMemo(() => {
    if (data) return data;
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const generated: Record<string, Record<number, number>> = {};
    
    days.forEach((day, dayIndex) => {
      generated[day] = {};
      for (let hour = 0; hour < 24; hour++) {
        let base = 10;
        if (dayIndex === 0 || dayIndex === 6) base *= 0.6;
        if (hour >= 1 && hour <= 5) base *= 0.1;
        else if (hour >= 6 && hour <= 8) base *= 0.4;
        else if (hour >= 9 && hour <= 11) base *= 0.7;
        else if (hour >= 12 && hour <= 13) base *= 0.9;
        else if (hour >= 14 && hour <= 17) base *= 0.6;
        else if (hour >= 18 && hour <= 21) base *= 1.5;
        else if (hour >= 22) base *= 0.5;
        generated[day][hour] = Math.round(base * (0.7 + Math.random() * 0.6));
      }
    });
    
    return generated;
  }, [data]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxValue = useMemo(() => {
    let max = 0;
    days.forEach(day => {
      hours.forEach(hour => {
        if (heatmapData[day]?.[hour] > max) max = heatmapData[day][hour];
      });
    });
    return max;
  }, [heatmapData]);

  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity < 0.1) return '#f8fafc';
    if (intensity < 0.25) return '#e2e8f0';
    if (intensity < 0.4) return '#cbd5e1';
    if (intensity < 0.55) return '#94a3b8';
    if (intensity < 0.7) return '#64748b';
    if (intensity < 0.85) return '#6366f1';
    return '#4b5fd7';
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  // Find peak times
  const peakTimes = useMemo(() => {
    const peaks: { day: string; hour: number; value: number }[] = [];
    days.forEach(day => {
      hours.forEach(hour => {
        const value = heatmapData[day]?.[hour] || 0;
        if (value >= maxValue * 0.8) {
          peaks.push({ day, hour, value });
        }
      });
    });
    return peaks.sort((a, b) => b.value - a.value).slice(0, 3);
  }, [heatmapData, maxValue]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <SectionHeader title="Peak Activity Hours" subtitle="When users engage with your maps" />
      
      {/* Insight Banner */}
      {peakTimes.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon path={mdiPulse} size={0.9} color="#4B5FD7" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Peak: {peakTimes[0]?.day} {formatHour(peakTimes[0]?.hour)} - {formatHour(peakTimes[0]?.hour + 1)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Schedule ads and have sales available during these windows
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[550px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-10">
            {hours.filter((_, i) => i % 4 === 0).map(hour => (
              <div key={hour} className="text-[10px] text-slate-400 font-medium" style={{ width: '88px', textAlign: 'center' }}>
                {formatHour(hour)}
              </div>
            ))}
          </div>
          
          {/* Grid rows */}
          {days.map(day => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-10 text-xs font-medium text-slate-600 pr-2">{day}</div>
              <div className="flex gap-0.5">
                {hours.map(hour => {
                  const value = heatmapData[day]?.[hour] || 0;
                  const isHovered = hoveredCell?.day === day && hoveredCell?.hour === hour;
                  const isPeak = value >= maxValue * 0.8;
                  
                  return (
                    <div
                      key={hour}
                      className={`w-[22px] h-6 rounded-sm cursor-pointer transition-all duration-150 ${
                        isHovered ? 'ring-2 ring-indigo-400 ring-offset-1 scale-110 z-10' : ''
                      } ${isPeak ? 'ring-1 ring-indigo-300' : ''}`}
                      style={{ backgroundColor: getColor(value) }}
                      onMouseEnter={() => setHoveredCell({ day, hour, value })}
                      onMouseLeave={() => setHoveredCell(null)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-3 p-2 bg-slate-800 rounded-lg text-white text-sm inline-flex items-center gap-2">
          <span className="font-semibold">{hoveredCell.day} {formatHour(hoveredCell.hour)}</span>
          <span className="text-slate-400">•</span>
          <span>{hoveredCell.value} sessions</span>
          <span className={hoveredCell.value >= maxValue * 0.7 ? 'text-green-400' : 'text-slate-400'}>
            ({Math.round((hoveredCell.value / maxValue) * 100)}% of peak)
          </span>
        </div>
      )}
      
      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-3 text-xs text-slate-600">
        <span className="font-medium">Less</span>
        <div className="flex gap-0.5">
          {['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#4b5fd7'].map((color, i) => (
            <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span className="font-medium">More</span>
      </div>
    </div>
  );
}

// ============================================================================
// NEW VS RETURNING VISITORS CARD
// ============================================================================

function NewVsReturningCard({ data }: { data?: { new: number; returning: number; newTrend?: number; returningTrend?: number } }) {
  // Default/sample data
  const visitorData = data || {
    new: 58,
    returning: 42,
    newTrend: 12,
    returningTrend: -3
  };
  
  const total = visitorData.new + visitorData.returning;
  const newPct = Math.round((visitorData.new / total) * 100);
  const retPct = 100 - newPct;
  
  // Determine insight
  const getInsight = () => {
    if (newPct > 70) {
      return { type: 'info' as const, text: 'Strong acquisition: Most visitors are new. Focus on conversion optimization.' };
    } else if (newPct < 30) {
      return { type: 'warning' as const, text: 'Nurture-heavy: Many returning visitors but few new ones. Boost marketing reach.' };
    } else {
      return { type: 'tip' as const, text: 'Balanced funnel: Good mix of new acquisition and returning engagement.' };
    }
  };
  
  const insight = getInsight();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <SectionHeader title="New vs. Returning Visitors" subtitle="Visitor composition this period" />
      
      <div className="flex items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="#8b5cf6" 
              strokeWidth="12"
              strokeDasharray={`${retPct * 2.51} 251`}
              strokeLinecap="round"
            />
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="12"
              strokeDasharray={`${newPct * 2.51} 251`}
              strokeDashoffset={`-${retPct * 2.51}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800">{formatCompactNumber(total * 50)}</span>
            <span className="text-xs text-slate-500">Sessions</span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">New Visitors</span>
                <span className="text-lg font-bold text-slate-800">{newPct}%</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-slate-500">{formatCompactNumber(visitorData.new * 50)} sessions</span>
                {visitorData.newTrend !== undefined && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${visitorData.newTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {visitorData.newTrend > 0 ? '↑' : '↓'} {Math.abs(visitorData.newTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800">Returning</span>
                <span className="text-lg font-bold text-slate-800">{retPct}%</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm text-slate-500">{formatCompactNumber(visitorData.returning * 50)} sessions</span>
                {visitorData.returningTrend !== undefined && (
                  <span className={`text-xs font-medium flex items-center gap-0.5 ${visitorData.returningTrend > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {visitorData.returningTrend > 0 ? '↑' : '↓'} {Math.abs(visitorData.returningTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Insight */}
      <div className={`mt-4 p-3 rounded-lg border ${
        insight.type === 'tip' ? 'bg-emerald-50 border-emerald-100' : 
        insight.type === 'warning' ? 'bg-amber-50 border-amber-100' : 
        'bg-blue-50 border-blue-100'
      }`}>
        <p className={`text-sm ${
          insight.type === 'tip' ? 'text-emerald-800' : 
          insight.type === 'warning' ? 'text-amber-800' : 
          'text-blue-800'
        }`}>
          <span className="font-semibold">{insight.type === 'tip' ? '✓' : insight.type === 'warning' ? '⚠' : 'ℹ'}</span>{' '}
          {insight.text}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// ENGAGEMENT QUALITY CARD
// ============================================================================

function EngagementQualityCard({ data }: { data?: { engagementRate: number; avgDuration: string; bounceRate: number; sessionsPerUser: number } }) {
  const metrics = data || {
    engagementRate: 64,
    avgDuration: '2m 45s',
    bounceRate: 36,
    sessionsPerUser: 1.8
  };

  const getEngagementLevel = (rate: number) => {
    if (rate >= 60) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-500' };
    if (rate >= 45) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-500' };
    if (rate >= 30) return { label: 'Average', color: 'text-amber-600', bg: 'bg-amber-500' };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-500' };
  };
  
  const level = getEngagementLevel(metrics.engagementRate);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <SectionHeader title="Engagement Quality" subtitle="How deeply visitors engage" />
      
      {/* Main Gauge */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle 
              cx="50" cy="50" r="42" 
              fill="none" 
              stroke="url(#engagementGradient)"
              strokeWidth="8"
              strokeDasharray={`${metrics.engagementRate * 2.64} 264`}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="engagementGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#4B5FD7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-slate-800">{metrics.engagementRate}%</span>
            <span className={`text-xs font-semibold ${level.color}`}>{level.label}</span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="text-sm text-slate-600 mb-2">Engagement Rate measures meaningful interactions vs. bounces</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${level.color} bg-opacity-10`}
               style={{ backgroundColor: `${level.bg.replace('bg-', '')}15` }}>
            <div className={`w-2 h-2 rounded-full ${level.bg}`} />
            {metrics.engagementRate >= 50 ? 'Above average for real estate' : 'Room for improvement'}
          </div>
        </div>
      </div>
      
      {/* Secondary Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-xl font-bold text-slate-800">{metrics.avgDuration}</div>
          <div className="text-xs text-slate-500 mt-1">Avg. Session</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-xl font-bold text-slate-800">{metrics.bounceRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Bounce Rate</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl">
          <div className="text-xl font-bold text-slate-800">{metrics.sessionsPerUser}</div>
          <div className="text-xs text-slate-500 mt-1">Sessions/User</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AI INSIGHTS GENERATOR (Enhanced)
// ============================================================================

function generateAIInsights(report: MarketReport): Array<{ type: 'hot' | 'tip' | 'warning' | 'info'; title: string; description: string }> {
  const insights: Array<{ type: 'hot' | 'tip' | 'warning' | 'info'; title: string; description: string }> = [];
  
  const summary = report.summary;
  const communities = report.communityPerformance || [];
  const devices = report.deviceBreakdown || [];
  const traffic = report.trafficSources || [];
  const countries = report.countryBreakdown || [];
  
  // Insight 1: Click Rate Analysis
  const clickRate = summary?.clickThroughRate || 0;
  if (clickRate > 8) {
    insights.push({
      type: 'hot',
      title: 'Outstanding Click Rate',
      description: `Your ${clickRate.toFixed(1)}% click rate is exceptional. Your lot presentation is resonating with buyers.`
    });
  } else if (clickRate < 3) {
    insights.push({
      type: 'warning',
      title: 'Click Rate Below Benchmark',
      description: `At ${clickRate.toFixed(1)}%, your click rate is below the 5% industry average. Consider updating lot imagery or pricing display.`
    });
  }
  
  // Insight 2: Mobile Performance
  const mobileShare = devices.find(d => d.device === 'Mobile')?.percentage || 0;
  if (mobileShare > 60) {
    insights.push({
      type: 'info',
      title: 'Mobile-First Audience',
      description: `${mobileShare}% of visitors browse on mobile. Ensure your lot details are touch-friendly and load quickly.`
    });
  }
  
  // Insight 3: Top Community Momentum
  if (communities.length >= 2) {
    const top = communities[0];
    const second = communities[1];
    const gap = ((top.mapLoads - second.mapLoads) / second.mapLoads * 100).toFixed(0);
    if (parseInt(gap) > 50) {
      insights.push({
        type: 'hot',
        title: `${top.name} Dominates`,
        description: `Leading by ${gap}% over ${second.name}. Consider allocating more marketing budget here.`
      });
    }
  }
  
  // Insight 4: Traffic Source Opportunity
  const directTraffic = traffic.find(t => t.source.toLowerCase() === '(direct)')?.percentage || 0;
  const organicTraffic = traffic.find(t => t.medium.toLowerCase() === 'organic')?.percentage || 0;
  if (directTraffic > 50) {
    insights.push({
      type: 'tip',
      title: 'Strong Brand Recognition',
      description: `${directTraffic}% direct traffic shows strong brand awareness. Your signage and word-of-mouth are working.`
    });
  } else if (organicTraffic > 30) {
    insights.push({
      type: 'tip',
      title: 'SEO Paying Off',
      description: `${organicTraffic}% organic traffic means your SEO investment is driving qualified visitors.`
    });
  }
  
  // Insight 5: Geographic Opportunity
  const localCountry = countries[0];
  if (localCountry && countries.length > 1) {
    const internationalPct = 100 - (localCountry.percentage || 0);
    if (internationalPct > 10) {
      insights.push({
        type: 'info',
        title: 'International Interest',
        description: `${internationalPct.toFixed(0)}% of visitors from outside ${localCountry.country}. Consider investor-focused content.`
      });
    }
  }
  
  // Insight 6: Change-based alerts
  if (summary?.mapLoadsChange && summary.mapLoadsChange < -20) {
    insights.push({
      type: 'warning',
      title: 'Traffic Drop Detected',
      description: `Map loads down ${Math.abs(summary.mapLoadsChange)}% vs. previous period. Check if marketing campaigns ended.`
    });
  } else if (summary?.mapLoadsChange && summary.mapLoadsChange > 30) {
    insights.push({
      type: 'hot',
      title: 'Traffic Surge',
      description: `Map loads up ${summary.mapLoadsChange}%! Identify what's driving this and double down.`
    });
  }
  
  // Ensure we have at least some insights
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Steady Performance',
      description: 'Metrics are stable this period. Check the Analytics tab for optimization opportunities.'
    });
  }
  
  return insights.slice(0, 4);
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
  
  const presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
  ];
  
  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onChange(start, end);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <Icon path={mdiCalendar} size={1} color="#64748b" />
        <span className="hidden sm:inline text-slate-700">
          {formatDateForDisplay(startDate)} – {formatDateForDisplay(endDate)}
        </span>
        <Icon path={mdiChevronDown} size={0.75} color="#64748b" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-3 min-w-[200px]">
            <div className="space-y-1">
              {presets.map(preset => (
                <button
                  key={preset.days}
                  onClick={() => applyPreset(preset.days)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
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
  
  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#4B5FD715' }}>
          <Icon path={mdiOfficeBuilding} size={1} color="#4B5FD7" />
        </div>
        <span className="font-semibold text-slate-800 hidden sm:inline">{selected}</span>
        <Icon path={mdiChevronDown} size={0.75} color="#64748b" />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-2 min-w-[220px] max-h-64 overflow-y-auto">
            {clients.map(client => (
              <button
                key={client}
                onClick={() => {
                  onChange(client);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  client === selected 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {client}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// DATA TABLE COMPONENT
// ============================================================================

function DataTable<T>({ 
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
// TAB CONTENT: OVERVIEW (Enhanced with AI Insights)
// ============================================================================

function OverviewContent({ report }: { report: MarketReport }) {
  const viewsData = report.viewsOverTime || [];
  const communityPerf = report.communityPerformance || [];
  const devices = report.deviceBreakdown || [];
  const orgName = report.organization?.name || '';
  
  // Generate AI insights dynamically
  const aiInsights = useMemo(() => generateAIInsights(report), [report]);
  
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);
  
  const topCommunities = useMemo(() => 
    [...communityPerf]
      .sort((a, b) => b.mapLoads - a.mapLoads)
      .slice(0, 8)
      .map(c => c.name),
    [communityPerf]
  );
  
  useEffect(() => {
    if (topCommunities.length > 0) {
      setSelectedCommunities(topCommunities.slice(0, Math.min(5, topCommunities.length)));
    } else {
      setSelectedCommunities([]);
    }
  }, [orgName]);
  
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

      {/* LotWorks AI Insights - Now generated dynamically */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: '#4B5FD720' }}>
            <Icon path={mdiRobotExcitedOutline} size={1} color="#4B5FD7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">LotWorks AI Insights</h2>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">Auto-generated</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {aiInsights.map((insight, i) => (
            <InsightCard key={i} {...insight} />
          ))}
        </div>
      </div>

      {/* Map Load Trend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Map Load Trend</h2>
            <p className="text-sm text-slate-500">Click community names to show/hide</p>
          </div>
        </div>
        
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
  const [lots, setLots] = useState<TopLot[]>(defaultLots);
  const [lotsLoading, setLotsLoading] = useState(false);
  
  const communityNames = useMemo(() => communityPerf.map(c => c.name), [communityPerf]);
  
  useEffect(() => {
    setSelectedCommunities([]);
    setLots(defaultLots);
  }, [client, defaultLots]);
  
  // Fetch filtered lots when communities change
  useEffect(() => {
    if (selectedCommunities.length === 0) {
      setLots(defaultLots);
      return;
    }
    
    const fetchFilteredLots = async () => {
      setLotsLoading(true);
      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          communities: selectedCommunities.join(','),
        });
        
        const response = await fetch(`/api/report/${encodeURIComponent(client)}/lots?${params}`);
        if (response.ok) {
          const data = await response.json();
          setLots(data.lots || []);
        }
      } catch (error) {
        console.error('Failed to fetch filtered lots:', error);
      } finally {
        setLotsLoading(false);
      }
    };
    
    fetchFilteredLots();
  }, [selectedCommunities, client, startDate, endDate, defaultLots]);
  
  const maxMapLoads = Math.max(...communityPerf.map(c => c.mapLoads), 1);
  const maxLotClicks = Math.max(...communityPerf.map(c => c.lotClicks), 1);
  
  // Community filter dropdown
  const CommunityFilter = (
    <div className="relative">
      <button
        onClick={() => {}}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50"
      >
        <Icon path={mdiFilter} size={0.75} color="#64748b" />
        <span className="text-slate-700">
          {selectedCommunities.length === 0 
            ? 'All Communities' 
            : `${selectedCommunities.length} selected`}
        </span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Community Map */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <SectionHeader 
          title="Community Locations" 
          subtitle="Click markers to view community details"
        />
        <div className="h-[400px] rounded-xl overflow-hidden">
          <CityMap communities={communityPerf} />
        </div>
      </div>
      
      {/* Community Performance Table */}
      <DataTable<CommunityPerformance>
        data={communityPerf}
        title="Community Performance"
        subtitle="All communities ranked by activity"
        columns={[
          {
            key: 'name',
            label: 'Community',
            sortable: true,
            render: (item) => <span className="font-medium text-slate-800">{item.name}</span>
          },
          {
            key: 'mapLoads',
            label: 'Map Loads',
            align: 'right',
            sortable: true,
            render: (item) => (
              <span 
                className="inline-block px-2.5 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: getHeatmapColor(item.mapLoads, maxMapLoads, 'blue') }}
              >
                {item.mapLoads.toLocaleString()}
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
                style={{ backgroundColor: getHeatmapColor(item.lotClicks, maxLotClicks, 'green') }}
              >
                {item.lotClicks.toLocaleString()}
              </span>
            )
          },
          {
            key: 'ctr',
            label: 'CTR',
            align: 'right',
            sortable: true,
            width: '100px',
            render: (item) => {
              const ctr = item.ctr || 0;
              return (
                <span className={`font-semibold ${ctr >= 5 ? 'text-emerald-600' : ctr >= 2 ? 'text-blue-600' : 'text-slate-600'}`}>
                  {ctr.toFixed(1)}%
                </span>
              );
            }
          }
        ]}
      />
      
      {/* Top Lots Table */}
      <DataTable<TopLot>
        data={lots}
        title="Top Clicked Lots"
        subtitle={lotsLoading ? "Loading..." : selectedCommunities.length > 0 ? `Filtered by ${selectedCommunities.length} communities` : "All lots ranked by clicks"}
        columns={[
          {
            key: 'rank',
            label: '#',
            width: '50px',
            render: (_, index) => (
              <span className="text-slate-400 font-medium">{index + 1}</span>
            )
          },
          {
            key: 'lot',
            label: 'Lot',
            sortable: true,
            render: (item) => <span className="font-medium text-slate-800">{item.lot}</span>
          },
          {
            key: 'community',
            label: 'Community',
            sortable: true,
            render: (item) => <span className="text-slate-600">{item.community}</span>
          },
          {
            key: 'clicks',
            label: 'Clicks',
            align: 'right',
            sortable: true,
            render: (item) => (
              <span 
                className="inline-block px-2.5 py-1 rounded-md text-sm font-semibold"
                style={{ backgroundColor: getHeatmapColor(item.clicks, Math.max(...lots.map(l => l.clicks), 1), 'green') }}
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
// TAB CONTENT: ANALYTICS (Revamped)
// ============================================================================

function AnalyticsContent({ report }: { report: MarketReport }) {
  const clicksByDay = report.clicksByDayOfWeek || [];
  const devices = report.deviceBreakdown || [];
  const countries = report.countryBreakdown || [];
  const cities = report.cityBreakdown || [];
  const traffic = report.trafficSources || [];

  // Pagination state for cities chart
  const [citiesPage, setCitiesPage] = useState(0);
  const CITIES_PER_PAGE = 10;

  const displayCities = cities;

  // Custom tick component for city names
  const CityTick = (props: any) => {
    const { x, y, payload } = props;
    const cityData = displayCities.slice(citiesPage * CITIES_PER_PAGE, (citiesPage + 1) * CITIES_PER_PAGE)[payload.index];
    if (!cityData) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text x={-10} y={-5} textAnchor="end" fontSize={11} fill="#64748b" fontWeight="500">
          {cityData.city}
        </text>
        <text x={-10} y={8} textAnchor="end" fontSize={9} fill="#94a3b8">
          {cityData.country}
        </text>
      </g>
    );
  };

  const maxDayClicks = Math.max(...clicksByDay.map(d => d.clicks), 1);
  const totalDayClicks = clicksByDay.reduce((sum, d) => sum + d.clicks, 0);

  const clicksByDayWithPercent = clicksByDay.map(d => ({
    ...d,
    percentage: totalDayClicks > 0 ? Math.round((d.clicks / totalDayClicks) * 1000) / 10 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Row 1: Engagement Intelligence (New!) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewVsReturningCard />
        <PeakActivityHeatmap />
      </div>

      {/* Row 2: Top Cities + Lot Clicks by Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Top Cities"
          subtitle={`${displayCities.length} cities with activity`}
          height={displayCities.length > CITIES_PER_PAGE ? "h-[450px]" : "h-[400px]"}
        >
          {displayCities.length === 0 ? (
            <EmptyState message="No city data available" />
          ) : (
            <div className="flex flex-col h-full">
              <div className={displayCities.length > CITIES_PER_PAGE ? "flex-1" : "h-full"}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={displayCities.slice(citiesPage * CITIES_PER_PAGE, (citiesPage + 1) * CITIES_PER_PAGE)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="city" tick={<CityTick />} tickLine={false} axisLine={false} width={110} interval={0} />
                    <Tooltip content={<ChartTooltipWithPercent showPercent />} />
                    <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {displayCities.length > CITIES_PER_PAGE && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setCitiesPage(p => Math.max(0, p - 1))} disabled={citiesPage === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <Icon path={mdiChevronLeft} size={1} />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-50 rounded-lg">
                    {citiesPage + 1} / {Math.ceil(displayCities.length / CITIES_PER_PAGE)}
                  </span>
                  <button onClick={() => setCitiesPage(p => Math.min(Math.ceil(displayCities.length / CITIES_PER_PAGE) - 1, p + 1))} disabled={citiesPage >= Math.ceil(displayCities.length / CITIES_PER_PAGE) - 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <Icon path={mdiChevronRight} size={1} />
                  </button>
                </div>
              )}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Lot Clicks by Day"
          subtitle="When users engage most"
          isEmpty={clicksByDay.length === 0}
          height={displayCities.length > CITIES_PER_PAGE ? "h-[450px]" : "h-[400px]"}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clicksByDayWithPercent}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} tickFormatter={v => v?.slice(0, 3)} />
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
      </div>

      {/* Row 3: Country Map + Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <SectionHeader title="Active Users by Country" subtitle={`${countries.length} countries tracked`} />
          {countries.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState message="No country data available" />
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-[280px]">
                <ChoroplethMap data={countries} />
              </div>
              <div className="pt-4 mt-auto">
                <div className="flex items-center justify-center gap-3 text-xs text-slate-700">
                  <span className="font-medium">Less</span>
                  <div className="flex gap-1">
                    {['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#4b5fd7'].map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className="font-medium">More</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <SectionHeader title="Traffic Sources" subtitle="Where visitors came from" />
          {traffic.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState />
            </div>
          ) : (
            <div className="space-y-3">
              {traffic.slice(0, 7).map((t, i) => (
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

      {/* Row 4: Device + Engagement Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Device Category" isEmpty={devices.length === 0} height="h-72">
          <div className="flex items-center h-full">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={devices} dataKey="users" nameKey="device" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
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
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${DEVICE_COLORS[d.device] || CHART_COLORS[i]}15` }}>
                    {d.device === 'Mobile' && <Icon path={mdiCellphone} size={1.25} color="#3b82f6" />}
                    {d.device === 'Desktop' && <Icon path={mdiMonitor} size={1.25} color="#ef4444" />}
                    {d.device === 'Tablet' && <Icon path={mdiTablet} size={1.25} color="#f59e0b" />}
                    {d.device === 'Smart tv' && <Icon path={mdiTelevision} size={1.25} color="#8b5cf6" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{d.device === 'Smart tv' ? 'Smart TV' : d.device}</div>
                    <div className="text-sm text-slate-500">{d.users.toLocaleString()} users</div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">{d.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <EngagementQualityCard />
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
    <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
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
                isActive ? 'text-slate-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
              style={isActive ? { backgroundColor: '#4B5FD715' } : {}}
              title={collapsed ? tab.label : undefined}
            >
              <div className={`p-2 rounded-lg transition-colors ${isActive ? '' : 'bg-slate-100 group-hover:bg-slate-200'}`} style={isActive ? { backgroundColor: '#4B5FD720' } : {}}>
                <Icon path={tab.icon} size={1} color={isActive ? '#4B5FD7' : '#64748b'} />
              </div>
              {!collapsed && (
                <div className="text-left">
                  <div className={`font-medium ${isActive ? 'text-slate-800' : ''}`}>{tab.label}</div>
                  <div className="text-xs text-slate-400">{tab.description}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Footer */}
      {!collapsed && lastUpdated && (
        <div className="p-4 border-t border-slate-100">
          <div className="text-xs text-slate-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}
    </aside>
  );
}

// ============================================================================
// MOBILE NAV
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
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <svg width="20" height="13" viewBox="0 0 52 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-5">
              <path d="M13.6111 0L0 5.17937L16.8565 42H25.2778L13.6111 0Z" fill="#192A54"/>
              <path d="M30.5278 23.5278L33.8333 9.52778L40.8333 35.1726H35.7377L30.5278 23.5278Z" fill="#192A54"/>
              <path d="M21 22.5556L25.6667 39.2778L33.1009 7.53369L23.0247 11.2063L21 22.5556Z" fill="#4B5FD7"/>
              <path d="M51.4171 2.16626L44.4485 4.80303L38.8889 23.917L41.4167 32.8615L51.4171 2.16626Z" fill="#4B5FD7"/>
            </svg>
            <span className="font-bold text-slate-800">LotWorks Insights</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <Icon path={mdiClose} size={1} color="#64748b" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'text-slate-800' : 'text-slate-600 hover:bg-slate-50'
                }`}
                style={isActive ? { backgroundColor: '#4B5FD715' } : {}}
              >
                <div className={`p-2 rounded-lg ${isActive ? '' : 'bg-slate-100'}`} style={isActive ? { backgroundColor: '#4B5FD720' } : {}}>
                  <Icon path={tab.icon} size={1} color={isActive ? '#4B5FD7' : '#64748b'} />
                </div>
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-slate-400">{tab.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
        
        {lastUpdated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
            <div className="text-xs text-slate-400">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function InsightsPage() {
  // Data state
  const [clients, setClients] = useState<string[]>([DEFAULT_CLIENT]);
  const [selectedClient, setSelectedClient] = useState(DEFAULT_CLIENT);
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Date range (default last 30 days)
  const [endDate, setEndDate] = useState(() => new Date());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  
  // Loading animation
  const loadingSubtitles = [
    "Fetching analytics data from your maps...",
    "Crunching the numbers...",
    "Analyzing community performance...",
    "Generating AI insights...",
    "Almost there..."
  ];
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);
  
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setCurrentSubtitleIndex((prev) => (prev + 1) % loadingSubtitles.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading, loadingSubtitles.length]);
  
  // UI State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [emailSchedulerOpen, setEmailSchedulerOpen] = useState(false);

  // Fetch clients on mount
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.ok ? res.json() : { clients: [DEFAULT_CLIENT] })
      .then(data => {
        const list = data.clients || [DEFAULT_CLIENT];
        setClients(list);
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
      {/* Email Scheduler Modal */}
      <EmailSchedulerModal 
        isOpen={emailSchedulerOpen} 
        onClose={() => setEmailSchedulerOpen(false)}
        clientName={selectedClient}
      />
      
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
            
            {/* Email Scheduler Button */}
            <button
              onClick={() => setEmailSchedulerOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
              title="Schedule email alerts"
            >
              <Icon path={mdiBellRing} size={1} color="#64748b" />
              <span className="hidden md:inline">Alerts</span>
            </button>
            
            <button
              onClick={handleExport}
              disabled={!report}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-white transition-colors text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: '#4B5FD7' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#3B4FB7'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4B5FD7'; }}
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
