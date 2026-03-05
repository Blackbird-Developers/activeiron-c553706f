import { useState, useEffect, useCallback, useMemo } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import { PageHeader } from "@/components/PageHeader";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { CampaignsTable } from "@/components/CampaignsTable";
import { CreativeAnalysis } from "@/components/CreativeAnalysis";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, Palette } from "lucide-react";
import { subDays, subYears, differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { metaAdsData as placeholderData } from "@/data/placeholderData";
import { CountryCode, parseCountryFromCampaignName } from "@/components/CountryFilter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CompareMode } from "@/components/DateFilter";

// Map Meta API objective values to friendly groups
const OBJECTIVE_GROUPS: Record<string, string> = {
  OUTCOME_AWARENESS: "Awareness",
  BRAND_AWARENESS: "Awareness",
  REACH: "Awareness",
  OUTCOME_ENGAGEMENT: "Awareness",
  OUTCOME_TRAFFIC: "Conversions",
  OUTCOME_LEADS: "Conversions",
  OUTCOME_SALES: "Conversions",
  CONVERSIONS: "Conversions",
  LINK_CLICKS: "Conversions",
  LEAD_GENERATION: "Conversions",
  PRODUCT_CATALOG_SALES: "Conversions",
};

function getObjectiveGroup(objective: string): string {
  return OBJECTIVE_GROUPS[objective] || "Other";
}

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
  const { startDate, endDate, setStartDate, setEndDate, selectedCountry, setSelectedCountry, compareMode, setCompareMode } = useDateRange();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [metaData, setMetaData] = useState<any>(placeholderData);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [objectiveTab, setObjectiveTab] = useState<string>("all");

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

  // Fetch comparison period data
  useEffect(() => {
    if (compareMode === 'off' || !startDate || !endDate) {
      setCompareData(null);
      return;
    }
    const daySpan = differenceInDays(endDate, startDate);
    let compStart: Date, compEnd: Date;
    if (compareMode === 'mom') {
      compEnd = subDays(startDate, 1);
      compStart = subDays(compEnd, daySpan);
    } else {
      compStart = subYears(startDate, 1);
      compEnd = subYears(endDate, 1);
    }
    setCompareLoading(true);
    supabase.functions.invoke('meta-ads-data', {
      body: { startDate: format(compStart, 'yyyy-MM-dd'), endDate: format(compEnd, 'yyyy-MM-dd') }
    }).then(res => setCompareData(res.data?.data || null))
      .catch(() => setCompareData(null))
      .finally(() => setCompareLoading(false));
  }, [compareMode, startDate, endDate]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to aggregate campaign metrics
  const aggregateCampaigns = (campaignList: any[], baseData: any) => {
    const agg = campaignList.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        clicks: acc.clicks + (c.clicks || 0),
        impressions: acc.impressions + (c.impressions || 0),
        conversions: acc.conversions + (c.conversions || 0),
        engagements: acc.engagements + (c.engagements || 0),
        reach: acc.reach + (c.reach || 0),
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0, engagements: 0, reach: 0 }
    );
    return {
      metaData: {
        ...baseData,
        overview: {
          ...baseData.overview,
          adSpend: agg.spend,
          clicks: agg.clicks,
          impressions: agg.impressions,
          conversions: agg.conversions,
          engagements: agg.engagements,
          cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
          ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
          costPerConversion: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
          cpr: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
          cpe: agg.engagements > 0 ? agg.spend / agg.engagements : 0,
        },
        campaigns: campaignList,
      },
      campaigns: campaignList,
    };
  };

  // Filter data based on selected country, active status, and objective
  const filteredData = useMemo(() => {
    let filteredCampaigns = [...campaigns];

    if (showActiveOnly) {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) => 
        campaign.status === 'ACTIVE'
      );
    }

    if (selectedCountry !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) => {
        const country = parseCountryFromCampaignName(campaign.name || '');
        return country === selectedCountry;
      });
    }

    // Filter by objective group
    if (objectiveTab !== 'all') {
      filteredCampaigns = filteredCampaigns.filter((campaign: any) => 
        getObjectiveGroup(campaign.objective || '') === objectiveTab
      );
    }

    if (!showActiveOnly && selectedCountry === 'all' && objectiveTab === 'all') {
      return { metaData, campaigns };
    }

    return aggregateCampaigns(filteredCampaigns, metaData);
  }, [metaData, campaigns, selectedCountry, showActiveOnly, objectiveTab]);

  // Apply same country/active filtering to compare data
  const filteredCompareData = useMemo(() => {
    if (!compareData) return null;
    let compCampaigns = compareData.campaigns || [];
    if (showActiveOnly) {
      compCampaigns = compCampaigns.filter((c: any) => c.status === 'ACTIVE');
    }
    if (selectedCountry !== 'all') {
      compCampaigns = compCampaigns.filter((c: any) => parseCountryFromCampaignName(c.name || '') === selectedCountry);
    }
    if (objectiveTab !== 'all') {
      compCampaigns = compCampaigns.filter((c: any) => getObjectiveGroup(c.objective || '') === objectiveTab);
    }
    const agg = compCampaigns.reduce((acc: any, c: any) => ({
      spend: acc.spend + (c.spend || 0), clicks: acc.clicks + (c.clicks || 0),
      impressions: acc.impressions + (c.impressions || 0), conversions: acc.conversions + (c.conversions || 0),
    }), { spend: 0, clicks: 0, impressions: 0, conversions: 0 });
    return {
      ...compareData,
      overview: {
        ...compareData.overview,
        adSpend: agg.spend, clicks: agg.clicks, impressions: agg.impressions, conversions: agg.conversions,
        cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
        ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
        costPerConversion: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
      },
      campaigns: compCampaigns,
    };
  }, [compareData, selectedCountry, showActiveOnly, objectiveTab]);

  // Detect which objective groups exist in the data
  const availableObjectives = useMemo(() => {
    const groups = new Set<string>();
    campaigns.forEach((c: any) => {
      groups.add(getObjectiveGroup(c.objective || ''));
    });
    return Array.from(groups).sort();
  }, [campaigns]);

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
        compareMode={compareMode}
        onCompareModeChange={setCompareMode}
      />

      {/* Objective filter tabs */}
      {availableObjectives.length > 1 && (
        <Tabs value={objectiveTab} onValueChange={setObjectiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
            {availableObjectives.map(obj => (
              <TabsTrigger key={obj} value={obj}>{obj}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <MetaAdsSection data={filteredData.metaData} selectedCountry={selectedCountry} compareData={compareMode !== 'off' ? filteredCompareData : undefined} compareLabel={compareMode === 'mom' ? 'MoM' : compareMode === 'yoy' ? 'YoY' : undefined} compareLoading={compareMode !== 'off' && compareLoading} objectiveFilter={objectiveTab} />

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
