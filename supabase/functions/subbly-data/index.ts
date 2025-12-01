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

    // Call Subbly API
    const response = await fetch(
      'https://api.subbly.co/private/v1/subscriptions',
      {
        method: 'GET',
        headers: {
          'X-API-KEY': SUBBLY_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Subbly API error:', response.status, errorText);
      
      // Return placeholder data on error
      const placeholderData = {
        overview: {
          subscriptions: 0,
          subscriptionRate: 0,
          costPerSubscription: 0,
          revenue: 0,
        },
        subscriptionsOverTime: [],
        planDistribution: [],
      };
      
      return new Response(
        JSON.stringify({
          data: placeholderData,
          error: `Subbly API error: ${response.status}`,
          details: errorText,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const rawData = await response.json();
    console.log('Subbly data retrieved successfully');

    // Transform Subbly data to match expected format
    const subscriptions = rawData.data || [];
    const total = rawData.total || 0;
    
    // Filter subscriptions within date range
    const startDateTime = new Date(startDate).getTime();
    const endDateTime = new Date(endDate).getTime();
    
    const activeSubscriptions = subscriptions.filter((sub: any) => {
      const createdAt = new Date(sub.created_at).getTime();
      return sub.status === 'active' && createdAt >= startDateTime && createdAt <= endDateTime;
    });
    
    // Calculate revenue (assuming average subscription price)
    // You might want to fetch product prices for more accurate revenue
    const totalRevenue = activeSubscriptions.length * 30; // Placeholder calculation
    
    // Calculate subscription rate (would need total users from GA4)
    const subscriptionRate = 0; // Requires GA4 total users
    const costPerSubscription = 0; // Requires ad spend data
    
    const processedData = {
      overview: {
        subscriptions: activeSubscriptions.length,
        subscriptionRate: Math.round(subscriptionRate * 100) / 100,
        costPerSubscription: Math.round(costPerSubscription * 100) / 100,
        revenue: totalRevenue,
      },
      subscriptionsOverTime: [],
      planDistribution: [],
    };

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in subbly-data function:', error);
    
    // Return placeholder data on error
    const placeholderData = {
      overview: {
        subscriptions: 0,
        subscriptionRate: 0,
        costPerSubscription: 0,
        revenue: 0,
      },
      subscriptionsOverTime: [],
      planDistribution: [],
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
