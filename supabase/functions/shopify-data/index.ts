import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface ShopifyQLColumn {
  name: string;
  dataType: string;
  displayName: string;
}

interface ShopifyQLResponse {
  data?: {
    shopifyqlQuery: {
      tableData: {
        columns: ShopifyQLColumn[];
        rows: string[][];
      } | null;
      parseErrors: string[] | null;
    };
  };
  errors?: Array<{ message: string }>;
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

    const graphqlEndpoint = `${baseUrl}/admin/api/2024-01/graphql.json`;
    
    const headers = {
      'X-Shopify-Access-Token': shopifyAccessToken,
      'Content-Type': 'application/json',
    };

    // Helper function to execute ShopifyQL queries
    async function executeShopifyQL(query: string): Promise<ShopifyQLResponse> {
      const graphqlQuery = {
        query: `query {
          shopifyqlQuery(query: "${query.replace(/"/g, '\\"')}") {
            tableData {
              columns {
                name
                dataType
                displayName
              }
              rows
            }
            parseErrors
          }
        }`,
      };

      console.log('Executing ShopifyQL:', query);
      const response = await fetch(graphqlEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(graphqlQuery),
      });

      const json = (await response.json()) as ShopifyQLResponse;

      if (!response.ok) {
        console.error('GraphQL request failed:', response.status, JSON.stringify(json));
        throw new Error(`GraphQL request failed: ${response.status}`);
      }

      if (json.errors?.length) {
        console.error('ShopifyQL GraphQL errors:', json.errors.map(e => e.message));
      }

      const parseErrors = json.data?.shopifyqlQuery?.parseErrors;
      if (parseErrors?.length) {
        console.error('ShopifyQL parseErrors:', parseErrors);
      }

