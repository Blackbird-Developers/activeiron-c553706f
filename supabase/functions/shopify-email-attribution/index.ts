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

    const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

    if (!shopifyStoreUrl || !shopifyAccessToken) {
      return new Response(JSON.stringify({
        data: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          totalDiscounts: 0,
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let baseUrl = shopifyStoreUrl.trim();
    if (!baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const graphqlEndpoint = `${baseUrl}/admin/api/2024-01/graphql.json`;
    const headers = {
      'X-Shopify-Access-Token': shopifyAccessToken,
      'Content-Type': 'application/json',
    };

    // Format date range for GraphQL query
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate + 'T23:59:59').toISOString();

    console.log(`Fetching email-attributed Shopify orders: ${startISO} to ${endISO}`);

    // Paginate through orders using GraphQL with customerJourneySummary
    let allOrders: any[] = [];
    let cursor: string | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const afterClause = cursor ? `, after: "${cursor}"` : '';
      
      const query = `{
        orders(
          first: 50,
          query: "created_at:>=${startISO} created_at:<=${endISO} financial_status:paid OR financial_status:partially_paid OR financial_status:partially_refunded"
          ${afterClause}
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              name
              createdAt
              totalPriceSet { shopMoney { amount } }
              subtotalPriceSet { shopMoney { amount } }
              totalDiscountsSet { shopMoney { amount } }
              financialStatus
              lineItems(first: 20) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                  }
                }
              }
              customerJourneySummary {
                firstVisit {
                  utmParameters {
                    source
                    medium
                    campaign
                  }
                  source
                  referrerUrl
                }
                lastVisit {
                  utmParameters {
                    source
                    medium
                    campaign
                  }
                  source
                  referrerUrl
                }
              }
            }
          }
        }
      }`;

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('GraphQL error:', response.status, errText);
        break;
      }

      const json = await response.json();

      if (json.errors) {
        console.error('GraphQL errors:', JSON.stringify(json.errors));
        break;
      }

      const ordersPage = json.data?.orders;
      if (!ordersPage) break;

      allOrders.push(...ordersPage.edges.map((e: any) => e.node));
      hasNextPage = ordersPage.pageInfo.hasNextPage;
      cursor = ordersPage.pageInfo.endCursor;

      console.log(`Fetched ${allOrders.length} orders so far...`);

      if (allOrders.length > 5000) break; // safety limit
    }

    console.log(`Total orders fetched: ${allOrders.length}`);

    // Helper to check if an order is email-attributed
    function isEmailAttributed(order: any): boolean {
      const journey = order.customerJourneySummary;
      if (!journey) return false;

      const visits = [journey.lastVisit, journey.firstVisit].filter(Boolean);

      for (const visit of visits) {
        // Check UTM source
        const utmSource = visit.utmParameters?.source?.toLowerCase() || '';
        const utmMedium = visit.utmParameters?.medium?.toLowerCase() || '';
        if (
          utmSource.includes('email') ||
          utmSource.includes('mailerlite') ||
          utmSource.includes('newsletter') ||
          utmMedium.includes('email')
        ) {
          return true;
        }

        // Check source field
        const source = (visit.source || '').toLowerCase();
        if (source.includes('email') || source.includes('mailerlite')) {
          return true;
        }

        // Check referrer URL
        const referrer = (visit.referrerUrl || '').toLowerCase();
        if (referrer.includes('mailerlite') || referrer.includes('mlsend')) {
          return true;
        }
      }

      return false;
    }

    // Filter to email-attributed orders only
    const emailOrders = allOrders.filter(isEmailAttributed);
    console.log(`Email-attributed orders: ${emailOrders.length} of ${allOrders.length}`);

    // Aggregate totals
    let totalRevenue = 0;
    let totalSubtotal = 0;
    let totalDiscounts = 0;

    for (const order of emailOrders) {
      totalRevenue += parseFloat(order.totalPriceSet?.shopMoney?.amount || '0');
      totalSubtotal += parseFloat(order.subtotalPriceSet?.shopMoney?.amount || '0');
      totalDiscounts += parseFloat(order.totalDiscountsSet?.shopMoney?.amount || '0');
    }

    const totalOrders = emailOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSubtotal / totalOrders : 0;

    // Orders over time
    const ordersOverTimeMap: Map<string, { orders: number; revenue: number }> = new Map();
    for (const order of emailOrders) {
      const dateKey = order.createdAt.split('T')[0];
      const existing = ordersOverTimeMap.get(dateKey) || { orders: 0, revenue: 0 };
      ordersOverTimeMap.set(dateKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + parseFloat(order.subtotalPriceSet?.shopMoney?.amount || '0'),
      });
    }

    const ordersOverTime = Array.from(ordersOverTimeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateStr, data]) => {
        const date = new Date(dateStr);
        return {
          date: `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`,
          orders: data.orders,
          revenue: Math.round(data.revenue * 100) / 100,
        };
      });

    return new Response(JSON.stringify({
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalOrders,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        ordersOverTime,
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: unknown) {
    console.error('Error in shopify-email-attribution:', error);
    return new Response(JSON.stringify({
      data: {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalDiscounts: 0,
        ordersOverTime: [],
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
