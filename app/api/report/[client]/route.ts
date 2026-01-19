import { NextRequest, NextResponse } from 'next/server';
import { buildFullReport } from '@/lib/ga4';
import { MOCK_REPORT } from '@/lib/mock-data';

export async function GET(
  request: NextRequest,
  { params }: { params: { client: string } }
) {
  try {
    const clientName = decodeURIComponent(params.client);
    const searchParams = request.nextUrl.searchParams;
    
    // Default to last 28 days
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start_date') || 
      new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Check if GA4 credentials are configured
    const hasCredentials = process.env.GA4_PROPERTY_ID && 
                          process.env.GA4_CLIENT_EMAIL && 
                          process.env.GA4_PRIVATE_KEY;
    
    if (!hasCredentials) {
      // Return mock data for development
      console.log('GA4 credentials not configured, returning mock data');
      return NextResponse.json({
        ...MOCK_REPORT,
        _mock: true,
        _message: 'Using mock data. Configure GA4 environment variables for live data.',
      });
    }
    
    const report = await buildFullReport(clientName, startDate, endDate);
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report', details: String(error) },
      { status: 500 }
    );
  }
}
