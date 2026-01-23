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
  CityData,
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

const DAY_OF_WEEK_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeDayLabel(dayIndex: number): string {
  return DAY_OF_WEEK_LABELS[dayIndex] ?? `Day${dayIndex}`;
}

export async function fetchPeakActivityHours(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<Record<string, Record<number, number>> | undefined> {
  try {
    const client = getClient();

    // Use activeUsers instead of sessions - works better with event-scoped custom parameter filters
    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'dayOfWeek' }, { name: 'hour' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'customEvent:c_client',
          stringFilter: { matchType: 'EXACT', value: clientName },
        },
      },
      orderBys: [
        { dimension: { dimensionName: 'dayOfWeek' }, desc: false },
        { dimension: { dimensionName: 'hour' }, desc: false },
      ],
    });

    const activity: Record<string, Record<number, number>> = {};

    for (const row of response.rows || []) {
      const dayValue = row.dimensionValues?.[0]?.value;
      const hourValue = row.dimensionValues?.[1]?.value;
      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);

      const dayIndex = dayValue ? Number.parseInt(dayValue, 10) : NaN;
      const hourIndex = hourValue ? Number.parseInt(hourValue, 10) : NaN;

      if (Number.isNaN(dayIndex) || Number.isNaN(hourIndex)) {
        continue;
      }

      const dayLabel = normalizeDayLabel(dayIndex);
      if (!activity[dayLabel]) {
        activity[dayLabel] = {};
      }

      activity[dayLabel][hourIndex] = users;
    }

    // Return undefined if no data (frontend will use sample data)
    return Object.keys(activity).length > 0 ? activity : undefined;
  } catch (error) {
    console.error('Failed to fetch peak activity hours:', error);
    return undefined;
  }
}

export async function fetchNewVsReturning(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<{ new: number; returning: number } | undefined> {
  try {
    const client = getClient();

    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'newVsReturning' }],
      metrics: [{ name: 'totalUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'customEvent:c_client',
          stringFilter: { matchType: 'EXACT', value: clientName },
        },
      },
    });

    let newUsers = 0;
    let returningUsers = 0;

    for (const row of response.rows || []) {
      const segment = row.dimensionValues?.[0]?.value?.toLowerCase() ?? '';
      const users = parseInt(row.metricValues?.[0]?.value || '0', 10);

      if (segment.includes('new')) {
        newUsers = users;
      } else if (segment.includes('return')) {
        returningUsers = users;
      }
    }

    // Return undefined if no data (frontend will use sample data)
    if (newUsers === 0 && returningUsers === 0) {
      return undefined;
    }

    return { new: newUsers, returning: returningUsers };
  } catch (error) {
    console.error('Failed to fetch new vs returning:', error);
    return undefined;
  }
}

export async function fetchEngagementMetrics(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<{
  engagementRate: number;
  avgDuration: string;
  bounceRate: number;
  sessionsPerUser: number;
} | undefined> {
  try {
    const client = getClient();

    const [response] = await client.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'sessionsPerUser' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'customEvent:c_client',
          stringFilter: { matchType: 'EXACT', value: clientName },
        },
      },
    });

    const row = response.rows?.[0];
    if (!row) {
      return undefined;
    }

    const engagementRateRaw = Number.parseFloat(row.metricValues?.[0]?.value || '0');
    const avgDurationSeconds = Number.parseFloat(row.metricValues?.[1]?.value || '0');
    const bounceRateRaw = Number.parseFloat(row.metricValues?.[2]?.value || '0');
    const sessionsPerUser = Number.parseFloat(row.metricValues?.[3]?.value || '0');

    // GA4 returns rates as decimals (0.64), convert to percentages (64)
    const engagementRate = Math.round(engagementRateRaw * 100);
    const bounceRate = Math.round(bounceRateRaw * 100);

    return {
      engagementRate,
      avgDuration: formatDuration(avgDurationSeconds),
      bounceRate,
      sessionsPerUser: Math.round(sessionsPerUser * 10) / 10, // Round to 1 decimal
    };
  } catch (error) {
    console.error('Failed to fetch engagement metrics:', error);
    return undefined;
  }
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

    // Exclude treetracking paths and invalid entries
    if (community && community !== '(not set)' && !path.toLowerCase().includes('treetracking')) {
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
    dimensions: [
      { name: 'customEvent:c_community' },
      { name: 'customEvent:c_urlpath' },
    ],
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
    limit: 500,
  });

  // Aggregate by community, excluding treetracking paths
  const communityTotals: Record<string, number> = {};
  let total = 0;

  for (const row of response.rows || []) {
    const community = row.dimensionValues?.[0]?.value || '';
    const path = row.dimensionValues?.[1]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Exclude treetracking paths
    if (community && community !== '(not set)' && !path.toLowerCase().includes('treetracking')) {
      communityTotals[community] = (communityTotals[community] || 0) + clicks;
      total += clicks;
    }
  }

  const results = Object.entries(communityTotals)
    .map(([community, lotClicks]) => ({ community, lotClicks }))
    .sort((a, b) => b.lotClicks - a.lotClicks);

  return { total, byCommunity: results };
}

