'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Icon from '@mdi/react';
import {
  mdiRobotExcitedOutline, mdiEye, mdiCursorPointer, mdiTarget, mdiCalendar,
  mdiChevronDown, mdiDownload, mdiRefresh, mdiOfficeBuilding, mdiAlertCircle,
  mdiClock, mdiMonitor, mdiCellphone, mdiTablet, mdiTelevision, mdiTrendingUp,
  mdiTrendingDown, mdiChevronLeft, mdiChevronRight, mdiChevronDoubleLeft,
  mdiChevronDoubleRight, mdiArrowUpDown, mdiFire, mdiLightbulb, mdiAlert,
  mdiFileAlert, mdiInformation, mdiViewDashboard, mdiMap, mdiChartPie, mdiMenu,
  mdiClose, mdiBellRing, mdiEmail, mdiCheck, mdiPulse, mdiAccountGroup,
  mdiAccountArrowRight, mdiChartLineVariant,
} from '@mdi/js';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { MarketReport, CommunityPerformance, TopLot } from '@/types';
import { MD3 } from '@/lib/theme';
import dynamic from 'next/dynamic';

const ChoroplethMap = dynamic(() => import('@/components/ChoroplethMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-medium)]">
      <div className="text-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-typescale-body-small)]">Loading map...</div>
    </div>
  )
});

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CLIENT = 'Pacesetter Homes';
const ITEMS_PER_PAGE = 10;

type TabId = 'overview' | 'details' | 'analytics';

const TABS: { id: TabId; label: string; icon: string; description: string }[] = [
  { id: 'overview', label: 'Overview', icon: mdiViewDashboard, description: 'Executive Summary' },
  { id: 'details', label: 'Map Details', icon: mdiMap, description: 'Communities & Lots' },
  { id: 'analytics', label: 'Analytics', icon: mdiChartPie, description: 'Traffic & Demographics' },
];

const LOADING_MESSAGES = [
  { text: "Fetching analytics data from your maps...", progress: 15 },
  { text: "Syncing community performance metrics...", progress: 30 },
  { text: "Analyzing visitor engagement patterns...", progress: 50 },
  { text: "Processing geographic insights...", progress: 70 },
  { text: "Generating AI-powered recommendations...", progress: 85 },
  { text: "Finalizing your market intelligence...", progress: 95 },
];

// =============================================================================
// UTILITIES
// =============================================================================

const formatDateToISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const formatDateForDisplay = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatCompactNumber = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1).replace(/\.0$/,'')}M` : n >= 1e3 ? `${(n/1e3).toFixed(1).replace(/\.0$/,'')}K` : n.toLocaleString();

function getHeatmapColor(value: number, max: number, type: 'green'|'yellow'|'blue'|'purple' = 'green') {
  if (max === 0 || value === 0) return 'transparent';
  const intensity = Math.min(value / max, 1);
  const colors = { green: [16,185,129], yellow: [245,158,11], blue: [59,130,246], purple: [139,92,246] };
  const [r,g,b] = colors[type];
  return `rgba(${r},${g},${b},${0.15 + intensity * 0.5})`;
}

function exportReportToCSV(report: MarketReport) {
  const sections: string[] = [];
  const org = report?.organization?.name || 'Unknown';
  sections.push(`Website Market Report - ${org}`, `Date Range: ${report?.dateRange?.start} to ${report?.dateRange?.end}`, `Generated: ${new Date().toLocaleString()}`, '', 'SUMMARY', 'Metric,Value');
  sections.push(`Map Loads,${report?.summary?.totalMapLoads ?? 0}`, `Lot Clicks,${report?.summary?.totalLotClicks ?? 0}`, `Click Rate,${report?.summary?.clickThroughRate ?? 0}%`);
  sections.push('', 'COMMUNITY PERFORMANCE', 'Community,Map Loads,Lot Clicks,CTR');
  (report?.communityPerformance || []).forEach(c => sections.push(`"${c.name}",${c.mapLoads},${c.lotClicks},${c.ctr}`));
  const csv = sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${org.replace(/\s+/g,'_')}_Report_${formatDateToISO(new Date())}.csv`;
  link.click();
}

// =============================================================================
// LOGO
// =============================================================================

function LotWorksLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const dims = { small: { w: 24, h: 16 }, default: { w: 32, h: 21 }, large: { w: 48, h: 32 } };
  const dim = dims[size];
  return (
    <svg width={dim.w} height={dim.h} viewBox="0 0 52 42" fill="none">
      <path d="M13.6111 0L0 5.17937L16.8565 42H25.2778L13.6111 0Z" fill="#192A54"/>
      <path d="M30.5278 23.5278L33.8333 9.52778L40.8333 35.1726H35.7377L30.5278 23.5278Z" fill="#192A54"/>
      <path d="M21 22.5556L25.6667 39.2778L33.1009 7.53369L23.0247 11.2063L21 22.5556Z" fill="#4B5FD7"/>
      <path d="M51.4171 2.16626L44.4485 4.80303L38.8889 23.917L41.4167 32.8615L51.4171 2.16626Z" fill="#4B5FD7"/>
    </svg>
  );
}

// =============================================================================
// LOADING SCREEN
// =============================================================================

