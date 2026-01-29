import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get a fresh access token using the refresh token
async function getAccessToken(): Promise<string | null> {
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing OAuth credentials');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to refresh access token:', errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
    const loginCustomerId = Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');

    if (!developerToken || !customerId) {
      console.log('Google Ads API credentials not configured - returning placeholder data');
      return new Response(JSON.stringify({ data: getPlaceholderData() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get fresh access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.error('Failed to get access token - returning placeholder data');
      return new Response(JSON.stringify({ data: getPlaceholderData() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Remove dashes from customer ID for API calls
    const formattedCustomerId = customerId.replace(/-/g, '');
    const formattedLoginCustomerId = loginCustomerId ? loginCustomerId.replace(/-/g, '') : null;
    
    console.log('=== Google Ads Debug Info ===');
    console.log('Developer Token (first 10 chars):', developerToken.substring(0, 10) + '...');
    console.log('Customer ID:', formattedCustomerId);
    console.log('Login Customer ID (MCC):', formattedLoginCustomerId || 'Not set');
    console.log('Access Token obtained:', accessToken ? 'Yes' : 'No');
    console.log('Date range:', { startDate, endDate });

    // Test a simple API call to check token validity
    const testResponse = await fetch(
      `https://googleads.googleapis.com/v19/customers/${formattedCustomerId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          ...(formattedLoginCustomerId ? { 'login-customer-id': formattedLoginCustomerId } : {}),
        },
      }
    );
    
    console.log('Test API call status:', testResponse.status);
    const testResponseText = await testResponse.text();
    console.log('Test API response:', testResponseText.substring(0, 500));

    // First, list accessible customers to verify credentials
    const accessibleCustomers = await listAccessibleCustomers(accessToken, developerToken);
    console.log('Accessible customers:', accessibleCustomers);

    // Format dates for Google Ads API (YYYY-MM-DD)
    const formattedStartDate = startDate;
    const formattedEndDate = endDate;

    // Fetch account-level metrics
    const accountMetrics = await fetchAccountMetrics(
      accessToken, 
      developerToken, 
      formattedCustomerId, 
      formattedStartDate, 
      formattedEndDate,
      formattedLoginCustomerId
    );

    // Fetch daily performance data
    const dailyPerformance = await fetchDailyPerformance(
      accessToken, 
      developerToken, 
      formattedCustomerId, 
      formattedStartDate, 
      formattedEndDate,
      formattedLoginCustomerId
    );

    // Fetch campaign performance
    const campaignPerformance = await fetchCampaignPerformance(
      accessToken, 
      developerToken, 
      formattedCustomerId, 
      formattedStartDate, 
      formattedEndDate,
      formattedLoginCustomerId
    );

    // Fetch country breakdown
    const countryBreakdown = await fetchCountryBreakdown(
      accessToken, 
      developerToken, 
      formattedCustomerId, 
      formattedStartDate, 
      formattedEndDate,
      formattedLoginCustomerId
    );

    const data = {
      overview: accountMetrics,
      performanceOverTime: dailyPerformance,
      campaignPerformance: campaignPerformance,
      countryBreakdown: countryBreakdown,
    };

    console.log('Google Ads data retrieved successfully');

    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

// List accessible customers to verify credentials and find correct customer IDs
async function listAccessibleCustomers(accessToken: string, developerToken: string): Promise<string[]> {
  try {
    const response = await fetch(
      'https://googleads.googleapis.com/v19/customers:listAccessibleCustomers',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to list accessible customers:', errorText);
      return [];
    }

    const data = await response.json();
    return data.resourceNames || [];
  } catch (error) {
    console.error('Error listing accessible customers:', error);
    return [];
  }
}
  } catch (error) {
    console.error('Error in google-ads-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function fetchAccountMetrics(
  accessToken: string, 
  developerToken: string, 
  customerId: string, 
  startDate: string, 
  endDate: string,
  loginCustomerId: string | null
) {
  const query = `
    SELECT
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.ctr,
      metrics.average_cpc
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };
    
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error (account metrics):', errorText);
      return getPlaceholderData().overview;
    }

    const data = await response.json();
    console.log('Account metrics response:', JSON.stringify(data).slice(0, 500));
    
    // Aggregate metrics from response
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCostMicros = 0;
    let totalConversions = 0;

    if (data && Array.isArray(data)) {
      for (const result of data) {
        if (result.results) {
          for (const row of result.results) {
            const metrics = row.metrics || {};
            totalImpressions += parseInt(metrics.impressions || 0);
            totalClicks += parseInt(metrics.clicks || 0);
            totalCostMicros += parseInt(metrics.costMicros || 0);
            totalConversions += parseFloat(metrics.conversions || 0);
          }
        }
      }
    }

    const totalSpend = totalCostMicros / 1000000; // Convert micros to actual currency
    const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;

    return {
      cpc: parseFloat(cpc.toFixed(2)),
      ctr: parseFloat(ctr.toFixed(2)),
      conversions: Math.round(totalConversions),
      adSpend: parseFloat(totalSpend.toFixed(2)),
      costPerConversion: parseFloat(costPerConversion.toFixed(2)),
      impressions: totalImpressions,
      clicks: totalClicks,
      reach: totalImpressions, // Google Ads doesn't have reach, using impressions
    };
  } catch (error) {
    console.error('Error fetching account metrics:', error);
    return getPlaceholderData().overview;
  }
}

async function fetchDailyPerformance(
  accessToken: string, 
  developerToken: string, 
  customerId: string, 
  startDate: string, 
  endDate: string,
  loginCustomerId: string | null
) {
  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.ctr
    FROM customer
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY segments.date
  `;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };
    
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error (daily performance):', errorText);
      return [];
    }

    const data = await response.json();
    const dailyData: Record<string, any> = {};

    if (data && Array.isArray(data)) {
      for (const result of data) {
        if (result.results) {
          for (const row of result.results) {
            const date = row.segments?.date;
            const metrics = row.metrics || {};
            
            if (date) {
              if (!dailyData[date]) {
                dailyData[date] = {
                  date: date,
                  impressions: 0,
                  clicks: 0,
                  spend: 0,
                  conversions: 0,
                  ctr: 0,
                };
              }
              
              dailyData[date].impressions += parseInt(metrics.impressions || 0);
              dailyData[date].clicks += parseInt(metrics.clicks || 0);
              dailyData[date].spend += (parseInt(metrics.costMicros || 0) / 1000000);
              dailyData[date].conversions += parseFloat(metrics.conversions || 0);
            }
          }
        }
      }
    }

    // Calculate CTR for each day
    const result = Object.values(dailyData).map((day: any) => ({
      ...day,
      ctr: day.impressions > 0 ? parseFloat(((day.clicks / day.impressions) * 100).toFixed(2)) : 0,
      spend: parseFloat(day.spend.toFixed(2)),
      conversions: Math.round(day.conversions),
    }));

    console.log('Daily performance data retrieved:', result.length, 'days');
    return result;
  } catch (error) {
    console.error('Error fetching daily performance:', error);
    return [];
  }
}

async function fetchCampaignPerformance(
  accessToken: string, 
  developerToken: string, 
  customerId: string, 
  startDate: string, 
  endDate: string,
  loginCustomerId: string | null
) {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      AND campaign.status != 'REMOVED'
  `;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };
    
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error (campaign performance):', errorText);
      return [];
    }

    const data = await response.json();
    const campaignData: Record<string, any> = {};

    if (data && Array.isArray(data)) {
      for (const result of data) {
        if (result.results) {
          for (const row of result.results) {
            const campaign = row.campaign || {};
            const metrics = row.metrics || {};
            const campaignId = campaign.id;
            
            if (campaignId) {
              if (!campaignData[campaignId]) {
                campaignData[campaignId] = {
                  campaign: campaign.name || 'Unknown Campaign',
                  status: campaign.status,
                  impressions: 0,
                  clicks: 0,
                  spend: 0,
                  conversions: 0,
                  conversionsValue: 0,
                };
              }
              
              campaignData[campaignId].impressions += parseInt(metrics.impressions || 0);
              campaignData[campaignId].clicks += parseInt(metrics.clicks || 0);
              campaignData[campaignId].spend += (parseInt(metrics.costMicros || 0) / 1000000);
              campaignData[campaignId].conversions += parseFloat(metrics.conversions || 0);
              campaignData[campaignId].conversionsValue += parseFloat(metrics.conversionsValue || 0);
            }
          }
        }
      }
    }

    // Calculate ROAS and format data
    const result = Object.values(campaignData).map((campaign: any) => ({
      campaign: campaign.campaign,
      status: campaign.status,
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      spend: parseFloat(campaign.spend.toFixed(2)),
      conversions: Math.round(campaign.conversions),
      roas: campaign.spend > 0 ? parseFloat((campaign.conversionsValue / campaign.spend).toFixed(2)) : 0,
    }));

    console.log('Campaign performance data retrieved:', result.length, 'campaigns');
    return result;
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    return [];
  }
}

async function fetchCountryBreakdown(
  accessToken: string, 
  developerToken: string, 
  customerId: string, 
  startDate: string, 
  endDate: string,
  loginCustomerId: string | null
) {
  const query = `
    SELECT
      geographic_view.country_criterion_id,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM geographic_view
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
  `;

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    };
    
    if (loginCustomerId) {
      headers['login-customer-id'] = loginCustomerId;
    }

    const response = await fetch(
      `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Ads API error (country breakdown):', errorText);
      return getPlaceholderData().countryBreakdown;
    }

    const data = await response.json();
    const countryData: Record<string, any> = {};

    // Country ID to name mapping for common countries
    const countryMap: Record<string, string> = {
      '2372': 'Ireland',
      '2826': 'United Kingdom',
      '2840': 'United States',
      '2276': 'Germany',
      '2250': 'France',
      '2724': 'Spain',
      '2380': 'Italy',
      '2528': 'Netherlands',
      '2056': 'Belgium',
      '2040': 'Austria',
    };

    if (data && Array.isArray(data)) {
      for (const result of data) {
        if (result.results) {
          for (const row of result.results) {
            const geoView = row.geographicView || {};
            const metrics = row.metrics || {};
            const countryId = geoView.countryCriterionId;
            
            if (countryId) {
              const countryName = countryMap[countryId] || `Country ${countryId}`;
              
              if (!countryData[countryId]) {
                countryData[countryId] = {
                  country: countryName,
                  impressions: 0,
                  clicks: 0,
                  spend: 0,
                  conversions: 0,
                };
              }
              
              countryData[countryId].impressions += parseInt(metrics.impressions || 0);
              countryData[countryId].clicks += parseInt(metrics.clicks || 0);
              countryData[countryId].spend += (parseInt(metrics.costMicros || 0) / 1000000);
              countryData[countryId].conversions += parseFloat(metrics.conversions || 0);
            }
          }
        }
      }
    }

    // Calculate CPC and CTR
    const result = Object.values(countryData).map((country: any) => ({
      country: country.country,
      impressions: country.impressions,
      clicks: country.clicks,
      spend: parseFloat(country.spend.toFixed(2)),
      conversions: Math.round(country.conversions),
      cpc: country.clicks > 0 ? parseFloat((country.spend / country.clicks).toFixed(2)) : 0,
      ctr: country.impressions > 0 ? parseFloat(((country.clicks / country.impressions) * 100).toFixed(2)) : 0,
    }));

    console.log('Country breakdown data retrieved:', result.length, 'countries');
    return result.length > 0 ? result : getPlaceholderData().countryBreakdown;
  } catch (error) {
    console.error('Error fetching country breakdown:', error);
    return getPlaceholderData().countryBreakdown;
  }
}

function getPlaceholderData() {
  return {
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
    countryBreakdown: [
      { country: 'Ireland', impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, ctr: 0 },
      { country: 'United Kingdom', impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, ctr: 0 },
      { country: 'United States', impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, ctr: 0 },
      { country: 'Germany', impressions: 0, clicks: 0, spend: 0, conversions: 0, cpc: 0, ctr: 0 },
    ],
  };
}
