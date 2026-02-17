import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ShopifySection } from "@/components/sections/ShopifySection";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LayoutList, TrendingUp, Package, Users } from "lucide-react";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CountryCode } from "@/components/CountryFilter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CACHE_KEY = 'shopify_performance_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface ShopifyData {
  overview: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    totalProducts: number;
  };
  ordersOverTime: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  countryBreakdown?: Array<{
    countryCode: string;
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
    ordersByStatus: Array<{ status: string; count: number; percentage: number }>;
  }>;
}

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  shopifyData: ShopifyData;
}

const defaultShopifyData: ShopifyData = {
  overview: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProducts: 0,
  },
  ordersOverTime: [],
  topProducts: [],
  ordersByStatus: [],
};

export default function ShopifyPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [shopifyData, setShopifyData] = useState<ShopifyData>(defaultShopifyData);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const fetchShopifyData = useCallback(async (forceRefresh = false) => {
    if (!startDate || !endDate) return;
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached: CachedData = JSON.parse(cachedStr);
          const cacheAge = Date.now() - cached.timestamp;
          
          if (cacheAge < CACHE_DURATION_MS && 
              cached.startDate === startDateStr && 
              cached.endDate === endDateStr) {
            setShopifyData(cached.shopifyData);
            setLastRefresh(new Date(cached.timestamp));
            return;
          }
        }
      } catch (e) {
        console.error('Cache read error:', e);
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      const newShopifyData = data?.data || defaultShopifyData;
      setShopifyData(newShopifyData);

      const now = new Date();
      setLastRefresh(now);

      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        shopifyData: newShopifyData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      toast({
        title: "Data Updated",
        description: "Shopify data refreshed successfully.",
      });
    } catch (error) {
      console.error('Error fetching Shopify data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Shopify data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchShopifyData();
  }, [fetchShopifyData]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter data based on selected country
  const filteredData = useMemo((): ShopifyData => {
    if (selectedCountry === 'all') {
      return shopifyData;
    }

    // Map CountryCode to Shopify country codes
    const countryCodeMap: Record<CountryCode, string[]> = {
      'IE': ['IE'],
      'UK': ['GB', 'UK'],
      'US': ['US'],
      'DE': ['DE'],
      'NZ': ['NZ'],
      'all': [],
    };

    const targetCodes = countryCodeMap[selectedCountry];
    const countryData = shopifyData.countryBreakdown?.find(
      c => targetCodes.includes(c.countryCode.toUpperCase())
    );

    if (!countryData) {
      return {
        ...shopifyData,
        overview: { totalOrders: 0, totalRevenue: 0, averageOrderValue: 0, totalProducts: shopifyData.overview.totalProducts },
        ordersOverTime: [],
        topProducts: [],
        ordersByStatus: [],
      };
    }

    return {
      overview: {
        totalOrders: countryData.totalOrders,
        totalRevenue: countryData.totalRevenue,
        averageOrderValue: countryData.averageOrderValue,
        totalProducts: shopifyData.overview.totalProducts,
      },
      ordersOverTime: countryData.ordersOverTime,
      topProducts: countryData.topProducts,
      ordersByStatus: countryData.ordersByStatus,
      countryBreakdown: shopifyData.countryBreakdown,
    };
  }, [shopifyData, selectedCountry]);

  // Calculate additional insights from filtered data
  const insights = useMemo(() => {
    const { ordersOverTime, topProducts, ordersByStatus } = filteredData;
    
    // Calculate conversion trends
    const revenueGrowth = ordersOverTime.length >= 2
      ? ((ordersOverTime[ordersOverTime.length - 1]?.revenue || 0) - (ordersOverTime[0]?.revenue || 0)) / Math.max(ordersOverTime[0]?.revenue || 1, 1) * 100
      : 0;

    // Best performing day
    const bestDay = ordersOverTime.reduce((best, day) => 
      day.revenue > (best?.revenue || 0) ? day : best
    , ordersOverTime[0]);

    // Total units sold
    const totalUnitsSold = topProducts.reduce((sum, p) => sum + p.quantity, 0);

    // Paid orders percentage
    const paidOrders = ordersByStatus.find(s => s.status.toLowerCase() === 'paid');
    const paidPercentage = paidOrders?.percentage || 0;

    return {
      revenueGrowth,
      bestDay,
      totalUnitsSold,
      paidPercentage,
    };
  }, [filteredData]);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} colorScheme="shopify" />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
        title="Shopify Performance"
        titleClassName="text-green-600 dark:text-green-400"
        description="E-commerce sales, orders, and product performance analytics"
        lastRefresh={lastRefresh}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      <ShopifySection data={filteredData} />

      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            All Products
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue Trends
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Users className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.topProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.topProducts.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-right">{product.quantity}</TableCell>
                        <TableCell className="text-right text-green-600 dark:text-green-400 font-semibold">
                          {formatCurrency(product.revenue)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(product.quantity > 0 ? product.revenue / product.quantity : 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No product data available for selected period{selectedCountry !== 'all' ? ` and market` : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredData.ordersOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={filteredData.ordersOverTime}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      className="text-muted-foreground"
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No trend data available for selected period{selectedCountry !== 'all' ? ` and market` : ''}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Best Performing Day</CardTitle>
              </CardHeader>
              <CardContent>
                {insights.bestDay ? (
                  <>
                    <p className="text-2xl font-bold">{insights.bestDay.date}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(insights.bestDay.revenue)} revenue • {insights.bestDay.orders} orders
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Units Sold</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{insights.totalUnitsSold.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  Across {filteredData.topProducts.length} products
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Payment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{insights.paidPercentage}%</p>
                <Badge variant={insights.paidPercentage >= 90 ? "default" : "secondary"} className="mt-1">
                  {insights.paidPercentage >= 90 ? "Excellent" : insights.paidPercentage >= 70 ? "Good" : "Needs Attention"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredData.ordersByStatus.length > 0 ? (
                    filteredData.ordersByStatus.map((status, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{status.status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{status.count}</span>
                          <Badge variant="outline" className="text-xs">{status.percentage}%</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No order status data</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Per Product</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredData.topProducts.slice(0, 5).map((product, index) => {
                    const maxRevenue = Math.max(...filteredData.topProducts.map(p => p.revenue), 1);
                    const widthPercent = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
                    
                    return (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate max-w-[200px]">{product.name}</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(product.revenue)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {filteredData.topProducts.length === 0 && (
                    <p className="text-muted-foreground text-sm">No product data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
