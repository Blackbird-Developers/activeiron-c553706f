import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Users, DollarSign, Mail, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";

export default function AIOverview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
    subbly: subblyData,
    mailchimp: mailchimpData,
  });

  const totalAdSpend = (marketingData.googleAds?.overview?.adSpend || 0) + (marketingData.metaAds?.overview?.adSpend || 0);
  const totalConversions = (marketingData.googleAds?.overview?.conversions || 0) + (marketingData.metaAds?.overview?.conversions || 0);
  const revenue = marketingData.subbly?.overview?.revenue || 0;
  const roas = totalAdSpend > 0 ? (revenue / totalAdSpend).toFixed(2) : '0.00';

  const fetchMarketingData = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch data from all sources with individual error handling
      const ga4Response = await supabase.functions.invoke('ga4-data', { body: { startDate, endDate } })
        .catch(err => {
          console.error('GA4 API error:', err);
          return { data: null, error: err };
        });

      const subblyResponse = await supabase.functions.invoke('subbly-data', { body: { startDate, endDate } })
        .catch(err => {
          console.error('Subbly API error:', err);
          return { data: null, error: err };
        });

      const mailchimpResponse = await supabase.functions.invoke('mailchimp-data', { body: { startDate, endDate } })
        .catch(err => {
          console.error('Mailchimp API error:', err);
          return { data: null, error: err };
        });

      // Update state with real data (fallback to placeholder if API fails)
      setMarketingData({
        ga4: ga4Response.data?.data || ga4Data,
        googleAds: googleAdsData, // Placeholder until Google Ads API is configured
        metaAds: metaAdsData, // Placeholder until Meta Ads API is configured
        subbly: subblyResponse.data?.data || subblyData,
        mailchimp: mailchimpResponse.data?.data || mailchimpData,
      });

      const errors = [
        ga4Response.error && 'GA4',
        subblyResponse.error && 'Subbly',
        mailchimpResponse.error && 'Mailchimp'
      ].filter(Boolean);

      if (errors.length > 0) {
        toast({
          title: "Partial Data Update",
          description: `${errors.join(', ')} API failed. Using placeholder data for these sources.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Data Updated",
          description: "Marketing data refreshed successfully.",
        });
      }
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch marketing data. Using placeholder data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          ga4Data: marketingData.ga4,
          googleAdsData: marketingData.googleAds,
          metaAdsData: marketingData.metaAds,
          subblyData: marketingData.subbly,
          mailchimpData: marketingData.mailchimp,
        },
      });

      if (error) throw error;

      setInsights(data.insights);
      toast({
        title: "Insights Generated",
        description: "AI analysis completed successfully.",
      });
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate insights.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const staticInsights = [
    {
      title: "Traffic Performance",
      icon: Users,
      color: "text-ga4-foreground",
      insight: `Your total traffic stands at ${marketingData.ga4?.overview?.totalUsers?.toLocaleString() || 'N/A'} users with a ${marketingData.ga4?.overview?.engagementRate || 'N/A'}% engagement rate. Organic search is your strongest channel at 40.5%, indicating strong SEO performance.`,
      recommendation: "Consider increasing content production to capitalise on organic search strength.",
    },
    {
      title: "Ad Spend Efficiency",
      icon: DollarSign,
      color: "text-meta-foreground",
      insight: `Combined ad spend across Google Ads ($${marketingData.googleAds?.overview?.adSpend?.toLocaleString() || 'N/A'}) and Meta Ads ($${marketingData.metaAds?.overview?.adSpend?.toLocaleString() || 'N/A'}) totals $${totalAdSpend.toLocaleString()}. Your overall ROAS is ${roas}, generating ${totalConversions.toLocaleString()} conversions.`,
      recommendation: "Google Ads shows higher CPC but better conversion rates. Consider reallocating 15% of Meta budget to Google Ads.",
    },
    {
      title: "Subscription Funnel",
      icon: TrendingUp,
      color: "text-subbly-foreground",
      insight: `Your subscription rate is ${marketingData.subbly?.overview?.subscriptionRate || 'N/A'}% with ${marketingData.subbly?.overview?.subscriptions || 'N/A'} active subscriptions generating $${marketingData.subbly?.overview?.revenue?.toLocaleString() || 'N/A'} in revenue. Premium plan dominates at 43.8% of subscribers.`,
      recommendation: "Conversion rate from ad clicks to subscriptions is strong. Test increasing ad spend by 20% to scale subscriptions.",
    },
    {
      title: "Email Engagement",
      icon: Mail,
      color: "text-mailchimp-foreground",
      insight: `Email campaigns show ${marketingData.mailchimp?.overview?.openRate || 'N/A'}% open rate and ${marketingData.mailchimp?.overview?.clickThroughRate || 'N/A'}% CTR. Your click-to-open rate of ${marketingData.mailchimp?.overview?.clickToOpenRate || 'N/A'}% indicates good content relevance.`,
      recommendation: "Newsletter #45 performed 35% open rate. Analyse its subject line and content for replication in future campaigns.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-accent-foreground" />
          <div>
            <h1 className="text-3xl font-bold">AI-Powered Insights</h1>
            <p className="text-muted-foreground">Data-driven recommendations across all marketing channels</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchMarketingData} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Data
          </Button>
          <Button 
            onClick={generateInsights}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate AI Insights
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-ga4/20 bg-ga4-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-ga4-foreground opacity-80">Total Users</div>
            <div className="text-2xl font-bold text-ga4-foreground">{marketingData.ga4?.overview?.totalUsers?.toLocaleString() || 'N/A'}</div>
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
            <div className="text-2xl font-bold text-subbly-foreground">{marketingData.subbly?.overview?.subscriptions || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-mailchimp/20 bg-mailchimp-light/50">
          <CardContent className="p-6">
            <div className="text-sm font-medium text-mailchimp-foreground opacity-80">Combined ROAS</div>
            <div className="text-2xl font-bold text-mailchimp-foreground">{roas}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Generated Insights */}
      {insights && (
        <Card className="border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
              AI-Generated Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{insights}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Static Insights */}
      <div className="space-y-6">
        {staticInsights.map((item, index) => (
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
