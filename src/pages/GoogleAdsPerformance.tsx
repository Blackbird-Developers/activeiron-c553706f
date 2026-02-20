import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { GoogleAdsSection } from "@/components/sections/GoogleAdsSection";
import { GoogleAdsAIOverview } from "@/components/GoogleAdsAIOverview";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutList, Sparkles } from "lucide-react";
import { subDays, subYears, differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { googleAdsData as placeholderData } from "@/data/placeholderData";
import { CountryCode, parseCountryFromCampaignName } from "@/components/CountryFilter";
import { CompareMode } from "@/components/DateFilter";

const CACHE_KEY = 'google_ads_performance_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  googleAdsData: typeof placeholderData;
}

export default function GoogleAdsPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [googleAdsData, setGoogleAdsData] = useState<any>(placeholderData);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [compareMode, setCompareMode] = useState<CompareMode>("off");
  const [compareData, setCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const fetchGoogleAdsData = useCallback(async (forceRefresh = false) => {
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
            setGoogleAdsData(cached.googleAdsData);
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
      const { data, error } = await supabase.functions.invoke('google-ads-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      const newData = data?.data || placeholderData;
      setGoogleAdsData(newData);

      const now = new Date();
      setLastRefresh(now);

      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        googleAdsData: newData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      toast({
        title: "Data Updated",
        description: "Google Ads data refreshed successfully.",
      });
    } catch (error) {
      console.error('Error fetching Google Ads data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Google Ads data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchGoogleAdsData();
  }, [fetchGoogleAdsData]);

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
    supabase.functions.invoke('google-ads-data', {
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

  // Filter data based on selected country and active status
  const filteredData = useMemo(() => {
    let campaigns = googleAdsData.campaignPerformance || [];

    // Filter by active status if enabled
    if (showActiveOnly) {
      campaigns = campaigns.filter(
        (campaign: any) => campaign.status === 'ENABLED'
      );
    }

    // Filter by country if selected
    if (selectedCountry !== 'all') {
      campaigns = campaigns.filter(
        (campaign: any) => {
          const country = parseCountryFromCampaignName(campaign.campaign || '');
          return country === selectedCountry;
        }
      );
    }

    // Aggregate metrics from filtered campaigns
    const agg = campaigns.reduce(
      (acc: any, c: any) => ({
        spend: acc.spend + (c.spend || 0),
        clicks: acc.clicks + (c.clicks || 0),
        impressions: acc.impressions + (c.impressions || 0),
        conversions: acc.conversions + (c.conversions || 0),
      }),
      { spend: 0, clicks: 0, impressions: 0, conversions: 0 }
    );

    // If all countries selected and no active filter, return raw overview
    if (selectedCountry === 'all' && !showActiveOnly) {
      return {
        ...googleAdsData,
        campaignPerformance: campaigns,
      };
    }

    return {
      ...googleAdsData,
      overview: {
        ...googleAdsData.overview,
        adSpend: agg.spend,
        clicks: agg.clicks,
        impressions: agg.impressions,
        conversions: agg.conversions,
        cpc: agg.clicks > 0 ? agg.spend / agg.clicks : 0,
        ctr: agg.impressions > 0 ? (agg.clicks / agg.impressions) * 100 : 0,
        costPerConversion: agg.conversions > 0 ? agg.spend / agg.conversions : 0,
      },
      campaignPerformance: campaigns,
    };
  }, [googleAdsData, selectedCountry, showActiveOnly]);

  return (
    <>
      <LoadingOverlay isLoading={isLoading} colorScheme="google" />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
          title="Google Ads Performance"
          titleClassName="text-google-ads-foreground"
          description="Comprehensive overview of all Google Ads campaigns"
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

        <GoogleAdsSection data={filteredData} selectedCountry={selectedCountry} compareData={compareMode !== 'off' ? compareData : undefined} compareLabel={compareMode === 'mom' ? 'MoM' : compareMode === 'yoy' ? 'YoY' : undefined} compareLoading={compareMode !== 'off' && compareLoading} />

        <Tabs defaultValue="campaigns" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="campaigns" className="gap-2">
                <LayoutList className="h-4 w-4" />
                Campaigns
              </TabsTrigger>
              <TabsTrigger value="ai-overview" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI Overview
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center space-x-2">
              <Switch
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
              <Label htmlFor="active-only" className="text-sm text-muted-foreground cursor-pointer">
                Active only
              </Label>
            </div>
          </div>

          <TabsContent value="campaigns" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-google-ads-foreground">Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredData.campaignPerformance?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-right p-2">Status</th>
                          <th className="text-right p-2">Spend</th>
                          <th className="text-right p-2">Clicks</th>
                          <th className="text-right p-2">Conversions</th>
                          <th className="text-right p-2">ROAS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.campaignPerformance.map((campaign: any, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{campaign.campaign}</td>
                            <td className="text-right p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                campaign.status === 'ENABLED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
                              }`}>
                                {campaign.status}
                              </span>
                            </td>
                            <td className="text-right p-2">€{campaign.spend?.toFixed(2)}</td>
                            <td className="text-right p-2">{campaign.clicks?.toLocaleString()}</td>
                            <td className="text-right p-2">{campaign.conversions}</td>
                            <td className="text-right p-2">{campaign.roas?.toFixed(2)}x</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    {selectedCountry !== 'all'
                      ? `No campaigns found for ${{ IE: 'Ireland', UK: 'United Kingdom', US: 'United States', DE: 'Germany', NZ: 'New Zealand' }[selectedCountry] || selectedCountry}`
                      : 'No campaign data available'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-overview" className="mt-6">
            <GoogleAdsAIOverview googleAdsData={filteredData} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
