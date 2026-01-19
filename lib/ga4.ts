import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { 
  MarketReport, 
  CommunityPerformance, 
  TopLot, 
  ViewOverTime, 
  Insight,
  DayOfWeekData,
  DeviceData,
  CountryData,
  BrowserData,
  OperatingSystemData,
  TrafficSource
} from '@/types';

// Service account credentials interface
interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

// Initialize GA4 client with environment variables
function getClient() {
  const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  
  if (base64Credentials) {
    try {
      const jsonString = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const credentials: ServiceAccountCredentials = JSON.parse(jsonString);
      
      return new BetaAnalyticsDataClient({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key,
        },
      });
    } catch (error) {
      console.error('Failed to parse base64 credentials:', error);
      throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_BASE64 format');
    }
  }
  
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  let privateKey = process.env.GA4_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    throw new Error('GA4 credentials not configured');
  }
  
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

// Helper to format seconds to MM:SS
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function fetchMapLoads(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<{ total: number; byCommunity: { community: string; path: string; mapLoads: number }[] }> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'customEvent:c_community' },
      { name: 'customEvent:c_urlpath' },
    ],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: {
          matchType: 'EXACT',
          value: clientName,
        },
      },
    },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 100,
  });

  const results: { community: string; path: string; mapLoads: number }[] = [];
  let total = 0;

  for (const row of response.rows || []) {
    const community = row.dimensionValues?.[0]?.value || '';
    const path = row.dimensionValues?.[1]?.value || '';
    const views = parseInt(row.metricValues?.[0]?.value || '0', 10);

    if (community && community !== '(not set)') {
      results.push({ community, path, mapLoads: views });
      total += views;
    }
  }

  return { total, byCommunity: results };
}

export async function fetchLotClicks(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<{ total: number; byCommunity: { community: string; lotClicks: number }[] }> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'customEvent:c_community' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT', value: 'maps-openInfoWin' },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT', value: clientName },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  });

  const results: { community: string; lotClicks: number }[] = [];
  let total = 0;

  for (const row of response.rows || []) {
    const community = row.dimensionValues?.[0]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    if (community && community !== '(not set)') {
      results.push({ community, lotClicks: clicks });
      total += clicks;
    }
  }

  return { total, byCommunity: results };
}

export async function fetchTopLots(
  clientName: string,
  startDate: string,
  endDate: string,
  limit: number = 25
): Promise<TopLot[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'customEvent:c_lot' },
      { name: 'customEvent:c_community' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT', value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT', value: 'maps-openInfoWin' },
            },
          },
        ],
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit,
  });

  const results: TopLot[] = [];
  let totalClicks = 0;

  for (const row of response.rows || []) {
    totalClicks += parseInt(row.metricValues?.[0]?.value || '0', 10);
  }

  let rank = 1;
  for (const row of response.rows || []) {
    const lot = row.dimensionValues?.[0]?.value || '';
    const community = row.dimensionValues?.[1]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    if (lot && lot !== '(not set)' && lot !== '-') {
      results.push({
        rank: rank++,
        lot,
        community: community || 'Unknown',
        clicks,
        share: totalClicks > 0 ? Math.round((clicks / totalClicks) * 10000) / 100 : 0,
      });
    }
  }

  return results;
}

export async function fetchViewsOverTime(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<ViewOverTime[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'date' },
      { name: 'customEvent:c_community' },
    ],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    limit: 10000,
  });

  const dateData: Record<string, ViewOverTime> = {};

  for (const row of response.rows || []) {
    const dateStr = row.dimensionValues?.[0]?.value || '';
    const community = row.dimensionValues?.[1]?.value || '';
    const views = parseInt(row.metricValues?.[0]?.value || '0', 10);

    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const dateObj = new Date(`${year}-${month}-${day}`);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!dateData[formattedDate]) {
      dateData[formattedDate] = { date: formattedDate, total: 0 };
    }

    const communityKey = community
      ? community.replace(/\s+/g, '').replace(/^./, (c) => c.toLowerCase())
      : 'other';

    dateData[formattedDate][communityKey] = views;
    dateData[formattedDate].total = (dateData[formattedDate].total as number) + views;
  }

  return Object.values(dateData);
}

