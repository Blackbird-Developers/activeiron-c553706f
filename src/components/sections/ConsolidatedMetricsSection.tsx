import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ga4Data, googleAdsData, metaAdsData, mailchimpData, shopifyData } from "@/data/placeholderData";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

interface ConsolidatedMetricsSectionProps {
  ga4Data?: typeof ga4Data;
  metaAdsData?: typeof metaAdsData;
  googleAdsData?: typeof googleAdsData;
  mailchimpData?: typeof mailchimpData;
  shopifyData?: typeof shopifyData;
  startDate?: Date;
  endDate?: Date;
}

interface MetricRow {
  category: string;
  metric: string;
  cumulative: string | number;
  dailyValues: (string | number)[];
  colorClass?: string;
  isPlaceholder?: boolean;
}

export function ConsolidatedMetricsSection({
  ga4Data: ga4,
  metaAdsData: metaAds,
  googleAdsData: googleAds,
  mailchimpData: mailchimp,
  shopifyData: shopify,
  startDate,
  endDate,
}: ConsolidatedMetricsSectionProps) {
  
  // Generate days for the current month or selected range
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());
  const daysInRange = eachDayOfInterval({ start, end });

  // Helper to get daily value from trends data
  const getDailyValue = (trendsData: any[], date: Date, field: string) => {
    if (!trendsData || trendsData.length === 0) return 0;
    
    const formats = [
      format(date, 'd MMM'),
      format(date, 'yyyy-MM-dd'),
      format(date, 'dd/MM/yyyy'),
    ];
    
    const dayData = trendsData.find((d: any) => 
      formats.some(f => d.date === f)
    );
    return dayData?.[field] || 0;
  };

  // Calculate cumulative metrics - Website/GA4
  const totalUsers = ga4?.overview?.totalUsers || 0;
  const newUsers = ga4?.overview?.newUsers || 0;
  const sessions = ga4?.overview?.sessions || 0;
  const pageViews = ga4?.overview?.pageViews || 0;
  const engagementRate = ga4?.overview?.engagementRate || 0;
  const bounceRate = ga4?.overview?.bounceRate || 0;
  
  // Meta Ads metrics
  const metaImpressions = metaAds?.overview?.impressions || 0;
  const metaClicks = metaAds?.overview?.clicks || 0;
  const metaSpend = metaAds?.overview?.adSpend || 0;
  const metaCPC = metaAds?.overview?.cpc || 0;
  const metaCTR = metaAds?.overview?.ctr || 0;
  const metaConversions = metaAds?.overview?.conversions || 0;
  const metaCPA = metaAds?.overview?.costPerConversion || 0;
  
  // Google Ads metrics
  const googleImpressions = googleAds?.overview?.impressions || 0;
  const googleClicks = googleAds?.overview?.clicks || 0;
  const googleSpend = googleAds?.overview?.adSpend || 0;
  const googleCPC = googleAds?.overview?.cpc || 0;
  const googleCTR = googleAds?.overview?.ctr || 0;
  const googleConversions = googleAds?.overview?.conversions || 0;
  const googleCPA = googleAds?.overview?.costPerConversion || 0;
  
  // Combined Paid Ads
  const totalImpressions = metaImpressions + googleImpressions;
  const totalClicks = metaClicks + googleClicks;
  const totalSpend = metaSpend + googleSpend;
  const totalConversions = metaConversions + googleConversions;
  const combinedCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const combinedCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cumulativeCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  
  // Conversion rate (conversions / users)
  const cumulativeCVR = totalUsers > 0 ? (totalConversions / totalUsers) * 100 : 0;
  
  // Email metrics
  const emailOpens = mailchimp?.overview?.emailOpens || 0;
  const emailClicks = mailchimp?.overview?.emailClicks || 0;
  const openRate = mailchimp?.overview?.openRate || 0;
  const clickRate = mailchimp?.overview?.clickThroughRate || 0;

  // Shopify / E-commerce metrics
  const shopifyOrders = shopify?.overview?.totalOrders || 0;
  const shopifyRevenue = shopify?.overview?.totalRevenue || 0;
  const averageOrderValue = shopify?.overview?.averageOrderValue || 0;
  
  // Blended CPA = Total Ad Spend / Shopify Orders
  const blendedCPA = shopifyOrders > 0 ? totalSpend / shopifyOrders : 0;
  
  // E-commerce conversion rate (orders / total users)
  const ecommerceConversionRate = totalUsers > 0 ? (shopifyOrders / totalUsers) * 100 : 0;
  
  // ROAS = Revenue / Spend
  const roas = totalSpend > 0 ? shopifyRevenue / totalSpend : 0;
  
  // Get daily Shopify values
  const getShopifyDailyValue = (date: Date, field: 'orders' | 'revenue') => {
    if (!shopify?.ordersOverTime || shopify.ordersOverTime.length === 0) return 0;
    
    const formats = [
      `${date.getDate()} ${format(date, 'MMM')}`,
      format(date, 'd MMM'),
    ];
    
    const dayData = shopify.ordersOverTime.find((d: any) => 
      formats.some(f => d.date === f)
    );
    return dayData?.[field] || 0;
  };

  // Generate metric rows matching Excel structure
  const metricRows: MetricRow[] = [
    // Website Tracking Section (GA4)
    { category: "Website", metric: "Total Users", cumulative: totalUsers.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4?.trendsOverTime, d, 'users').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Website", metric: "New Users", cumulative: newUsers.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4?.trendsOverTime, d, 'newUsers').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Website", metric: "Sessions", cumulative: sessions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4?.trendsOverTime, d, 'sessions').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Website", metric: "Page Views", cumulative: pageViews.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4?.trendsOverTime, d, 'pageViews').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Website", metric: "Engagement Rate", cumulative: `${engagementRate.toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-blue-500/10" },
    { category: "Website", metric: "Bounce Rate", cumulative: `${bounceRate.toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-blue-500/10" },
    
    // Meta Ads Section
    { category: "Meta Ads", metric: "Impressions", cumulative: metaImpressions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(metaAds?.performanceOverTime, d, 'impressions').toLocaleString()), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "Clicks", cumulative: metaClicks.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(metaAds?.performanceOverTime, d, 'clicks').toLocaleString()), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "Spend", cumulative: `€${metaSpend.toLocaleString()}`, dailyValues: daysInRange.map(d => `€${getDailyValue(metaAds?.performanceOverTime, d, 'spend').toLocaleString()}`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CPC", cumulative: `€${metaCPC.toFixed(2)}`, dailyValues: daysInRange.map(d => `€${getDailyValue(metaAds?.performanceOverTime, d, 'cpc').toFixed(2)}`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CTR", cumulative: `${metaCTR.toFixed(2)}%`, dailyValues: daysInRange.map(d => `${getDailyValue(metaAds?.performanceOverTime, d, 'ctr').toFixed(2)}%`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "Conversions", cumulative: metaConversions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(metaAds?.performanceOverTime, d, 'conversions').toLocaleString()), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CPA", cumulative: `€${metaCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-green-500/10" },
    
    // Google Ads Section
    { category: "Google Ads", metric: "Impressions", cumulative: googleImpressions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(googleAds?.performanceOverTime, d, 'impressions').toLocaleString()), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "Clicks", cumulative: googleClicks.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(googleAds?.performanceOverTime, d, 'clicks').toLocaleString()), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "Spend", cumulative: `€${googleSpend.toLocaleString()}`, dailyValues: daysInRange.map(d => `€${getDailyValue(googleAds?.performanceOverTime, d, 'spend').toLocaleString()}`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CPC", cumulative: `€${googleCPC.toFixed(2)}`, dailyValues: daysInRange.map(d => `€${getDailyValue(googleAds?.performanceOverTime, d, 'cpc').toFixed(2)}`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CTR", cumulative: `${googleCTR.toFixed(2)}%`, dailyValues: daysInRange.map(d => `${getDailyValue(googleAds?.performanceOverTime, d, 'ctr').toFixed(2)}%`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "Conversions", cumulative: googleConversions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(googleAds?.performanceOverTime, d, 'conversions').toLocaleString()), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CPA", cumulative: `€${googleCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-red-500/10" },
    
    // Shopify / E-Commerce Section
    { category: "Shopify", metric: "Orders", cumulative: shopifyOrders.toLocaleString(), dailyValues: daysInRange.map(d => getShopifyDailyValue(d, 'orders').toLocaleString()), colorClass: "bg-emerald-500/10" },
    { category: "Shopify", metric: "Revenue", cumulative: `€${shopifyRevenue.toLocaleString()}`, dailyValues: daysInRange.map(d => `€${getShopifyDailyValue(d, 'revenue').toLocaleString()}`), colorClass: "bg-emerald-500/10" },
    { category: "Shopify", metric: "Avg Order Value", cumulative: `€${averageOrderValue.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-emerald-500/10" },
    { category: "Shopify", metric: "E-Commerce CVR", cumulative: `${ecommerceConversionRate.toFixed(2)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-emerald-500/10" },
    
    // Combined Paid Channel Section
    { category: "Combined Paid", metric: "Total Impressions", cumulative: totalImpressions.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Total Clicks", cumulative: totalClicks.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Total Spend", cumulative: `€${totalSpend.toLocaleString()}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Combined CPC", cumulative: `€${combinedCPC.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Combined CTR", cumulative: `${combinedCTR.toFixed(2)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Total Conversions", cumulative: totalConversions.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined Paid", metric: "Blended CPA", cumulative: `€${blendedCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-purple-500/10" },
    { category: "Combined Paid", metric: "ROAS", cumulative: `${roas.toFixed(2)}x`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    
    // Email Section
    { category: "Email", metric: "Email Opens", cumulative: emailOpens.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-orange-500/10" },
    { category: "Email", metric: "Email Clicks", cumulative: emailClicks.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-orange-500/10" },
    { category: "Email", metric: "Open Rate", cumulative: `${openRate.toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-orange-500/10" },
    { category: "Email", metric: "Click Rate", cumulative: `${clickRate.toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-orange-500/10" },
  ];

  // Group rows by category for visual separation
  let currentCategory = "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Consolidated Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(start, 'dd MMM yyyy')} - {format(end, 'dd MMM yyyy')}
            </p>
          </div>
          <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
            Shopify: Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="w-max">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 z-20 bg-muted min-w-[120px] font-semibold">Category</TableHead>
                  <TableHead className="sticky left-[120px] z-20 bg-muted min-w-[150px] font-semibold">Metric</TableHead>
                  <TableHead className="sticky left-[270px] z-20 bg-primary/10 min-w-[100px] font-semibold text-center">MTD</TableHead>
                  {daysInRange.map((day) => (
                    <TableHead key={day.toISOString()} className="min-w-[80px] text-center font-medium">
                      {format(day, 'dd')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricRows.map((row) => {
                  const showCategory = row.category !== currentCategory;
                  if (showCategory) currentCategory = row.category;
                  
                  return (
                    <TableRow key={`${row.category}-${row.metric}`} className={row.colorClass}>
                      <TableCell className="sticky left-0 z-10 bg-background font-medium">
                        {showCategory ? (
                          <div className="flex items-center gap-2">
                            {row.category}
                            {row.isPlaceholder && <Badge variant="secondary" className="text-xs">Soon</Badge>}
                          </div>
                        ) : ""}
                      </TableCell>
                      <TableCell className="sticky left-[120px] z-10 bg-background">
                        {row.metric}
                      </TableCell>
                      <TableCell className="sticky left-[270px] z-10 bg-primary/5 text-center font-semibold">
                        {row.cumulative}
                      </TableCell>
                      {row.dailyValues.map((value, dayIdx) => (
                        <TableCell key={dayIdx} className="text-center text-sm">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
