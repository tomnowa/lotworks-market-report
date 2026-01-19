'use client';

import { useState, useEffect } from 'react';
import {
  Eye,
  MousePointerClick,
  Target,
  MapPin,
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { CommunityRow } from '@/components/dashboard/CommunityRow';
import { TopLotRow } from '@/components/dashboard/TopLotRow';
import { ViewsOverTimeChart, CommunityComparisonChart } from '@/components/charts';
import type { MarketReport } from '@/types';

export default function DashboardPage() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);

  // For demo purposes, using a hardcoded client
  // In production, this would come from auth context or URL params
  const clientName = 'Coastal Bend Lots';

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const response = await fetch(`/api/report/${encodeURIComponent(clientName)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }
        const data = await response.json();
        setReport(data);
        setIsMockData(data._mock === true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [clientName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Report</h2>
          <p className="text-slate-600">{error || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const maxLoads = Math.max(...report.communityPerformance.map((c) => c.mapLoads));
  const maxClicks = Math.max(...report.communityPerformance.map((c) => c.lotClicks));
  const maxLotClicks = Math.max(...report.topLots.map((l) => l.clicks));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mock Data Banner */}
      {isMockData && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              <strong>Demo Mode:</strong> Showing mock data. Configure GA4 environment variables for live data.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="gradient-header text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-400 to-lime-500 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-lg">W</span>
              </div>
              <div>
                <div className="text-sm text-slate-400">LotWorks</div>
                <div className="font-semibold">Website Market Report</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-sm">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-400 text-slate-900 hover:bg-lime-300 transition-colors text-sm font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Organization & Date */}
          <div className="flex items-end justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 text-sm mb-3">
                <Building2 className="w-4 h-4 text-lime-400" />
                <span className="text-slate-300">Organization</span>
              </div>
              <h1 className="text-4xl font-bold mb-2">{report.organization.name}</h1>
              <p className="text-slate-400">
                Public map analytics and buyer engagement insights
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {report.dateRange.start} – {report.dateRange.end}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
        <div className="h-8 bg-slate-50 rounded-t-[2rem]" />
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 -mt-4 pb-12">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Map Loads"
            value={report.summary.totalMapLoads}
            change={report.summary.mapLoadsChange}
            changeLabel="vs. previous period"
            icon={Eye}
            accent={true}
          />
          <StatCard
            title="Total Lot Clicks"
            value={report.summary.totalLotClicks}
            change={report.summary.lotClicksChange}
            changeLabel="vs. previous period"
            icon={MousePointerClick}
          />
          <StatCard
            title="Click-through Rate"
            value={`${report.summary.clickThroughRate.toFixed(1)}%`}
            icon={Target}
          />
          <StatCard
            title="Top Community"
            value={report.summary.topCommunity}
            icon={MapPin}
          />
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-lime-400 pulse-subtle" />
            <h2 className="text-lg font-semibold text-slate-800">AI Insights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {report.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views Over Time */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Map Loads Over Time</h2>
              <select className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white">
                <option value="all">All Communities</option>
                <option value="gemini">Gemini</option>
                <option value="kingsLanding">Kings Landing</option>
              </select>
            </div>
            <div className="h-64">
              <ViewsOverTimeChart data={report.viewsOverTime} />
            </div>
          </div>

          {/* Community Comparison Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">
              Community Comparison
            </h2>
            <div className="h-64">
              <CommunityComparisonChart data={report.communityPerformance} />
            </div>
          </div>
        </div>

        {/* Detailed Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Community Performance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Community Performance</h2>
              <span className="text-sm text-slate-400">
                {report.communityPerformance.length} communities
              </span>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Community</div>
              <div className="col-span-3">Map Loads</div>
              <div className="col-span-3">Lot Clicks</div>
              <div className="col-span-2 text-right">CTR</div>
            </div>

            {/* Table Body */}
            <div>
              {report.communityPerformance.map((community) => (
                <CommunityRow
                  key={community.name}
                  community={community}
                  maxLoads={maxLoads}
                  maxClicks={maxClicks}
                />
              ))}
            </div>
          </div>

          {/* Top Lots */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 card-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Top 10 Most Clicked Lots</h2>
              <span className="text-sm text-slate-400">of {report.topLots.length * 7} total</span>
            </div>

            <div>
              {report.topLots.map((lot) => (
                <TopLotRow key={lot.rank} lot={lot} maxClicks={maxLotClicks} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm text-slate-500">
          <div>
            Powered by <span className="font-semibold text-slate-700">LotWorks</span>
          </div>
          <div>Data refreshed: {new Date().toLocaleString()}</div>
        </div>
      </footer>
    </div>
  );
}
