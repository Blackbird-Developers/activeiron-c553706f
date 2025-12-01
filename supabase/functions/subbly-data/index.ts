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
    
    const STOREFRONT_API = Deno.env.get('Storefront_api_subbly');
    const SUBBLY_PRIVATE = Deno.env.get('subbly_private');

    if (!STOREFRONT_API || !SUBBLY_PRIVATE) {
      throw new Error('Subbly credentials not configured');
    }

    console.log('Fetching Subbly data for period:', { startDate, endDate });

    // Call Subbly API
    const response = await fetch(
      `https://api.subbly.co/v1/subscriptions?start_date=${startDate}&end_date=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUBBLY_PRIVATE}`,
          'X-Storefront-Key': STOREFRONT_API,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Subbly API error:', response.status, errorText);
      throw new Error(`Subbly API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Subbly data retrieved successfully');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in subbly-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
