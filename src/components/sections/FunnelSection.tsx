import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ga4Data as placeholderGa4, googleAdsData as placeholderGoogleAds, metaAdsData as placeholderMeta, mailchimpData as placeholderMailchimp } from "@/data/placeholderData";
import { ArrowDown } from "lucide-react";

interface FunnelSectionProps {
  ga4Data?: typeof placeholderGa4;
  googleAdsData?: typeof placeholderGoogleAds;
  metaAdsData?: typeof placeholderMeta;
  mailchimpData?: typeof placeholderMailchimp;
}

export function FunnelSection({ 
  ga4Data = placeholderGa4,
  googleAdsData = placeholderGoogleAds,
  metaAdsData = placeholderMeta,
  mailchimpData = placeholderMailchimp
}: FunnelSectionProps) {
  const totalConversions = googleAdsData.overview.conversions + metaAdsData.overview.conversions;
  const totalAdSpend = googleAdsData.overview.adSpend + metaAdsData.overview.adSpend;

  // Build funnel data dynamically from props
  const funnelData = [
    { stage: "Total Users", value: ga4Data.overview.totalUsers, percentage: 100, color: "hsl(var(--ga4-primary))" },
    { stage: "Total Conversions", value: totalConversions, percentage: ga4Data.overview.totalUsers > 0 ? ((totalConversions / ga4Data.overview.totalUsers) * 100) : 0, color: "hsl(var(--chart-2))" },
    { stage: "Email Clicks", value: mailchimpData.overview.emailClicks, percentage: ga4Data.overview.totalUsers > 0 ? ((mailchimpData.overview.emailClicks / ga4Data.overview.totalUsers) * 100) : 0, color: "hsl(var(--mailchimp-primary))" },
  ];

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 lg:w-12 rounded-full bg-accent" />
        <h2 className="text-xl lg:text-2xl font-bold">Marketing Funnel</h2>
      </div>

      <Card>
        <CardHeader className="pb-2 lg:pb-6">
          <CardTitle className="text-base lg:text-lg">End-to-End Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 lg:space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage}>
                <div 
                  className="relative rounded-lg p-4 lg:p-6 transition-all hover:shadow-md"
                  style={{ 
                    backgroundColor: stage.color,
                    opacity: 1 - (index * 0.1)
                  }}
                >
                  <div className="flex items-center justify-between text-white gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm lg:text-lg font-semibold truncate">{stage.stage}</h3>
                      <p className="text-xs lg:text-sm opacity-90">
                        {stage.value.toLocaleString()} ({stage.percentage.toFixed(2)}%)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg lg:text-2xl font-bold">{stage.value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                {index < funnelData.length - 1 && (
                  <div className="flex justify-center py-1 lg:py-2">
                    <ArrowDown className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 lg:mt-8 grid gap-3 lg:gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-3 lg:p-4">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Conversion Rate</p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold">
                {ga4Data.overview.totalUsers > 0 ? ((totalConversions / ga4Data.overview.totalUsers) * 100).toFixed(2) : 0}%
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">
                {totalConversions.toLocaleString()} / {ga4Data.overview.totalUsers.toLocaleString()} users
              </p>
            </div>

            <div className="rounded-lg border bg-card p-3 lg:p-4">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Total Conversions</p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold">{totalConversions.toLocaleString()}</p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">
                Google: {googleAdsData.overview.conversions} + Meta: {metaAdsData.overview.conversions}
              </p>
            </div>

            <div className="rounded-lg border bg-card p-3 lg:p-4">
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Cost per Conversion</p>
              <p className="mt-1 lg:mt-2 text-xl lg:text-2xl font-bold">
                €{totalConversions > 0 ? (totalAdSpend / totalConversions).toFixed(2) : '0.00'}
              </p>
              <p className="text-[10px] lg:text-xs text-muted-foreground mt-1">
                €{totalAdSpend.toLocaleString()} / {totalConversions.toLocaleString()} conversions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
