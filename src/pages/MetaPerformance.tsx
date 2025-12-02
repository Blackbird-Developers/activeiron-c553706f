import { useState, useEffect } from "react";
import { DateFilter } from "@/components/DateFilter";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { CampaignCard } from "@/components/CampaignCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { subDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { metaAdsData as placeholderData } from "@/data/placeholderData";

export default function MetaPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [metaData, setMetaData] = useState<any>(placeholderData);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchMetaData = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      const { data, error } = await supabase.functions.invoke('meta-ads-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      setMetaData(data?.data || placeholderData);
      setCampaigns(data?.data?.campaigns || []);

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
  };

  useEffect(() => {
    fetchMetaData();
  }, [startDate, endDate]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-meta-foreground">Meta Ads Performance</h1>
          <p className="text-muted-foreground">Comprehensive overview of all Meta advertising campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchMetaData} 
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

      <MetaAdsSection data={metaData} />

      {campaigns.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-meta" />
            <h2 className="text-2xl font-bold text-meta-foreground">Active Campaigns</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      )}

      {campaigns.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No active campaigns found for the selected period.</p>
        </div>
      )}
    </div>
  );
}
