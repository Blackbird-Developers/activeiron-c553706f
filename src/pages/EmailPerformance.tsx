import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MailerLiteSection } from "@/components/sections/MailerLiteSection";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { EmailCampaignsTable } from "@/components/EmailCampaignsTable";
import { ScoreCard } from "@/components/ScoreCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, LayoutList, BarChart3 } from "lucide-react";
import { subMonths, startOfMonth, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { mailerliteData as placeholderData } from "@/data/placeholderData";

const CACHE_KEY = 'email_performance_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

interface CachedData {
  timestamp: number;
  startDate: string;
  endDate: string;
  mailerliteData: typeof placeholderData;
}

export default function EmailPerformance() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(subMonths(new Date(), 1)));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [mailerliteData, setMailerliteData] = useState<any>(placeholderData);

  const fetchEmailData = useCallback(async (forceRefresh = false) => {
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
            setMailerliteData(cached.mailerliteData);
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
      const { data, error } = await supabase.functions.invoke('mailerlite-data', {
        body: { startDate: startDateStr, endDate: endDateStr }
      });

      if (error) throw error;

      const newData = data?.data || placeholderData;
      setMailerliteData(newData);

      const now = new Date();
      setLastRefresh(now);

      const cacheData: CachedData = {
        timestamp: now.getTime(),
        startDate: startDateStr,
        endDate: endDateStr,
        mailerliteData: newData,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

      toast({
        title: "Data Updated",
        description: "Email data refreshed successfully.",
      });
    } catch (error) {
      console.error('Error fetching MailerLite data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch email data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  useEffect(() => {
    fetchEmailData();
  }, [fetchEmailData]);

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const campaigns = mailerliteData.campaigns || [];

  return (
    <>
      <LoadingOverlay isLoading={isLoading} colorScheme="mailchimp" />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
        title="Email Performance"
        titleClassName="text-mailchimp-foreground"
        description="Comprehensive overview of MailerLite email campaigns and subscriber metrics"
        lastRefresh={lastRefresh}
        isLoading={isLoading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Subscriber metrics */}
      <div className="space-y-4 lg:space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 lg:w-12 rounded-full bg-mailchimp" />
          <h2 className="text-xl lg:text-2xl font-bold text-mailchimp-foreground">Subscriber Overview</h2>
        </div>
        
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <ScoreCard
            title="Total Subscribers"
            value={mailerliteData.overview.totalSubscribers?.toLocaleString() || '0'}
            change="All time"
            changeType="neutral"
            icon={Users}
            colorScheme="mailchimp"
          />
          <ScoreCard
            title="Active Subscribers"
            value={mailerliteData.overview.activeSubscribers?.toLocaleString() || '0'}
            change="Currently active"
            changeType="positive"
            icon={UserCheck}
            colorScheme="mailchimp"
          />
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-2">
            <LayoutList className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <MailerLiteSection data={mailerliteData} />
        </TabsContent>
        
        <TabsContent value="campaigns" className="mt-6">
          <EmailCampaignsTable campaigns={campaigns} />
        </TabsContent>
      </Tabs>
      </div>
    </>
  );
}
