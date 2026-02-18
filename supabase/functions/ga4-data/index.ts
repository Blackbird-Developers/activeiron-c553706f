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
    const { startDate, endDate, country } = await req.json();
    
    const GA4_SERVICE_ACCOUNT = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    const GA4_PROPERTY_ID = Deno.env.get('GA4_PROPERTY_ID');

    if (!GA4_SERVICE_ACCOUNT) {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON not configured. Please add your service account JSON as a secret.');
    }

    if (!GA4_PROPERTY_ID) {
      throw new Error('GA4_PROPERTY_ID not configured');
    }

    // Parse service account JSON
    const serviceAccount = JSON.parse(GA4_SERVICE_ACCOUNT);
    
    console.log('Fetching GA4 data for period:', { startDate, endDate });
    console.log('Using service account:', serviceAccount.client_email);
    console.log('GA4 Property ID:', GA4_PROPERTY_ID);
    
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
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'engagementRate' },
            { name: 'bounceRate' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'engagedSessions' },
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
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [
            { name: 'sessions' },
          ]
        }),
      }
    );

    // THIRD API CALL: Get user trends over time (daily) with extended metrics
    const trendsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'active1DayUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [
            {
              dimension: { dimensionName: 'date' },
            },
          ],
        }),
      }
    );

    // FOURTH API CALL: Get country breakdown
    const countryResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: 'country' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
          ],
          orderBys: [
            {
              metric: { metricName: 'activeUsers' },
              desc: true,
            },
          ],
          limit: 10,
        }),
      }
    );

    // Build country dimension filter for source/medium call
    const countryFullName: Record<string, string> = {
      'IE': 'Ireland',
      'UK': 'United Kingdom',
      'US': 'United States',
      'DE': 'Germany',
      'NZ': 'New Zealand',
    };
    const countryFilterObj = country && country !== 'all' && countryFullName[country] ? {
      dimensionFilter: {
        filter: {
          fieldName: 'country',
          stringFilter: {
            matchType: 'EXACT',
            value: countryFullName[country],
          }
        }
      }
    } : {};

    // FIFTH API CALL: Get source/medium breakdown (with optional country filter)
    const sourceMediumResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'engagementRate' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
            { name: 'screenPageViews' },
          ],
          ...countryFilterObj,
          orderBys: [
            {
              metric: { metricName: 'sessions' },
              desc: true,
            },
          ],
          limit: 50,
        }),
      }
    );

    if (!totalsResponse.ok || !channelsResponse.ok || !trendsResponse.ok) {
      const errorText = !totalsResponse.ok ? await totalsResponse.text() : await channelsResponse.text();
      console.error('GA4 API error:', errorText);
      throw new Error(`GA4 API error`);
    }

    const totalsData = await totalsResponse.json();
    const channelsData = await channelsResponse.json();
    const trendsData = await trendsResponse.json();
    const countryData = countryResponse.ok ? await countryResponse.json() : { rows: [] };
    const sourceMediumData = sourceMediumResponse.ok ? await sourceMediumResponse.json() : { rows: [] };
    
    console.log('Totals response (no dimensions):', JSON.stringify(totalsData, null, 2));

    // Extract accurate totals from the no-dimension response
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
    const sessions = totalsData.rows?.[0]?.metricValues?.[4]?.value 
      ? parseInt(totalsData.rows[0].metricValues[4].value) 
      : 0;
    const pageViews = totalsData.rows?.[0]?.metricValues?.[5]?.value 
      ? parseInt(totalsData.rows[0].metricValues[5].value) 
      : 0;
    const avgSessionDuration = totalsData.rows?.[0]?.metricValues?.[6]?.value 
      ? parseFloat(totalsData.rows[0].metricValues[6].value) 
      : 0;
    const engagedSessions = totalsData.rows?.[0]?.metricValues?.[7]?.value 
      ? parseInt(totalsData.rows[0].metricValues[7].value) 
      : 0;
    
    console.log('Extracted totals:', { 
      activeUsers, 
      newUsers,
      engagementRate,
      bounceRate,
      sessions,
      pageViews,
      avgSessionDuration,
      engagedSessions,
    });
    
    // Build traffic by source from channels data
    const trafficBySource = channelsData.rows?.map((row: any) => {
      const channelSessions = parseInt(row.metricValues[0].value);
      
      return {
        name: row.dimensionValues[0].value,
        sessions: channelSessions,
        percentage: sessions > 0 ? Math.round((channelSessions / sessions) * 1000) / 10 : 0
      };
    }) || [];
    
    // Sort by sessions descending
    trafficBySource.sort((a: any, b: any) => b.sessions - a.sessions);

    // Build trends over time from date-based report
    const trendsOverTime = trendsData.rows?.map((row: any) => {
      const rawDate = row.dimensionValues[0].value; // e.g. "20251101"
      const year = rawDate.slice(0, 4);
      const month = rawDate.slice(4, 6);
      const day = rawDate.slice(6, 8);
      const dateObj = new Date(`${year}-${month}-${day}T00:00:00`);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });

      return {
        date: formattedDate,
        users: parseInt(row.metricValues[0].value), // totalUsers per day
        newUsers: parseInt(row.metricValues[1].value),
        sessions: parseInt(row.metricValues[2].value),
        pageViews: parseInt(row.metricValues[3].value),
      };
    }) || [];

    // Build country breakdown
    const countryBreakdown = countryData.rows?.map((row: any) => {
      return {
        country: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
        pageViews: parseInt(row.metricValues[2].value),
        engagementRate: parseFloat(row.metricValues[3].value) * 100,
      };
    }) || [];
    
    console.log('Traffic by source:', trafficBySource);
    console.log('Trends over time:', trendsOverTime);
    console.log('Country breakdown:', countryBreakdown);

    // Build source/medium breakdown
    const sourceMediumBreakdown = sourceMediumData.rows?.map((row: any) => {
      return {
        source: row.dimensionValues[0].value,
        medium: row.dimensionValues[1].value,
        sessions: parseInt(row.metricValues[0].value),
        users: parseInt(row.metricValues[1].value),
        newUsers: parseInt(row.metricValues[2].value),
        engagementRate: Math.round(parseFloat(row.metricValues[3].value) * 1000) / 10,
        avgSessionDuration: Math.round(parseFloat(row.metricValues[4].value)),
        bounceRate: Math.round(parseFloat(row.metricValues[5].value) * 1000) / 10,
        pageViews: parseInt(row.metricValues[6].value),
      };
    }) || [];

    console.log('Source/Medium breakdown entries:', sourceMediumBreakdown.length);
    console.log('GA4 data retrieved successfully');
    
    // Create processed data structure
    const processedData = {
      overview: {
        totalUsers: activeUsers,
        newUsers: newUsers,
        engagementRate: Math.round(engagementRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
        sessions: sessions,
        pageViews: pageViews,
        avgSessionDuration: Math.round(avgSessionDuration),
        engagedSessions: engagedSessions,
      },
      trafficBySource: trafficBySource.slice(0, 5),
      trendsOverTime: trendsOverTime,
      countryBreakdown: countryBreakdown,
      sourceMediumBreakdown: sourceMediumBreakdown,
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
        sessions: 0,
        pageViews: 0,
        avgSessionDuration: 0,
        engagedSessions: 0,
      },
      trafficBySource: [],
      trendsOverTime: [],
      countryBreakdown: [],
      sourceMediumBreakdown: [],
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
