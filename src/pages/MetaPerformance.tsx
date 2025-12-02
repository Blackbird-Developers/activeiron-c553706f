import { useState, useEffect, useCallback } from "react";
import { DateFilter } from "@/components/DateFilter";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { CampaignsTable } from "@/components/CampaignsTable";
import { Clock } from "lucide-react";
import { subDays, format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { metaAdsData as placeholderData } from "@/data/placeholderData";

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-meta-foreground">Meta Ads Performance</h1>
          <p className="text-muted-foreground">Comprehensive overview of all Meta advertising campaigns</p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {isLoading ? 'Updating...' : `Updated ${formatDistanceToNow(lastRefresh, { addSuffix: true })}`}
              </span>
            </div>
          )}
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </div>

      <MetaAdsSection data={metaData} />

      {!isLoading && <CampaignsTable campaigns={campaigns} />}
    </div>
  );
}
