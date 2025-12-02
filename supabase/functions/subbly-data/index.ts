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
          churnRate: 0,
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
          churnRate: 0,
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
    
    // Get all active subscriptions at start of period for churn calculation
    const activeAtStart = subscriptions.filter((sub: any) => {
      const createdAt = new Date(sub.created_at).getTime();
      return sub.status === 'active' && createdAt < startDateTime;
    });
    
    // Get cancelled subscriptions during the period
    const cancelledDuringPeriod = subscriptions.filter((sub: any) => {
      const updatedAt = new Date(sub.updated_at || sub.created_at).getTime();
      return sub.status === 'cancelled' && updatedAt >= startDateTime && updatedAt <= endDateTime;
    });
    
    // Get new subscriptions during the period
    const newSubscriptions = subscriptions.filter((sub: any) => {
      const createdAt = new Date(sub.created_at).getTime();
      return sub.status === 'active' && createdAt >= startDateTime && createdAt <= endDateTime;
    });
    
    // Calculate churn rate (capped at 100%)
    const rawChurnRate = activeAtStart.length > 0 
      ? (cancelledDuringPeriod.length / activeAtStart.length) * 100 
      : 0;
    const churnRate = Math.min(rawChurnRate, 100);
    
    // Calculate revenue (using successful charges count and average price)
    const totalRevenue = newSubscriptions.reduce((sum: number, sub: any) => {
      return sum + ((sub.successful_charges_count || 1) * 30); // Assuming £30 average
    }, 0);
    
    const processedData = {
      overview: {
        subscriptions: newSubscriptions.length,
        churnRate: Math.round(churnRate * 100) / 100,
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
        churnRate: 0,
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
