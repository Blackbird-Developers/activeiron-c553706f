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
    
    const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY');

    if (!MAILERLITE_API_KEY) {
      console.log('MailerLite API key not configured, returning placeholder data');
      
      // Return placeholder data when API key is not configured
      const placeholderData = {
        overview: {
          emailOpens: 0,
          emailClicks: 0,
          openRate: 0,
          clickThroughRate: 0,
          clickToOpenRate: 0,
          totalSubscribers: 0,
          activeSubscribers: 0,
        },
        campaignPerformance: [],
        topCampaigns: [],
      };
      
      return new Response(JSON.stringify({ 
        data: placeholderData,
        message: 'MailerLite API key not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching MailerLite data for period:', { startDate, endDate });

    // Fetch campaigns from MailerLite API v2
    // Note: MailerLite's date filter doesn't work reliably, so we fetch all sent campaigns
    // and filter by date client-side
    const campaignsUrl = `https://connect.mailerlite.com/api/campaigns?filter[status]=sent&limit=100`;
    
    const campaignsResponse = await fetch(
      campaignsUrl,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    if (!campaignsResponse.ok) {
      const errorText = await campaignsResponse.text();
      console.error('MailerLite API error:', campaignsResponse.status, errorText);
      throw new Error(`MailerLite API error: ${campaignsResponse.status}`);
    }

    const campaignsData = await campaignsResponse.json();
    console.log('MailerLite campaigns retrieved:', campaignsData.data?.length || 0);
    
    // Parse date range for filtering
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999); // Include full end day

    // Fetch subscriber stats - these are account-wide totals, not date-filtered
    let totalSubscribers = 0;
    let activeSubscribers = 0;
    
    try {
      // Fetch total subscribers count (limit=0 returns just {"total": N})
      const subscribersResponse = await fetch(
        'https://connect.mailerlite.com/api/subscribers?limit=0',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json();
        console.log('Total subscribers raw response:', JSON.stringify(subscribersData));
        totalSubscribers = subscribersData.total || 0;
      }
      
      // Fetch active subscribers count
      const activeSubscribersResponse = await fetch(
        'https://connect.mailerlite.com/api/subscribers?filter[status]=active&limit=0',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      if (activeSubscribersResponse.ok) {
        const activeSubscribersData = await activeSubscribersResponse.json();
        console.log('Active subscribers raw response:', JSON.stringify(activeSubscribersData));
        activeSubscribers = activeSubscribersData.total || 0;
      }
    } catch (e) {
      console.error('Error fetching subscriber stats:', e);
    }

    // Process campaign data - filter by date range
    const allCampaignsRaw = campaignsData.data || [];
    const campaigns = allCampaignsRaw.filter((campaign: any) => {
      const sentAt = campaign.finished_at || campaign.scheduled_for;
      if (!sentAt) return false;
      const campaignDate = new Date(sentAt);
      return campaignDate >= startDateObj && campaignDate <= endDateObj;
    });
    
    console.log('Campaigns after date filter:', campaigns.length);
    
    let totalOpens = 0;
    let totalClicks = 0;
    let totalSent = 0;
    
    const topCampaigns: any[] = [];
    const campaignPerformance: any[] = [];
    const allCampaigns: any[] = [];
    
    campaigns.forEach((campaign: any) => {
      const stats = campaign.stats || {};
      const sent = stats.sent || 0;
      const opens = stats.opens_count || stats.unique_opens_count || 0;
      const clicks = stats.clicks_count || stats.unique_clicks_count || 0;
      const bounced = stats.hard_bounces_count || 0;
      const unsubscribed = stats.unsubscribes_count || 0;
      
      totalOpens += opens;
      totalClicks += clicks;
      totalSent += sent;
      
      const openRate = sent > 0 ? Math.round((opens / sent) * 1000) / 10 : 0;
      const clickRate = sent > 0 ? Math.round((clicks / sent) * 1000) / 10 : 0;
      const clickToOpenRate = opens > 0 ? Math.round((clicks / opens) * 1000) / 10 : 0;
      
      // Add to all campaigns for detailed view
      allCampaigns.push({
        id: campaign.id,
        name: campaign.name || 'Untitled',
        subject: campaign.emails?.[0]?.subject || campaign.name || 'No subject',
        status: campaign.status || 'sent',
        sentAt: campaign.finished_at || campaign.scheduled_for || null,
        sent: sent,
        opens: opens,
        clicks: clicks,
        bounced: bounced,
        unsubscribed: unsubscribed,
        openRate: openRate,
        clickRate: clickRate,
        clickToOpenRate: clickToOpenRate,
      });
      
      // Add to top campaigns (limit to 4)
      if (topCampaigns.length < 4) {
        topCampaigns.push({
          name: campaign.name || 'Untitled',
          opens: opens,
          clicks: clicks,
          openRate: openRate,
        });
      }
      
      // Add to campaign performance timeline
      if (campaign.scheduled_for || campaign.finished_at) {
        const date = new Date(campaign.finished_at || campaign.scheduled_for);
        campaignPerformance.push({
          date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          opens: opens,
          clicks: clicks,
          openRate: openRate,
          ctr: clickRate,
        });
      }
    });
    
    // Sort top campaigns by opens (descending)
    topCampaigns.sort((a, b) => b.opens - a.opens);
    
    // Calculate rates
    const openRate = totalSent > 0 ? (totalOpens / totalSent * 100) : 0;
    const clickThroughRate = totalSent > 0 ? (totalClicks / totalSent * 100) : 0;
    const clickToOpenRate = totalOpens > 0 ? (totalClicks / totalOpens * 100) : 0;
    
    // Sort all campaigns by sent date (most recent first)
    allCampaigns.sort((a, b) => {
      if (!a.sentAt) return 1;
      if (!b.sentAt) return -1;
      return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    });
    
    const processedData = {
      overview: {
        emailOpens: totalOpens,
        emailClicks: totalClicks,
        openRate: Math.round(openRate * 10) / 10,
        clickThroughRate: Math.round(clickThroughRate * 10) / 10,
        clickToOpenRate: Math.round(clickToOpenRate * 10) / 10,
        totalSubscribers,
        activeSubscribers,
        totalSent,
      },
      campaignPerformance: campaignPerformance.slice(0, 7), // Last 7 data points
      topCampaigns: topCampaigns.slice(0, 4),
      campaigns: allCampaigns,
    };

    return new Response(JSON.stringify({ data: processedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mailerlite-data function:', error);
    
    // Return placeholder data on error
    const placeholderData = {
      overview: {
        emailOpens: 0,
        emailClicks: 0,
        openRate: 0,
        clickThroughRate: 0,
        clickToOpenRate: 0,
        totalSubscribers: 0,
        activeSubscribers: 0,
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
