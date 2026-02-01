import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GA4Section } from "@/components/sections/GA4Section";
import { GoogleAdsSection } from "@/components/sections/GoogleAdsSection";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { MailchimpSection } from "@/components/sections/MailchimpSection";
import { ShopifySection } from "@/components/sections/ShopifySection";
import { FunnelSection } from "@/components/sections/FunnelSection";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ga4Data, googleAdsData, metaAdsData, mailchimpData, shopifyData } from "@/data/placeholderData";
import { CountryCode, parseCountryFromCampaignName } from "@/components/CountryFilter";

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
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [marketingData, setMarketingData] = useState({
    ga4: ga4Data,
    googleAds: googleAdsData,
    metaAds: metaAdsData,
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
      const [ga4Response, metaAdsResponse, googleAdsResponse, mailchimpResponse, shopifyResponse] = await Promise.all([
        supabase.functions.invoke('ga4-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('meta-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
          .catch(err => ({ data: null, error: err })),
        supabase.functions.invoke('google-ads-data', { body: { startDate: startDateStr, endDate: endDateStr } })
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
    
    // Filter Meta Ads campaigns by country in name (campaigns array from API)
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
    };
  }, [marketingData, selectedCountry]);

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
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      <div className="space-y-12">
        <GA4Section data={filteredData.ga4} />
        <GoogleAdsSection data={filteredData.googleAds} />
        <MetaAdsSection data={filteredData.metaAds} />
        <ShopifySection data={filteredData.shopify} />
        <MailchimpSection data={filteredData.mailchimp} />
        <FunnelSection 
          ga4Data={filteredData.ga4}
          metaAdsData={filteredData.metaAds}
          googleAdsData={filteredData.googleAds}
          mailchimpData={filteredData.mailchimp}
        />
      </div>
    </div>
  );
};

export default Index;
