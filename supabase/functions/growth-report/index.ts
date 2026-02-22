import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BENCHMARKS = {
  ga4: {
    engagementRate: { good: 65, excellent: 75, unit: '%', label: 'Engagement Rate' },
    bounceRate: { good: 40, excellent: 30, unit: '%', label: 'Bounce Rate', inverted: true },
  },
  googleAds: {
    ctr: { good: 5.0, excellent: 7.0, unit: '%', label: 'CTR' },
    cpc: { good: 1.20, excellent: 0.80, unit: '€', label: 'CPC', inverted: true },
    conversionRate: { good: 4.0, excellent: 6.0, unit: '%', label: 'Conversion Rate' },
  },
  metaAds: {
    ctr: { good: 2.5, excellent: 4.0, unit: '%', label: 'CTR' },
    cpc: { good: 1.00, excellent: 0.60, unit: '€', label: 'CPC', inverted: true },
    cpr: { good: 8.00, excellent: 5.00, unit: '€', label: 'Cost Per Result', inverted: true },
  },
  email: {
    openRate: { good: 30, excellent: 40, unit: '%', label: 'Open Rate' },
    clickThroughRate: { good: 5.0, excellent: 8.0, unit: '%', label: 'Click-Through Rate' },
    clickToOpenRate: { good: 15, excellent: 25, unit: '%', label: 'Click-to-Open Rate' },
  },
  shopify: {
    conversionRate: { good: 2.5, excellent: 4.0, unit: '%', label: 'Store Conversion Rate' },
  },
};

