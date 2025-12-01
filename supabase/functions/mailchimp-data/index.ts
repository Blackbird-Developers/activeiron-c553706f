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

    const data = await response.json();
    console.log('Mailchimp data retrieved successfully');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in mailchimp-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