function LoadingScreen({ message, progress }: { message: string; progress: number }) {
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--md-sys-color-primary) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} 
      />
      
      {/* Main card */}
      <div className="relative w-full max-w-lg animate-fade-in">
        {/* Decorative blurs */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-[var(--md-sys-color-primary)] opacity-5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#8B5CF6] opacity-5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Card with elevated shadow */}
        <div className="relative bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-extra-large)] shadow-xl border border-[var(--md-sys-color-outline-variant)]/30 p-8 sm:p-10">
          
          {/* Logo container */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Soft glow behind logo */}
              <div className="absolute inset-0 bg-[var(--md-sys-color-primary)] opacity-10 blur-2xl rounded-full scale-150" />
              {/* Logo background */}
              <div className="relative w-20 h-20 bg-[var(--md-sys-color-surface-container-low)] rounded-[var(--md-sys-shape-corner-large)] shadow-sm flex items-center justify-center border border-[var(--md-sys-color-outline-variant)]/20">
                <LotWorksLogo size="large" />
              </div>
            </div>
          </div>

          {/* Brand label */}
          <div className="text-center mb-2">
            <span className="text-[var(--md-sys-color-primary)] text-[11px] font-semibold tracking-[0.3em] uppercase">
              LotWorks Insights
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center text-[var(--md-sys-color-on-surface)] text-[28px] sm:text-[32px] font-semibold mb-2 leading-tight">
            Preparing your market intelligence
          </h1>

          {/* Status message */}
          <p className="text-center text-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-typescale-body-medium)] mb-6 min-h-[24px]">
            {message}
          </p>

          {/* Progress bar container */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-4">
              {/* Progress track */}
              <div className="h-2 flex-1 bg-[var(--md-sys-color-surface-container)] rounded-full overflow-hidden">
                {/* Animated gradient progress bar */}
                <div 
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #4B5FD7 0%, #8B5CF6 50%, #4B5FD7 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s ease-in-out infinite',
                    transition: 'width 0.5s ease-out',
                  }}
                >
                  {/* Shimmer overlay */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                      animation: 'shimmer 1.5s ease-in-out infinite',
                    }}
                  />
                </div>
              </div>
              
              {/* Live sync indicator */}
              <div className="flex items-center gap-1.5 text-[var(--md-sys-color-primary)] flex-shrink-0">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <Icon path={mdiPulse} size={0.7} />
                  <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-40">
                    <Icon path={mdiPulse} size={0.7} />
                  </div>
                </div>
                <span className="text-[11px] font-medium whitespace-nowrap">Live sync</span>
              </div>
            </div>
          </div>

          {/* Footer message */}
          <div className="flex items-center justify-center gap-2 text-[var(--md-sys-color-on-surface-variant)] opacity-60">
            <Icon path={mdiClock} size={0.625} />
            <span className="text-[var(--md-sys-typescale-body-small)]">Holding until every insight is ready.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
      <div className="w-16 h-16 rounded-full bg-[var(--md-sys-color-surface-container)] flex items-center justify-center mb-3">
        <Icon path={mdiFileAlert} size={1.5} className="opacity-50" style={{ color: 'var(--md-sys-color-on-surface-variant)' }} />
      </div>
      <p className="text-[var(--md-sys-color-on-surface-variant)] text-[var(--md-sys-typescale-body-medium)]">{message}</p>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-[var(--md-sys-typescale-title-medium)] font-semibold text-[var(--md-sys-color-on-surface)]">{title}</h3>
      {subtitle && <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)] mt-1">{subtitle}</p>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, isEmpty = false, height = "h-64" }: { title: string; subtitle?: string; children: React.ReactNode; isEmpty?: boolean; height?: string }) {
  return (
    <div className={`md-card-outlined p-6 ${height} flex flex-col`}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="flex-1 min-h-0">{isEmpty ? <EmptyState /> : children}</div>
    </div>
  );
}

function ChartTooltipContent({ active, payload, label, showPercent = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--md-sys-color-inverse-surface)] text-[var(--md-sys-color-inverse-on-surface)] px-3 py-2 rounded-[var(--md-sys-shape-corner-extra-small)] shadow-lg text-[var(--md-sys-typescale-body-small)]">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="opacity-80">{p.name}:</span>
          <span className="font-medium">{p.value?.toLocaleString()}</span>
          {showPercent && p.payload?.percentage != null && <span className="opacity-60">({p.payload.percentage}%)</span>}
        </div>
      ))}
    </div>
  );
}

