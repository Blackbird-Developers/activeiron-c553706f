import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Mail, MousePointer, TrendingUp, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mailerliteData as placeholderData } from "@/data/placeholderData";
import { calcCompare } from "@/lib/compareUtils";

interface MailerLiteSectionProps {
  data?: typeof placeholderData;
  compareData?: any;
  compareLabel?: string;
}

export function MailerLiteSection({ data = placeholderData, compareData, compareLabel }: MailerLiteSectionProps) {
  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 lg:w-12 rounded-full bg-mailchimp" />
        <h2 className="text-xl lg:text-2xl font-bold text-mailchimp-foreground">Email Campaigns (MailerLite)</h2>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        <ScoreCard
          title="Email Opens"
          value={data.overview.emailOpens.toLocaleString()}
          icon={Mail}
          colorScheme="mailchimp"
          compare={compareData && compareLabel ? calcCompare(data.overview.emailOpens, compareData.overview?.emailOpens, compareLabel) : undefined}
        />
        <ScoreCard
          title="Email Clicks"
          value={data.overview.emailClicks.toLocaleString()}
          icon={MousePointer}
          colorScheme="mailchimp"
          compare={compareData && compareLabel ? calcCompare(data.overview.emailClicks, compareData.overview?.emailClicks, compareLabel) : undefined}
        />
        <ScoreCard
          title="Open Rate"
          value={`${data.overview.openRate}%`}
          icon={Percent}
          colorScheme="mailchimp"
          compare={compareData && compareLabel ? calcCompare(data.overview.openRate, compareData.overview?.openRate, compareLabel) : undefined}
        />
        <ScoreCard
          title="Click-through Rate"
          value={`${data.overview.clickThroughRate}%`}
          icon={TrendingUp}
          colorScheme="mailchimp"
          compare={compareData && compareLabel ? calcCompare(data.overview.clickThroughRate, compareData.overview?.clickThroughRate, compareLabel) : undefined}
        />
        <ScoreCard
          title="Click-to-Open Rate"
          value={`${data.overview.clickToOpenRate}%`}
          icon={Percent}
          colorScheme="mailchimp"
          compare={compareData && compareLabel ? calcCompare(data.overview.clickToOpenRate, compareData.overview?.clickToOpenRate, compareLabel) : undefined}
        />
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-mailchimp-foreground">Campaign Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.campaignPerformance}>
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
                <Line type="monotone" dataKey="opens" stroke="hsl(var(--mailchimp-primary))" strokeWidth={2} name="Opens" dot={false} />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Clicks" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-mailchimp-foreground">Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.topCampaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
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
                <Bar dataKey="opens" fill="hsl(var(--mailchimp-primary))" name="Opens" />
                <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
