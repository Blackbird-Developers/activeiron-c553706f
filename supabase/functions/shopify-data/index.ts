import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyOrder {
  id: number;
  created_at: string;
  total_price: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    title: string;
    quantity: number;
    price: string;
  }>;
}

interface ShopifyProduct {
  id: number;
  title: string;
  status: string;
  variants: Array<{
    inventory_quantity: number;
    price: string;
  }>;
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

    // Fetch orders within date range
    const ordersUrl = `${baseUrl}/admin/api/2024-01/orders.json?status=any&created_at_min=${startDate}T00:00:00Z&created_at_max=${endDate}T23:59:59Z&limit=250`;
    console.log('Fetching orders from:', ordersUrl);
    
    const ordersResponse = await fetch(ordersUrl, { headers });
    
    if (!ordersResponse.ok) {
      const errorText = await ordersResponse.text();
      console.error('Shopify orders API error:', ordersResponse.status, errorText);
      throw new Error(`Shopify API error: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    const orders: ShopifyOrder[] = ordersData.orders || [];
    console.log(`Retrieved ${orders.length} orders`);

    // Fetch products
    const productsUrl = `${baseUrl}/admin/api/2024-01/products.json?limit=250`;
    const productsResponse = await fetch(productsUrl, { headers });
    
    let products: ShopifyProduct[] = [];
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      products = productsData.products || [];
      console.log(`Retrieved ${products.length} products`);
    } else {
      console.error('Failed to fetch products:', productsResponse.status);
    }

    // Calculate overview metrics
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price || '0'), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group orders by date for time series
    const ordersByDate: Record<string, { orders: number; revenue: number }> = {};
    orders.forEach(order => {
      const date = new Date(order.created_at);
      const dateKey = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'short' })}`;
      
      if (!ordersByDate[dateKey]) {
        ordersByDate[dateKey] = { orders: 0, revenue: 0 };
      }
      ordersByDate[dateKey].orders += 1;
      ordersByDate[dateKey].revenue += parseFloat(order.total_price || '0');
    });

    const ordersOverTime = Object.entries(ordersByDate).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: Math.round(data.revenue * 100) / 100,
    }));

    // Calculate top products from orders
    const productSales: Record<string, { title: string; quantity: number; revenue: number }> = {};
    orders.forEach(order => {
      order.line_items?.forEach(item => {
        if (!productSales[item.title]) {
          productSales[item.title] = { title: item.title, quantity: 0, revenue: 0 };
        }
        productSales[item.title].quantity += item.quantity;
        productSales[item.title].revenue += parseFloat(item.price) * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(p => ({
        name: p.title,
        quantity: p.quantity,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    // Orders by status
    const statusCounts: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.financial_status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
    }));

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

    console.log('Shopify data retrieved successfully');

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
