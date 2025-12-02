import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Image, Video, TrendingUp, MousePointer, Target, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreativeAnalysisProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

interface AdCreative {
  id: string;
  name: string;
  headline: string;
  description: string;
  hasVideo: boolean;
  imageUrl: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  conversions: number;
}

interface AnalysisData {
  ads: AdCreative[];
  topPerformers: {
    byClicks: AdCreative[];
    byCTR: AdCreative[];
    byConversions: AdCreative[];
    byCPC: AdCreative[];
  };
  summary: {
    totalAds: number;
    videoAds: number;
    imageAds: number;
    avgCTR: number;
    avgCPC: number;
  };
  aiAnalysis: string;
}

export function CreativeAnalysis({ startDate, endDate }: CreativeAnalysisProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);

  const fetchAnalysis = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select a date range first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('meta-creative-analysis', {
        body: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }
      });

      if (error) throw error;
      setData(result);
      toast({
        title: "Analysis complete",
        description: "Creative performance data has been analysed.",
      });
    } catch (error) {
      console.error('Error fetching creative analysis:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creative analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderAdRow = (ad: AdCreative) => (
    <TableRow key={ad.id}>
      <TableCell className="font-medium max-w-[200px] truncate">{ad.headline}</TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          {ad.hasVideo ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
          {ad.hasVideo ? 'Video' : 'Image'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">€{ad.spend.toFixed(2)}</TableCell>
      <TableCell className="text-right">{ad.impressions.toLocaleString('en-GB')}</TableCell>
      <TableCell className="text-right">{ad.clicks.toLocaleString('en-GB')}</TableCell>
      <TableCell className="text-right">{ad.ctr.toFixed(2)}%</TableCell>
      <TableCell className="text-right">€{ad.cpc.toFixed(2)}</TableCell>
      <TableCell className="text-right">{ad.conversions}</TableCell>
    </TableRow>
  );

  if (!data) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-meta/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-meta" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Creative Performance Analysis</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Analyse your ad creatives to discover which images, videos, headlines, and descriptions perform best.
            </p>
            <Button onClick={fetchAnalysis} disabled={isLoading} className="bg-meta hover:bg-meta/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ads Analysed</CardDescription>
            <CardTitle className="text-2xl">{data.summary.totalAds}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Image className="h-3 w-3" /> Image Ads
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.imageAds}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Video className="h-3 w-3" /> Video Ads
            </CardDescription>
            <CardTitle className="text-2xl">{data.summary.videoAds}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average CTR</CardDescription>
            <CardTitle className="text-2xl">{data.summary.avgCTR.toFixed(2)}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* AI Analysis */}
      <Card className="border-meta/30 bg-meta/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-meta-foreground">
            <Sparkles className="h-5 w-5 text-meta" />
            AI Creative Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
            {data.aiAnalysis}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Creatives</CardTitle>
          <CardDescription>View best performers by different metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="clicks">
            <TabsList className="mb-4">
              <TabsTrigger value="clicks" className="gap-1">
                <MousePointer className="h-3 w-3" /> By Clicks
              </TabsTrigger>
              <TabsTrigger value="ctr" className="gap-1">
                <TrendingUp className="h-3 w-3" /> By CTR
              </TabsTrigger>
              <TabsTrigger value="conversions" className="gap-1">
                <Target className="h-3 w-3" /> By Conversions
              </TabsTrigger>
              <TabsTrigger value="cpc" className="gap-1">
                € By CPC (Low)
              </TabsTrigger>
            </TabsList>

            {['clicks', 'ctr', 'conversions', 'cpc'].map((metric) => (
              <TabsContent key={metric} value={metric}>
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Headline</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead className="text-right">Spend</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">CPC</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topPerformers[
                        metric === 'clicks' ? 'byClicks' :
                        metric === 'ctr' ? 'byCTR' :
                        metric === 'conversions' ? 'byConversions' : 'byCPC'
                      ].map(renderAdRow)}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchAnalysis} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
