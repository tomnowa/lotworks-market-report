import { NextRequest, NextResponse } from 'next/server';
import { fetchTopLots } from '@/lib/ga4';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientName = searchParams.get('client');
    const communitiesParam = searchParams.get('communities');
    
    if (!clientName) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      );
    }
    
    // Get date parameters with defaults
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start_date') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Parse communities filter
    const communities = communitiesParam ? communitiesParam.split(',').map(c => c.trim()) : undefined;
    
    // Check for credentials
    const hasCredentials = process.env.GA4_PROPERTY_ID && 
      (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || 
       (process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY));
    
    if (!hasCredentials) {
      return NextResponse.json(
        { error: 'GA4 credentials not configured' },
        { status: 500 }
      );
    }
    
    console.log(`Fetching lots for ${clientName}, communities: ${communities?.join(', ') || 'all'}`);
    const lots = await fetchTopLots(clientName, startDate, endDate, 50, communities);
    
    return NextResponse.json({ lots });
    
  } catch (error) {
    console.error('Error fetching lots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lots', details: String(error) },
      { status: 500 }
    );
  }
}
