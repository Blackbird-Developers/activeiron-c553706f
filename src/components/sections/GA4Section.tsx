import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Activity, Clock, MousePointerClick, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ga4Data as placeholderData } from "@/data/placeholderData";

interface GA4SectionProps {
  data?: typeof placeholderData;
}

export function GA4Section({ data = placeholderData }: GA4SectionProps) {
  const COLORS = ["hsl(var(--ga4-primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 lg:w-12 rounded-full bg-ga4" />
        <h2 className="text-xl lg:text-2xl font-bold text-ga4-foreground">Traffic Analytics (GA4)</h2>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard
          title="Sessions"
          value={data.overview.sessions.toLocaleString()}
          change=""
          changeType="positive"
          icon={BarChart3}
          colorScheme="ga4"
        />
        <ScoreCard
          title="Engaged Sessions"
          value={(data.overview.engagedSessions || 0).toLocaleString()}
          change=""
          changeType="positive"
          icon={MousePointerClick}
          colorScheme="ga4"
        />
        <ScoreCard
          title="Engagement Rate"
          value={`${data.overview.engagementRate}%`}
          change=""
          changeType="positive"
          icon={Activity}
          colorScheme="ga4"
        />
        <ScoreCard
          title="Avg Engagement Time"
          value={formatDuration(data.overview.avgSessionDuration)}
          change=""
          changeType="positive"
          icon={Clock}
          colorScheme="ga4"
        />
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-ga4-foreground">User Trends</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trendsOverTime}>
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
                <Line type="monotone" dataKey="users" stroke="hsl(var(--ga4-primary))" strokeWidth={2} name="Total Users" dot={false} />
                <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--chart-2))" strokeWidth={2} name="New Users" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-ga4-foreground">Traffic by Source</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.trafficBySource}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {data.trafficBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
