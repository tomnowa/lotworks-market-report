import { NextResponse } from 'next/server';
import { fetchAvailableClients } from '@/lib/ga4';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hasCredentials = process.env.GA4_PROPERTY_ID && 
      (process.env.GOOGLE_SERVICE_ACCOUNT_BASE64 || 
       (process.env.GA4_CLIENT_EMAIL && process.env.GA4_PRIVATE_KEY));
    
    if (!hasCredentials) {
      return NextResponse.json({
        clients: ['Pacesetter Homes', 'Demo Client'],
        _mock: true,
      });
    }
    
    const clients = await fetchAvailableClients();
    return NextResponse.json({ clients });
    
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: String(error) },
      { status: 500 }
    );
  }
}
