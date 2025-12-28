import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ConsolidatedMetricsSection } from "@/components/sections/ConsolidatedMetricsSection";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ga4Data, googleAdsData, metaAdsData, subblyData, mailchimpData } from "@/data/placeholderData";

const CACHE_KEY = 'consolidated_view_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
  };
}

export default function ConsolidatedView() {
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
  });

  const fetchMarketingData = useCallback(async (forceRefresh = false) => {
    if (!startDate || !endDate) return;
    
    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    // Check cache first
    if (!forceRefresh) {
      try {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          const cached: CachedData = JSON.parse(cachedStr);
          const cacheAge = Date.now() - cached.timestamp;
          
          // Use cache if less than 24 hours old and same date range
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

    setIsLoading(true);
    try {
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

      const newData = {
        ga4: ga4Response.data?.data || ga4Data,
        googleAds: googleAdsResponse.data?.data || googleAdsData,
        metaAds: metaAdsResponse.data?.data || metaAdsData,
        subbly: subblyResponse.data?.data || subblyData,
        mailchimp: mailchimpResponse.data?.data || mailchimpData,
      };

      setMarketingData(newData);
      
      const now = new Date();
      setLastRefresh(now);

      // Save to cache
      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        data: newData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      toast({
        title: "Data Updated",
        description: "Consolidated data refreshed successfully.",
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

  useEffect(() => {
    fetchMarketingData();
  }, [fetchMarketingData]);

  // Update elapsed time display every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Consolidated View"
        description="All key metrics in one place"
        lastRefresh={lastRefresh}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <ConsolidatedMetricsSection
        ga4Data={marketingData.ga4}
        metaAdsData={marketingData.metaAds}
        googleAdsData={marketingData.googleAds}
        subblyData={marketingData.subbly}
        mailchimpData={marketingData.mailchimp}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
