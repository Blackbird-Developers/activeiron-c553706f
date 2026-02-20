import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to exchange short-lived token for long-lived token
async function getLongLivedToken(shortLivedToken: string): Promise<string | null> {
  const FB_APP_ID = Deno.env.get('FB_APP_ID');
  const FB_APP_SECRET = Deno.env.get('FB_APP_SECRET');
  
  if (!FB_APP_ID || !FB_APP_SECRET) {
    console.log('FB_APP_ID or FB_APP_SECRET not configured, cannot refresh token');
    return null;
  }
  
  try {
    console.log('Attempting to exchange for long-lived token...');
    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: FB_APP_ID,
        client_secret: FB_APP_SECRET,
        fb_exchange_token: shortLivedToken,
      }),
      { method: 'GET' }
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('Successfully obtained long-lived token, expires in:', data.expires_in, 'seconds');
      return data.access_token;
    } else {
      const errorText = await response.text();
      console.error('Failed to get long-lived token:', errorText);
      return null;
    }
  } catch (error) {
    console.error('Error exchanging token:', error);
    return null;
  }
}

// Function to check if token is valid
async function isTokenValid(token: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${token}&access_token=${token}`
    );
    if (response.ok) {
      const data = await response.json();
      return data.data?.is_valid === true;
    }
    return false;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    let META_ADS_API_KEY = Deno.env.get('META_ADS_API_KEY');
    const META_AD_ACCOUNT_ID_RAW = Deno.env.get('META_AD_ACCOUNT_ID');
    const META_AD_ACCOUNT_ID = META_AD_ACCOUNT_ID_RAW?.trim();

    if (!META_ADS_API_KEY) {
      throw new Error('META_ADS_API_KEY not configured');
    }

    if (!META_AD_ACCOUNT_ID) {
      throw new Error('META_AD_ACCOUNT_ID not configured');
    }

    // Check if current token is valid, if not try to refresh
    const tokenValid = await isTokenValid(META_ADS_API_KEY);
    if (!tokenValid) {
      console.log('Current token appears invalid, attempting to get long-lived token...');
      const longLivedToken = await getLongLivedToken(META_ADS_API_KEY);
      if (longLivedToken) {
        META_ADS_API_KEY = longLivedToken;
        console.log('Using refreshed long-lived token');
      } else {
        console.log('Could not refresh token, proceeding with original token');
      }
    }

    console.log('Fetching Meta Ads data for period:', { startDate, endDate, adAccountId: META_AD_ACCOUNT_ID });

    // Call Meta Marketing API for account-level insights
    const accountResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/insights?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields: 'impressions,clicks,spend,cpc,ctr,actions,cost_per_action_type,reach,frequency,video_thruplay_watched_actions,post_engagement,cost_per_unique_click',
        level: 'account',
      }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Call Meta Marketing API for daily breakdown
    const dailyResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/insights?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields: 'impressions,clicks,spend,cpc,ctr,actions',
        level: 'account',
        time_increment: '1', // Daily breakdown
      }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Call Meta Marketing API for country breakdown
    const countryResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/insights?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        time_range: JSON.stringify({ since: startDate, until: endDate }),
        fields: 'impressions,clicks,spend,cpc,ctr,actions,country',
        level: 'account',
        breakdowns: 'country',
      }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    // Call Meta Marketing API for campaign-level insights
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/campaigns?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        fields: 'name,status,effective_status',
        filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE'] }]),
      }),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.error('Meta Ads API error:', accountResponse.status, errorText);
      
      // Return placeholder data structure on error
      const placeholderData = {
        overview: {
          cpc: 0,
          ctr: 0,
          conversions: 0,
          adSpend: 0,
          costPerConversion: 0,
          impressions: 0,
          clicks: 0,
          reach: 0,
        },
        performanceOverTime: [],
        campaignPerformance: [],
        campaigns: [],
        countryBreakdown: [],
      };
      
      return new Response(
        JSON.stringify({
          data: placeholderData,
          error: `Meta Ads API error: ${accountResponse.status}`,
          details: errorText,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const accountData = await accountResponse.json();
    console.log('Meta Ads account data retrieved successfully');

    // Process daily breakdown data
    let performanceOverTime: any[] = [];
    if (dailyResponse.ok) {
      const dailyData = await dailyResponse.json();
      console.log('Daily breakdown data retrieved:', dailyData.data?.length || 0, 'days');
      
      performanceOverTime = (dailyData.data || []).map((day: any) => {
        // Parse the date_start field (format: "2025-01-01")
        const dateObj = new Date(day.date_start);
        const formattedDate = `${dateObj.getDate()} ${dateObj.toLocaleString('en-GB', { month: 'short' })}`;
        
        // Extract conversions from actions
        const conversions = day.actions?.find((a: any) => 
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
          a.action_type === 'subscribe_website' || a.action_type === 'subscribe_total'
        )?.value || 0;
        
        return {
          date: formattedDate,
          spend: parseFloat(day.spend || 0),
          cpc: parseFloat(day.cpc || 0),
          ctr: parseFloat(day.ctr || 0),
          impressions: parseInt(day.impressions || 0),
          clicks: parseInt(day.clicks || 0),
          conversions: parseInt(conversions),
        };
      });
    } else {
      console.log('Failed to fetch daily breakdown:', await dailyResponse.text());
    }

    // Process country breakdown data
    let countryBreakdown: any[] = [];
    if (countryResponse.ok) {
      const countryData = await countryResponse.json();
      console.log('Country breakdown data retrieved:', countryData.data?.length || 0, 'countries');
      
      countryBreakdown = (countryData.data || []).map((row: any) => {
        const conversions = row.actions?.find((a: any) => 
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
          a.action_type === 'subscribe_website' || a.action_type === 'subscribe_total'
        )?.value || 0;

        return {
          country: row.country,
          impressions: parseInt(row.impressions || 0),
          clicks: parseInt(row.clicks || 0),
          spend: parseFloat(row.spend || 0),
          cpc: parseFloat(row.cpc || 0),
          ctr: parseFloat(row.ctr || 0),
          conversions: parseInt(conversions),
        };
      });
    } else {
      console.log('Failed to fetch country breakdown');
    }

    // Process campaign data
    let campaigns = [];
    if (campaignsResponse.ok) {
      const campaignsData = await campaignsResponse.json();
      
      // Fetch insights for each active campaign
      const campaignInsights = await Promise.all(
        (campaignsData.data || []).map(async (campaign: any) => {
          try {
            const insightsResponse = await fetch(
              `https://graph.facebook.com/v21.0/${campaign.id}/insights?` +
              new URLSearchParams({
                access_token: META_ADS_API_KEY,
                time_range: JSON.stringify({ since: startDate, until: endDate }),
                fields: 'impressions,clicks,spend,cpc,ctr,actions,cost_per_action_type,purchase_roas',
              }),
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );

            if (insightsResponse.ok) {
              const insights = await insightsResponse.json();
              const data = insights.data?.[0] || {};
              
              // Extract conversions from actions
              const conversions = data.actions?.find((a: any) => 
                a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
              )?.value || 0;
              
              const costPerConversion = data.cost_per_action_type?.find((a: any) => 
                a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
              )?.value || 0;

              // Extract ROAS from purchase_roas field
              const roas = data.purchase_roas?.find((a: any) =>
                a.action_type === 'omni_purchase' || a.action_type === 'purchase'
              )?.value || 0;

              return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.effective_status,
                spend: parseFloat(data.spend || 0),
                cpc: parseFloat(data.cpc || 0),
                ctr: parseFloat(data.ctr || 0),
                impressions: parseInt(data.impressions || 0),
                clicks: parseInt(data.clicks || 0),
                conversions: parseInt(conversions),
                costPerConversion: parseFloat(costPerConversion),
                roas: parseFloat(roas),
              };
            }
          } catch (error) {
            console.error(`Error fetching insights for campaign ${campaign.id}:`, error);
          }
          return null;
        })
      );

      campaigns = campaignInsights.filter(c => c !== null);
    }

    // Transform API response to match frontend expectations
    const accountMetrics = accountData.data?.[0] || {};
    
    // Define conversion action types to look for (in order of priority)
    const conversionActionTypes = [
      'purchase',
      'offsite_conversion.fb_pixel_purchase',
      'subscribe_website',
      'subscribe_total',
      'lead',
      'complete_registration',
      'offsite_conversion.fb_pixel_lead',
      'offsite_conversion.fb_pixel_complete_registration',
      'omni_purchase',
      'onsite_conversion.purchase',
    ];
    
    // Extract conversions from actions array - check multiple action types
    let conversions = 0;
    let costPerConversion = 0;
    
    if (accountMetrics.actions) {
      for (const actionType of conversionActionTypes) {
        const action = accountMetrics.actions.find((a: any) => a.action_type === actionType);
        if (action) {
          conversions = parseInt(action.value || 0);
          break;
        }
      }
    }
    
    if (accountMetrics.cost_per_action_type) {
      for (const actionType of conversionActionTypes) {
        const costAction = accountMetrics.cost_per_action_type.find((a: any) => a.action_type === actionType);
        if (costAction) {
          costPerConversion = parseFloat(costAction.value || 0);
          break;
        }
      }
    }

    // Extract thruplays (video views that reached at least 15 seconds)
    const thruplays = parseInt(
      accountMetrics.video_thruplay_watched_actions?.find((a: any) => a.action_type === 'video_view')?.value || 0
    );

    // Extract post engagements
    const engagements = parseInt(accountMetrics.post_engagement || 0);

    // CPR = Cost Per Result = Ad Spend / Conversions (same as costPerConversion but named explicitly)
    const cpr = costPerConversion;

    // CPE = Cost Per Engagement
    const adSpend = parseFloat(accountMetrics.spend || 0);
    const cpe = engagements > 0 ? adSpend / engagements : 0;
    
    console.log('Account metrics actions:', JSON.stringify(accountMetrics.actions?.slice(0, 10)));
    console.log('Extracted conversions:', conversions, 'Cost per conversion:', costPerConversion, 'Thruplays:', thruplays, 'Engagements:', engagements, 'CPE:', cpe);

    const processedData = {
      overview: {
        cpc: parseFloat(accountMetrics.cpc || 0),
        ctr: parseFloat(accountMetrics.ctr || 0),
        conversions: conversions,
        adSpend: adSpend,
        costPerConversion: costPerConversion,
        impressions: parseInt(accountMetrics.impressions || 0),
        clicks: parseInt(accountMetrics.clicks || 0),
        reach: parseInt(accountMetrics.reach || 0),
        thruplays: thruplays,
        cpr: cpr,
        engagements: engagements,
        cpe: cpe,
      },
      performanceOverTime,
      campaignPerformance: campaigns.slice(0, 10).map((c: any) => ({
        campaign: (c.name || '').length > 25 ? c.name.substring(0, 25) + '…' : c.name,
        conversions: c.conversions || 0,
        roas: c.roas || 0,
      })),
      campaigns,
      countryBreakdown,
    };

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in meta-ads-data function:', error);
    
    // Return placeholder data structure on error
    const placeholderData = {
      overview: {
        cpc: 0,
        ctr: 0,
        conversions: 0,
        adSpend: 0,
        costPerConversion: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
      },
      performanceOverTime: [],
      campaignPerformance: [],
      countryBreakdown: [],
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
