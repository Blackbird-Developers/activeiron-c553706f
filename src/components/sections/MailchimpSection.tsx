import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Mail, MousePointer, TrendingUp, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { mailchimpData as placeholderData } from "@/data/placeholderData";

interface MailchimpSectionProps {
  data?: typeof placeholderData;
}

export function MailchimpSection({ data = placeholderData }: MailchimpSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-mailchimp" />
        <h2 className="text-2xl font-bold text-mailchimp-foreground">Email Campaigns (Mailchimp)</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-mailchimp-foreground">Campaign Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.campaignPerformance}>
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
                <Line type="monotone" dataKey="opens" stroke="hsl(var(--mailchimp-primary))" strokeWidth={2} name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-mailchimp-foreground">Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.topCampaigns}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }} 
                />
                <Legend />
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
