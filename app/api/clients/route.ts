import { NextResponse } from 'next/server';
import { fetchAvailableClients } from '@/lib/ga4';
import { MOCK_CLIENTS } from '@/lib/mock-data';

export async function GET() {
  try {
    // Check if GA4 credentials are configured
    const hasCredentials = process.env.GA4_PROPERTY_ID && 
                          process.env.GA4_CLIENT_EMAIL && 
                          process.env.GA4_PRIVATE_KEY;
    
    if (!hasCredentials) {
      // Return mock data for development
      return NextResponse.json({
        clients: MOCK_CLIENTS,
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