export async function fetchClicksByDayOfWeek(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<DayOfWeekData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'dayOfWeek' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT', value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT', value: 'maps-openInfoWin' },
            },
          },
        ],
      },
    },
    orderBys: [{ dimension: { dimensionName: 'dayOfWeek' }, desc: false }],
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const results: DayOfWeekData[] = [];

  for (const row of response.rows || []) {
    const dayIndex = parseInt(row.dimensionValues?.[0]?.value || '0', 10);
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    results.push({
      day: dayNames[dayIndex] || 'Unknown',
      clicks,
      dayIndex,
    });
  }

  // Sort by day index (0=Sunday through 6=Saturday), but reorder to start with Monday
  results.sort((a, b) => {
    const aIdx = a.dayIndex === 0 ? 7 : a.dayIndex;
    const bIdx = b.dayIndex === 0 ? 7 : b.dayIndex;
    return aIdx - bIdx;
  });

  return results;
}

export async function fetchDeviceBreakdown(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<DeviceData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });

  let totalUsers = 0;
  const rawData: { device: string; users: number }[] = [];

  for (const row of response.rows || []) {
    const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
    totalUsers += users;
    rawData.push({
      device: row.dimensionValues?.[0]?.value || 'Unknown',
      users,
    });
  }

  return rawData.map(d => ({
    ...d,
    device: d.device.charAt(0).toUpperCase() + d.device.slice(1),
    percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
  }));
}

export async function fetchCountryBreakdown(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<CountryData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 10,
  });

  let totalUsers = 0;
  const rawData: { country: string; users: number }[] = [];

  for (const row of response.rows || []) {
    const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
    totalUsers += users;
    rawData.push({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      users,
    });
  }

  return rawData.map(d => ({
    ...d,
    percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
  }));
}

export async function fetchBrowserBreakdown(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<BrowserData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'browser' }],
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  let totalUsers = 0;
  const rawData: { browser: string; users: number }[] = [];

  for (const row of response.rows || []) {
    const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
    totalUsers += users;
    rawData.push({
      browser: row.dimensionValues?.[0]?.value || 'Unknown',
      users,
    });
  }

  return rawData.map(d => ({
    ...d,
    percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
  }));
}

export async function fetchOSBreakdown(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<OperatingSystemData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'operatingSystem' }],
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  let totalUsers = 0;
  const rawData: { os: string; users: number }[] = [];

  for (const row of response.rows || []) {
    const users = parseInt(row.metricValues?.[0]?.value || '0', 10);
    totalUsers += users;
    rawData.push({
      os: row.dimensionValues?.[0]?.value || 'Unknown',
      users,
    });
  }

  return rawData.map(d => ({
    ...d,
    percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
  }));
}

export async function fetchTrafficSources(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<TrafficSource[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 10,
  });

  let totalSessions = 0;
  const rawData: { source: string; medium: string; sessions: number }[] = [];

  for (const row of response.rows || []) {
    const sessions = parseInt(row.metricValues?.[0]?.value || '0', 10);
    totalSessions += sessions;
    rawData.push({
      source: row.dimensionValues?.[0]?.value || '(not set)',
      medium: row.dimensionValues?.[1]?.value || '(not set)',
      sessions,
    });
  }

  return rawData.map(d => ({
    ...d,
    percentage: totalSessions > 0 ? Math.round((d.sessions / totalSessions) * 1000) / 10 : 0,
  }));
}

export async function fetchAvgSessionDuration(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<string> {
  const client = getClient();

  try {
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'averageSessionDuration' }],
      dimensionFilter: {
        filter: {
          fieldName: 'customEvent:c_client',
          stringFilter: { matchType: 'EXACT', value: clientName },
        },
      },
    });

    const avgSeconds = parseFloat(response.rows?.[0]?.metricValues?.[0]?.value || '0');
    return formatDuration(avgSeconds);
  } catch {
    return '00:00';
  }
}

export async function fetchAvailableClients(): Promise<string[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
    dimensions: [{ name: 'customEvent:c_client' }],
    metrics: [{ name: 'eventCount' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 100,
  });

  const clients: string[] = [];

  for (const row of response.rows || []) {
    const clientName = row.dimensionValues?.[0]?.value || '';
    if (clientName && clientName !== '(not set)') {
      clients.push(clientName);
    }
  }

  return clients;
}

