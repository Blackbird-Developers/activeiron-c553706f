import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
  subtotal_price: string;
  financial_status: string;
  fulfillment_status: string | null;
  shipping_address?: {
    country: string;
    country_code: string;
  };
  billing_address?: {
    country: string;
    country_code: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    product_id: number;
  }>;
}

interface ShopifyProduct {
  id: string;
  title: string;
  status: string;
  variants: {
    edges: Array<{
      node: {
        inventoryQuantity: number;
        price: string;
      };
    }>;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { startDate, endDate } = await req.json();
    
    const shopifyStoreUrl = Deno.env.get('SHOPIFY_STORE_URL');
    const shopifyAccessToken = Deno.env.get('SHOPIFY_ACCESS_TOKEN');

    if (!shopifyStoreUrl || !shopifyAccessToken) {
      console.log('Shopify credentials not configured');
      return new Response(JSON.stringify({
        data: {
          overview: {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            totalProducts: 0,
          },
          ordersOverTime: [],
          topProducts: [],
          ordersByStatus: [],
        },
        error: 'Shopify credentials not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up the store URL
    let baseUrl = shopifyStoreUrl.trim();
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    console.log(`Fetching Shopify data for period: ${startDate} to ${endDate}`);

    const headers = {
      'X-Shopify-Access-Token': shopifyAccessToken,
      'Content-Type': 'application/json',
    };

    // Fetch orders using REST API (works on all Shopify plans)
    async function fetchAllOrders(): Promise<ShopifyOrder[]> {
      const allOrders: ShopifyOrder[] = [];
      let pageInfo: string | null = null;
      let hasNextPage = true;
      
      // Format dates for Shopify API
      const startDateISO = new Date(startDate).toISOString();
      const endDateISO = new Date(endDate + 'T23:59:59').toISOString();
      
      console.log(`Fetching orders from ${startDateISO} to ${endDateISO}`);

      while (hasNextPage) {
        let url: string;
        
        if (pageInfo) {
          url = `${baseUrl}/admin/api/2024-01/orders.json?limit=250&page_info=${pageInfo}`;
        } else {
          url = `${baseUrl}/admin/api/2024-01/orders.json?limit=250&status=any&created_at_min=${encodeURIComponent(startDateISO)}&created_at_max=${encodeURIComponent(endDateISO)}`;
        }

        console.log(`Fetching orders page: ${pageInfo ? 'cursor' : 'first'}`);
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch orders: ${response.status} - ${errorText}`);
          break;
        }

        const data = await response.json();
        const orders = data.orders || [];
        allOrders.push(...orders);

        console.log(`Retrieved ${orders.length} orders (total: ${allOrders.length})`);

        // Check for pagination via Link header
        const linkHeader = response.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const match = linkHeader.match(/page_info=([^>&]+).*rel="next"/);
          if (match) {
            pageInfo = match[1];
          } else {
            hasNextPage = false;
          }
        } else {
          hasNextPage = false;
        }

        // Safety limit to prevent infinite loops
        if (allOrders.length > 10000) {
          console.log('Reached safety limit of 10,000 orders');
          break;
        }
      }

      return allOrders;
    }

    // Fetch products using GraphQL (this works on all plans)
    async function fetchProducts(): Promise<ShopifyProduct[]> {
      const graphqlEndpoint = `${baseUrl}/admin/api/2024-01/graphql.json`;
      
      const query = {
        query: `{
          products(first: 250) {
            edges {
              node {
                id
                title
                status
                variants(first: 10) {
                  edges {
                    node {
                      inventoryQuantity
                      price
                    }
                  }
                }
              }
            }
          }
        }`
      };

      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        console.error('Failed to fetch products:', response.status);
        return [];
      }

      const data = await response.json();
      return data.data?.products?.edges?.map((edge: { node: ShopifyProduct }) => edge.node) || [];
    }

    // Fetch data in parallel
    const [orders, products] = await Promise.all([
      fetchAllOrders(),
      fetchProducts(),
    ]);

    console.log(`Total orders fetched: ${orders.length}, Products: ${products.length}`);

    // Helper to get country code from order
    function getOrderCountry(order: ShopifyOrder): string {
      const countryCode = order.shipping_address?.country_code || order.billing_address?.country_code || '';
      return countryCode.toUpperCase();
    }

    // Build country breakdown map
    const countryDataMap: Map<string, {
      orders: number;
      revenue: number;
      productSales: Map<string, { name: string; quantity: number; revenue: number }>;
      ordersOverTime: Map<string, { orders: number; revenue: number }>;
      statusCount: Map<string, number>;
    }> = new Map();

    // Initialize aggregators
    function getCountryData(countryCode: string) {
      if (!countryDataMap.has(countryCode)) {
        countryDataMap.set(countryCode, {
          orders: 0,
          revenue: 0,
          productSales: new Map(),
          ordersOverTime: new Map(),
          statusCount: new Map(),
        });
      }
      return countryDataMap.get(countryCode)!;
    }

    // Calculate metrics from orders (also for "all" aggregate)
    let totalRevenue = 0;
    let totalOrders = orders.length;
    
    const ordersOverTimeMap: Map<string, { orders: number; revenue: number }> = new Map();
    const productSalesMap: Map<string, { name: string; quantity: number; revenue: number }> = new Map();
    const statusCountMap: Map<string, number> = new Map();

    for (const order of orders) {
      const countryCode = getOrderCountry(order);
      const countryData = getCountryData(countryCode);

      // Revenue (use subtotal_price for net revenue, or total_price for gross)
      const orderRevenue = parseFloat(order.total_price) || 0;
      totalRevenue += orderRevenue;
      countryData.orders += 1;
      countryData.revenue += orderRevenue;

      // Orders over time (group by date)
      const orderDate = new Date(order.created_at);
      const dateKey = orderDate.toISOString().split('T')[0];
      
      // Global aggregate
      const existing = ordersOverTimeMap.get(dateKey) || { orders: 0, revenue: 0 };
      ordersOverTimeMap.set(dateKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + orderRevenue,
      });
      
      // Per-country aggregate
      const countryExisting = countryData.ordersOverTime.get(dateKey) || { orders: 0, revenue: 0 };
      countryData.ordersOverTime.set(dateKey, {
        orders: countryExisting.orders + 1,
        revenue: countryExisting.revenue + orderRevenue,
      });

      // Product sales
      for (const item of order.line_items) {
        const productKey = item.product_id?.toString() || item.title;
        const itemRevenue = parseFloat(item.price) * item.quantity;
        
        // Global aggregate
        const existingProduct = productSalesMap.get(productKey) || { 
          name: item.title, 
          quantity: 0, 
          revenue: 0 
        };
        productSalesMap.set(productKey, {
          name: item.title,
          quantity: existingProduct.quantity + item.quantity,
          revenue: existingProduct.revenue + itemRevenue,
        });

        // Per-country aggregate
        const countryProduct = countryData.productSales.get(productKey) || { 
          name: item.title, 
          quantity: 0, 
          revenue: 0 
        };
        countryData.productSales.set(productKey, {
          name: item.title,
          quantity: countryProduct.quantity + item.quantity,
          revenue: countryProduct.revenue + itemRevenue,
        });
      }

      // Financial status - global
      const status = order.financial_status || 'unknown';
      statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
      
      // Per-country status
      countryData.statusCount.set(status, (countryData.statusCount.get(status) || 0) + 1);
    }

    // Format orders over time (sorted by date)
    const ordersOverTime = Array.from(ordersOverTimeMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dateStr, data]) => {
        const date = new Date(dateStr);
        const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
        return {
          date: formattedDate,
          orders: data.orders,
          revenue: Math.round(data.revenue * 100) / 100,
        };
      });

    // Format top products (sorted by revenue)
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        name: p.name,
        quantity: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    // Format orders by status
    const totalStatusCount = Array.from(statusCountMap.values()).reduce((a, b) => a + b, 0);
    const ordersByStatus = Array.from(statusCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
        count,
        percentage: totalStatusCount > 0 ? Math.round((count / totalStatusCount) * 100) : 0,
      }));

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Build per-country breakdown
    const countryBreakdown: Array<{
      countryCode: string;
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
      topProducts: Array<{ name: string; quantity: number; revenue: number }>;
      ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
    }> = [];

    for (const [countryCode, data] of countryDataMap.entries()) {
      if (!countryCode) continue; // Skip orders without country

      const countryOrdersOverTime = Array.from(data.ordersOverTime.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateStr, d]) => {
          const date = new Date(dateStr);
          const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
          return { date: formattedDate, orders: d.orders, revenue: Math.round(d.revenue * 100) / 100 };
        });

      const countryTopProducts = Array.from(data.productSales.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(p => ({ name: p.name, quantity: p.quantity, revenue: Math.round(p.revenue * 100) / 100 }));

      const countryTotalStatus = Array.from(data.statusCount.values()).reduce((a, b) => a + b, 0);
      const countryOrdersByStatus = Array.from(data.statusCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' '),
          count,
          percentage: countryTotalStatus > 0 ? Math.round((count / countryTotalStatus) * 100) : 0,
        }));

      countryBreakdown.push({
        countryCode,
        totalOrders: data.orders,
        totalRevenue: Math.round(data.revenue * 100) / 100,
        averageOrderValue: data.orders > 0 ? Math.round((data.revenue / data.orders) * 100) / 100 : 0,
        ordersOverTime: countryOrdersOverTime,
        topProducts: countryTopProducts,
        ordersByStatus: countryOrdersByStatus,
      });
    }

    // Sort by revenue descending
    countryBreakdown.sort((a, b) => b.totalRevenue - a.totalRevenue);

    const responseData = {
      data: {
        overview: {
          totalOrders,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageOrderValue: Math.round(averageOrderValue * 100) / 100,
          totalProducts: products.length,
        },
        ordersOverTime,
        topProducts,
        ordersByStatus,
        countryBreakdown,
      }
    };

    console.log('Shopify data retrieved successfully:', JSON.stringify(responseData.data.overview), 'Countries:', countryBreakdown.map(c => c.countryCode));

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Error in shopify-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      data: {
        overview: {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalProducts: 0,
        },
        ordersOverTime: [],
        topProducts: [],
        ordersByStatus: [],
      },
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