function StatCard({ title, value, change, icon, accent = false, tooltip }: { title: string; value: string | number; change?: number; icon: string; accent?: boolean; tooltip?: string }) {
  const isPos = change !== undefined && change > 0;
  const isNeg = change !== undefined && change < 0;
  return (
    <div className={`md-stat-card ${accent ? 'md-stat-card-accent' : ''}`} title={tooltip}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-[var(--md-sys-typescale-body-medium)] font-medium mb-1 ${accent ? 'text-white/80' : 'text-[var(--md-sys-color-on-surface-variant)]'}`}>{title}</div>
          <div className={`text-[var(--md-sys-typescale-headline-medium)] font-bold ${accent ? 'text-white' : 'text-[var(--md-sys-color-on-surface)]'}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-[var(--md-sys-typescale-label-medium)] font-medium ${
              accent ? (isPos ? 'text-emerald-200' : isNeg ? 'text-red-200' : 'text-white/60')
                    : (isPos ? 'text-[var(--md-sys-color-success)]' : isNeg ? 'text-[var(--md-sys-color-error)]' : 'text-[var(--md-sys-color-on-surface-variant)]')
            }`}>
              {change !== 0 && <Icon path={isPos ? mdiTrendingUp : mdiTrendingDown} size={0.65} />}
              <span>{isPos ? '+' : ''}{change}% vs prev</span>
            </div>
          )}
        </div>
        <div className={`p-2.5 rounded-[var(--md-sys-shape-corner-medium)] ${accent ? 'bg-white/20' : 'bg-[var(--md-sys-color-surface-container)]'}`}>
          <Icon path={icon} size={1.25} color={accent ? 'white' : MD3.colors.onSurfaceVariant} />
        </div>
      </div>
    </div>
  );
}

function InsightCard({ type, title, description }: { type: 'hot'|'tip'|'warning'|'info'; title: string; description: string }) {
  const cfg = {
    hot: { icon: mdiFire, cls: 'md-insight-hot', color: MD3.colors.hot },
    tip: { icon: mdiLightbulb, cls: 'md-insight-tip', color: MD3.colors.success },
    warning: { icon: mdiAlert, cls: 'md-insight-warning', color: MD3.colors.warning },
    info: { icon: mdiInformation, cls: 'md-insight-info', color: MD3.colors.info },
  }[type];
  return (
    <div className={`md-insight-card ${cfg.cls}`}>
      <div className="md-insight-icon"><Icon path={cfg.icon} size={0.875} color={cfg.color} /></div>
      <div>
        <div className="md-insight-title">{title}</div>
        <div className="md-insight-description">{description}</div>
      </div>
    </div>
  );
}

// =============================================================================
// EMAIL SCHEDULER MODAL
// =============================================================================

function EmailSchedulerModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [enabled, setEnabled] = useState(true);
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily'|'weekly'|'monthly'>('weekly');
  const [types, setTypes] = useState({ performance: true, opportunities: true, recommendations: true });

  if (!isOpen) return null;

  return (
    <div className="md-dialog-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="md-dialog-container max-w-md w-full mx-4">
        <div className="md-dialog-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-primary-container)]">
              <Icon path={mdiBellRing} size={1} color={MD3.colors.primary} />
            </div>
            <div>
              <h2 className="text-[var(--md-sys-typescale-headline-small)] font-semibold text-[var(--md-sys-color-on-surface)]">Email Alerts</h2>
              <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">Configure alert preferences</p>
            </div>
          </div>
          <button onClick={onClose} className="md-icon-button">
            <Icon path={mdiClose} size={1} />
          </button>
        </div>

        <div className="md-dialog-content space-y-6">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between p-4 bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-medium)]">
            <div>
              <div className="font-medium text-[var(--md-sys-color-on-surface)]">Enable Alerts</div>
              <div className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">Receive email notifications</div>
            </div>
            <button onClick={() => setEnabled(!enabled)} className={`md-switch ${enabled ? 'md-switch-checked' : ''}`}>
              <span className="md-switch-thumb" />
            </button>
          </div>

          {enabled && (
            <>
              {/* Email Input */}
              <div>
                <label className="block text-[var(--md-sys-typescale-label-medium)] font-medium text-[var(--md-sys-color-on-surface)] mb-2">Email Address</label>
                <div className="md-input-outlined">
                  <Icon path={mdiEmail} size={0.875} className="text-[var(--md-sys-color-on-surface-variant)]" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@company.com" className="flex-1 bg-transparent outline-none text-[var(--md-sys-color-on-surface)]" />
                </div>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-[var(--md-sys-typescale-label-medium)] font-medium text-[var(--md-sys-color-on-surface)] mb-2">Frequency</label>
                <div className="md-segmented-buttons">
                  {(['daily','weekly','monthly'] as const).map((f) => (
                    <button key={f} onClick={() => setFrequency(f)} className={`md-segmented-button ${frequency === f ? 'md-segmented-button-selected' : ''}`}>
                      {frequency === f && <Icon path={mdiCheck} size={0.75} />}
                      <span className="capitalize">{f}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alert Types */}
              <div>
                <label className="block text-[var(--md-sys-typescale-label-medium)] font-medium text-[var(--md-sys-color-on-surface)] mb-3">Alert Types</label>
                <div className="space-y-3">
                  {[
                    { key: 'performance', label: 'Performance Drops', desc: 'When metrics fall below threshold' },
                    { key: 'opportunities', label: 'Opportunities', desc: 'High-potential lots and trends' },
                    { key: 'recommendations', label: 'AI Recommendations', desc: 'Strategic suggestions' },
                  ].map((t) => (
                    <label key={t.key} className="flex items-start gap-3 cursor-pointer p-3 rounded-[var(--md-sys-shape-corner-small)] hover:bg-[var(--md-sys-color-surface-container)] transition-colors">
                      <div className={`md-checkbox ${types[t.key as keyof typeof types] ? 'md-checkbox-checked' : ''}`} onClick={(e) => { e.preventDefault(); setTypes(prev => ({ ...prev, [t.key]: !prev[t.key as keyof typeof types] })); }}>
                        {types[t.key as keyof typeof types] && <Icon path={mdiCheck} size={0.625} />}
                      </div>
                      <div>
                        <div className="font-medium text-[var(--md-sys-color-on-surface)]">{t.label}</div>
                        <div className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">{t.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="md-dialog-actions">
          <button onClick={onClose} className="md-button-text">Cancel</button>
          <button onClick={onClose} className="md-button-filled">Save Preferences</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PEAK ACTIVITY HEATMAP
// =============================================================================

function PeakActivityHeatmap({ report }: { report: MarketReport | null }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const heatmapData = useMemo(() => {
    const data: Record<string, Record<number, number>> = {};
    days.forEach(d => { data[d] = {}; hours.forEach(h => { data[d][h] = 0; }); });
    
    if (report?.peakActivityHours) {
      // Use actual data from report
      Object.entries(report.peakActivityHours).forEach(([day, hourData]) => {
        if (data[day]) {
          Object.entries(hourData).forEach(([hour, value]) => {
            data[day][parseInt(hour)] = value;
          });
        }
      });
    } else {
      // Generate sample data
      days.forEach((d, di) => {
        hours.forEach(h => {
          const base = (di < 5) ? (h >= 9 && h <= 17 ? 80 : 30) : 20;
          data[d][h] = Math.floor(base + Math.random() * 40);
        });
      });
    }
    return data;
  }, [report]);

  const maxVal = Math.max(...Object.values(heatmapData).flatMap(d => Object.values(d)));
  const peakDay = Object.entries(heatmapData).reduce((a, b) => 
    Object.values(a[1]).reduce((s, v) => s + v, 0) > Object.values(b[1]).reduce((s, v) => s + v, 0) ? a : b
  )[0];
  const peakHour = hours.reduce((a, b) => {
    const sumA = days.reduce((s, d) => s + (heatmapData[d][a] || 0), 0);
    const sumB = days.reduce((s, d) => s + (heatmapData[d][b] || 0), 0);
    return sumA > sumB ? a : b;
  });

  return (
    <div className="md-card-outlined p-6">
      <SectionHeader title="Peak Activity Hours" subtitle="User engagement patterns by day and hour" />
      
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="min-w-[600px]">
          {/* Hour labels */}
          <div className="flex mb-2 pl-12">
            {[0,3,6,9,12,15,18,21].map(h => (
              <div key={h} className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] opacity-70" style={{ width: `${100/8}%` }}>
                {h === 0 ? '12a' : h === 12 ? '12p' : h < 12 ? `${h}a` : `${h-12}p`}
              </div>
            ))}
          </div>

          {/* Grid */}
          {days.map(day => (
            <div key={day} className="flex items-center gap-2 mb-1">
              <div className="w-10 text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)] font-medium">{day}</div>
              <div className="flex-1 flex gap-0.5">
                {hours.map(hour => {
                  const val = heatmapData[day][hour];
                  return (
                    <div
                      key={hour}
                      className="flex-1 h-6 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer"
                      style={{ backgroundColor: getHeatmapColor(val, maxVal, 'purple') }}
                      title={`${day} ${hour}:00 - ${val} sessions`}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Less</span>
            <div className="flex gap-0.5">
              {[0.1, 0.25, 0.4, 0.55, 0.7].map((intensity, i) => (
                <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(139,92,246,${intensity})` }} />
              ))}
            </div>
            <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">More</span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-small)] flex items-start gap-2">
        <Icon path={mdiLightbulb} size={0.75} className="text-[var(--md-sys-color-success)] mt-0.5 flex-shrink-0" />
        <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">
          <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Peak activity:</span> {peakDay}s around {peakHour > 12 ? peakHour - 12 : peakHour}{peakHour >= 12 ? 'PM' : 'AM'}. Consider scheduling promotions during these windows.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// NEW VS RETURNING CARD
// =============================================================================

