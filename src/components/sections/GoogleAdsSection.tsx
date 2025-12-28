import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { DollarSign, MousePointer, Target, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { googleAdsData as placeholderData } from "@/data/placeholderData";

interface GoogleAdsSectionProps {
  data?: typeof placeholderData;
}

export function GoogleAdsSection({ data = placeholderData }: GoogleAdsSectionProps) {
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
        <ScoreCard
          title="CPC"
          value={`€${data.overview.cpc}`}
          change="-4.8% vs last period"
          changeType="positive"
          icon={MousePointer}
          colorScheme="google-ads"
        />
        <ScoreCard
          title="CTR"
          value={`${data.overview.ctr}%`}
          change="+1.2% vs last period"
          changeType="positive"
          icon={Target}
          colorScheme="google-ads"
        />
        <ScoreCard
          title="Conversions"
          value={data.overview.conversions.toLocaleString()}
          change="+12.7% vs last period"
          changeType="positive"
          icon={TrendingUp}
          colorScheme="google-ads"
        />
        <ScoreCard
          title="Ad Spend"
          value={`€${data.overview.adSpend.toLocaleString()}`}
          change="+9.3% vs last period"
          changeType="neutral"
          icon={DollarSign}
          colorScheme="google-ads"
        />
        <ScoreCard
          title="Cost per Conversion"
          value={`€${data.overview.costPerConversion}`}
          change="-6.2% vs last period"
          changeType="positive"
          icon={DollarSign}
          colorScheme="google-ads"
        />
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
              <BarChart data={data.campaignPerformance}>
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
