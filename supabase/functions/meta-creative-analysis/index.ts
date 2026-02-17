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
    const META_AD_ACCOUNT_ID_RAW = Deno.env.get('META_AD_ACCOUNT_ID');
    const META_AD_ACCOUNT_ID = META_AD_ACCOUNT_ID_RAW?.trim();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!META_ADS_API_KEY || !META_AD_ACCOUNT_ID) {
      throw new Error('Meta Ads credentials not configured');
    }

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Fetching Meta Ads creative data for period:', { startDate, endDate });

    // Fetch ads with creative data
    const adsResponse = await fetch(
      `https://graph.facebook.com/v21.0/act_${META_AD_ACCOUNT_ID}/ads?` +
      new URLSearchParams({
        access_token: META_ADS_API_KEY,
        fields: 'id,name,status,creative{id,name,title,body,image_url,thumbnail_url,video_id}',
        filtering: JSON.stringify([{ field: 'effective_status', operator: 'IN', value: ['ACTIVE', 'PAUSED'] }]),
        limit: '50',
      }),
      { method: 'GET' }
    );

    if (!adsResponse.ok) {
      const errorText = await adsResponse.text();
      console.error('Meta Ads API error:', adsResponse.status, errorText);
      throw new Error(`Meta Ads API error: ${adsResponse.status}`);
    }

    const adsData = await adsResponse.json();
    const ads = adsData.data || [];

    // Fetch insights for each ad
    const adInsights = await Promise.all(
      ads.slice(0, 50).map(async (ad: any) => {
        try {
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${ad.id}/insights?` +
            new URLSearchParams({
              access_token: META_ADS_API_KEY,
              time_range: JSON.stringify({ since: startDate, until: endDate }),
              fields: 'impressions,clicks,spend,cpc,ctr,actions,cost_per_action_type',
            }),
            { method: 'GET' }
          );

          if (insightsResponse.ok) {
            const insights = await insightsResponse.json();
            const data = insights.data?.[0] || {};
            
            const conversions = data.actions?.find((a: any) => 
              a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
            )?.value || 0;

            const creative = ad.creative || {};
            const headline = creative.title || ad.name || 'Untitled';
            const description = creative.body || ad.name || 'N/A';

            return {
              id: ad.id,
              name: ad.name,
              status: ad.status,
              creative: creative,
              headline,
              description,
              imageUrl: creative.image_url || creative.thumbnail_url || null,
              hasVideo: !!creative.video_id,
              spend: parseFloat(data.spend || 0),
              impressions: parseInt(data.impressions || 0),
              clicks: parseInt(data.clicks || 0),
              cpc: parseFloat(data.cpc || 0),
              ctr: parseFloat(data.ctr || 0),
              conversions: parseInt(conversions),
            };
          }
        } catch (error) {
          console.error(`Error fetching insights for ad ${ad.id}:`, error);
        }
        return null;
      })
    );

    const validAds = adInsights.filter(a => a !== null && a.spend > 0);
    
    // Sort by different metrics to find best performers
    const bestByClicks = [...validAds].sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    const bestByCTR = [...validAds].sort((a, b) => b.ctr - a.ctr).slice(0, 5);
    const bestByConversions = [...validAds].sort((a, b) => b.conversions - a.conversions).slice(0, 5);
    const bestByCPC = [...validAds].sort((a, b) => a.cpc - b.cpc).slice(0, 5);

    // Generate AI analysis
    const systemPrompt = `You are a Meta Ads creative performance analyst. Analyse ad creative data and provide insights in British English. Focus on identifying patterns in what makes creatives perform well.`;
    
    const userPrompt = `Analyse these Meta Ads creative performance metrics:

TOP PERFORMERS BY CLICKS:
${bestByClicks.map(a => `- "${a.headline}" | ${a.clicks} clicks | CTR: ${a.ctr.toFixed(2)}% | Type: ${a.hasVideo ? 'Video' : 'Image'}`).join('\n')}

TOP PERFORMERS BY CTR:
${bestByCTR.map(a => `- "${a.headline}" | CTR: ${a.ctr.toFixed(2)}% | Clicks: ${a.clicks} | Type: ${a.hasVideo ? 'Video' : 'Image'}`).join('\n')}

TOP PERFORMERS BY CONVERSIONS:
${bestByConversions.map(a => `- "${a.headline}" | ${a.conversions} conversions | Spend: €${a.spend.toFixed(2)} | Type: ${a.hasVideo ? 'Video' : 'Image'}`).join('\n')}

MOST EFFICIENT (LOW CPC):
${bestByCPC.map(a => `- "${a.headline}" | CPC: €${a.cpc.toFixed(2)} | Clicks: ${a.clicks} | Type: ${a.hasVideo ? 'Video' : 'Image'}`).join('\n')}

Total ads analysed: ${validAds.length}
Video ads: ${validAds.filter(a => a.hasVideo).length}
Image ads: ${validAds.filter(a => !a.hasVideo).length}

Provide:
1. Overall creative performance summary (2-3 sentences)
2. Best performing creative elements (headlines, formats)
3. Video vs Image performance comparison
4. Top 3 actionable recommendations for improving creative performance`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    let aiAnalysis = '';
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      aiAnalysis = aiData.choices[0].message.content;
    } else {
      if (aiResponse.status === 429) {
        aiAnalysis = 'Rate limit exceeded. Please try again later.';
      } else if (aiResponse.status === 402) {
        aiAnalysis = 'AI credits exhausted. Please add funds to continue.';
      } else {
        aiAnalysis = 'Unable to generate AI analysis at this time.';
      }
    }

    return new Response(JSON.stringify({
      ads: validAds,
      topPerformers: {
        byClicks: bestByClicks,
        byCTR: bestByCTR,
        byConversions: bestByConversions,
        byCPC: bestByCPC,
      },
      summary: {
        totalAds: validAds.length,
        videoAds: validAds.filter(a => a.hasVideo).length,
        imageAds: validAds.filter(a => !a.hasVideo).length,
        avgCTR: validAds.length > 0 ? validAds.reduce((sum, a) => sum + a.ctr, 0) / validAds.length : 0,
        avgCPC: validAds.length > 0 ? validAds.reduce((sum, a) => sum + a.cpc, 0) / validAds.length : 0,
      },
      aiAnalysis,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in meta-creative-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        ads: [],
        topPerformers: { byClicks: [], byCTR: [], byConversions: [], byCPC: [] },
        summary: { totalAds: 0, videoAds: 0, imageAds: 0, avgCTR: 0, avgCPC: 0 },
        aiAnalysis: 'Unable to generate analysis at this time.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
