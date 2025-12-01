import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { DollarSign, MousePointer, Target, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { metaAdsData as placeholderData } from "@/data/placeholderData";

interface MetaAdsSectionProps {
  data?: typeof placeholderData;
}

export function MetaAdsSection({ data = placeholderData }: MetaAdsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-meta" />
        <h2 className="text-2xl font-bold text-meta-foreground">Meta Ads Performance</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ScoreCard
          title="CPC"
          value={`$${data.overview.cpc}`}
          change="-5.2% vs last period"
          changeType="positive"
          icon={MousePointer}
          colorScheme="meta"
        />
        <ScoreCard
          title="CTR"
          value={`${data.overview.ctr}%`}
          change="+0.8% vs last period"
          changeType="positive"
          icon={Target}
          colorScheme="meta"
        />
        <ScoreCard
          title="Conversions"
          value={data.overview.conversions.toLocaleString()}
          change="+15.3% vs last period"
          changeType="positive"
          icon={TrendingUp}
          colorScheme="meta"
        />
        <ScoreCard
          title="Ad Spend"
          value={`$${data.overview.adSpend.toLocaleString()}`}
          change="+8.1% vs last period"
          changeType="neutral"
          icon={DollarSign}
          colorScheme="meta"
        />
        <ScoreCard
          title="Cost per Conversion"
          value={`$${data.overview.costPerConversion}`}
          change="-7.5% vs last period"
          changeType="positive"
          icon={DollarSign}
          colorScheme="meta"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-meta-foreground">Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.performanceOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="conversions" stroke="hsl(var(--meta-primary))" strokeWidth={2} name="Conversions" />
                <Line type="monotone" dataKey="ctr" stroke="hsl(var(--chart-4))" strokeWidth={2} name="CTR %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-meta-foreground">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.campaignPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="campaign" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
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
