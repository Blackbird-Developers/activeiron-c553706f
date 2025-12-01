import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { funnelData, ga4Data, metaAdsData, subblyData } from "@/data/placeholderData";
import { ArrowDown } from "lucide-react";

export function FunnelSection() {
  const calculateROAS = () => {
    const revenue = subblyData.overview.revenue;
    const adSpend = metaAdsData.overview.adSpend;
    return (revenue / adSpend).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-accent" />
        <h2 className="text-2xl font-bold">Marketing Funnel</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>End-to-End Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage}>
                <div 
                  className="relative rounded-lg p-6 transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: stage.color,
                    opacity: 1 - (index * 0.1)
                  }}
                >
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="text-lg font-semibold">{stage.stage}</h3>
                      <p className="text-sm opacity-90">
                        {stage.value.toLocaleString()} ({stage.percentage}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{stage.value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Subscription Rate</p>
              <p className="mt-2 text-2xl font-bold">{subblyData.overview.subscriptionRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {subblyData.overview.subscriptions} / {ga4Data.overview.totalUsers} users
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Cost per Conversion</p>
              <p className="mt-2 text-2xl font-bold">${metaAdsData.overview.costPerConversion}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${metaAdsData.overview.adSpend.toLocaleString()} / {metaAdsData.overview.conversions} conversions
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">ROAS</p>
              <p className="mt-2 text-2xl font-bold">{calculateROAS()}x</p>
              <p className="text-xs text-muted-foreground mt-1">
                ${subblyData.overview.revenue.toLocaleString()} / ${metaAdsData.overview.adSpend.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