export async function fetchTopLots(
  clientName: string,
  startDate: string,
  endDate: string,
  limit: number = 25,
  communities?: string[]
): Promise<TopLot[]> {
  const client = getClient();

  // Build dimension filter - structure differs based on whether we have community filter
  let dimensionFilter;

  if (communities && communities.length > 0) {
    // With community filter - use andGroup with all three filters
    dimensionFilter = {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT' as const, value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT' as const, value: 'maps-openInfoWin' },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_community',
              inListFilter: { values: communities },
            },
          },
        ],
      },
    };
  } else {
    // Without community filter - just client and category
    dimensionFilter = {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT' as const, value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT' as const, value: 'maps-openInfoWin' },
            },
          },
        ],
      },
    };
  }

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'customEvent:c_lot' },
      { name: 'customEvent:c_community' },
      { name: 'customEvent:c_urlpath' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter,
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: limit * 3, // Fetch more to account for filtered rows
  });

  // Aggregate by lot+community, excluding treetracking paths
  const lotTotals: Record<string, { lot: string; community: string; clicks: number }> = {};
  let totalClicks = 0;

  for (const row of response.rows || []) {
    const lot = row.dimensionValues?.[0]?.value || '';
    const community = row.dimensionValues?.[1]?.value || '';
    const path = row.dimensionValues?.[2]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Exclude treetracking paths and invalid lots
    if (lot && lot !== '(not set)' && lot !== '-' && !path.toLowerCase().includes('treetracking')) {
      const key = `${lot}|${community}`;
      if (!lotTotals[key]) {
        lotTotals[key] = { lot, community: community || 'Unknown', clicks: 0 };
      }
      lotTotals[key].clicks += clicks;
      totalClicks += clicks;
    }
  }

  // Sort and rank
  const sortedLots = Object.values(lotTotals)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);

  return sortedLots.map((item, index) => ({
    rank: index + 1,
    lot: item.lot,
    community: item.community,
    clicks: item.clicks,
    share: totalClicks > 0 ? Math.round((item.clicks / totalClicks) * 10000) / 100 : 0,
  }));
}

