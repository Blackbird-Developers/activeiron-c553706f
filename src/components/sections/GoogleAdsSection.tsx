import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { DollarSign, MousePointer, Target, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { googleAdsData as placeholderData } from "@/data/placeholderData";
import { calcCompare } from "@/lib/compareUtils";

interface GoogleAdsSectionProps {
  data?: typeof placeholderData;
  selectedCountry?: string;
  compareData?: any;
  compareLabel?: string;
  compareLoading?: boolean;
}

export function GoogleAdsSection({ data = placeholderData, selectedCountry = "all", compareData, compareLabel, compareLoading }: GoogleAdsSectionProps) {
  const hasData = data.overview.adSpend > 0 || data.overview.clicks > 0 || data.overview.impressions > 0;
  const isFiltered = selectedCountry !== "all";

  // Filter campaign performance chart to only show active/enabled campaigns
  const activeCampaignPerformance = (data.campaignPerformance || []).filter((c: any) => {
    if (c.status && c.status !== 'ENABLED') return false;
    return true;
  });

  const countryLabels: Record<string, string> = {
    IE: "Ireland", UK: "United Kingdom", US: "United States", DE: "Germany", NZ: "New Zealand",
  };

  if (!hasData && isFiltered) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 lg:w-12 rounded-full bg-google-ads" />
            <h2 className="text-xl lg:text-2xl font-bold text-google-ads-foreground">Google Ads Performance</h2>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              No Google Ads data available for <span className="font-medium text-foreground">{countryLabels[selectedCountry] || selectedCountry}</span>. Campaigns may not be running in this region or campaign names may not include the region identifier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 lg:w-12 rounded-full bg-google-ads" />
          <h2 className="text-xl lg:text-2xl font-bold text-google-ads-foreground">Google Ads Performance</h2>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
          <span className="text-xs font-medium text-muted-foreground">Work in Progress</span>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <ScoreCard title="CPC" value={`€${Number(data.overview.cpc).toFixed(2)}`} icon={MousePointer} colorScheme="google-ads" compare={compareData && compareLabel ? calcCompare(Number(data.overview.cpc), compareData.overview?.cpc, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
        <ScoreCard title="CTR" value={`${Number(data.overview.ctr).toFixed(2)}%`} icon={Target} colorScheme="google-ads" compare={compareData && compareLabel ? calcCompare(Number(data.overview.ctr), compareData.overview?.ctr, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Conversions" value={data.overview.conversions.toLocaleString()} icon={TrendingUp} colorScheme="google-ads" compare={compareData && compareLabel ? calcCompare(data.overview.conversions, compareData.overview?.conversions, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Ad Spend" value={`€${Number(data.overview.adSpend).toFixed(2)}`} icon={DollarSign} colorScheme="google-ads" compare={compareData && compareLabel ? calcCompare(Number(data.overview.adSpend), compareData.overview?.adSpend, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Cost per Conversion" value={`€${Number(data.overview.costPerConversion).toFixed(2)}`} icon={DollarSign} colorScheme="google-ads" compare={compareData && compareLabel ? calcCompare(Number(data.overview.costPerConversion), compareData.overview?.costPerConversion, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-google-ads-foreground">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={45} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--google-ads-primary))" strokeWidth={2} name="Conversions" dot={false} />
                <Line type="monotone" dataKey="ctr" stroke="hsl(var(--chart-4))" strokeWidth={2} name="CTR %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-google-ads-foreground">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activeCampaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="campaign" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={45} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="conversions" fill="hsl(var(--google-ads-primary))" name="Conversions" />
                <Bar dataKey="roas" fill="hsl(var(--chart-2))" name="ROAS" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
