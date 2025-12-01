import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { CreditCard, TrendingUp, DollarSign, Percent } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { subblyData as placeholderData } from "@/data/placeholderData";

interface SubblySectionProps {
  data?: typeof placeholderData;
}

export function SubblySection({ data = placeholderData }: SubblySectionProps) {
  const COLORS = ["hsl(var(--subbly-primary))", "hsl(var(--chart-2))", "hsl(var(--chart-4))"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-subbly" />
        <h2 className="text-2xl font-bold text-subbly-foreground">Subscriptions (Subbly)</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ScoreCard
          title="Subscriptions"
          value={data.overview.subscriptions.toLocaleString()}
          change="+18.2% vs last period"
          changeType="positive"
          icon={CreditCard}
          colorScheme="subbly"
        />
        <ScoreCard
          title="Subscription Rate"
          value={`${data.overview.subscriptionRate}%`}
          change="+0.4% vs last period"
          changeType="positive"
          icon={Percent}
          colorScheme="subbly"
        />
        <ScoreCard
          title="Cost per Subscription"
          value={`$${data.overview.costPerSubscription}`}
          change="-12.3% vs last period"
          changeType="positive"
          icon={DollarSign}
          colorScheme="subbly"
        />
        <ScoreCard
          title="Revenue"
          value={`$${data.overview.revenue.toLocaleString()}`}
          change="+22.7% vs last period"
          changeType="positive"
          icon={TrendingUp}
          colorScheme="subbly"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-subbly-foreground">Subscriptions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.subscriptionsOverTime}>
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
                <Line type="monotone" dataKey="subscriptions" stroke="hsl(var(--subbly-primary))" strokeWidth={2} name="Subscriptions" />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-subbly-foreground">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.planDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percentage }) => `${plan}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="subscribers"
                >
                  {data.planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
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
