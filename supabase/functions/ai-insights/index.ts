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
    const { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData, country } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable API key not configured');
    }

    console.log('Generating AI insights for marketing data');

    const currencySymbol = '€';
    const currencyName = 'EUR (€)';

    const systemPrompt = `You are a marketing analytics expert. Analyse the provided marketing data and generate actionable insights and recommendations. Focus on:
1. Traffic performance and user engagement
2. Ad spend efficiency and ROAS
3. Conversion funnel optimisation
4. Email campaign performance
5. Cross-channel opportunities

IMPORTANT: All monetary values MUST be displayed in ${currencyName}. Use the ${currencySymbol} symbol for all currency figures. The default currency is Euro (€) unless the UK market is specifically selected.

Provide specific, data-driven recommendations in British English.`;

    const userPrompt = `Analyse this marketing data:

GA4 Traffic: ${JSON.stringify(ga4Data)}
Google Ads: ${JSON.stringify(googleAdsData)}
Meta Ads: ${JSON.stringify(metaAdsData)}
Subbly Subscriptions: ${JSON.stringify(subblyData)}
Mailchimp Campaigns: ${JSON.stringify(mailchimpData)}

Generate 4-5 key insights with specific recommendations.`;

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
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;
    console.log('AI insights generated successfully');

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