function buildBenchmarkAnalysis(data: any) {
  const results: any[] = [];

  // GA4
  const ga4 = data.ga4Data?.overview;
  if (ga4) {
    if (ga4.engagementRate != null) {
      results.push({ channel: 'GA4', metric: 'Engagement Rate', current: ga4.engagementRate, benchmark: BENCHMARKS.ga4.engagementRate });
    }
    if (ga4.bounceRate != null) {
      results.push({ channel: 'GA4', metric: 'Bounce Rate', current: ga4.bounceRate, benchmark: BENCHMARKS.ga4.bounceRate });
    }
  }

  // Google Ads
  const gads = data.googleAdsData?.overview;
  if (gads) {
    if (gads.ctr != null) results.push({ channel: 'Google Ads', metric: 'CTR', current: gads.ctr, benchmark: BENCHMARKS.googleAds.ctr });
    if (gads.cpc != null) results.push({ channel: 'Google Ads', metric: 'CPC', current: gads.cpc, benchmark: BENCHMARKS.googleAds.cpc });
    const convRate = gads.clicks > 0 ? (gads.conversions / gads.clicks) * 100 : 0;
    results.push({ channel: 'Google Ads', metric: 'Conversion Rate', current: Number(convRate.toFixed(2)), benchmark: BENCHMARKS.googleAds.conversionRate });
  }

  // Meta Ads
  const meta = data.metaAdsData?.overview;
  if (meta) {
    if (meta.ctr != null) results.push({ channel: 'Meta Ads', metric: 'CTR', current: meta.ctr, benchmark: BENCHMARKS.metaAds.ctr });
    if (meta.cpc != null) results.push({ channel: 'Meta Ads', metric: 'CPC', current: meta.cpc, benchmark: BENCHMARKS.metaAds.cpc });
    if (meta.cpr != null) results.push({ channel: 'Meta Ads', metric: 'CPR', current: meta.cpr, benchmark: BENCHMARKS.metaAds.cpr });
  }

  // Email
  const email = data.mailerliteData?.overview;
  if (email) {
    if (email.openRate != null) results.push({ channel: 'Email', metric: 'Open Rate', current: email.openRate, benchmark: BENCHMARKS.email.openRate });
    if (email.clickThroughRate != null) results.push({ channel: 'Email', metric: 'CTR', current: email.clickThroughRate, benchmark: BENCHMARKS.email.clickThroughRate });
    if (email.clickToOpenRate != null) results.push({ channel: 'Email', metric: 'CTOR', current: email.clickToOpenRate, benchmark: BENCHMARKS.email.clickToOpenRate });
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { ga4Data, googleAdsData, metaAdsData, shopifyData, mailerliteData } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('Lovable API key not configured');

    const benchmarks = buildBenchmarkAnalysis(body);

    const totalGoogleSpend = googleAdsData?.overview?.adSpend || 0;
    const totalMetaSpend = metaAdsData?.overview?.adSpend || 0;
    const totalAdSpend = totalGoogleSpend + totalMetaSpend;
    const shopifyRevenue = shopifyData?.overview?.totalRevenue || 0;
    const shopifyOrders = shopifyData?.overview?.totalOrders || 0;

    const systemPrompt = `You are a senior digital marketing strategist preparing a Growth Opportunities Report for a D2C health supplement brand (ActiveIron). Your goal is to identify high-impact areas of improvement and quantify the estimated revenue/efficiency gains.

IMPORTANT RULES:
- All monetary values MUST be in Euro (€).
- Use British English throughout.
- Be specific with numbers and percentages. Every recommendation MUST include an estimated impact figure.
- Structure your response EXACTLY as valid JSON matching the schema below. Return ONLY the JSON, no markdown fences.

JSON Schema:
{
  "executiveSummary": "2-3 sentence overview of the biggest opportunities",
  "totalEstimatedAnnualImpact": "€XX,XXX estimated additional annual revenue/savings",
  "opportunities": [
    {
      "channel": "GA4 | Google Ads | Meta Ads | Email | Shopify | Cross-Channel",
      "title": "Short opportunity title",
      "currentState": "What the data shows now (with numbers)",
      "benchmarkComparison": "How this compares to industry benchmarks",
      "recommendation": "Specific actionable recommendation",
      "estimatedImpact": "€X,XXX/month or X% improvement with projected revenue impact",
      "priority": "High | Medium | Low",
      "effort": "Quick Win | Medium | Long-term",
      "icon": "trending-up | target | dollar-sign | mail | shopping-bag | bar-chart"
    }
  ],
  "quickWins": ["3-5 things that can be done this week"],
  "investmentAreas": ["2-3 areas worth investing budget into"]
}`;

    const userPrompt = `Analyse this marketing data and identify 6-8 growth opportunities with quantified estimates:

## Current Performance (Last 30 Days)

### GA4 Traffic
- Users: ${ga4Data?.overview?.totalUsers?.toLocaleString() || 'N/A'}
- Sessions: ${ga4Data?.overview?.sessions?.toLocaleString() || 'N/A'}
- Engagement Rate: ${ga4Data?.overview?.engagementRate || 'N/A'}%
- Bounce Rate: ${ga4Data?.overview?.bounceRate || 'N/A'}%
- New Users: ${ga4Data?.overview?.newUsers?.toLocaleString() || 'N/A'}

### Google Ads
- Spend: €${totalGoogleSpend.toLocaleString()}
- CTR: ${googleAdsData?.overview?.ctr || 'N/A'}%
- CPC: €${googleAdsData?.overview?.cpc || 'N/A'}
- Conversions: ${googleAdsData?.overview?.conversions || 'N/A'}
- Cost/Conversion: €${googleAdsData?.overview?.costPerConversion || 'N/A'}

### Meta Ads
- Spend: €${totalMetaSpend.toLocaleString()}
- CTR: ${metaAdsData?.overview?.ctr || 'N/A'}%
- CPC: €${metaAdsData?.overview?.cpc || 'N/A'}
- Conversions: ${metaAdsData?.overview?.conversions || 'N/A'}
- Cost/Conversion: €${metaAdsData?.overview?.costPerConversion || 'N/A'}
- CPR: €${metaAdsData?.overview?.cpr || 'N/A'}
- Reach: ${metaAdsData?.overview?.reach?.toLocaleString() || 'N/A'}
- Thruplays: ${metaAdsData?.overview?.thruplays?.toLocaleString() || 'N/A'}

### Shopify
- Total Orders: ${shopifyOrders}
- Gross Revenue: €${shopifyRevenue.toLocaleString()}
- AOV: €${shopifyData?.overview?.averageOrderValue || 'N/A'}
- Blended ROAS: ${totalAdSpend > 0 ? (shopifyRevenue / totalAdSpend).toFixed(2) : 'N/A'}x
- Blended CPA: €${shopifyOrders > 0 ? (totalAdSpend / shopifyOrders).toFixed(2) : 'N/A'}

### Email (MailerLite)
- Open Rate: ${mailerliteData?.overview?.openRate || 'N/A'}%
- Click-Through Rate: ${mailerliteData?.overview?.clickThroughRate || 'N/A'}%
- Click-to-Open Rate: ${mailerliteData?.overview?.clickToOpenRate || 'N/A'}%
- Subscribers: ${mailerliteData?.overview?.totalSubscribers?.toLocaleString() || 'N/A'}

## Benchmark Comparison
${benchmarks.map(b => `- ${b.channel} ${b.metric}: Current ${b.current}${b.benchmark.unit} vs Good ${b.benchmark.good}${b.benchmark.unit} / Excellent ${b.benchmark.excellent}${b.benchmark.unit}${b.benchmark.inverted ? ' (lower is better)' : ''}`).join('\n')}

## Campaign Data
- Google Ads Campaigns: ${JSON.stringify(googleAdsData?.campaignPerformance || [])}
- Meta Ads Campaigns: ${JSON.stringify(metaAdsData?.campaignPerformance || [])}
- Top Shopify Products: ${JSON.stringify(shopifyData?.topProducts || [])}

Based on this data, identify 6-8 specific, actionable growth opportunities with quantified revenue or efficiency estimates.`;

    console.log('Generating growth report...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const rawContent = aiData.choices[0].message.content;
    console.log('Growth report generated successfully');

    // Try to parse the JSON from the AI response
    let report;
    try {
      // Strip markdown fences if present
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      report = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse AI JSON, returning raw:', parseErr);
      report = { raw: rawContent };
    }

    return new Response(JSON.stringify({ report, benchmarks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in growth-report function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
