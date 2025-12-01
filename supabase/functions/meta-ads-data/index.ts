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
    
    const META_ADS_API_KEY = Deno.env.get('META_ADS_API_KEY');
    const META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!META_ADS_API_KEY) {
      throw new Error('META_ADS_API_KEY not configured');
    }

    if (!META_AD_ACCOUNT_ID) {
      throw new Error('META_AD_ACCOUNT_ID not configured');
    }

    console.log('Fetching Meta Ads data for period:', { startDate, endDate, adAccountId: META_AD_ACCOUNT_ID });

    // Call Meta Marketing API for insights
    const response = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/insights?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields: 'impressions,clicks,spend,cpc,ctr,conversions,cost_per_conversion,reach,frequency',
        level: 'account',
      }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Meta Ads API error:', response.status, errorText);
      throw new Error(`Meta Ads API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Meta Ads data retrieved successfully');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in meta-ads-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
