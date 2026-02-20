import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, TrendingUp, Search, FileText, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  googleAdsData: any;
}

function MatchTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    EXACT: { label: "Exact", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
    PHRASE: { label: "Phrase", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
    BROAD: { label: "Broad", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  };
  const info = map[type] || { label: type, className: "bg-muted text-muted-foreground" };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${info.className}`}>{info.label}</span>;
}

export function GoogleAdsAIOverview({ googleAdsData }: Props) {
  const { toast } = useToast();
  const [insights, setInsights] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const campaigns = googleAdsData?.campaignPerformance || [];
  const keywords = googleAdsData?.topKeywords || [];
  const rsas = googleAdsData?.responsiveSearchAds || [];
  const overview = googleAdsData?.overview || {};

  const topCampaigns = [...campaigns].sort((a, b) => (b.spend || 0) - (a.spend || 0)).slice(0, 10);
  const topKeywords = [...keywords].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 15);
  const topRSAs = [...rsas].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10);

  const generateInsights = async () => {
    setIsGenerating(true);
    setInsights("");
    try {
      const { data, error } = await supabase.functions.invoke('google-ads-ai-insights', {
        body: {
          campaigns: topCampaigns,
          keywords: topKeywords,
          responsiveSearchAds: topRSAs,
          overview,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setInsights(data.insights);
      toast({ title: "Analysis Complete", description: "Google Ads AI insights generated successfully." });
    } catch (err: any) {
      const msg = err?.message || "Failed to generate insights.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const hasData = campaigns.length > 0 || keywords.length > 0 || rsas.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-google-ads-foreground" />
          <div>
            <h3 className="text-lg font-semibold text-google-ads-foreground">AI Performance Analysis</h3>
            <p className="text-sm text-muted-foreground">AI-powered feedback on campaigns, keywords & ad copy</p>
          </div>
        </div>
        <Button
          onClick={generateInsights}
          disabled={isGenerating || !hasData}
          className="bg-google-ads text-google-ads-foreground hover:bg-google-ads/90"
          size="sm"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analysing…</>
          ) : insights ? (
            <><RefreshCw className="h-4 w-4 mr-2" />Re-analyse</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" />Generate AI Insights</>
          )}
        </Button>
      </div>

      {/* AI Insights Output */}
      {insights && (
        <Card className="border-google-ads/30 bg-google-ads-light/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-google-ads-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground leading-relaxed whitespace-pre-wrap">
              {insights}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasData && !isGenerating && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No Google Ads data available yet. Refresh the page data first.</p>
          </CardContent>
        </Card>
      )}

      {/* Data preview panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-google-ads-foreground">
              <TrendingUp className="h-4 w-4" />
              Top Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topCampaigns.length > 0 ? (
              <div className="divide-y">
                {topCampaigns.slice(0, 6).map((c: any, i: number) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight truncate flex-1" title={c.campaign}>{c.campaign}</p>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        c.status === 'ENABLED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'
                      }`}>{c.status}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>€{(c.spend || 0).toFixed(2)}</span>
                      <span>{c.clicks || 0} clicks</span>
                      <span>{c.conversions || 0} conv.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No campaign data</p>
            )}
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-google-ads-foreground">
              <Search className="h-4 w-4" />
              Top Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topKeywords.length > 0 ? (
              <div className="divide-y">
                {topKeywords.slice(0, 8).map((k: any, i: number) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium flex-1 truncate" title={k.keyword}>{k.keyword}</p>
                      <MatchTypeBadge type={k.matchType} />
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{k.clicks || 0} clicks</span>
                      <span>{(k.ctr || 0).toFixed(1)}% CTR</span>
                      <span>€{(k.cpc || 0).toFixed(2)} CPC</span>
                      {k.qualityScore && <span>QS: {k.qualityScore}/10</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No keyword data</p>
            )}
          </CardContent>
        </Card>

        {/* RSAs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-google-ads-foreground">
              <FileText className="h-4 w-4" />
              Responsive Search Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topRSAs.length > 0 ? (
              <div className="divide-y">
                {topRSAs.slice(0, 5).map((ad: any, i: number) => (
                  <div key={i} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
                    <p className="text-[10px] text-muted-foreground truncate">{ad.campaign}</p>
                    <p className="text-xs font-medium truncate text-google-ads-foreground" title={(ad.headlines || []).join(' | ')}>
                      {(ad.headlines || []).slice(0, 2).join(' | ')}
                    </p>
                    {ad.descriptions?.[0] && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{ad.descriptions[0]}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{ad.clicks || 0} clicks</span>
                      <span>{(ad.ctr || 0).toFixed(1)}% CTR</span>
                      <span>{ad.conversions || 0} conv.</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">No RSA data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {hasData && !insights && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="h-8 w-8 mx-auto mb-3 text-google-ads-foreground opacity-60" />
            <p className="text-sm font-medium mb-1">Ready to analyse</p>
            <p className="text-xs text-muted-foreground mb-4">
              {campaigns.length} campaigns · {keywords.length} keywords · {rsas.length} RSAs loaded
            </p>
            <Button onClick={generateInsights} disabled={isGenerating} size="sm" variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate AI Insights
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
