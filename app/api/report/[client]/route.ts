import { NextRequest, NextResponse } from 'next/server';
import { buildFullReport } from '@/lib/ga4';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: { client: string } }
) {
  try {
    const clientName = decodeURIComponent(params.client);
    const searchParams = request.nextUrl.searchParams;
    
    // Get date parameters with defaults
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('start_date') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
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
    
    console.log(`Fetching report for ${clientName} from ${startDate} to ${endDate}`);
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
