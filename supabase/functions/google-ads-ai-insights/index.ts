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
    const { campaigns, keywords, responsiveSearchAds, overview } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are a Google Ads specialist and paid search expert. Analyse the provided Google Ads data and provide clear, actionable recommendations in British English. Use €  for all monetary values. Structure your response with clear headings. Be specific, concise, and data-driven. Do not pad your response — skip any section where there is no data.`;

    const topCampaigns = [...(campaigns || [])]
      .sort((a: any, b: any) => (b.spend || 0) - (a.spend || 0))
      .slice(0, 10);

    const topKeywords = [...(keywords || [])]
      .sort((a: any, b: any) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 15);

    const rsas = (responsiveSearchAds || []).slice(0, 10);

    const userPrompt = `Please analyse this Google Ads account data for the selected date range and provide strategic feedback.

## Account Overview
- Total Spend: €${(overview?.adSpend || 0).toFixed(2)}
- Clicks: ${(overview?.clicks || 0).toLocaleString()}
- Impressions: ${(overview?.impressions || 0).toLocaleString()}
- Conversions: ${overview?.conversions || 0}
- CPC: €${(overview?.cpc || 0).toFixed(2)}
- CTR: ${(overview?.ctr || 0).toFixed(2)}%
- Cost Per Conversion: €${(overview?.costPerConversion || 0).toFixed(2)}

## Top Campaigns (by spend)
${topCampaigns.length > 0 ? topCampaigns.map((c: any) => 
  `- ${c.campaign} | Status: ${c.status} | Spend: €${(c.spend||0).toFixed(2)} | Clicks: ${c.clicks||0} | Conversions: ${c.conversions||0} | ROAS: ${(c.roas||0).toFixed(2)}x`
).join('\n') : 'No campaign data available.'}

## Top Keywords (by clicks)
${topKeywords.length > 0 ? topKeywords.map((k: any) =>
  `- "${k.keyword}" [${k.matchType}] | Clicks: ${k.clicks||0} | Impressions: ${k.impressions||0} | CTR: ${(k.ctr||0).toFixed(2)}% | CPC: €${(k.cpc||0).toFixed(2)} | Conversions: ${k.conversions||0} | Quality Score: ${k.qualityScore || 'N/A'}`
).join('\n') : 'No keyword data available.'}

## Responsive Search Ads (top performing)
${rsas.length > 0 ? rsas.map((ad: any) =>
  `- Campaign: ${ad.campaign} | Ad Group: ${ad.adGroup} | Headlines: ${(ad.headlines||[]).slice(0,3).join(' | ')} | CTR: ${(ad.ctr||0).toFixed(2)}% | Conversions: ${ad.conversions||0} | Status: ${ad.status}`
).join('\n') : 'No RSA data available.'}

Please provide:
1. **Campaign Analysis** — which campaigns are performing well and which need attention, with specific recommendations
2. **Keyword Insights** — top performing keywords, any negative keyword opportunities, match type recommendations
3. **RSA Feedback** — headline and ad copy quality observations, suggestions for improvement
4. **Quick Wins** — 3 specific actions to take immediately to improve performance`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const insights = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-ads-ai-insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
