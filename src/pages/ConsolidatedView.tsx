import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ConsolidatedMetricsSection } from "@/components/sections/ConsolidatedMetricsSection";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ga4Data, googleAdsData, metaAdsData, mailerliteData, shopifyData } from "@/data/placeholderData";
import { CountryCode, parseCountryFromCampaignName } from "@/components/CountryFilter";

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
    mailerlite: typeof mailerliteData;
    shopify: typeof shopifyData;
  };
}

export default function ConsolidatedView() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
    mailerlite: mailerliteData,
    shopify: shopifyData,
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
      const [ga4Response, metaAdsResponse, googleAdsResponse, mailerliteResponse, shopifyResponse] = await Promise.all([
        supabase.functions.invoke('ga4-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('meta-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('google-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('mailerlite-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('shopify-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err }))
      ]);

      const newData = {
        ga4: ga4Response.data?.data || ga4Data,
        googleAds: googleAdsResponse.data?.data || googleAdsData,
        metaAds: metaAdsResponse.data?.data || metaAdsData,
        mailerlite: mailerliteResponse.data?.data || mailerliteData,
        shopify: shopifyResponse.data?.data || shopifyData,
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

  // Filter data based on selected country
  const filteredData = useMemo(() => {
    if (selectedCountry === 'all') {
      return marketingData;
    }

    // Filter Google Ads campaigns by country in name
    const filteredGoogleCampaigns = (marketingData.googleAds.campaignPerformance || []).filter(
      (campaign: any) => {
        const country = parseCountryFromCampaignName(campaign.campaign || '');
        return country === selectedCountry;
      }
    );
    const googleAdsAgg = filteredGoogleCampaigns.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        clicks: acc.clicks + (c.clicks || 0),
        impressions: acc.impressions + (c.impressions || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    // Filter Meta Ads campaigns by country in name
    const metaCampaigns = (marketingData.metaAds as any).campaigns || [];
    const filteredMetaCampaigns = metaCampaigns.filter(
      (campaign: any) => {
        const country = parseCountryFromCampaignName(campaign.name || '');
        return country === selectedCountry;
      }
    );
    const metaAdsAgg = filteredMetaCampaigns.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        clicks: acc.clicks + (c.clicks || 0),
        impressions: acc.impressions + (c.impressions || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    // Filter GA4 country breakdown
    const countryNameMap: Record<CountryCode, string[]> = {
      'IE': ['Ireland'],
      'UK': ['United Kingdom', 'Great Britain'],
      'all': [],
    };
    const ga4CountryData = marketingData.ga4.countryBreakdown?.find(
      (c: any) => countryNameMap[selectedCountry]?.some(name => 
        c.country?.toLowerCase() === name.toLowerCase()
      )
    );

    // Filter Shopify by country breakdown
    const shopifyCountryCodeMap: Record<CountryCode, string[]> = {
      'IE': ['IE'],
      'UK': ['GB', 'UK'],
      'all': [],
    };
    const shopifyCountryData = (marketingData.shopify as any)?.countryBreakdown?.find(
      (c: any) => shopifyCountryCodeMap[selectedCountry]?.includes(c.countryCode?.toUpperCase())
    );

    return {
      ...marketingData,
      ga4: {
        ...marketingData.ga4,
        overview: ga4CountryData ? {
          ...marketingData.ga4.overview,
          totalUsers: ga4CountryData.users || 0,
          sessions: ga4CountryData.sessions || 0,
          pageViews: ga4CountryData.pageViews || 0,
          engagementRate: ga4CountryData.engagementRate || 0,
        } : marketingData.ga4.overview,
      },
      googleAds: {
        ...marketingData.googleAds,
        overview: {
          ...marketingData.googleAds.overview,
          adSpend: googleAdsAgg.spend,
          clicks: googleAdsAgg.clicks,
          impressions: googleAdsAgg.impressions,
          conversions: googleAdsAgg.conversions,
          cpc: googleAdsAgg.clicks > 0 ? googleAdsAgg.spend / googleAdsAgg.clicks : 0,
          ctr: googleAdsAgg.impressions > 0 ? (googleAdsAgg.clicks / googleAdsAgg.impressions) * 100 : 0,
          costPerConversion: googleAdsAgg.conversions > 0 ? googleAdsAgg.spend / googleAdsAgg.conversions : 0,
        },
        campaignPerformance: filteredGoogleCampaigns,
      },
      metaAds: {
        ...marketingData.metaAds,
        overview: {
          ...marketingData.metaAds.overview,
          adSpend: metaAdsAgg.spend,
          clicks: metaAdsAgg.clicks,
          impressions: metaAdsAgg.impressions,
          conversions: metaAdsAgg.conversions,
          cpc: metaAdsAgg.clicks > 0 ? metaAdsAgg.spend / metaAdsAgg.clicks : 0,
          ctr: metaAdsAgg.impressions > 0 ? (metaAdsAgg.clicks / metaAdsAgg.impressions) * 100 : 0,
          costPerConversion: metaAdsAgg.conversions > 0 ? metaAdsAgg.spend / metaAdsAgg.conversions : 0,
        },
        campaigns: filteredMetaCampaigns,
      } as any,
      shopify: shopifyCountryData ? {
        overview: {
          totalOrders: shopifyCountryData.totalOrders || 0,
          totalRevenue: shopifyCountryData.totalRevenue || 0,
          averageOrderValue: shopifyCountryData.averageOrderValue || 0,
          totalProducts: marketingData.shopify.overview?.totalProducts || 0,
        },
        ordersOverTime: shopifyCountryData.ordersOverTime || [],
        topProducts: shopifyCountryData.topProducts || [],
        ordersByStatus: shopifyCountryData.ordersByStatus || [],
        countryBreakdown: (marketingData.shopify as any)?.countryBreakdown,
      } : marketingData.shopify,
    };
  }, [marketingData, selectedCountry]);

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
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      <ConsolidatedMetricsSection
        ga4Data={filteredData.ga4}
        metaAdsData={filteredData.metaAds}
        googleAdsData={filteredData.googleAds}
        mailchimpData={filteredData.mailerlite}
        shopifyData={filteredData.shopify}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
