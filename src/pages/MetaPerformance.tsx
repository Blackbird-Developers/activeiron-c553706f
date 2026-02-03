import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { CampaignsTable } from "@/components/CampaignsTable";
import { CreativeAnalysis } from "@/components/CreativeAnalysis";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, Palette } from "lucide-react";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { metaAdsData as placeholderData } from "@/data/placeholderData";
import { CountryCode, parseCountryFromCampaignName } from "@/components/CountryFilter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const CACHE_KEY = 'meta_performance_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  metaData: typeof placeholderData;
  campaigns: any[];
}

export default function MetaPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [metaData, setMetaData] = useState<any>(placeholderData);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchMetaData = useCallback(async (forceRefresh = false) => {
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
            setMetaData(cached.metaData);
            setCampaigns(cached.campaigns);
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
      const { data, error } = await supabase.functions.invoke('meta-ads-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      const newMetaData = data?.data || placeholderData;
      const newCampaigns = data?.data?.campaigns || [];

      setMetaData(newMetaData);
      setCampaigns(newCampaigns);

      const now = new Date();
      setLastRefresh(now);

      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        metaData: newMetaData,
        campaigns: newCampaigns,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      toast({
        title: "Data Updated",
        description: "Meta Ads data refreshed successfully.",
      });
    } catch (error) {
      console.error('Error fetching Meta Ads data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Meta Ads data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchMetaData();
  }, [fetchMetaData]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter data based on selected country and active status
  const filteredData = useMemo(() => {
    // Start with all campaigns
    let filteredCampaigns = [...campaigns];

    // Filter by active status if enabled
    if (showActiveOnly) {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) => 
        campaign.status === 'ACTIVE'
      );
    }

    // Filter by country if selected
    if (selectedCountry !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) => {
        const country = parseCountryFromCampaignName(campaign.name || '');
        return country === selectedCountry;
      });
    }

    // If no filters applied and showing all, return original data
    if (!showActiveOnly && selectedCountry === 'all') {
      return { metaData, campaigns };
    }

    // Aggregate metrics from filtered campaigns
    const agg = filteredCampaigns.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        clicks: acc.clicks + (c.clicks || 0),
        impressions: acc.impressions + (c.impressions || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    return {
      metaData: {
        ...metaData,
        overview: {
          ...metaData.overview,
          adSpend: agg.spend,
          clicks: agg.clicks,
          impressions: agg.impressions,
          conversions: agg.conversions,
          cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
          ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
          costPerConversion: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
        },
        campaigns: filteredCampaigns,
      },
      campaigns: filteredCampaigns,
    };
  }, [metaData, campaigns, selectedCountry, showActiveOnly]);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} colorScheme="meta" />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
        title="Meta Ads Performance"
        titleClassName="text-meta-foreground"
        description="Comprehensive overview of all Meta advertising campaigns"
        lastRefresh={lastRefresh}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
      />

      <MetaAdsSection data={filteredData.metaData} />

      <Tabs defaultValue="campaigns" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="campaigns" className="gap-2">
              <LayoutList className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger value="creatives" className="gap-2">
              <Palette className="h-4 w-4" />
              Creative Analysis
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Switch
              id="active-only-meta"
              checked={showActiveOnly}
              onCheckedChange={setShowActiveOnly}
            />
            <Label htmlFor="active-only-meta" className="text-sm text-muted-foreground">
              Active only
            </Label>
          </div>
        </div>
        
        <TabsContent value="campaigns" className="mt-6">
          {!isLoading && <CampaignsTable campaigns={filteredData.campaigns} />}
        </TabsContent>
        
        <TabsContent value="creatives" className="mt-6">
          <CreativeAnalysis startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
