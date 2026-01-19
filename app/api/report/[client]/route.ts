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
    
    // Check environment variables
    const propertyId = process.env.GA4_PROPERTY_ID;
    const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
    const clientEmail = process.env.GA4_CLIENT_EMAIL;
    const privateKey = process.env.GA4_PRIVATE_KEY;
    
    // Debug: Log what we have (without exposing full secrets)
    console.log('GA4 Config Check:', {
      hasPropertyId: !!propertyId,
      propertyId: propertyId,
      hasBase64Credentials: !!base64Credentials,
      base64CredentialsLength: base64Credentials?.length,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    });
    
    const hasCredentials = propertyId && (base64Credentials || (clientEmail && privateKey));
    
    if (!hasCredentials) {
      console.log('Missing credentials, returning mock data');
      return NextResponse.json({
        ...MOCK_REPORT,
        _mock: true,
        _message: 'Using mock data. Configure GA4 environment variables for live data.',
        _debug: {
          hasPropertyId: !!propertyId,
          hasClientEmail: !!clientEmail,
          hasPrivateKey: !!privateKey,
        }
      });
    }
    
    console.log('Attempting to fetch report for client:', clientName);
    const report = await buildFullReport(clientName, startDate, endDate);
    console.log('Report fetched successfully');
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error fetching report:', error);
    
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch report', 
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
