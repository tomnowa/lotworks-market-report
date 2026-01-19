import { NextResponse } from 'next/server';

export async function GET() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY;
  
  // Check if private key looks valid
  const keyAnalysis = privateKey ? {
    length: privateKey.length,
    startsCorrectly: privateKey.startsWith('-----BEGIN'),
    containsNewlines: privateKey.includes('\n'),
    containsEscapedNewlines: privateKey.includes('\\n'),
  } : null;
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    config: {
      GA4_PROPERTY_ID: {
        set: !!propertyId,
        value: propertyId || null,
      },
      GA4_CLIENT_EMAIL: {
        set: !!clientEmail,
        value: clientEmail || null,
      },
      GA4_PRIVATE_KEY: {
        set: !!privateKey,
        analysis: keyAnalysis,
        // Show first and last bit to verify format
        preview: privateKey 
          ? `${privateKey.substring(0, 50)}...${privateKey.substring(privateKey.length - 30)}`
          : null,
      },
    },
    allConfigured: !!(propertyId && clientEmail && privateKey),
  });
}
