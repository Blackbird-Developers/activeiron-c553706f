import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Users, DollarSign, Mail } from "lucide-react";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";

export default function AIOverview() {
  const totalAdSpend = googleAdsData.overview.adSpend + metaAdsData.overview.adSpend;
  const totalConversions = googleAdsData.overview.conversions + metaAdsData.overview.conversions;
  const revenue = subblyData.overview.revenue;
  const roas = (revenue / totalAdSpend).toFixed(2);

  const insights = [
    {
      title: "Traffic Performance",
      icon: Users,
      color: "text-ga4-foreground",
      insight: `Your total traffic stands at ${ga4Data.overview.totalUsers.toLocaleString()} users with a ${ga4Data.overview.engagementRate}% engagement rate. Organic search is your strongest channel at 40.5%, indicating strong SEO performance.`,
      recommendation: "Consider increasing content production to capitalise on organic search strength.",
    },
    {
      title: "Ad Spend Efficiency",
      icon: DollarSign,
      color: "text-meta-foreground",
      insight: `Combined ad spend across Google Ads ($${googleAdsData.overview.adSpend.toLocaleString()}) and Meta Ads ($${metaAdsData.overview.adSpend.toLocaleString()}) totals $${totalAdSpend.toLocaleString()}. Your overall ROAS is ${roas}, generating ${totalConversions.toLocaleString()} conversions.`,
      recommendation: "Google Ads shows higher CPC but better conversion rates. Consider reallocating 15% of Meta budget to Google Ads.",
    },
    {
      title: "Subscription Funnel",
      icon: TrendingUp,
      color: "text-subbly-foreground",
      insight: `Your subscription rate is ${subblyData.overview.subscriptionRate}% with ${subblyData.overview.subscriptions} active subscriptions generating $${subblyData.overview.revenue.toLocaleString()} in revenue. Premium plan dominates at 43.8% of subscribers.`,
      recommendation: "Conversion rate from ad clicks to subscriptions is strong. Test increasing ad spend by 20% to scale subscriptions.",
    },
    {
      title: "Email Engagement",
      icon: Mail,
      color: "text-mailchimp-foreground",
      insight: `Email campaigns show ${mailchimpData.overview.openRate}% open rate and ${mailchimpData.overview.clickThroughRate}% CTR. Your click-to-open rate of ${mailchimpData.overview.clickToOpenRate}% indicates good content relevance.`,
      recommendation: "Newsletter #45 performed 35% open rate. Analyse its subject line and content for replication in future campaigns.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-accent-foreground" />
        <div>
          <h1 className="text-3xl font-bold">AI-Powered Insights</h1>
          <p className="text-muted-foreground">Data-driven recommendations across all marketing channels</p>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-ga4/20 bg-ga4-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-ga4-foreground opacity-80">Total Users</div>
            <div className="text-2xl font-bold text-ga4-foreground">{ga4Data.overview.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-meta/20 bg-meta-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-meta-foreground opacity-80">Total Conversions</div>
            <div className="text-2xl font-bold text-meta-foreground">{totalConversions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-subbly/20 bg-subbly-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-subbly-foreground opacity-80">Active Subscriptions</div>
            <div className="text-2xl font-bold text-subbly-foreground">{subblyData.overview.subscriptions}</div>
          </CardContent>
        </Card>
        <Card className="border-mailchimp/20 bg-mailchimp-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-mailchimp-foreground opacity-80">Combined ROAS</div>
            <div className="text-2xl font-bold text-mailchimp-foreground">{roas}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <div className="space-y-6">
        {insights.map((item, index) => (
          <Card key={index} className="border-l-4" style={{ borderLeftColor: `hsl(var(--${item.color.replace('text-', '').replace('-foreground', '')}-primary))` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <item.icon className={`h-5 w-5 ${item.color}`} />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Analysis</h4>
                <p className="text-sm leading-relaxed">{item.insight}</p>
              </div>
              <div className="rounded-lg bg-accent/50 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Recommendation
                </h4>
                <p className="text-sm leading-relaxed">{item.recommendation}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
