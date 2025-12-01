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
      console.log('Subbly credentials not configured - returning placeholder data');
      const data = {
        overview: {
          subscriptions: 0,
          subscriptionRate: 0,
          revenue: 0,
        },
      };

      return new Response(JSON.stringify({ data, note: 'Subbly integration is currently disabled. Using placeholder data.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching Subbly data for period:', { startDate, endDate });
    console.log('Subbly integration is currently disabled. Using placeholder data.');

    const data = {
      overview: {
        subscriptions: 0,
        subscriptionRate: 0,
        revenue: 0,
      },
    };

    return new Response(JSON.stringify({ data, note: 'Subbly integration is currently disabled. Using placeholder data.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
