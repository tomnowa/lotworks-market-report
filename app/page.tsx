'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  mdiFileAlert,
  mdiInformation,
  mdiViewDashboard,
  mdiMap,
  mdiChartPie,
  mdiMenu,
  mdiClose,
  mdiBellRing,
  mdiEmail,
  mdiCheck,
  mdiPulse,
  mdiAccountGroup,
  mdiAccountArrowRight,
  mdiChartLineVariant,
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

const LOADING_SUBTITLES = [
  "Fetching analytics data from your maps...",
  "Crunching the numbers...",
  "Analyzing community performance...",
  "Generating AI insights...",
  "Almost there..."
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
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${height} flex flex-col`}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="flex-1 min-h-0">
        {isEmpty ? <EmptyState /> : children}
      </div>
    </div>
  );
}

// ... (rest of file unchanged)

export default function InsightsPage() {
  // ... (omitted for brevity; same as file)
}
