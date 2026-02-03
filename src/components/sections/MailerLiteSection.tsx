import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Mail, MousePointer, TrendingUp, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mailerliteData as placeholderData } from "@/data/placeholderData";

interface MailerLiteSectionProps {
  data?: typeof placeholderData;
}

export function MailerLiteSection({ data = placeholderData }: MailerLiteSectionProps) {
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
          change="+6.5% vs last period"
          changeType="positive"
          icon={Mail}
          colorScheme="mailchimp"
        />
        <ScoreCard
          title="Email Clicks"
          value={data.overview.emailClicks.toLocaleString()}
          change="+9.2% vs last period"
          changeType="positive"
          icon={MousePointer}
          colorScheme="mailchimp"
        />
        <ScoreCard
          title="Open Rate"
          value={`${data.overview.openRate}%`}
          change="+1.8% vs last period"
          changeType="positive"
          icon={Percent}
          colorScheme="mailchimp"
        />
        <ScoreCard
          title="Click-through Rate"
          value={`${data.overview.clickThroughRate}%`}
          change="+0.5% vs last period"
          changeType="positive"
          icon={TrendingUp}
          colorScheme="mailchimp"
        />
        <ScoreCard
          title="Click-to-Open Rate"
          value={`${data.overview.clickToOpenRate}%`}
          change="+2.1% vs last period"
          changeType="positive"
          icon={Percent}
          colorScheme="mailchimp"
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