export async function fetchTotalLotsWithClicks(
  clientName: string,
  startDate: string,
  endDate: string,
  communities?: string[]
): Promise<number> {
  const client = getClient();

  // Build dimension filter - structure differs based on whether we have community filter
  let dimensionFilter;

  if (communities && communities.length > 0) {
    // With community filter - use andGroup with all three filters
    dimensionFilter = {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT' as const, value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT' as const, value: 'maps-openInfoWin' },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_community',
              inListFilter: { values: communities },
            },
          },
        ],
      },
    };
  } else {
    // Without community filter - just client and category
    dimensionFilter = {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'customEvent:c_client',
              stringFilter: { matchType: 'EXACT' as const, value: clientName },
            },
          },
          {
            filter: {
              fieldName: 'customEvent:c_category',
              stringFilter: { matchType: 'EXACT' as const, value: 'maps-openInfoWin' },
            },
          },
        ],
      },
    };
  }

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'customEvent:c_lot' },
      { name: 'customEvent:c_community' },
      { name: 'customEvent:c_urlpath' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter,
    limit: 50000, // High limit to get all lots with clicks
  });

  // Aggregate by lot+community to count unique lots with clicks, excluding treetracking paths
  const uniqueLots: Set<string> = new Set();

  for (const row of response.rows || []) {
    const lot = row.dimensionValues?.[0]?.value || '';
    const community = row.dimensionValues?.[1]?.value || '';
    const path = row.dimensionValues?.[2]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Exclude treetracking paths and invalid lots, and only count lots with actual clicks
    if (lot && lot !== '(not set)' && lot !== '-' && !path.toLowerCase().includes('treetracking') && clicks > 0) {
      const key = `${lot}|${community}`;
      uniqueLots.add(key);
    }
  }

  return uniqueLots.size;
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
      { name: 'customEvent:c_urlpath' },
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
    const path = row.dimensionValues?.[2]?.value || '';
    const views = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Exclude treetracking paths
    if (path.toLowerCase().includes('treetracking')) {
      continue;
    }

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

    // Aggregate views for same date+community (may have multiple paths)
    const existingViews = (dateData[formattedDate][communityKey] as number) || 0;
    dateData[formattedDate][communityKey] = existingViews + views;
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
    dimensions: [
      { name: 'dayOfWeek' },
      { name: 'customEvent:c_urlpath' },
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
    orderBys: [{ dimension: { dimensionName: 'dayOfWeek' }, desc: false }],
    limit: 500,
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayTotals: Record<number, number> = {};

  for (const row of response.rows || []) {
    const dayIndex = parseInt(row.dimensionValues?.[0]?.value || '0', 10);
    const path = row.dimensionValues?.[1]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Exclude treetracking paths
    if (!path.toLowerCase().includes('treetracking')) {
      dayTotals[dayIndex] = (dayTotals[dayIndex] || 0) + clicks;
    }
  }

  const results: DayOfWeekData[] = Object.entries(dayTotals).map(([idx, clicks]) => ({
    day: dayNames[parseInt(idx)] || 'Unknown',
    clicks,
    dayIndex: parseInt(idx),
  }));

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

// Major city coordinates for mapping
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // North America
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Phoenix': { lat: 33.4484, lng: -112.0740 },
  'Toronto': { lat: 43.6532, lng: -79.3832 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 },
  'Montreal': { lat: 45.5017, lng: -73.5673 },
  'Calgary': { lat: 51.0447, lng: -114.0719 },
  'Edmonton': { lat: 53.5461, lng: -113.4938 },
  'Ottawa': { lat: 45.4215, lng: -75.6972 },
  'Winnipeg': { lat: 49.8951, lng: -97.1384 },
  'Mexico City': { lat: 19.4326, lng: -99.1332 },
  'San Francisco': { lat: 37.7749, lng: -122.4194 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Denver': { lat: 39.7392, lng: -104.9903 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Atlanta': { lat: 33.7490, lng: -84.3880 },
  'Boston': { lat: 42.3601, lng: -71.0589 },
  // Europe
  'London': { lat: 51.5074, lng: -0.1278 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Berlin': { lat: 52.5200, lng: 13.4050 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  // Asia Pacific
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Sydney': { lat: -33.8688, lng: 151.2093 },
  'Melbourne': { lat: -37.8136, lng: 144.9631 },
  'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Shanghai': { lat: 31.2304, lng: 121.4737 },
  'Beijing': { lat: 39.9042, lng: 116.4074 },
  'Seoul': { lat: 37.5665, lng: 126.9780 },
  // South America
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  'Rio de Janeiro': { lat: -22.9068, lng: -43.1729 },
};

export async function fetchCityBreakdown(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<CityData[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'city' },
      { name: 'country' },
    ],
    metrics: [{ name: 'activeUsers' }],
    dimensionFilter: {
      filter: {
        fieldName: 'customEvent:c_client',
        stringFilter: { matchType: 'EXACT', value: clientName },
      },
    },
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 100,
  });

  let totalUsers = 0;
  const rawData: { city: string; country: string; users: number }[] = [];

  for (const row of response.rows || []) {
    const city = row.dimensionValues?.[0]?.value || '';
    const country = row.dimensionValues?.[1]?.value || '';
    const users = parseInt(row.metricValues?.[0]?.value || '0', 10);

    // Skip entries without a valid city name
    if (city && city !== '(not set)' && users > 0) {
      totalUsers += users;
      rawData.push({ city, country, users });
    }
  }

  return rawData.map(d => {
    // Try to find coordinates for the city
    const coords = CITY_COORDINATES[d.city] || { lat: 0, lng: 0 };
    
    return {
      city: d.city,
      country: d.country,
      lat: coords.lat,
      lng: coords.lng,
      users: d.users,
      percentage: totalUsers > 0 ? Math.round((d.users / totalUsers) * 1000) / 10 : 0,
    };
  });
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
    // Remove community name from lot string since it's shown separately in description
    const lotWithoutCommunity = hotLot.lot
      .replace(new RegExp(`,?\\s*${hotLot.community.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,?`, 'gi'), '')
      .trim();
    insights.push({
      type: 'hot',
      title: `${lotWithoutCommunity} is generating strong interest`,
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
    totalLotsWithClicks,
    viewsOverTime,
    clicksByDayOfWeek,
    deviceBreakdown,
    countryBreakdown,
    cityBreakdown,
    browserBreakdown,
    osBreakdown,
    trafficSources,
    avgTimeOnMap,
    peakActivityHours,
    newVsReturning,
    engagementMetrics,
  ] = await Promise.all([
    fetchMapLoads(clientName, startDate, endDate),
    fetchLotClicks(clientName, startDate, endDate),
    fetchTopLots(clientName, startDate, endDate, 50),
    fetchTotalLotsWithClicks(clientName, startDate, endDate),
    fetchViewsOverTime(clientName, startDate, endDate),
    fetchClicksByDayOfWeek(clientName, startDate, endDate),
    fetchDeviceBreakdown(clientName, startDate, endDate),
    fetchCountryBreakdown(clientName, startDate, endDate),
    fetchCityBreakdown(clientName, startDate, endDate),
    fetchBrowserBreakdown(clientName, startDate, endDate),
    fetchOSBreakdown(clientName, startDate, endDate),
    fetchTrafficSources(clientName, startDate, endDate),
    fetchAvgSessionDuration(clientName, startDate, endDate),
    fetchPeakActivityHours(clientName, startDate, endDate),
    fetchNewVsReturning(clientName, startDate, endDate),
    fetchEngagementMetrics(clientName, startDate, endDate),
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
      totalLotsWithClicks,
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
    cityBreakdown,
    browserBreakdown,
    osBreakdown,
    trafficSources,
    peakActivityHours,
    newVsReturning,
    engagementMetrics,
    insights: generateInsights(communityPerformance, topLots, clicksByDayOfWeek, ctr),
  };
}
