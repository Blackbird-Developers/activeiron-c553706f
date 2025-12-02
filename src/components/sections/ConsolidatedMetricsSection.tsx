import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Users, Mail, Target, TrendingUp, DollarSign, MousePointerClick } from "lucide-react";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";

interface ConsolidatedMetricsSectionProps {
  ga4Data?: typeof ga4Data;
  metaAdsData?: typeof metaAdsData;
  googleAdsData?: typeof googleAdsData;
  subblyData?: typeof subblyData;
  mailchimpData?: typeof mailchimpData;
}

export function ConsolidatedMetricsSection({
  ga4Data,
  metaAdsData,
  googleAdsData,
  subblyData,
  mailchimpData,
}: ConsolidatedMetricsSectionProps) {
  
  // Calculate consolidated metrics
  const totalUsers = ga4Data?.overview.totalUsers || 0;
  const mailchimpLeads = mailchimpData?.overview.emailOpens || 0;
  const userToLeadPercentage = totalUsers > 0 ? (mailchimpLeads / totalUsers) * 100 : 0;
  const totalSubscriptions = subblyData?.overview.subscriptions || 0;
  const cumulativeCVR = totalUsers > 0 ? (totalSubscriptions / totalUsers) * 100 : 0;

  const metaSpend = metaAdsData?.overview.adSpend || 0;
  const googleSpend = googleAdsData?.overview.adSpend || 0;
  const totalSpend = metaSpend + googleSpend;
  
  const metaConversions = metaAdsData?.overview.conversions || 0;
  const googleConversions = googleAdsData?.overview.conversions || 0;
  const totalConversions = metaConversions + googleConversions;
  const cumulativeCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const emailTraffic = mailchimpData?.overview.emailClicks || 0;
  const emailConversions = Math.round(emailTraffic * 0.15); // Estimated 15% conversion
  const emailCVR = emailTraffic > 0 ? (emailConversions / emailTraffic) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Site & Leads Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Site & Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <ScoreCard
              title="Total Users"
              value={totalUsers.toLocaleString()}
              icon={Users}
              colorScheme="ga4"
            />
            <ScoreCard
              title="Mailchimp Leads"
              value={mailchimpLeads.toLocaleString()}
              icon={Mail}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="User to Lead %"
              value={`${userToLeadPercentage.toFixed(2)}%`}
              icon={Target}
              colorScheme="default"
            />
            <ScoreCard
              title="Total Sales/Subscriptions"
              value={totalSubscriptions.toLocaleString()}
              icon={TrendingUp}
              colorScheme="subbly"
            />
            <ScoreCard
              title="Cumulative CVR"
              value={`${cumulativeCVR.toFixed(2)}%`}
              icon={Target}
              colorScheme="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Meta Ads</h3>
              <div className="grid gap-4 md:grid-cols-5">
                <ScoreCard
                  title="Spend"
                  value={`£${metaSpend.toLocaleString()}`}
                  icon={DollarSign}
                  colorScheme="meta"
                />
                <ScoreCard
                  title="CPC"
                  value={`£${metaAdsData?.overview.cpc.toFixed(2)}`}
                  icon={MousePointerClick}
                  colorScheme="meta"
                />
                <ScoreCard
                  title="CTR"
                  value={`${metaAdsData?.overview.ctr.toFixed(2)}%`}
                  icon={Target}
                  colorScheme="meta"
                />
                <ScoreCard
                  title="Conversions"
                  value={metaConversions.toLocaleString()}
                  icon={TrendingUp}
                  colorScheme="meta"
                />
                <ScoreCard
                  title="CPA"
                  value={`£${metaAdsData?.overview.costPerConversion.toFixed(2)}`}
                  icon={DollarSign}
                  colorScheme="meta"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Google Ads</h3>
              <div className="grid gap-4 md:grid-cols-5">
                <ScoreCard
                  title="Spend"
                  value={`£${googleSpend.toLocaleString()}`}
                  icon={DollarSign}
                  colorScheme="google-ads"
                />
                <ScoreCard
                  title="CPC"
                  value={`£${googleAdsData?.overview.cpc.toFixed(2)}`}
                  icon={MousePointerClick}
                  colorScheme="google-ads"
                />
                <ScoreCard
                  title="CTR"
                  value={`${googleAdsData?.overview.ctr.toFixed(2)}%`}
                  icon={Target}
                  colorScheme="google-ads"
                />
                <ScoreCard
                  title="Conversions"
                  value={googleConversions.toLocaleString()}
                  icon={TrendingUp}
                  colorScheme="google-ads"
                />
                <ScoreCard
                  title="CPA"
                  value={`£${googleAdsData?.overview.costPerConversion.toFixed(2)}`}
                  icon={DollarSign}
                  colorScheme="google-ads"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Total</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <ScoreCard
                  title="Total Spend"
                  value={`£${totalSpend.toLocaleString()}`}
                  icon={DollarSign}
                  colorScheme="default"
                />
                <ScoreCard
                  title="Cumulative CPA"
                  value={`£${cumulativeCPA.toFixed(2)}`}
                  icon={DollarSign}
                  colorScheme="default"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Email Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <ScoreCard
              title="Email Traffic"
              value={emailTraffic.toLocaleString()}
              icon={MousePointerClick}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Email Conversions"
              value={emailConversions.toLocaleString()}
              icon={TrendingUp}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Email CVR"
              value={`${emailCVR.toFixed(2)}%`}
              icon={Target}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Open Rate"
              value={`${mailchimpData?.overview.openRate.toFixed(1)}%`}
              icon={Mail}
              colorScheme="mailchimp"
            />
            <ScoreCard
              title="Click Rate"
              value={`${mailchimpData?.overview.clickThroughRate.toFixed(1)}%`}
              icon={MousePointerClick}
              colorScheme="mailchimp"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
