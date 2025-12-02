import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

interface ConsolidatedMetricsSectionProps {
  ga4Data?: typeof ga4Data;
  metaAdsData?: typeof metaAdsData;
  googleAdsData?: typeof googleAdsData;
  subblyData?: typeof subblyData;
  mailchimpData?: typeof mailchimpData;
  startDate?: Date;
  endDate?: Date;
}

interface MetricRow {
  category: string;
  metric: string;
  cumulative: string | number;
  dailyValues: (string | number)[];
  colorClass?: string;
}

export function ConsolidatedMetricsSection({
  ga4Data,
  metaAdsData,
  googleAdsData,
  subblyData,
  mailchimpData,
  startDate,
  endDate,
}: ConsolidatedMetricsSectionProps) {
  
  // Generate days for the current month or selected range
  const start = startDate || startOfMonth(new Date());
  const end = endDate || endOfMonth(new Date());
  const daysInRange = eachDayOfInterval({ start, end });

  // Helper to get daily value from trends data
  const getDailyValue = (trendsData: any[], date: Date, field: string) => {
    if (!trendsData) return 0;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = trendsData.find((d: any) => d.date === dateStr);
    return dayData?.[field] || 0;
  };

  // Calculate cumulative metrics
  const totalUsers = ga4Data?.overview?.totalUsers || 0;
  const newUsers = ga4Data?.overview?.newUsers || 0;
  const engagementRate = ga4Data?.overview?.engagementRate || 0;
  const bounceRate = ga4Data?.overview?.bounceRate || 0;
  
  const metaSpend = metaAdsData?.overview?.adSpend || 0;
  const metaCPC = metaAdsData?.overview?.cpc || 0;
  const metaCTR = metaAdsData?.overview?.ctr || 0;
  const metaConversions = metaAdsData?.overview?.conversions || 0;
  const metaCPA = metaAdsData?.overview?.costPerConversion || 0;
  
  const googleSpend = googleAdsData?.overview?.adSpend || 0;
  const googleCPC = googleAdsData?.overview?.cpc || 0;
  const googleCTR = googleAdsData?.overview?.ctr || 0;
  const googleConversions = googleAdsData?.overview?.conversions || 0;
  const googleCPA = googleAdsData?.overview?.costPerConversion || 0;
  
  const totalSpend = metaSpend + googleSpend;
  const totalConversions = metaConversions + googleConversions;
  const cumulativeCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
  
  const subscriptions = subblyData?.overview?.subscriptions || 0;
  const cumulativeCVR = totalUsers > 0 ? (subscriptions / totalUsers) * 100 : 0;
  
  const emailOpens = mailchimpData?.overview?.emailOpens || 0;
  const emailClicks = mailchimpData?.overview?.emailClicks || 0;
  const openRate = mailchimpData?.overview?.openRate || 0;
  const clickRate = mailchimpData?.overview?.clickThroughRate || 0;

  // Generate metric rows
  const metricRows: MetricRow[] = [
    // Site & Traffic Section
    { category: "Site & Traffic", metric: "Total Users", cumulative: totalUsers.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4Data?.trendsOverTime, d, 'users').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Site & Traffic", metric: "New Users", cumulative: newUsers.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(ga4Data?.trendsOverTime, d, 'newUsers').toLocaleString()), colorClass: "bg-blue-500/10" },
    { category: "Site & Traffic", metric: "Engagement Rate", cumulative: `${(engagementRate * 100).toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-blue-500/10" },
    { category: "Site & Traffic", metric: "Bounce Rate", cumulative: `${(bounceRate * 100).toFixed(1)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-blue-500/10" },
    
    // Meta Ads Section
    { category: "Meta Ads", metric: "Spend", cumulative: `£${metaSpend.toLocaleString()}`, dailyValues: daysInRange.map(d => `£${getDailyValue(metaAdsData?.performanceOverTime, d, 'spend').toLocaleString()}`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CPC", cumulative: `£${metaCPC.toFixed(2)}`, dailyValues: daysInRange.map(d => `£${getDailyValue(metaAdsData?.performanceOverTime, d, 'cpc').toFixed(2)}`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CTR", cumulative: `${metaCTR.toFixed(2)}%`, dailyValues: daysInRange.map(d => `${getDailyValue(metaAdsData?.performanceOverTime, d, 'ctr').toFixed(2)}%`), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "Conversions", cumulative: metaConversions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(metaAdsData?.performanceOverTime, d, 'conversions').toLocaleString()), colorClass: "bg-green-500/10" },
    { category: "Meta Ads", metric: "CPA", cumulative: `£${metaCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-green-500/10" },
    
    // Google Ads Section
    { category: "Google Ads", metric: "Spend", cumulative: `£${googleSpend.toLocaleString()}`, dailyValues: daysInRange.map(d => `£${getDailyValue(googleAdsData?.performanceOverTime, d, 'spend').toLocaleString()}`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CPC", cumulative: `£${googleCPC.toFixed(2)}`, dailyValues: daysInRange.map(d => `£${getDailyValue(googleAdsData?.performanceOverTime, d, 'cpc').toFixed(2)}`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CTR", cumulative: `${googleCTR.toFixed(2)}%`, dailyValues: daysInRange.map(d => `${getDailyValue(googleAdsData?.performanceOverTime, d, 'ctr').toFixed(2)}%`), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "Conversions", cumulative: googleConversions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(googleAdsData?.performanceOverTime, d, 'conversions').toLocaleString()), colorClass: "bg-red-500/10" },
    { category: "Google Ads", metric: "CPA", cumulative: `£${googleCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-red-500/10" },
    
    // Combined Marketing Section
    { category: "Combined", metric: "Total Spend", cumulative: `£${totalSpend.toLocaleString()}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined", metric: "Total Conversions", cumulative: totalConversions.toLocaleString(), dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    { category: "Combined", metric: "Cumulative CPA", cumulative: `£${cumulativeCPA.toFixed(2)}`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-slate-500/10" },
    
    // Subscriptions Section
    { category: "Subscriptions", metric: "Total Subscriptions", cumulative: subscriptions.toLocaleString(), dailyValues: daysInRange.map(d => getDailyValue(subblyData?.subscriptionsOverTime, d, 'subscriptions').toLocaleString()), colorClass: "bg-purple-500/10" },
    { category: "Subscriptions", metric: "Cumulative CVR", cumulative: `${cumulativeCVR.toFixed(2)}%`, dailyValues: daysInRange.map(() => "-"), colorClass: "bg-purple-500/10" },
    
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
        <CardTitle>Consolidated Metrics</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(start, 'dd MMM yyyy')} - {format(end, 'dd MMM yyyy')}
        </p>
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
                {metricRows.map((row, idx) => {
                  const showCategory = row.category !== currentCategory;
                  if (showCategory) currentCategory = row.category;
                  
                  return (
                    <TableRow key={`${row.category}-${row.metric}`} className={row.colorClass}>
                      <TableCell className="sticky left-0 z-10 bg-background font-medium">
                        {showCategory ? row.category : ""}
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
