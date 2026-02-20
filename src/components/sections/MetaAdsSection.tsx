import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { DollarSign, MousePointer, Target, TrendingUp, AlertCircle, Eye, Users, Link, Play, Heart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { metaAdsData as placeholderData } from "@/data/placeholderData";
import { calcCompare } from "@/lib/compareUtils";

interface MetaAdsSectionProps {
  data?: typeof placeholderData;
  selectedCountry?: string;
  compareData?: any;
  compareLabel?: string;
  compareLoading?: boolean;
}

export function MetaAdsSection({ data = placeholderData, selectedCountry = "all", compareData, compareLabel, compareLoading }: MetaAdsSectionProps) {
  const hasData = data.overview.adSpend > 0 || data.overview.clicks > 0 || data.overview.impressions > 0;
  const isFiltered = selectedCountry !== "all";

  // Filter campaign performance chart to only show active campaigns with spend
  const activeCampaignPerformance = (data.campaignPerformance || []).filter((c: any) => {
    if (c.status && c.status !== 'ACTIVE') return false;
    return (c.spend ?? c.conversions ?? 0) > 0;
  });

  const countryLabels: Record<string, string> = {
    IE: "Ireland", UK: "United Kingdom", US: "United States", DE: "Germany", NZ: "New Zealand",
  };

  if (!hasData && isFiltered) {
    return (
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 lg:w-12 rounded-full bg-meta" />
          <h2 className="text-xl lg:text-2xl font-bold text-meta-foreground">Meta Ads Performance</h2>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              No Meta Ads data available for <span className="font-medium text-foreground">{countryLabels[selectedCountry] || selectedCountry}</span>. Campaigns may not be running in this region or campaign names may not include the region identifier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 lg:w-12 rounded-full bg-meta" />
        <h2 className="text-xl lg:text-2xl font-bold text-meta-foreground">Meta Ads Performance</h2>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
        <ScoreCard title="Ad Spend" value={`€${Number(data.overview.adSpend).toFixed(2)}`} icon={DollarSign} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.adSpend), compareData.overview?.adSpend, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Impressions" value={data.overview.impressions.toLocaleString()} icon={Eye} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.impressions, compareData.overview?.impressions, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Reach" value={(data.overview.reach || 0).toLocaleString()} icon={Users} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.reach || 0, compareData?.overview?.reach, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Unique Link Clicks" value={(data.overview.clicks || 0).toLocaleString()} icon={Link} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.clicks || 0, compareData?.overview?.clicks, compareLabel) : undefined} compareLoading={compareLoading} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
        <ScoreCard title="CPC" value={`€${Number(data.overview.cpc).toFixed(2)}`} icon={MousePointer} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.cpc), compareData.overview?.cpc, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
        <ScoreCard title="CTR" value={`${Number(data.overview.ctr).toFixed(2)}%`} icon={Target} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.ctr), compareData.overview?.ctr, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Conversions" value={data.overview.conversions.toLocaleString()} icon={TrendingUp} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.conversions, compareData.overview?.conversions, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Cost per Conversion" value={`€${Number(data.overview.costPerConversion).toFixed(2)}`} icon={DollarSign} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.costPerConversion), compareData.overview?.costPerConversion, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4">
        <ScoreCard title="CPR" value={`€${Number(data.overview.cpr ?? data.overview.costPerConversion).toFixed(2)}`} icon={DollarSign} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.cpr ?? data.overview.costPerConversion), compareData.overview?.cpr ?? compareData.overview?.costPerConversion, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
        <ScoreCard title="Thruplays" value={(data.overview.thruplays ?? 0).toLocaleString()} icon={Play} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.thruplays ?? 0, compareData.overview?.thruplays ?? 0, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="Engagements" value={(data.overview.engagements ?? 0).toLocaleString()} icon={Heart} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(data.overview.engagements ?? 0, compareData.overview?.engagements ?? 0, compareLabel) : undefined} compareLoading={compareLoading} />
        <ScoreCard title="CPE" value={`€${Number(data.overview.cpe ?? 0).toFixed(2)}`} icon={MousePointer} colorScheme="meta" compare={compareData && compareLabel ? calcCompare(Number(data.overview.cpe ?? 0), compareData.overview?.cpe ?? 0, compareLabel) : undefined} invertChange compareLoading={compareLoading} />
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-meta-foreground">Performance Over Time</CardTitle>
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
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--meta-primary))" strokeWidth={2} name="Conversions" dot={false} />
                <Line type="monotone" dataKey="ctr" stroke="hsl(var(--chart-4))" strokeWidth={2} name="CTR %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-meta-foreground">Campaign Performance</CardTitle>
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
                <Bar dataKey="conversions" fill="hsl(var(--meta-primary))" name="Conversions" />
                <Bar dataKey="roas" fill="hsl(var(--chart-2))" name="ROAS" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
