import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GA4Section } from "@/components/sections/GA4Section";
import { GoogleAdsSection } from "@/components/sections/GoogleAdsSection";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { SubblySection } from "@/components/sections/SubblySection";
import { MailchimpSection } from "@/components/sections/MailchimpSection";
import { ShopifySection } from "@/components/sections/ShopifySection";
import { FunnelSection } from "@/components/sections/FunnelSection";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData, shopifyData } from "@/data/placeholderData";

const CACHE_KEY = 'marketing_dashboard_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  data: {
    ga4: typeof ga4Data;
    googleAds: typeof googleAdsData;
    metaAds: typeof metaAdsData;
    subbly: typeof subblyData;
    mailchimp: typeof mailchimpData;
    shopify: typeof shopifyData;
  };
}

const Index = () => {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
    subbly: subblyData,
    mailchimp: mailchimpData,
    shopify: shopifyData,
  });

  const fetchMarketingData = useCallback(async (forceRefresh = false) => {
    if (!startDate || !endDate) return;
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached: CachedData = JSON.parse(cachedStr);
          const cacheAge = Date.now() - cached.timestamp;
          
          if (cacheAge < CACHE_DURATION_MS && 
              cached.startDate === startDateStr && 
              cached.endDate === endDateStr) {
            setMarketingData(cached.data);
            setLastRefresh(new Date(cached.timestamp));
            return;
          }
        }
      } catch (e) {
        console.error('Cache read error:', e);
      }
    }

    // Clear old cache to ensure fresh data when force refreshing
    if (forceRefresh) {
      localStorage.removeItem(CACHE_KEY);
    }
    
    setIsLoading(true);
    try {
      const [ga4Response, metaAdsResponse, googleAdsResponse, subblyResponse, mailchimpResponse, shopifyResponse] = await Promise.all([
        supabase.functions.invoke('ga4-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('meta-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('google-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('subbly-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('mailchimp-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('shopify-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err }))
      ]);

      console.log('Google Ads Response:', googleAdsResponse);

      const newData = {
        ga4: ga4Response.data?.data || ga4Data,
        googleAds: googleAdsResponse.data?.data || googleAdsData,
        metaAds: metaAdsResponse.data?.data || metaAdsData,
        subbly: subblyResponse.data?.data || subblyData,
        mailchimp: mailchimpResponse.data?.data || mailchimpData,
        shopify: shopifyResponse.data?.data || shopifyData,
      };

      console.log('Google Ads Data being set:', newData.googleAds);

      setMarketingData(newData);

      const now = new Date();
      setLastRefresh(now);

      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        data: newData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

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
  }, [startDate, endDate, toast]);

  const didMountRef = useRef(false);
  useEffect(() => {
    // First load: allow cache. Subsequent date changes: force refresh so UI always matches selected dates.
    if (!didMountRef.current) {
      didMountRef.current = true;
      fetchMarketingData(false);
      return;
    }
    fetchMarketingData(true);
  }, [fetchMarketingData]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Marketing Dashboard"
        description="Multi-source analytics across all channels"
        lastRefresh={lastRefresh}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <div className="space-y-12">
        <GA4Section data={marketingData.ga4} />
        <GoogleAdsSection data={marketingData.googleAds} />
        <MetaAdsSection data={marketingData.metaAds} />
        <SubblySection 
          data={marketingData.subbly} 
          totalAdSpend={marketingData.metaAds.overview.adSpend + marketingData.googleAds.overview.adSpend}
        />
        <ShopifySection data={marketingData.shopify} />
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
