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
    
    const MAILCHIMP_KEY = Deno.env.get('mailchimp_key');

    if (!MAILCHIMP_KEY) {
      throw new Error('Mailchimp API key not configured');
    }

    console.log('Fetching Mailchimp data for period:', { startDate, endDate });

    // Extract data centre from API key (last part after the dash)
    const dc = MAILCHIMP_KEY.split('-').pop();

    // Call Mailchimp API
    const response = await fetch(
      `https://${dc}.api.mailchimp.com/3.0/reports?since_send_time=${startDate}&before_send_time=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MAILCHIMP_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mailchimp API error:', response.status, errorText);
      throw new Error(`Mailchimp API error: ${response.status}`);
    }

    const rawData = await response.json();
    console.log('Mailchimp data retrieved successfully');

    // Transform raw Mailchimp data to match expected format
    const reports = rawData.reports || [];
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    
    const topCampaigns: any[] = [];
    
    reports.forEach((report: any) => {
      totalOpens += report.opens?.unique_opens || 0;
      totalClicks += report.clicks?.unique_subscriber_clicks || 0;
      totalSent += report.emails_sent || 0;
      
      // Add to top campaigns
      if (topCampaigns.length < 4) {
        topCampaigns.push({
          name: report.campaign_title || 'Untitled',
          opens: report.opens?.unique_opens || 0,
          clicks: report.clicks?.unique_subscriber_clicks || 0,
          openRate: Math.round((report.opens?.open_rate || 0) * 1000) / 10,
        });
      }
    });
    
    const openRate = totalSent > 0 ? (totalOpens / totalSent * 100) : 0;
    const clickThroughRate = totalSent > 0 ? (totalClicks / totalSent * 100) : 0;
    const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens * 100) : 0;
    
    const processedData = {
      overview: {
        emailOpens: totalOpens,
        emailClicks: totalClicks,
        openRate: Math.round(openRate * 10) / 10,
        clickThroughRate: Math.round(clickThroughRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
      },
      campaignPerformance: [],
      topCampaigns,
    };

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mailchimp-data function:', error);
    
    // Return placeholder data on error
    const placeholderData = {
      overview: {
        emailOpens: 0,
        emailClicks: 0,
        openRate: 0,
        clickThroughRate: 0,
        clickToOpenRate: 0,
      },
      campaignPerformance: [],
      topCampaigns: [],
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
