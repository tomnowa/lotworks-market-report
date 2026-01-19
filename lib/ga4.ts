import { BetaAnalyticsDataClient } from '@google-analytics/data';
import type { MarketReport, CommunityPerformance, TopLot, ViewOverTime, Insight } from '@/types';

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
  // Method 1: Base64-encoded full JSON (recommended for Vercel)
  const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  
  if (base64Credentials) {
    try {
      const jsonString = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const credentials: ServiceAccountCredentials = JSON.parse(jsonString);
      
      console.log('Using base64-encoded service account');
      console.log('Client email:', credentials.client_email);
      console.log('Project ID:', credentials.project_id);
      
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
  
  // Method 2: Separate environment variables (fallback)
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  let privateKey = process.env.GA4_PRIVATE_KEY;
  
  if (!clientEmail || !privateKey) {
    throw new Error('GA4 credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_BASE64 or both GA4_CLIENT_EMAIL and GA4_PRIVATE_KEY');
  }
  
  // Handle different private key formats
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  console.log('Using separate env vars for credentials');
  console.log('Client email:', clientEmail);
  
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

const PROPERTY_ID = process.env.GA4_PROPERTY_ID;

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
  limit: number = 10
): Promise<TopLot[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'customEvent:c_lot' }],
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
            notExpression: {
              filter: {
                fieldName: 'customEvent:c_lot',
                stringFilter: { matchType: 'EXACT', value: '-' },
              },
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

  // First pass: calculate total
  for (const row of response.rows || []) {
    totalClicks += parseInt(row.metricValues?.[0]?.value || '0', 10);
  }

  // Second pass: build results
  let rank = 1;
  for (const row of response.rows || []) {
    const lot = row.dimensionValues?.[0]?.value || '';
    const clicks = parseInt(row.metricValues?.[0]?.value || '0', 10);

    if (lot && lot !== '(not set)') {
      const parts = lot.split(', ');
      const community = parts[parts.length - 1] || 'Unknown';

      results.push({
        rank: rank++,
        lot,
        community,
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

    // Format date for display (YYYYMMDD -> Mon DD)
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    const dateObj = new Date(`${year}-${month}-${day}`);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!dateData[formattedDate]) {
      dateData[formattedDate] = { date: formattedDate, total: 0 };
    }

    // Convert community name to camelCase key
    const communityKey = community
      ? community.replace(/\s+/g, '').replace(/^./, (c) => c.toLowerCase())
      : 'other';

    dateData[formattedDate][communityKey] = views;
    dateData[formattedDate].total = (dateData[formattedDate].total as number) + views;
  }

  return Object.values(dateData);
}

export async function fetchAvailableClients(): Promise<string[]> {
  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${PROPERTY_ID}`,
    dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
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
  ctr: number
): Insight[] {
  const insights: Insight[] = [];

  // Top community insight
  if (communityPerformance.length > 0) {
    const top = communityPerformance[0];
    insights.push({
      type: 'trending',
      title: `${top.name} leads engagement`,
      description: `With ${top.mapLoads} map loads and ${top.lotClicks} lot clicks, ${top.name} is your most active community.`,
    });
  }

  // Hot lot insight
  if (topLots.length > 0) {
    const hotLot = topLots[0];
    insights.push({
      type: 'hot',
      title: `${hotLot.lot.split(',')[0]} is hot`,
      description: `This lot received ${hotLot.clicks} clicks (${hotLot.share}% of total), indicating strong buyer interest.`,
    });
  }

  // Opportunity insight
  const lowCtrCommunities = communityPerformance.filter((c) => c.ctr < 50 && c.mapLoads > 20);
  if (lowCtrCommunities.length > 0) {
    const opp = lowCtrCommunities[0];
    insights.push({
      type: 'opportunity',
      title: `${opp.name} has untapped potential`,
      description: `High traffic (${opp.mapLoads} loads) but low engagement (${opp.ctr}% CTR). Consider updating lot details.`,
    });
  }

  return insights;
}

export async function buildFullReport(
  clientName: string,
  startDate: string,
  endDate: string
): Promise<MarketReport> {
  // Fetch all data in parallel
  const [mapLoads, lotClicks, topLots, viewsOverTime] = await Promise.all([
    fetchMapLoads(clientName, startDate, endDate),
    fetchLotClicks(clientName, startDate, endDate),
    fetchTopLots(clientName, startDate, endDate, 10),
    fetchViewsOverTime(clientName, startDate, endDate),
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
    },
    communityPerformance,
    topLots,
    viewsOverTime,
    insights: generateInsights(communityPerformance, topLots, ctr),
  };
}
