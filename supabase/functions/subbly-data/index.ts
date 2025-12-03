import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to safely get date from potentially null field
function safeGetDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

// Fetch all pages from Subbly API
async function fetchAllSubscriptions(apiKey: string): Promise<any[]> {
  const allSubscriptions: any[] = [];
  let currentPage = 1;
  let lastPage = 1;

  do {
    console.log(`Fetching Subbly page ${currentPage}...`);
    
    const response = await fetch(
      `https://api.subbly.co/private/v1/subscriptions?page=${currentPage}`,
      {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Subbly API error:', response.status, errorText);
      throw new Error(`Subbly API error: ${response.status} - ${errorText}`);
    }

    const pageData = await response.json();
    console.log(`Page ${currentPage} response:`, {
      current_page: pageData.current_page,
      last_page: pageData.last_page,
      total: pageData.total,
      dataLength: pageData.data?.length || 0
    });

    const subscriptions = pageData.data || [];
    allSubscriptions.push(...subscriptions);

    currentPage = (pageData.current_page || currentPage) + 1;
    lastPage = pageData.last_page || 1;

  } while (currentPage <= lastPage);

  console.log(`Total subscriptions fetched: ${allSubscriptions.length}`);
  return allSubscriptions;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const SUBBLY_API_KEY = Deno.env.get('subbly_private');

    if (!SUBBLY_API_KEY) {
      console.log('Subbly credentials not configured - returning placeholder data');
      const data = {
        overview: {
          subscriptions: 0,
          churnRate: 0,
          revenue: 0,
        },
        subscriptionsOverTime: [],
        planDistribution: [],
      };

      return new Response(JSON.stringify({ data, note: 'Subbly integration is currently disabled. API key not configured.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching Subbly data for period:', { startDate, endDate });

    // Fetch all subscriptions with pagination
    const allSubscriptions = await fetchAllSubscriptions(SUBBLY_API_KEY);

    // Parse date range
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);

    console.log('Filtering subscriptions between:', { 
      startDateTime: startDateTime.toISOString(), 
      endDateTime: endDateTime.toISOString() 
    });

    // Filter ALL subscriptions created within the date range (regardless of status)
    const subscriptionsInRange = allSubscriptions.filter((sub: any) => {
      const createdAt = safeGetDate(sub.created_at);
      if (!createdAt) return false;
      return createdAt >= startDateTime && createdAt <= endDateTime;
    });

    console.log(`Subscriptions in date range: ${subscriptionsInRange.length}`);

    // Count by status for debugging
    const statusCounts: Record<string, number> = {};
    subscriptionsInRange.forEach((sub: any) => {
      const status = sub.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    console.log('Status breakdown:', statusCounts);

    // Get active subscriptions at start of period for churn calculation
    const activeAtStart = allSubscriptions.filter((sub: any) => {
      const createdAt = safeGetDate(sub.created_at);
      if (!createdAt) return false;
      // Was created before the period and is/was active
      return createdAt < startDateTime && (sub.status === 'active' || sub.status === 'expired' || sub.status === 'cancelled');
    });

    // Get cancelled/expired subscriptions during the period
    const churnedDuringPeriod = allSubscriptions.filter((sub: any) => {
      const updatedAt = safeGetDate(sub.updated_at) || safeGetDate(sub.created_at);
      if (!updatedAt) return false;
      return (sub.status === 'cancelled' || sub.status === 'expired') && 
             updatedAt >= startDateTime && 
             updatedAt <= endDateTime;
    });

    // Calculate churn rate (capped at 100%)
    const rawChurnRate = activeAtStart.length > 0 
      ? (churnedDuringPeriod.length / activeAtStart.length) * 100 
      : 0;
    const churnRate = Math.min(rawChurnRate, 100);

    // Calculate revenue estimate from subscriptions in range
    // Using price from subscription if available, otherwise default estimate
    const totalRevenue = subscriptionsInRange.reduce((sum: number, sub: any) => {
      const price = sub.price || sub.amount || 30; // Default €30 if no price
      const charges = sub.successful_charges_count || 1;
      return sum + (price * charges);
    }, 0);

    // Build subscriptions over time data - include ALL days in range
    const subscriptionsByDate: Record<string, number> = {};
    
    // First, initialize all days in range with 0
    const currentDate = new Date(startDateTime);
    while (currentDate <= endDateTime) {
      const dateKey = currentDate.toISOString().split('T')[0];
      subscriptionsByDate[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Then count subscriptions for each day
    subscriptionsInRange.forEach((sub: any) => {
      const createdAt = safeGetDate(sub.created_at);
      if (createdAt) {
        const dateKey = createdAt.toISOString().split('T')[0];
        if (subscriptionsByDate.hasOwnProperty(dateKey)) {
          subscriptionsByDate[dateKey] = (subscriptionsByDate[dateKey] || 0) + 1;
        }
      }
    });

    // Sort by date and format for chart
    const subscriptionsOverTime = Object.entries(subscriptionsByDate)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        subscriptions: count,
        revenue: count * 30, // Estimate €30 per subscription
      }));
    
    console.log(`Generated ${subscriptionsOverTime.length} daily data points`);

    // Build plan distribution
    const planCounts: Record<string, number> = {};
    subscriptionsInRange.forEach((sub: any) => {
      const planName = sub.product?.name || sub.product_name || 'Standard Plan';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });

    const totalSubs = subscriptionsInRange.length;
    const planDistribution = Object.entries(planCounts).map(([plan, count]) => ({
      plan,
      subscribers: count,
      percentage: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0,
    }));

    const processedData = {
      overview: {
        subscriptions: subscriptionsInRange.length,
        churnRate: Math.round(churnRate * 100) / 100,
        revenue: totalRevenue,
      },
      subscriptionsOverTime,
      planDistribution,
      statusBreakdown: statusCounts,
    };

    console.log('Returning processed data:', {
      subscriptions: processedData.overview.subscriptions,
      churnRate: processedData.overview.churnRate,
      revenue: processedData.overview.revenue,
    });

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in subbly-data function:', error);
    
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