function generateInsights(
  communityPerformance: CommunityPerformance[],
  topLots: TopLot[],
  clicksByDay: DayOfWeekData[],
  ctr: number
): Insight[] {
  const insights: Insight[] = [];

  // Top community insight
  if (communityPerformance.length > 0) {
    const top = communityPerformance[0];
    insights.push({
      type: 'trending',
      title: `${top.name} leads engagement`,
      description: `With ${top.mapLoads.toLocaleString()} map loads and ${top.lotClicks.toLocaleString()} lot clicks, ${top.name} is your most active community.`,
    });
  }

  // Hot lot insight
  if (topLots.length > 0) {
    const hotLot = topLots[0];
    const lotName = hotLot.lot.split(',')[0];
    insights.push({
      type: 'hot',
      title: `${lotName} is generating strong interest`,
      description: `This lot in ${hotLot.community} received ${hotLot.clicks} clicks (${hotLot.share}% of total), indicating high buyer demand.`,
    });
  }

  // Best day insight
  if (clicksByDay.length > 0) {
    const bestDay = [...clicksByDay].sort((a, b) => b.clicks - a.clicks)[0];
    if (bestDay) {
      insights.push({
        type: 'opportunity',
        title: `${bestDay.day}s drive peak engagement`,
        description: `${bestDay.day} sees the highest lot click activity with ${bestDay.clicks.toLocaleString()} clicks. Consider timing promotions accordingly.`,
      });
    }
  }

  // Low CTR warning
  const lowCtrCommunities = communityPerformance.filter((c) => c.ctr < 15 && c.mapLoads > 50);
  if (lowCtrCommunities.length > 0) {
    const opp = lowCtrCommunities[0];
    insights.push({
      type: 'warning',
      title: `${opp.name} has conversion potential`,
      description: `High traffic (${opp.mapLoads.toLocaleString()} loads) but ${opp.ctr.toFixed(1)}% CTR. Review lot availability and pricing.`,
    });
  }

  return insights.slice(0, 4);
}

export async function buildFullReport(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<MarketReport> {
  // Fetch all data in parallel
  const [
    mapLoads, 
    lotClicks, 
    topLots, 
    viewsOverTime,
    clicksByDayOfWeek,
    deviceBreakdown,
    countryBreakdown,
    browserBreakdown,
    osBreakdown,
    trafficSources,
    avgTimeOnMap
  ] = await Promise.all([
    fetchMapLoads(clientName, startDate, endDate),
    fetchLotClicks(clientName, startDate, endDate),
    fetchTopLots(clientName, startDate, endDate, 25),
    fetchViewsOverTime(clientName, startDate, endDate),
    fetchClicksByDayOfWeek(clientName, startDate, endDate),
    fetchDeviceBreakdown(clientName, startDate, endDate),
    fetchCountryBreakdown(clientName, startDate, endDate),
    fetchBrowserBreakdown(clientName, startDate, endDate),
    fetchOSBreakdown(clientName, startDate, endDate),
    fetchTrafficSources(clientName, startDate, endDate),
    fetchAvgSessionDuration(clientName, startDate, endDate),
  ]);

  // Merge community data
  const communityData: Record<string, CommunityPerformance> = {};

  for (const item of mapLoads.byCommunity) {
    communityData[item.community] = {
      name: item.community,
      path: item.path,
      mapLoads: item.mapLoads,
      lotClicks: 0,
      ctr: 0,
    };
  }

  for (const item of lotClicks.byCommunity) {
    if (communityData[item.community]) {
      communityData[item.community].lotClicks = item.lotClicks;
      const loads = communityData[item.community].mapLoads;
      if (loads > 0) {
        communityData[item.community].ctr = Math.round((item.lotClicks / loads) * 1000) / 10;
      }
    } else {
      // Community has clicks but no loads tracked
      communityData[item.community] = {
        name: item.community,
        path: '',
        mapLoads: 0,
        lotClicks: item.lotClicks,
        ctr: 0,
      };
    }
  }

  const communityPerformance = Object.values(communityData).sort(
    (a, b) => b.mapLoads - a.mapLoads
  );

  // Calculate summary
  const totalMapLoads = mapLoads.total;
  const totalLotClicks = lotClicks.total;
  const ctr = totalMapLoads > 0 ? Math.round((totalLotClicks / totalMapLoads) * 1000) / 10 : 0;
  const topCommunity = communityPerformance[0]?.name || 'N/A';

  // Format dates for display
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    organization: {
      name: clientName,
      clientId: clientName.toLowerCase().replace(/\s+/g, '-'),
    },
    dateRange: {
      start: formatDate(startDateObj),
      end: formatDate(endDateObj),
      label: `${startDate} to ${endDate}`,
    },
    summary: {
      totalMapLoads,
      totalLotClicks,
      clickThroughRate: ctr,
      topCommunity,
      avgTimeOnMap,
    },
    communityPerformance,
    topLots,
    viewsOverTime,
    clicksByDayOfWeek,
    deviceBreakdown,
    countryBreakdown,
    browserBreakdown,
    osBreakdown,
    trafficSources,
    insights: generateInsights(communityPerformance, topLots, clicksByDayOfWeek, ctr),
  };
}
