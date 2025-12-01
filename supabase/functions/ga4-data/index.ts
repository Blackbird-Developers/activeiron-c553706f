import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const GA4_SECRET = Deno.env.get('GA4_Secret');
    const GA4_MEASUREMENT_ID = Deno.env.get('GA4_Measurement_ID');

    if (!GA4_SECRET || !GA4_MEASUREMENT_ID) {
      throw new Error('GA4 credentials not configured');
    }

    console.log('Fetching GA4 data for period:', { startDate, endDate });

    // Call GA4 Data API
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_MEASUREMENT_ID}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GA4_SECRET}`,
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

    const data = await response.json();
    console.log('GA4 data retrieved successfully');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ga4-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
