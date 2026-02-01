import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { Sparkles, TrendingUp, Users, DollarSign, Mail, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ga4Data, googleAdsData, metaAdsData, mailchimpData } from "@/data/placeholderData";

export default function AIOverview() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
    mailchimp: mailchimpData,
  });

  const totalAdSpend = (marketingData.googleAds?.overview?.adSpend || 0) + (marketingData.metaAds?.overview?.adSpend || 0);
  const totalConversions = (marketingData.googleAds?.overview?.conversions || 0) + (marketingData.metaAds?.overview?.conversions || 0);

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

      const metaAdsResponse = await supabase.functions.invoke('meta-ads-data', { 
        body: { 
          startDate, 
          endDate
        } 
      }).catch(err => {
        console.error('Meta Ads API error:', err);
        return { data: null, error: err };
      });

      const googleAdsResponse = await supabase.functions.invoke('google-ads-data', { 
        body: { 
          startDate, 
          endDate,
          customerId: '1234567890' // TODO: Configure via environment variable
        } 
      }).catch(err => {
        console.error('Google Ads API error:', err);
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
        googleAds: googleAdsResponse.data?.data || googleAdsData,
        metaAds: metaAdsResponse.data?.data || metaAdsData,
        mailchimp: mailchimpResponse.data?.data || mailchimpData,
      });

      const errors = [
        ga4Response.error && 'GA4',
        metaAdsResponse.error && 'Meta Ads',
        googleAdsResponse.error && 'Google Ads',
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
      insight: `Combined ad spend across Google Ads (€${marketingData.googleAds?.overview?.adSpend?.toLocaleString() || 'N/A'}) and Meta Ads (€${marketingData.metaAds?.overview?.adSpend?.toLocaleString() || 'N/A'}) totals €${totalAdSpend.toLocaleString()}, generating ${totalConversions.toLocaleString()} conversions.`,
      recommendation: "Google Ads shows higher CPC but better conversion rates. Consider reallocating 15% of Meta budget to Google Ads.",
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
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="AI-Powered Insights"
        description="Data-driven recommendations across all marketing channels"
        showDateFilter={false}
        actions={
          <>
            <Button 
              onClick={fetchMarketingData} 
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="h-8 text-xs sm:text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              onClick={generateInsights}
              disabled={isLoading}
              size="sm"
              className="h-8 text-xs sm:text-sm"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              )}
              <span className="hidden sm:inline">Generate</span> AI
            </Button>
          </>
        }
      />

      {/* Key Metrics Summary */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-ga4/20 bg-ga4-light/50">
          <CardContent className="p-4 lg:p-6">
            <div className="text-xs lg:text-sm font-medium text-ga4-foreground opacity-80">Total Users</div>
            <div className="text-lg lg:text-2xl font-bold text-ga4-foreground">{marketingData.ga4?.overview?.totalUsers?.toLocaleString() || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card className="border-meta/20 bg-meta-light/50">
          <CardContent className="p-4 lg:p-6">
            <div className="text-xs lg:text-sm font-medium text-meta-foreground opacity-80">Total Conversions</div>
            <div className="text-lg lg:text-2xl font-bold text-meta-foreground">{totalConversions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-mailchimp/20 bg-mailchimp-light/50">
          <CardContent className="p-4 lg:p-6">
            <div className="text-xs lg:text-sm font-medium text-mailchimp-foreground opacity-80">Total Ad Spend</div>
            <div className="text-lg lg:text-2xl font-bold text-mailchimp-foreground">€{totalAdSpend.toLocaleString()}</div>
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