      return json;
    }

    // Fetch products using GraphQL
    async function fetchProducts(): Promise<ShopifyProduct[]> {
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

    // ShopifyQL prefers relative time ranges (e.g. SINCE -30d UNTIL today).
    // Convert the selected start/end dates into offsets relative to today (UTC).
    const todayUTC = new Date();
    const utcMidnight = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const parseYmdUTC = (ymd: string) => {
      const [y, m, day] = ymd.split('-').map(Number);
      return new Date(Date.UTC(y, (m || 1) - 1, day || 1));
    };
    const daysDiffUTC = (a: Date, b: Date) => Math.round((utcMidnight(a).getTime() - utcMidnight(b).getTime()) / 86400000);

    const start = parseYmdUTC(startDate);
    const end = parseYmdUTC(endDate);

    // endOffset: how many days ago the end date is from today (0 => today)
    const endOffset = Math.max(0, daysDiffUTC(utcMidnight(todayUTC), end));
    // rangeDays: at least 1 day
    const rangeDays = Math.max(1, daysDiffUTC(end, start));
    // startOffset: how many days ago the start date is from today
    const startOffset = endOffset + rangeDays;

    const sinceExpr = `-${startOffset}d`;
    const untilExpr = endOffset === 0 ? 'today' : `-${endOffset}d`;

    console.log('ShopifyQL time window:', { sinceExpr, untilExpr, startDate, endDate });

    // Fetch sales data using ShopifyQL
    let totalRevenue = 0;
    let totalOrders = 0;
    const ordersOverTime: Array<{ date: string; orders: number; revenue: number }> = [];
    const topProducts: Array<{ name: string; quantity: number; revenue: number }> = [];
    const ordersByStatus: Array<{ status: string; count: number; percentage: number }> = [];

    try {
      // Query 1: Total sales and orders summary
      const salesSummaryQuery = `FROM sales SHOW total_sales, order_count SINCE ${sinceExpr} UNTIL ${untilExpr}`;
      const salesSummaryResponse = await executeShopifyQL(salesSummaryQuery);

      const tableData = salesSummaryResponse.data?.shopifyqlQuery?.tableData;
      if (tableData?.rows?.length) {
        const columns = tableData.columns;
        const row = tableData.rows[0];

        const salesIdx = columns.findIndex(c => c.name === 'total_sales');
        const ordersIdx = columns.findIndex(c => c.name === 'order_count');

        if (salesIdx !== -1 && row[salesIdx]) {
          totalRevenue = Number(String(row[salesIdx]).replace(/[^0-9.-]/g, '')) || 0;
        }
        if (ordersIdx !== -1 && row[ordersIdx]) {
          totalOrders = parseInt(String(row[ordersIdx]).replace(/[^0-9-]/g, '')) || 0;
        }

        console.log(`Sales summary - Revenue: ${totalRevenue}, Orders: ${totalOrders}`);
      } else {
        console.log('Sales summary returned no rows');
      }
    } catch (error) {
      console.error('Error fetching sales summary:', error);
    }

    try {
      // Query 2: Sales over time (by day)
      const salesOverTimeQuery = `FROM sales SHOW total_sales, order_count BY day SINCE ${sinceExpr} UNTIL ${untilExpr} ORDER BY day`;
      const salesOverTimeResponse = await executeShopifyQL(salesOverTimeQuery);

      const tableData = salesOverTimeResponse.data?.shopifyqlQuery?.tableData;
      if (tableData?.rows?.length) {
        const columns = tableData.columns;
        const rows = tableData.rows;

        const dayIdx = columns.findIndex(c => c.name === 'day');
        const salesIdx = columns.findIndex(c => c.name === 'total_sales');
        const ordersIdx = columns.findIndex(c => c.name === 'order_count');

        for (const row of rows) {
          const dateStr = row[dayIdx] || '';
          const revenue = Number(String(row[salesIdx]).replace(/[^0-9.-]/g, '')) || 0;
          const orders = parseInt(String(row[ordersIdx]).replace(/[^0-9-]/g, '')) || 0;

          const date = new Date(dateStr);
          const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;

          ordersOverTime.push({
            date: formattedDate,
            orders,
            revenue: Math.round(revenue * 100) / 100,
          });
        }

        console.log(`Sales over time - ${ordersOverTime.length} days of data`);
      } else {
        console.log('Sales over time returned no rows');
      }
    } catch (error) {
      console.error('Error fetching sales over time:', error);
    }

    try {
      // Query 3: Top products by sales
      const topProductsQuery = `FROM sales SHOW total_sales, net_quantity BY product_title SINCE ${sinceExpr} UNTIL ${untilExpr} ORDER BY total_sales DESC LIMIT 10`;
      const topProductsResponse = await executeShopifyQL(topProductsQuery);

      const tableData = topProductsResponse.data?.shopifyqlQuery?.tableData;
      if (tableData?.rows?.length) {
        const columns = tableData.columns;
        const rows = tableData.rows;

        const titleIdx = columns.findIndex(c => c.name === 'product_title');
        const salesIdx = columns.findIndex(c => c.name === 'total_sales');
        const qtyIdx = columns.findIndex(c => c.name === 'net_quantity');

        for (const row of rows) {
          topProducts.push({
            name: row[titleIdx] || 'Unknown',
            quantity: parseInt(String(row[qtyIdx]).replace(/[^0-9-]/g, '')) || 0,
            revenue: Math.round((Number(String(row[salesIdx]).replace(/[^0-9.-]/g, '')) || 0) * 100) / 100,
          });
        }

        console.log(`Top products - ${topProducts.length} products`);
      } else {
        console.log('Top products returned no rows');
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }

    try {
      // Query 4: Orders by financial status
      const orderStatusQuery = `FROM orders SHOW count BY financial_status SINCE ${sinceExpr} UNTIL ${untilExpr}`;
      const orderStatusResponse = await executeShopifyQL(orderStatusQuery);

      const tableData = orderStatusResponse.data?.shopifyqlQuery?.tableData;
      if (tableData?.rows?.length) {
        const columns = tableData.columns;
        const rows = tableData.rows;

        const statusIdx = columns.findIndex(c => c.name === 'financial_status');
        const countIdx = columns.findIndex(c => c.name === 'count');

        let totalStatusCount = 0;
        const statusData: Array<{ status: string; count: number }> = [];

        for (const row of rows) {
          const count = parseInt(String(row[countIdx]).replace(/[^0-9-]/g, '')) || 0;
          totalStatusCount += count;
          statusData.push({
            status: row[statusIdx] || 'Unknown',
            count,
          });
        }

        for (const item of statusData) {
          ordersByStatus.push({
            status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
            count: item.count,
            percentage: totalStatusCount > 0 ? Math.round((item.count / totalStatusCount) * 100) : 0,
          });
        }

        console.log(`Orders by status - ${ordersByStatus.length} statuses`);
      } else {
        console.log('Orders by status returned no rows');
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    }

    // Fetch products for total count
    const products = await fetchProducts();
    console.log(`Retrieved ${products.length} products`);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
      }
    };

    console.log('Shopify data retrieved successfully:', JSON.stringify(responseData.data.overview));

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
