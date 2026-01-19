import { NextResponse } from 'next/server';

export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const base64Credentials = process.env.GOOGLE_SERVICE_ACCOUNT_BASE64;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;
  
  // Try to decode base64 credentials
  let decodedCredentials = null;
  if (base64Credentials) {
    try {
      const jsonString = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const parsed = JSON.parse(jsonString);
      decodedCredentials = {
        valid: true,
        client_email: parsed.client_email,
        project_id: parsed.project_id,
        has_private_key: !!parsed.private_key,
      };
    } catch (error) {
      decodedCredentials = {
        valid: false,
        error: String(error),
      };
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      GA4_PROPERTY_ID: {
        set: !!propertyId,
        value: propertyId || null,
      },
      GOOGLE_SERVICE_ACCOUNT_BASE64: {
        set: !!base64Credentials,
        length: base64Credentials?.length || 0,
        decoded: decodedCredentials,
      },
      GA4_CLIENT_EMAIL: {
        set: !!clientEmail,
        value: clientEmail || null,
      },
      GA4_PRIVATE_KEY: {
        set: !!privateKey,
        length: privateKey?.length || 0,
        startsCorrectly: privateKey?.startsWith('-----BEGIN') || false,
      },
    },
    recommendedSetup: 'Use GOOGLE_SERVICE_ACCOUNT_BASE64 for Vercel deployments',
    allConfigured: !!(propertyId && (base64Credentials || (clientEmail && privateKey))),
  });
}
