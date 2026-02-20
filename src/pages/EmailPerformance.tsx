import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MailerLiteSection } from "@/components/sections/MailerLiteSection";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { EmailCampaignsTable } from "@/components/EmailCampaignsTable";
import { ScoreCard } from "@/components/ScoreCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, LayoutList, BarChart3, ShoppingBag, Euro, TrendingUp, Package } from "lucide-react";
import { subMonths, subYears, subDays, startOfMonth, differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mailerliteData as placeholderData } from "@/data/placeholderData";
import { CompareMode } from "@/components/DateFilter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CACHE_KEY = 'email_performance_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  mailerliteData: typeof placeholderData;
}

interface EmailAttributionData {
  totalRevenue: number;
  totalSubtotal: number;
  totalOrders: number;
  averageOrderValue: number;
  totalDiscounts: number;
  ordersOverTime: Array<{ date: string; orders: number; revenue: number }>;
}

export default function EmailPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mailerliteData, setMailerliteData] = useState<any>(placeholderData);
  const [compareMode, setCompareMode] = useState<CompareMode>("off");
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [attributionData, setAttributionData] = useState<EmailAttributionData | null>(null);
  const [attributionLoading, setAttributionLoading] = useState(false);

  const fetchEmailData = useCallback(async (forceRefresh = false) => {
    if (!startDate || !endDate) return;
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached: CachedData = JSON.parse(cachedStr);
          const cacheAge = Date.now() - cached.timestamp;
          if (cacheAge < CACHE_DURATION_MS && cached.startDate === startDateStr && cached.endDate === endDateStr) {
            setMailerliteData(cached.mailerliteData);
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
      const { data, error } = await supabase.functions.invoke('mailerlite-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      const newData = data?.data || placeholderData;
      setMailerliteData(newData);

      const now = new Date();
      setLastRefresh(now);

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        mailerliteData: newData,
      }));

      toast({ title: "Data Updated", description: "Email data refreshed successfully." });
    } catch (error) {
      console.error('Error fetching MailerLite data:', error);
      toast({ title: "Error", description: "Failed to fetch email data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  const fetchAttributionData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setAttributionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('shopify-email-attribution', {
        body: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        }
      });
      if (error) throw error;
      setAttributionData(data?.data || null);
    } catch (err) {
      console.error('Error fetching email attribution data:', err);
    } finally {
      setAttributionLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchEmailData(); }, [fetchEmailData]);
  useEffect(() => { fetchAttributionData(); }, [fetchAttributionData]);

  // Fetch comparison period data
  useEffect(() => {
    if (compareMode === 'off' || !startDate || !endDate) {
      setCompareData(null);
      return;
    }
    const daySpan = differenceInDays(endDate, startDate);
    let compStart: Date, compEnd: Date;
    if (compareMode === 'mom') {
      compEnd = subDays(startDate, 1);
      compStart = subDays(compEnd, daySpan);
    } else {
      compStart = subYears(startDate, 1);
      compEnd = subYears(endDate, 1);
    }
    setCompareLoading(true);
    supabase.functions.invoke('mailerlite-data', {
      body: { startDate: format(compStart, 'yyyy-MM-dd'), endDate: format(compEnd, 'yyyy-MM-dd') }
    }).then(res => setCompareData(res.data?.data || null))
      .catch(() => setCompareData(null))
      .finally(() => setCompareLoading(false));
  }, [compareMode, startDate, endDate]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const campaigns = mailerliteData.campaigns || [];

  const formatCurrency = (value: number) =>
    `€${value.toLocaleString('en-IE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <LoadingOverlay isLoading={isLoading} colorScheme="mailchimp" />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
          title="Email Performance"
          titleClassName="text-mailchimp-foreground"
          description="Comprehensive overview of MailerLite email campaigns and subscriber metrics"
          lastRefresh={lastRefresh}
          isLoading={isLoading}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          showCountryFilter={false}
          compareMode={compareMode}
          onCompareModeChange={setCompareMode}
        />

        {/* Subscriber metrics */}
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 lg:w-12 rounded-full bg-mailchimp" />
            <h2 className="text-xl lg:text-2xl font-bold text-mailchimp-foreground">Subscriber Overview</h2>
          </div>
          
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            <ScoreCard
              title="Total Subscribers"
              value={mailerliteData.overview.totalSubscribers?.toLocaleString() || '0'}
              change="All time"
              changeType="neutral"
              icon={Users}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Active Subscribers"
              value={mailerliteData.overview.activeSubscribers?.toLocaleString() || '0'}
              change="Currently active"
              changeType="positive"
              icon={UserCheck}
              colorScheme="mailchimp"
            />
          </div>
        </div>

        {/* Email Revenue Attribution from Shopify */}
        <div className="space-y-4 lg:space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 lg:w-12 rounded-full bg-mailchimp" />
            <h2 className="text-xl lg:text-2xl font-bold text-mailchimp-foreground">Email Revenue (Shopify Attribution)</h2>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard
              title="Email Revenue"
              value={attributionLoading ? '—' : formatCurrency(attributionData?.totalRevenue ?? 0)}
              change="Shopify orders via email"
              changeType="neutral"
              icon={Euro}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Email Orders"
              value={attributionLoading ? '—' : (attributionData?.totalOrders ?? 0).toLocaleString()}
              change="Conversions from email"
              changeType="neutral"
              icon={ShoppingBag}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Avg. Order Value"
              value={attributionLoading ? '—' : formatCurrency(attributionData?.averageOrderValue ?? 0)}
              change="Email-attributed orders"
              changeType="neutral"
              icon={TrendingUp}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Total Discounts"
              value={attributionLoading ? '—' : formatCurrency(attributionData?.totalDiscounts ?? 0)}
              change="Discounts on email orders"
              changeType="neutral"
              icon={Package}
              colorScheme="mailchimp"
            />
          </div>

          {/* Revenue over time chart */}
          {!attributionLoading && attributionData?.ordersOverTime && attributionData.ordersOverTime.length > 0 && (
            <Card>
              <CardHeader className="pb-2 lg:pb-4">
                <CardTitle className="text-base lg:text-lg text-mailchimp-foreground">Email Revenue Over Time</CardTitle>
              </CardHeader>
              <CardContent className="px-2 lg:px-6">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attributionData.ordersOverTime}>
                    <defs>
                      <linearGradient id="emailRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--mailchimp-primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--mailchimp-primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={60}
                      tickFormatter={(v) => `€${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px"
                      }}
                      formatter={(value: number) => [`€${value.toLocaleString('en-IE', { minimumFractionDigits: 2 })}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--mailchimp-primary))"
                      strokeWidth={2}
                      fill="url(#emailRevenueGrad)"
                      name="Revenue"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {!attributionLoading && (!attributionData || attributionData.totalOrders === 0) && (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
              No email-attributed Shopify orders found for this period. Make sure your email campaigns use UTM parameters 
              (<code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">utm_source=mailerlite</code> or <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">utm_medium=email</code>).
            </div>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <LayoutList className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <MailerLiteSection
              data={mailerliteData}
              compareData={compareMode !== 'off' ? compareData : undefined}
              compareLabel={compareMode === 'mom' ? 'MoM' : compareMode === 'yoy' ? 'YoY' : undefined}
              compareLoading={compareMode !== 'off' && compareLoading}
            />
          </TabsContent>
          
          <TabsContent value="campaigns" className="mt-6">
            <EmailCampaignsTable campaigns={campaigns} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
