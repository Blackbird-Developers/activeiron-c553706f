import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to create JWT for service account
async function createJWT(serviceAccountJson: any) {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: serviceAccountJson.private_key_id,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountJson.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${headerB64}.${payloadB64}`;

  // Import the private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(serviceAccountJson.private_key),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${signatureB64}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getAccessToken(serviceAccountJson: any) {
  const jwt = await createJWT(serviceAccountJson);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OAuth error:', response.status, errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const GA4_SERVICE_ACCOUNT = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    const GA4_PROPERTY_ID = Deno.env.get('GA4_PROPERTY_ID');

    if (!GA4_SERVICE_ACCOUNT) {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON not configured. Please add your service account JSON as a secret.');
    }

    if (!GA4_PROPERTY_ID) {
      throw new Error('GA4_PROPERTY_ID not configured');
    }

    console.log('Fetching GA4 data for period:', { startDate, endDate });

    // Parse service account JSON
    const serviceAccount = JSON.parse(GA4_SERVICE_ACCOUNT);
    
    // Get OAuth access token
    const accessToken = await getAccessToken(serviceAccount);

    // FIRST API CALL: Get accurate totals WITHOUT dimensions (matches GA4 UI)
    const totalsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          // Use activeUsers to match GA4 UI "Users" card
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
          ]
        }),
      }
    );

    // SECOND API CALL: Get channel breakdown WITH dimensions
    const channelsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'firstUserDefaultChannelGroup' }],
          metrics: [
            { name: 'totalUsers' },
          ]
        }),
      }
    );

    if (!totalsResponse.ok || !channelsResponse.ok) {
      const errorText = !totalsResponse.ok ? await totalsResponse.text() : await channelsResponse.text();
      console.error('GA4 API error:', errorText);
      throw new Error(`GA4 API error`);
    }

    const totalsData = await totalsResponse.json();
    const channelsData = await channelsResponse.json();
    
    console.log('Totals response (no dimensions):', JSON.stringify(totalsData, null, 2));
    console.log('Channels response (with dimensions):', JSON.stringify(channelsData, null, 2));

    // Extract accurate totals from the no-dimension response
    // NOTE: We use activeUsers here to match the GA4 UI "Users" metric
    const activeUsers = totalsData.rows?.[0]?.metricValues?.[0]?.value 
      ? parseInt(totalsData.rows[0].metricValues[0].value) 
      : 0;
    const newUsers = totalsData.rows?.[0]?.metricValues?.[1]?.value 
      ? parseInt(totalsData.rows[0].metricValues[1].value) 
      : 0;
    const engagementRate = totalsData.rows?.[0]?.metricValues?.[2]?.value 
      ? parseFloat(totalsData.rows[0].metricValues[2].value) * 100 
      : 0;
    const bounceRate = totalsData.rows?.[0]?.metricValues?.[3]?.value 
      ? parseFloat(totalsData.rows[0].metricValues[3].value) * 100 
      : 0;
    
    console.log('Extracted totals (active users primary):', { 
      activeUsers, 
      newUsers,
      engagementRate,
      bounceRate
    });
    
    // Build traffic by source from channels data
    const trafficBySource = channelsData.rows?.map((row: any) => {
      const users = parseInt(row.metricValues[0].value);
      
      return {
        name: row.dimensionValues[0].value,
        users,
        percentage: activeUsers > 0 ? Math.round((users / activeUsers) * 1000) / 10 : 0
      };
    }) || [];
    
    console.log('Traffic by source with accurate percentages:', trafficBySource);
    console.log('GA4 data retrieved successfully');
    
    // Create processed data structure
    const processedData = {
      overview: {
        // Expose activeUsers as totalUsers so the dashboard label stays consistent
        totalUsers: activeUsers,
        newUsers: newUsers,
        engagementRate: Math.round(engagementRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
      },
      trafficBySource: trafficBySource.slice(0, 5), // Top 5 sources
      trendsOverTime: [], // Would need date-based query for this
    };

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ga4-data function:', error);
    
    // Return placeholder data on error
    const placeholderData = {
      overview: {
        totalUsers: 0,
        newUsers: 0,
        engagementRate: 0,
        bounceRate: 0,
      },
      trafficBySource: [],
      trendsOverTime: [],
    };
    
    return new Response(
      JSON.stringify({ 
        data: placeholderData,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
