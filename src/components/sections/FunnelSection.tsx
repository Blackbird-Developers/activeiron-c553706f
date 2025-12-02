import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { funnelData, ga4Data as placeholderGa4, googleAdsData as placeholderGoogleAds, metaAdsData as placeholderMeta, subblyData as placeholderSubbly, mailchimpData as placeholderMailchimp } from "@/data/placeholderData";
import { ArrowDown } from "lucide-react";

interface FunnelSectionProps {
  ga4Data?: typeof placeholderGa4;
  googleAdsData?: typeof placeholderGoogleAds;
  metaAdsData?: typeof placeholderMeta;
  subblyData?: typeof placeholderSubbly;
  mailchimpData?: typeof placeholderMailchimp;
}

export function FunnelSection({ 
  ga4Data = placeholderGa4,
  googleAdsData = placeholderGoogleAds,
  metaAdsData = placeholderMeta,
  subblyData = placeholderSubbly,
  mailchimpData = placeholderMailchimp
}: FunnelSectionProps) {
  const calculateROAS = () => {
    const revenue = subblyData.overview.revenue;
    const totalAdSpend = googleAdsData.overview.adSpend + metaAdsData.overview.adSpend;
    return (revenue / totalAdSpend).toFixed(2);
  };

  const totalConversions = googleAdsData.overview.conversions + metaAdsData.overview.conversions;
  const totalAdSpend = googleAdsData.overview.adSpend + metaAdsData.overview.adSpend;

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
              <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="mt-2 text-2xl font-bold">
                {((subblyData.overview.subscriptions / ga4Data.overview.totalUsers) * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {subblyData.overview.subscriptions} / {ga4Data.overview.totalUsers} users
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
              <p className="mt-2 text-2xl font-bold">{totalConversions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Google Ads: {googleAdsData.overview.conversions} + Meta: {metaAdsData.overview.conversions}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">Combined ROAS</p>
              <p className="mt-2 text-2xl font-bold">{calculateROAS()}x</p>
              <p className="text-xs text-muted-foreground mt-1">
                €{subblyData.overview.revenue.toLocaleString()} / €{totalAdSpend.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
