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
    
    const SUBBLY_API_KEY = Deno.env.get('subbly_private');
    const STOREFRONT_API = Deno.env.get('Storefront_api_subbly');

    if (!SUBBLY_API_KEY || !STOREFRONT_API) {
      throw new Error('Subbly credentials not configured');
    }

    console.log('Fetching Subbly data for period:', { startDate, endDate });
    console.log('Note: You may need to contact Subbly support for the correct API endpoint and documentation');

    // Try the orders endpoint instead of subscriptions
    // Note: The exact endpoint depends on Subbly's API documentation
    // Common endpoints might be: /api/orders, /api/subscriptions, /api/v1/orders
    const endpoints = [
      'https://api.subbly.co/v1/orders',
      'https://api.subbly.co/orders',
      'https://api.subbly.co/v1/subscriptions',
    ];

    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        
        const response = await fetch(
          `${endpoint}?start_date=${startDate}&end_date=${endDate}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUBBLY_API_KEY}`,
              'X-Subbly-Key': STOREFRONT_API,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`Subbly data retrieved successfully from ${endpoint}`);
          return new Response(JSON.stringify({ data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const errorText = await response.text();
        console.error(`Subbly API error at ${endpoint}:`, response.status, errorText);
        lastError = { endpoint, status: response.status, error: errorText };
      } catch (err) {
        console.error(`Failed to fetch from ${endpoint}:`, err);
        lastError = { endpoint, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }

    // If all endpoints failed
    throw new Error(`All Subbly API endpoints failed. Last error: ${JSON.stringify(lastError)}. Please contact Subbly support for API documentation.`);

  } catch (error) {
    console.error('Error in subbly-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Subbly API documentation is not publicly available. Please contact Subbly support at https://www.subbly.dev/ for API access and documentation.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
