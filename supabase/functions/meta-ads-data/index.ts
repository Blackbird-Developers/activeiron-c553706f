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

    // Call Meta Marketing API for account-level insights
    const accountResponse = await fetch(
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
        },
        performanceOverTime: [],
        campaignPerformance: [],
        campaigns: [],
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
                fields: 'impressions,clicks,spend,cpc,ctr,actions,cost_per_action_type',
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
                roas: 0, // Would need revenue data
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

    const processedData = {
      ...accountData,
      campaigns,
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
      },
      performanceOverTime: [],
      campaignPerformance: [],
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
