import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { CreditCard, TrendingDown, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { subblyData as placeholderData } from "@/data/placeholderData";

interface SubblySectionProps {
  data?: typeof placeholderData;
  totalAdSpend?: number;
}

export function SubblySection({ data = placeholderData, totalAdSpend = 0 }: SubblySectionProps) {
  const COLORS = ["hsl(var(--subbly-primary))", "hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-3))"];
  
  // Calculate CAC (Customer Acquisition Cost)
  const cac = data.overview.subscriptions > 0 
    ? totalAdSpend / data.overview.subscriptions 
    : 0;

  // Ensure subscriptionsOverTime data has valid entries
  const chartData = data.subscriptionsOverTime && data.subscriptionsOverTime.length > 0 
    ? data.subscriptionsOverTime 
    : [];

  // Ensure planDistribution data has valid entries
  const pieData = data.planDistribution && data.planDistribution.length > 0 
    ? data.planDistribution 
    : [{ plan: 'No Data', subscribers: 1, percentage: 100 }];

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
          title="Churn Rate"
          value={`${data.overview.churnRate}%`}
          change="-0.3% vs last period"
          changeType="positive"
          icon={TrendingDown}
          colorScheme="subbly"
        />
        <ScoreCard
          title="Customer Acquisition Cost"
          value={`€${cac.toFixed(2)}`}
          change="-8.5% vs last period"
          changeType="positive"
          icon={DollarSign}
          colorScheme="subbly"
        />
        <ScoreCard
          title="Revenue"
          value={`€${data.overview.revenue.toLocaleString()}`}
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
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--subbly-primary))" 
                    fontSize={12}
                    label={{ value: 'Subscriptions', angle: -90, position: 'insideLeft', fill: 'hsl(var(--subbly-primary))' }}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--chart-2))" 
                    fontSize={12}
                    label={{ value: 'Revenue (€)', angle: 90, position: 'insideRight', fill: 'hsl(var(--chart-2))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'Revenue (€)' ? `€${value.toLocaleString()}` : value.toLocaleString(),
                      name
                    ]}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="subscriptions" 
                    stroke="hsl(var(--subbly-primary))" 
                    strokeWidth={2} 
                    name="Subscriptions"
                    dot={{ fill: "hsl(var(--subbly-primary))" }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2} 
                    name="Revenue (€)"
                    dot={{ fill: "hsl(var(--chart-2))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No subscription data available for selected period
              </div>
            )}
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
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percentage }) => `${plan}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="subscribers"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  formatter={(value: number, name: string) => [value.toLocaleString(), 'Subscribers']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
