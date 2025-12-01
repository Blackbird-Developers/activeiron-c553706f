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

    // Call GA4 Data API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
            { name: 'sessions' }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GA4 API error:', response.status, errorText);
      throw new Error(`GA4 API error: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('GA4 data retrieved successfully');

    // Transform raw GA4 data to match expected format
    let totalUsers = 0;
    let newUsers = 0;
    let totalSessions = 0;
    let weightedEngagementRate = 0;
    let weightedBounceRate = 0;
    
    const trafficBySource = rawData.rows?.map((row: any) => {
      const users = parseInt(row.metricValues[0].value);
      const newUsersVal = parseInt(row.metricValues[1].value);
      const engagementRate = parseFloat(row.metricValues[2].value);
      const bounceRate = parseFloat(row.metricValues[3].value);
      const sessions = parseInt(row.metricValues[4].value);
      
      totalUsers += users;
      newUsers += newUsersVal;
      totalSessions += sessions;
      weightedEngagementRate += engagementRate * users;
      weightedBounceRate += bounceRate * users;
      
      return {
        name: row.dimensionValues[0].value,
        users: users,
        percentage: 0 // Will calculate after totals are known
      };
    }) || [];
    
    // Calculate percentages and weighted averages
    trafficBySource.forEach((source: any) => {
      source.percentage = totalUsers > 0 ? Math.round(source.users / totalUsers * 1000) / 10 : 0;
    });
    
    const avgEngagementRate = totalUsers > 0 ? (weightedEngagementRate / totalUsers * 100) : 0;
    const avgBounceRate = totalUsers > 0 ? (weightedBounceRate / totalUsers * 100) : 0;
    
    // Create processed data structure
    const processedData = {
      overview: {
        totalUsers,
        newUsers,
        engagementRate: Math.round(avgEngagementRate * 10) / 10,
        bounceRate: Math.round(avgBounceRate * 10) / 10,
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