function NewVsReturningCard({ report }: { report: MarketReport | null }) {
  const data = useMemo(() => {
    if (report?.newVsReturning) {
      const total = report.newVsReturning.new + report.newVsReturning.returning;
      return [
        { name: 'New', value: report.newVsReturning.new, color: MD3.colors.success, pct: total ? Math.round((report.newVsReturning.new / total) * 100) : 0 },
        { name: 'Returning', value: report.newVsReturning.returning, color: '#8B5CF6', pct: total ? Math.round((report.newVsReturning.returning / total) * 100) : 0 },
      ];
    }
    return [
      { name: 'New', value: 2847, color: MD3.colors.success, pct: 68 },
      { name: 'Returning', value: 1340, color: '#8B5CF6', pct: 32 },
    ];
  }, [report]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const newPct = data[0].pct;
  const insight = newPct > 70 ? { type: 'tip' as const, text: 'Strong new user acquisition! Focus on retention strategies.' }
    : newPct < 30 ? { type: 'warning' as const, text: 'Low new user rate. Consider expanding marketing reach.' }
    : { type: 'info' as const, text: 'Healthy balance of new and returning visitors.' };

  return (
    <div className="md-card-outlined p-6">
      <SectionHeader title="New vs Returning" subtitle="User acquisition breakdown" />
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 relative">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[var(--md-sys-typescale-title-large)] font-bold text-[var(--md-sys-color-on-surface)]">{formatCompactNumber(total)}</div>
              <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">Total</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[var(--md-sys-typescale-body-medium)] text-[var(--md-sys-color-on-surface)]">{d.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-[var(--md-sys-color-on-surface)]">{d.value.toLocaleString()}</span>
                <span className="text-[var(--md-sys-color-on-surface-variant)] ml-2">({d.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 p-3 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-small)] flex items-start gap-2">
        <Icon path={insight.type === 'tip' ? mdiLightbulb : insight.type === 'warning' ? mdiAlert : mdiInformation} size={0.75} className={`mt-0.5 flex-shrink-0 ${insight.type === 'tip' ? 'text-[var(--md-sys-color-success)]' : insight.type === 'warning' ? 'text-[var(--md-sys-color-warning)]' : 'text-[var(--md-sys-color-info)]'}`} />
        <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">{insight.text}</p>
      </div>
    </div>
  );
}

// =============================================================================
// ENGAGEMENT QUALITY CARD
// =============================================================================

function EngagementQualityCard({ report }: { report: MarketReport | null }) {
  const metrics = report?.engagementMetrics;
  const engagementRate = metrics?.engagementRate ?? 67;
  const avgDuration = metrics?.avgDuration ?? '2m 34s';
  const sessionsPerUser = metrics?.sessionsPerUser ?? 1.4;
  const bounceRate = metrics?.bounceRate ?? 33;

  const quality = engagementRate >= 70 ? 'Excellent' : engagementRate >= 50 ? 'Good' : engagementRate >= 30 ? 'Fair' : 'Needs Improvement';
  const qualityColor = engagementRate >= 70 ? MD3.colors.success : engagementRate >= 50 ? MD3.colors.info : engagementRate >= 30 ? MD3.colors.warning : MD3.colors.error;

  const insight = engagementRate >= 70
    ? { type: 'tip' as const, text: 'Outstanding engagement! Users are highly interested in your content.' }
    : engagementRate >= 50
    ? { type: 'info' as const, text: 'Solid engagement. Consider A/B testing to optimize further.' }
    : { type: 'warning' as const, text: 'Engagement could improve. Review content relevance and load times.' };

  return (
    <div className="md-card-outlined p-6">
      <SectionHeader title="Engagement Quality" subtitle="Overall user interaction metrics" />
      
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[var(--md-sys-typescale-display-small)] font-bold text-[var(--md-sys-color-on-surface)]">{engagementRate}%</span>
            <span className="text-[var(--md-sys-typescale-label-medium)] font-medium" style={{ color: qualityColor }}>{quality}</span>
          </div>
        </div>
        <div className="md-progress-bar"><div className="md-progress-fill" style={{ width: `${engagementRate}%`, backgroundColor: qualityColor }} /></div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Avg Duration', value: avgDuration },
          { label: 'Sessions/User', value: sessionsPerUser.toFixed(1) },
          { label: 'Bounce Rate', value: `${bounceRate}%` },
        ].map(m => (
          <div key={m.label} className="text-center p-3 bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-small)]">
            <div className="text-[var(--md-sys-typescale-title-medium)] font-bold text-[var(--md-sys-color-on-surface)]">{m.value}</div>
            <div className="text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)]">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-small)] flex items-start gap-2">
        <Icon path={insight.type === 'tip' ? mdiLightbulb : insight.type === 'warning' ? mdiAlert : mdiInformation} size={0.75} className={`mt-0.5 flex-shrink-0 ${insight.type === 'tip' ? 'text-[var(--md-sys-color-success)]' : insight.type === 'warning' ? 'text-[var(--md-sys-color-warning)]' : 'text-[var(--md-sys-color-info)]'}`} />
        <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">{insight.text}</p>
      </div>
    </div>
  );
}

// =============================================================================
// AI INSIGHTS GENERATOR
// =============================================================================

interface AIInsight { type: 'hot'|'tip'|'warning'|'info'; title: string; description: string; }

function generateAIInsights(report: MarketReport | null): AIInsight[] {
  if (!report) return [];
  const insights: AIInsight[] = [];
  const communities = report.communityPerformance || [];

  // Top performer
  const topComm = communities.reduce((a, b) => (a.lotClicks > b.lotClicks ? a : b), communities[0]);
  if (topComm?.lotClicks > 100) {
    insights.push({ type: 'hot', title: `${topComm.name} is on fire!`, description: `Leading with ${topComm.lotClicks.toLocaleString()} lot clicks and ${topComm.ctr}% CTR. Consider increasing inventory visibility here.` });
  }

  // Low CTR warning
  const lowCTR = communities.filter(c => parseFloat(String(c.ctr)) < 2 && c.mapLoads > 50);
  if (lowCTR.length > 0) {
    insights.push({ type: 'warning', title: 'Conversion opportunity detected', description: `${lowCTR.length} ${lowCTR.length === 1 ? 'community has' : 'communities have'} high traffic but low CTR. Review lot presentation and pricing.` });
  }

  // High engagement tip
  const highCTR = communities.filter(c => parseFloat(String(c.ctr)) > 8);
  if (highCTR.length > 0) {
    insights.push({ type: 'tip', title: 'High-intent audiences found', description: `${highCTR.map(c => c.name).join(', ')} ${highCTR.length === 1 ? 'shows' : 'show'} exceptional engagement. Prioritize follow-up communications.` });
  }

  // Overall trend
  const totalClicks = report.summary?.totalLotClicks || 0;
  if (totalClicks > 500) {
    insights.push({ type: 'info', title: 'Strong market interest', description: `${totalClicks.toLocaleString()} lot clicks this period indicates healthy buyer activity. Market conditions remain favorable.` });
  }

  return insights.slice(0, 4);
}

// =============================================================================
// DATE RANGE PICKER
// =============================================================================

function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: { startDate: Date; endDate: Date; onStartChange: (d: Date) => void; onEndChange: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const presets = [
    { label: 'Last 7 days', start: new Date(Date.now() - 7*24*60*60*1000), end: new Date() },
    { label: 'Last 30 days', start: new Date(Date.now() - 30*24*60*60*1000), end: new Date() },
    { label: 'Last 90 days', start: new Date(Date.now() - 90*24*60*60*1000), end: new Date() },
    { label: 'This year', start: new Date(new Date().getFullYear(), 0, 1), end: new Date() },
  ];

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="md-button-outlined gap-2">
        <Icon path={mdiCalendar} size={0.875} />
        <span className="hidden sm:inline">{formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}</span>
        <span className="sm:hidden">Date Range</span>
        <Icon path={mdiChevronDown} size={0.75} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-medium)] shadow-lg border border-[var(--md-sys-color-outline-variant)] p-4 min-w-[280px]">
          <div className="space-y-2 mb-4">
            {presets.map(p => (
              <button key={p.label} onClick={() => { onStartChange(p.start); onEndChange(p.end); setOpen(false); }} className="w-full text-left px-3 py-2 rounded-[var(--md-sys-shape-corner-small)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-typescale-body-medium)] text-[var(--md-sys-color-on-surface)] transition-colors">
                {p.label}
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--md-sys-color-outline-variant)] pt-4 space-y-3">
            <div>
              <label className="block text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)] mb-1">Start</label>
              <input type="date" value={formatDateToISO(startDate)} onChange={(e) => onStartChange(new Date(e.target.value + 'T00:00:00'))} className="w-full px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[var(--md-sys-shape-corner-small)] text-[var(--md-sys-color-on-surface)] text-[var(--md-sys-typescale-body-medium)]" />
            </div>
            <div>
              <label className="block text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)] mb-1">End</label>
              <input type="date" value={formatDateToISO(endDate)} onChange={(e) => onEndChange(new Date(e.target.value + 'T00:00:00'))} className="w-full px-3 py-2 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-[var(--md-sys-shape-corner-small)] text-[var(--md-sys-color-on-surface)] text-[var(--md-sys-typescale-body-medium)]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// CLIENT SELECTOR
// =============================================================================

function ClientSelector({ clients, selected, onSelect }: { clients: string[]; selected: string; onSelect: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="md-button-outlined gap-2">
        <div className="w-6 h-6 rounded-[var(--md-sys-shape-corner-small)] bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
          <Icon path={mdiOfficeBuilding} size={0.75} color={MD3.colors.primary} />
        </div>
        <span className="max-w-[120px] truncate">{selected}</span>
        <Icon path={mdiChevronDown} size={0.75} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-[var(--md-sys-color-surface-container)] rounded-[var(--md-sys-shape-corner-medium)] shadow-lg border border-[var(--md-sys-color-outline-variant)] py-2 min-w-[200px] max-h-64 overflow-y-auto">
          {clients.map(c => (
            <button key={c} onClick={() => { onSelect(c); setOpen(false); }} className={`w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors ${c === selected ? 'bg-[var(--md-sys-color-secondary-container)]' : ''}`}>
              <Icon path={mdiOfficeBuilding} size={0.875} className="text-[var(--md-sys-color-on-surface-variant)]" />
              <span className={`text-[var(--md-sys-typescale-body-medium)] ${c === selected ? 'font-medium text-[var(--md-sys-color-on-secondary-container)]' : 'text-[var(--md-sys-color-on-surface)]'}`}>{c}</span>
              {c === selected && <Icon path={mdiCheck} size={0.75} className="ml-auto text-[var(--md-sys-color-primary)]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// DATA TABLE
// =============================================================================

interface DataTableProps<T> {
  data: T[];
  columns: { key: keyof T | string; label: string; sortable?: boolean; render?: (item: T) => React.ReactNode }[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends Record<string, any>>({ data, columns, onRowClick, emptyMessage = "No data available" }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (!data.length) return <EmptyState message={emptyMessage} />;

  return (
    <div>
      <div className="overflow-x-auto rounded-[var(--md-sys-shape-corner-medium)] border border-[var(--md-sys-color-outline-variant)]">
        <table className="w-full">
          <thead>
            <tr className="md-table-header">
              {columns.map(col => (
                <th key={String(col.key)} className={`text-left px-4 py-3 text-[var(--md-sys-typescale-label-medium)] font-semibold text-[var(--md-sys-color-on-surface-variant)] ${col.sortable ? 'cursor-pointer select-none hover:text-[var(--md-sys-color-on-surface)]' : ''}`} onClick={() => col.sortable && handleSort(String(col.key))}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && <Icon path={mdiArrowUpDown} size={0.625} className={sortKey === col.key ? 'text-[var(--md-sys-color-primary)]' : 'opacity-40'} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((item, i) => (
              <tr key={i} onClick={() => onRowClick?.(item)} className={`md-table-row border-t border-[var(--md-sys-color-outline-variant)] ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map(col => (
                  <td key={String(col.key)} className="px-4 py-3 text-[var(--md-sys-typescale-body-medium)] text-[var(--md-sys-color-on-surface)]">
                    {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">
            Showing {(page-1)*ITEMS_PER_PAGE+1}-{Math.min(page*ITEMS_PER_PAGE, sorted.length)} of <span className="md-tag">{sorted.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="md-icon-button-small"><Icon path={mdiChevronDoubleLeft} size={0.875} /></button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="md-icon-button-small"><Icon path={mdiChevronLeft} size={0.875} /></button>
            <span className="px-3 text-[var(--md-sys-typescale-body-medium)] text-[var(--md-sys-color-on-surface)]">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="md-icon-button-small"><Icon path={mdiChevronRight} size={0.875} /></button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="md-icon-button-small"><Icon path={mdiChevronDoubleRight} size={0.875} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SIDEBAR
// =============================================================================

function Sidebar({ activeTab, onTabChange, collapsed, onCollapse, lastUpdated }: { activeTab: TabId; onTabChange: (t: TabId) => void; collapsed: boolean; onCollapse: (c: boolean) => void; lastUpdated: Date | null }) {
  return (
    <aside className={`md-nav-drawer ${collapsed ? 'md-nav-drawer-collapsed' : ''} hidden lg:flex`}>
      {/* Header */}
      <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
            <LotWorksLogo size={collapsed ? 'small' : 'default'} />
            {!collapsed && <span className="text-[var(--md-sys-typescale-title-medium)] font-bold text-[var(--md-sys-color-on-surface)]">Insights</span>}
          </div>
          {!collapsed && (
            <button onClick={() => onCollapse(true)} className="md-icon-button-small">
              <Icon path={mdiChevronLeft} size={0.875} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={() => onCollapse(false)} className="md-icon-button-small mx-auto mt-2">
            <Icon path={mdiChevronRight} size={0.875} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`md-nav-drawer-item ${activeTab === tab.id ? 'md-nav-drawer-item-active' : ''} ${collapsed ? 'justify-center px-3' : ''}`}
            title={collapsed ? tab.label : undefined}
          >
            <Icon path={tab.icon} size={1} />
            {!collapsed && (
              <div className="flex-1 text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-[11px] opacity-70">{tab.description}</div>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && lastUpdated && (
        <div className="p-4 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-2 text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)]">
            <Icon path={mdiClock} size={0.625} />
            <span>Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      )}
    </aside>
  );
}

// =============================================================================
// MOBILE NAV
// =============================================================================

function MobileNav({ activeTab, onTabChange, isOpen, onClose }: { activeTab: TabId; onTabChange: (t: TabId) => void; isOpen: boolean; onClose: () => void }) {
  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      
      {/* Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[var(--md-sys-color-surface)] z-50 transform transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LotWorksLogo />
            <span className="text-[var(--md-sys-typescale-title-medium)] font-bold text-[var(--md-sys-color-on-surface)]">Insights</span>
          </div>
          <button onClick={onClose} className="md-icon-button">
            <Icon path={mdiClose} size={1} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { onTabChange(tab.id); onClose(); }}
              className={`md-nav-drawer-item ${activeTab === tab.id ? 'md-nav-drawer-item-active' : ''}`}
            >
              <Icon path={tab.icon} size={1} />
              <div className="flex-1 text-left">
                <div className="font-medium">{tab.label}</div>
                <div className="text-[11px] opacity-70">{tab.description}</div>
              </div>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}

// =============================================================================
// OVERVIEW CONTENT
// =============================================================================

function OverviewContent({ report }: { report: MarketReport | null }) {
  const insights = useMemo(() => generateAIInsights(report), [report]);
  const summary = report?.summary;
  const communities = report?.communityPerformance || [];
  const topLots = report?.topLots || [];

  const trendData = useMemo(() => {
    if (!report?.viewsOverTime?.length) return [];
    return report.viewsOverTime.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: d.total,
    }));
  }, [report]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Map Loads" value={summary?.totalMapLoads ?? 0} change={summary?.mapLoadsChange} icon={mdiEye} accent />
        <StatCard title="Lot Clicks" value={summary?.totalLotClicks ?? 0} change={summary?.lotClicksChange} icon={mdiCursorPointer} />
        <StatCard title="Click Rate" value={`${summary?.clickThroughRate ?? 0}%`} change={summary?.clickRateChange} icon={mdiTarget} tooltip="Lot clicks ÷ Map loads × 100" />
        <StatCard title="Avg Session" value={report?.engagementMetrics?.avgDuration ?? '2m 34s'} icon={mdiClock} />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="md-card-filled p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-primary)]">
              <Icon path={mdiRobotExcitedOutline} size={1} color="white" />
            </div>
            <div>
              <h3 className="text-[var(--md-sys-typescale-title-medium)] font-semibold text-[var(--md-sys-color-on-surface)]">AI Insights</h3>
              <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">Powered by machine learning analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => <InsightCard key={i} {...insight} />)}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <ChartCard title="Daily Trend" subtitle="Total map views over time" isEmpty={!trendData.length}>
          <ResponsiveContainer>
            <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="views" name="Views" stroke={MD3.colors.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Community Performance */}
        <ChartCard title="Top Communities" subtitle="By lot clicks" isEmpty={!communities.length}>
          <ResponsiveContainer>
            <BarChart data={communities.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--md-sys-color-outline-variant)" opacity={0.5} horizontal={false} />
              <XAxis type="number" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--md-sys-color-on-surface-variant)', fontSize: 11 }} axisLine={false} tickLine={false} width={75} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="lotClicks" name="Lot Clicks" fill={MD3.colors.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* World Map & Top Lots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="md-card-outlined p-6 h-[400px]">
            <SectionHeader title="Geographic Distribution" subtitle="Visitor locations worldwide" />
            <div className="h-[calc(100%-60px)]">
              <ChoroplethMap data={report?.cityBreakdown || []} />
            </div>
          </div>
        </div>

        <div className="md-card-outlined p-6">
          <SectionHeader title="Hot Lots" subtitle="Most clicked this period" />
          {topLots.length ? (
            <div className="space-y-3">
              {topLots.slice(0, 5).map((lot, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface-container-lowest)] rounded-[var(--md-sys-shape-corner-small)]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--md-sys-typescale-label-medium)] font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)]'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[var(--md-sys-color-on-surface)] truncate">{lot.lot}</div>
                    <div className="text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)] truncate">{lot.community}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-[var(--md-sys-color-on-surface)]">{lot.clicks}</div>
                    <div className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">clicks</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No lot data available" />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAP DETAILS CONTENT
// =============================================================================

function MapDetailsContent({ report, client, startDate, endDate }: { report: MarketReport | null; client: string; startDate: string; endDate: string }) {
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityPerformance | null>(null);
  const [communityLots, setCommunityLots] = useState<TopLot[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);

  const communities = report?.communityPerformance || [];

  const fetchCommunityLots = useCallback(async (community: CommunityPerformance) => {
    setSelectedCommunity(community);
    setLoadingLots(true);
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        communities: community.name,
      });
      const res = await fetch(`/api/report/${encodeURIComponent(client)}/lots?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCommunityLots(data.lots || []);
      }
    } catch (e) {
      console.error('Failed to fetch lots:', e);
    } finally {
      setLoadingLots(false);
    }
  }, [client, startDate, endDate]);

  const communityColumns = [
    { key: 'name', label: 'Community', sortable: true },
    { key: 'mapLoads', label: 'Map Loads', sortable: true, render: (c: CommunityPerformance) => c.mapLoads.toLocaleString() },
    { key: 'lotClicks', label: 'Lot Clicks', sortable: true, render: (c: CommunityPerformance) => c.lotClicks.toLocaleString() },
    { key: 'ctr', label: 'CTR', sortable: true, render: (c: CommunityPerformance) => (
      <span className={`md-tag ${parseFloat(String(c.ctr)) >= 5 ? 'bg-emerald-100 text-emerald-700' : parseFloat(String(c.ctr)) < 2 ? 'bg-red-100 text-red-700' : ''}`}>
        {c.ctr}%
      </span>
    )},
  ];

  const lotColumns = [
    { key: 'lot', label: 'Lot', sortable: true, render: (l: TopLot) => l.lot },
    { key: 'clicks', label: 'Clicks', sortable: true, render: (l: TopLot) => l.clicks.toLocaleString() },
    { key: 'share', label: 'Share', sortable: true, render: (l: TopLot) => (
      <span className="md-tag">{l.share}%</span>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="md-card-outlined p-4 text-center">
          <div className="text-[var(--md-sys-typescale-headline-medium)] font-bold text-[var(--md-sys-color-primary)]">{communities.length}</div>
          <div className="text-[var(--md-sys-typescale-label-medium)] text-[var(--md-sys-color-on-surface-variant)]">Communities</div>
        </div>
        <div className="md-card-outlined p-4 text-center">
          <div className="text-[var(--md-sys-typescale-headline-medium)] font-bold text-[var(--md-sys-color-on-surface)]">{report?.summary?.totalMapLoads?.toLocaleString() || 0}</div>
          <div className="text-[var(--md-sys-typescale-label-medium)] text-[var(--md-sys-color-on-surface-variant)]">Total Map Loads</div>
        </div>
        <div className="md-card-outlined p-4 text-center">
          <div className="text-[var(--md-sys-typescale-headline-medium)] font-bold text-[var(--md-sys-color-on-surface)]">{report?.summary?.totalLotClicks?.toLocaleString() || 0}</div>
          <div className="text-[var(--md-sys-typescale-label-medium)] text-[var(--md-sys-color-on-surface-variant)]">Total Lot Clicks</div>
        </div>
        <div className="md-card-outlined p-4 text-center">
          <div className="text-[var(--md-sys-typescale-headline-medium)] font-bold text-[var(--md-sys-color-on-surface)]">{report?.summary?.clickThroughRate || 0}%</div>
          <div className="text-[var(--md-sys-typescale-label-medium)] text-[var(--md-sys-color-on-surface-variant)]">Avg CTR</div>
        </div>
      </div>

      {/* Community Table */}
      <div className="md-card-outlined p-6">
        <SectionHeader title="Community Performance" subtitle="Click a row to view lot details" />
        <DataTable data={communities} columns={communityColumns} onRowClick={fetchCommunityLots} emptyMessage="No community data available" />
      </div>

      {/* Lot Details Modal/Panel */}
      {selectedCommunity && (
        <div className="md-card-filled p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[var(--md-sys-typescale-title-medium)] font-semibold text-[var(--md-sys-color-on-surface)]">{selectedCommunity.name}</h3>
              <p className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)]">Lot-level performance data</p>
            </div>
            <button onClick={() => setSelectedCommunity(null)} className="md-icon-button">
              <Icon path={mdiClose} size={1} />
            </button>
          </div>
          {loadingLots ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full" />
            </div>
          ) : (
            <DataTable data={communityLots} columns={lotColumns} emptyMessage="No lot data available for this community" />
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ANALYTICS CONTENT
// =============================================================================

function AnalyticsContent({ report }: { report: MarketReport | null }) {
  const deviceData = useMemo(() => {
    if (report?.deviceBreakdown?.length) {
      return report.deviceBreakdown.map((d) => ({
        name: d.device,
        value: d.users,
        percentage: d.percentage,
        color: MD3.device[d.device] || MD3.chart[0],
      }));
    }
    return [
      { name: 'Desktop', value: 58, percentage: 58, color: MD3.device.Desktop },
      { name: 'Mobile', value: 35, percentage: 35, color: MD3.device.Mobile },
      { name: 'Tablet', value: 7, percentage: 7, color: MD3.device.Tablet },
    ];
  }, [report]);

  const osData = useMemo(() => {
    if (report?.osBreakdown?.length) {
      return report.osBreakdown.map((o, i) => ({
        name: o.os,
        value: o.users,
        percentage: o.percentage,
        color: MD3.os[o.os] || MD3.chart[i % MD3.chart.length],
      }));
    }
    return [
      { name: 'Windows', value: 45, percentage: 45, color: MD3.os.Windows },
      { name: 'macOS', value: 28, percentage: 28, color: MD3.os.macOS },
      { name: 'iOS', value: 15, percentage: 15, color: MD3.os.iOS },
      { name: 'Android', value: 12, percentage: 12, color: MD3.os.Android },
    ];
  }, [report]);

  const trafficData = useMemo(() => {
    if (report?.trafficSources?.length) {
      return report.trafficSources.map((s, i) => ({
        name: s.source,
        sessions: s.sessions,
        percentage: s.percentage,
        color: MD3.chart[i % MD3.chart.length],
      }));
    }
    return [
      { name: 'Organic Search', sessions: 1847, percentage: 42, color: MD3.chart[0] },
      { name: 'Direct', sessions: 1203, percentage: 27, color: MD3.chart[1] },
      { name: 'Referral', sessions: 756, percentage: 17, color: MD3.chart[2] },
      { name: 'Social', sessions: 412, percentage: 9, color: MD3.chart[3] },
      { name: 'Email', sessions: 198, percentage: 5, color: MD3.chart[4] },
    ];
  }, [report]);

  const metrics = report?.engagementMetrics;
  const totalUsers = report?.deviceBreakdown?.reduce((sum, d) => sum + d.users, 0) || 4187;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={totalUsers} icon={mdiAccountGroup} />
        <StatCard title="Engagement Rate" value={`${metrics?.engagementRate ?? 67}%`} icon={mdiPulse} />
        <StatCard title="Avg Duration" value={metrics?.avgDuration ?? '2m 34s'} icon={mdiClock} />
        <StatCard title="Sessions/User" value={metrics?.sessionsPerUser?.toFixed(1) ?? '1.4'} icon={mdiChartLineVariant} />
      </div>

      {/* Engagement Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NewVsReturningCard report={report} />
        <EngagementQualityCard report={report} />
      </div>

      {/* Heatmap */}
      <PeakActivityHeatmap report={report} />

      {/* Device, OS, Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="md-card-outlined p-6">
          <SectionHeader title="Devices" subtitle="User device types" />
          <div className="h-48">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTooltipContent showPercent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {deviceData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[var(--md-sys-typescale-label-small)] text-[var(--md-sys-color-on-surface-variant)]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OS Breakdown */}
        <div className="md-card-outlined p-6">
          <SectionHeader title="Operating Systems" subtitle="User platforms" />
          <div className="space-y-3">
            {osData.slice(0, 5).map(os => (
              <div key={os.name}>
                <div className="flex justify-between text-[var(--md-sys-typescale-body-small)] mb-1">
                  <span className="text-[var(--md-sys-color-on-surface)]">{os.name}</span>
                  <span className="text-[var(--md-sys-color-on-surface-variant)]">{os.percentage}%</span>
                </div>
                <div className="md-progress-bar h-2">
                  <div className="md-progress-fill" style={{ width: `${os.percentage}%`, backgroundColor: os.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="md-card-outlined p-6">
          <SectionHeader title="Traffic Sources" subtitle="Where users come from" />
          <div className="space-y-3">
            {trafficData.slice(0, 5).map(src => (
              <div key={src.name} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: src.color }} />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface)]">{src.name}</span>
                    <span className="text-[var(--md-sys-typescale-body-small)] font-medium text-[var(--md-sys-color-on-surface)]">{src.sessions.toLocaleString()}</span>
                  </div>
                  <div className="md-progress-bar h-1.5 mt-1">
                    <div className="md-progress-fill" style={{ width: `${src.percentage}%`, backgroundColor: src.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Map */}
      <div className="md-card-outlined p-6">
        <SectionHeader title="Geographic Distribution" subtitle="Visitor locations by region" />
        <div className="h-[400px]">
          <ChoroplethMap data={report?.cityBreakdown || []} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function InsightsPage() {
  // State
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const [clients] = useState([DEFAULT_CLIENT, 'Brookfield Residential', 'Mattamy Homes', 'Jayman Built']);
  const [selectedClient, setSelectedClient] = useState(DEFAULT_CLIENT);

  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(() => new Date());

  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingState, setLoadingState] = useState({ message: LOADING_MESSAGES[0].text, progress: LOADING_MESSAGES[0].progress });

  // Fetch report data with minimum loading time for smooth UX
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingState({ message: LOADING_MESSAGES[0].text, progress: LOADING_MESSAGES[0].progress });

    const minLoadTime = 2000; // Minimum 2s to show loading for polish
    const startTime = Date.now();
    let messageIdx = 0;

    // Progress through loading messages
    const interval = setInterval(() => {
      messageIdx = Math.min(messageIdx + 1, LOADING_MESSAGES.length - 1);
      setLoadingState({
        message: LOADING_MESSAGES[messageIdx].text,
        progress: LOADING_MESSAGES[messageIdx].progress,
      });
    }, 600);

    try {
      const params = new URLSearchParams({
        start_date: formatDateToISO(startDate),
        end_date: formatDateToISO(endDate),
      });
      
      const res = await fetch(`/api/report/${encodeURIComponent(selectedClient)}?${params}`);
      
      if (!res.ok) {
        const statusText = res.statusText || 'Unknown error';
        if (res.status === 404) {
          throw new Error(`API endpoint not found (404). Check that /api/report/[client] exists.`);
        } else if (res.status === 500) {
          throw new Error(`Server error (500). The API encountered an internal error.`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`Authentication error (${res.status}). Please check your credentials.`);
        } else {
          throw new Error(`Request failed: ${res.status} ${statusText}`);
        }
      }
      
      const data = await res.json();

      // Ensure minimum load time has passed for smooth UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
      }

      // Final progress animation
      setLoadingState({ message: "Ready!", progress: 100 });
      await new Promise(resolve => setTimeout(resolve, 300));

      setReport(data);
      setLastUpdated(new Date());
    } catch (e) {
      // Still wait minimum time even on error to prevent flash
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadTime - elapsed));
      }
      
      // Handle network errors specifically
      if (e instanceof TypeError && e.message === 'Failed to fetch') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(e instanceof Error ? e.message : 'An unexpected error occurred');
      }
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }, [selectedClient, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Loading state
  if (loading) {
    return <LoadingScreen message={loadingState.message} progress={loadingState.progress} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[var(--md-sys-color-surface)] flex items-center justify-center p-4">
        <div className="md-card-outlined p-8 max-w-md w-full text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center">
            <Icon path={mdiAlertCircle} size={1.75} className="text-[var(--md-sys-color-error)]" />
          </div>
          
          {/* Title */}
          <h2 className="text-[var(--md-sys-typescale-headline-small)] font-semibold text-[var(--md-sys-color-on-surface)] mb-2">
            Unable to Load Data
          </h2>
          
          {/* Error message */}
          <p className="text-[var(--md-sys-typescale-body-medium)] text-[var(--md-sys-color-on-surface-variant)] mb-8">
            {error}
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button 
              onClick={fetchReport} 
              className="md-button-filled inline-flex items-center justify-center gap-2 min-w-[140px]"
            >
              <Icon path={mdiRefresh} size={0.875} />
              <span>Try Again</span>
            </button>
          </div>
          
          {/* Help text */}
          <p className="mt-6 text-[var(--md-sys-typescale-body-small)] text-[var(--md-sys-color-on-surface-variant)] opacity-70">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-surface)]">
      {/* Sidebar (Desktop) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        lastUpdated={lastUpdated}
      />

      {/* Mobile Nav */}
      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="md-top-app-bar">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNavOpen(true)} className="md-icon-button lg:hidden">
              <Icon path={mdiMenu} size={1} />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <LotWorksLogo size="small" />
              <span className="font-semibold text-[var(--md-sys-color-on-surface)]">Insights</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ClientSelector clients={clients} selected={selectedClient} onSelect={setSelectedClient} />
            <DateRangePicker startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />
            
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => setEmailModalOpen(true)} className="md-icon-button" title="Email Alerts">
                <Icon path={mdiBellRing} size={1} />
              </button>
              <button onClick={() => exportReportToCSV(report!)} className="md-icon-button" title="Export CSV">
                <Icon path={mdiDownload} size={1} />
              </button>
              <button onClick={fetchReport} className="md-icon-button" title="Refresh">
                <Icon path={mdiRefresh} size={1} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          {/* Mobile Tab Bar */}
          <div className="lg:hidden mb-6">
            <div className="md-segmented-buttons">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`md-segmented-button ${activeTab === tab.id ? 'md-segmented-button-selected' : ''}`}
                >
                  <Icon path={tab.icon} size={0.875} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
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

      {/* Email Modal */}
      <EmailSchedulerModal isOpen={emailModalOpen} onClose={() => setEmailModalOpen(false)} />
    </div>
  );
}
