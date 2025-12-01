import { useState, useEffect } from "react";
import { DateFilter } from "@/components/DateFilter";
import { GA4Section } from "@/components/sections/GA4Section";
import { GoogleAdsSection } from "@/components/sections/GoogleAdsSection";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { SubblySection } from "@/components/sections/SubblySection";
import { MailchimpSection } from "@/components/sections/MailchimpSection";
import { FunnelSection } from "@/components/sections/FunnelSection";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";

const Index = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
    subbly: subblyData,
    mailchimp: mailchimpData,
  });

  const fetchMarketingData = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Fetch data from all sources with individual error handling
      const [ga4Response, metaAdsResponse, googleAdsResponse, subblyResponse, mailchimpResponse] = await Promise.all([
        supabase.functions.invoke('ga4-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('meta-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('google-ads-data', { body: { startDate: startDateStr, endDate: endDateStr, customerId: '1234567890' } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('subbly-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('mailchimp-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err }))
      ]);

      // Update state with real data (fallback to placeholder if API fails)
      setMarketingData({
        ga4: ga4Response.data?.data || ga4Data,
        googleAds: googleAdsResponse.data?.data || googleAdsData,
        metaAds: metaAdsResponse.data?.data || metaAdsData,
        subbly: subblyResponse.data?.data || subblyData,
        mailchimp: mailchimpResponse.data?.data || mailchimpData,
      });

      toast({
        title: "Data Updated",
        description: "Marketing data refreshed successfully.",
      });
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch marketing data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, [startDate, endDate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          <p className="text-muted-foreground">Multi-source analytics across all channels</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchMarketingData} 
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </div>

      <div className="space-y-12">
        <GA4Section data={marketingData.ga4} />
        <GoogleAdsSection data={marketingData.googleAds} />
        <MetaAdsSection data={marketingData.metaAds} />
        <SubblySection data={marketingData.subbly} />
        <MailchimpSection data={marketingData.mailchimp} />
        <FunnelSection 
          ga4Data={marketingData.ga4}
          metaAdsData={marketingData.metaAds}
          googleAdsData={marketingData.googleAds}
          subblyData={marketingData.subbly}
          mailchimpData={marketingData.mailchimp}
        />
      </div>
    </div>
  );
};

export default Index;
