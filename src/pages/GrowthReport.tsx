import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import {
  Sparkles, TrendingUp, Target, DollarSign, Mail, ShoppingBag, BarChart3,
  Printer, Loader2, RefreshCw, ArrowRight, CheckCircle2, Zap, Rocket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ga4Data, googleAdsData, metaAdsData, mailerliteData, shopifyData } from "@/data/placeholderData";
import { format, subDays } from "date-fns";
import activeIronLogo from "@/assets/activeiron-logo.png";

interface Opportunity {
  channel: string;
  title: string;
  currentState: string;
  benchmarkComparison: string;
  recommendation: string;
  estimatedImpact: string;
  priority: "High" | "Medium" | "Low";
  effort: string;
  icon: string;
}

interface GrowthReport {
  executiveSummary: string;
  totalEstimatedAnnualImpact: string;
  opportunities: Opportunity[];
  quickWins: string[];
  investmentAreas: string[];
}

interface BenchmarkResult {
  channel: string;
  metric: string;
  current: number;
  benchmark: { good: number; excellent: number; unit: string; label: string; inverted?: boolean };
}

const iconMap: Record<string, any> = {
  "trending-up": TrendingUp,
  "target": Target,
  "dollar-sign": DollarSign,
  "mail": Mail,
  "shopping-bag": ShoppingBag,
  "bar-chart": BarChart3,
};

const priorityColors: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Low: "bg-muted text-muted-foreground border-border",
};

const effortColors: Record<string, string> = {
  "Quick Win": "bg-meta-light text-meta-foreground",
  Medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "Long-term": "bg-muted text-muted-foreground",
};

function BenchmarkBar({ result }: { result: BenchmarkResult }) {
  const { current, benchmark } = result;
  const inverted = benchmark.inverted;
  const max = Math.max(current, benchmark.excellent, benchmark.good) * 1.3;

  const getStatus = () => {
    if (inverted) {
      if (current <= benchmark.excellent) return "excellent";
      if (current <= benchmark.good) return "good";
      return "below";
    }
    if (current >= benchmark.excellent) return "excellent";
    if (current >= benchmark.good) return "good";
    return "below";
  };

  const status = getStatus();
  const statusColor = status === "excellent" ? "text-meta-foreground" : status === "good" ? "text-amber-600 dark:text-amber-400" : "text-destructive";
  const barColor = status === "excellent" ? "bg-meta-foreground" : status === "good" ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{result.channel} — {result.metric}</span>
        <span className={`font-semibold ${statusColor}`}>
          {current}{benchmark.unit}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
        <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${Math.min((current / max) * 100, 100)}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Good: {benchmark.good}{benchmark.unit}</span>
        <span>Excellent: {benchmark.excellent}{benchmark.unit}</span>
      </div>
    </div>
  );
}

export default function GrowthReport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<GrowthReport | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const startDate = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      // Fetch all platform data in parallel
      const [ga4Res, metaRes, googleRes, mailerliteRes, shopifyRes] = await Promise.all([
        supabase.functions.invoke('ga4-data', { body: { startDate, endDate } }).catch(() => ({ data: null })),
        supabase.functions.invoke('meta-ads-data', { body: { startDate, endDate } }).catch(() => ({ data: null })),
        supabase.functions.invoke('google-ads-data', { body: { startDate, endDate } }).catch(() => ({ data: null })),
        supabase.functions.invoke('mailerlite-data', { body: { startDate, endDate } }).catch(() => ({ data: null })),
        supabase.functions.invoke('shopify-data', { body: { startDate, endDate } }).catch(() => ({ data: null })),
      ]);

      const payload = {
        ga4Data: ga4Res.data?.data || ga4Data,
        googleAdsData: googleRes.data?.data || googleAdsData,
        metaAdsData: metaRes.data?.data || metaAdsData,
        mailerliteData: mailerliteRes.data?.data || mailerliteData,
        shopifyData: shopifyRes.data?.data || shopifyData,
      };

      const { data, error } = await supabase.functions.invoke('growth-report', { body: payload });

      if (error) throw error;

      if (data.report?.opportunities) {
        setReport(data.report);
        setBenchmarks(data.benchmarks || []);
        setGeneratedAt(new Date());
        toast({ title: "Report Generated", description: "Growth opportunities report is ready." });
      } else if (data.report?.raw) {
        toast({ title: "Partial Report", description: "AI returned unstructured data. Displaying raw analysis.", variant: "destructive" });
        setReport({ executiveSummary: data.report.raw, totalEstimatedAnnualImpact: '', opportunities: [], quickWins: [], investmentAreas: [] });
        setBenchmarks(data.benchmarks || []);
        setGeneratedAt(new Date());
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({ title: "Error", description: error?.message || "Failed to generate report.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
          title="Growth Opportunities Report"
          description="AI-powered analysis with quantified impact estimates across all channels"
          showDateFilter={false}
          showCountryFilter={false}
          actions={
            <div className="flex gap-2">
              {report && (
                <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs sm:text-sm">
                  <Printer className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Print /</span> PDF
                </Button>
              )}
              <Button onClick={generateReport} disabled={isLoading} size="sm" className="h-8 text-xs sm:text-sm">
                {isLoading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                {report ? "Regenerate" : "Generate"} Report
              </Button>
            </div>
          }
        />

        {!report && !isLoading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div className="rounded-full bg-accent/50 p-4">
                <Rocket className="h-8 w-8 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Generate Your Growth Report</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Pull live data from GA4, Google Ads, Meta Ads, Shopify, and MailerLite to identify growth opportunities with estimated revenue impact.
                </p>
              </div>
              <Button onClick={generateReport} size="lg" className="mt-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>
        )}

        {report && (
          <div ref={printRef} className="space-y-6 print:space-y-4">
            {/* Print header (hidden on screen) */}
            <div className="hidden print:block mb-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h1 className="text-2xl font-bold">Growth Opportunities Report</h1>
                  <p className="text-sm text-muted-foreground">ActiveIron — Prepared by Blackbird Marketing</p>
                </div>
                <img src={activeIronLogo} alt="ActiveIron" className="h-10" />
              </div>
              {generatedAt && (
                <p className="text-xs text-muted-foreground mt-2">
                  Generated: {format(generatedAt, 'dd MMM yyyy, HH:mm')} — Data period: Last 30 days
                </p>
              )}
            </div>

            {/* Executive Summary */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
                {report.totalEstimatedAnnualImpact && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Total Estimated Annual Impact</p>
                      <p className="text-xl font-bold text-primary">{report.totalEstimatedAnnualImpact}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Benchmark Scorecard */}
            {benchmarks.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Performance vs Industry Benchmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {benchmarks.map((b, i) => (
                      <BenchmarkBar key={i} result={b} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {report.opportunities.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Growth Opportunities ({report.opportunities.length})
                </h2>
                {report.opportunities.map((opp, i) => {
                  const IconComp = iconMap[opp.icon] || TrendingUp;
                  return (
                    <Card key={i} className="print:break-inside-avoid">
                      <CardContent className="p-4 lg:p-6 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-accent/50 p-2 shrink-0">
                              <IconComp className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm lg:text-base">{opp.title}</h3>
                              <p className="text-xs text-muted-foreground">{opp.channel}</p>
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <Badge variant="outline" className={priorityColors[opp.priority]}>
                              {opp.priority}
                            </Badge>
                            <Badge variant="outline" className={effortColors[opp.effort] || effortColors.Medium}>
                              {opp.effort}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3 text-sm">
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Current State</p>
                            <p className="text-xs leading-relaxed">{opp.currentState}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">vs Benchmark</p>
                            <p className="text-xs leading-relaxed">{opp.benchmarkComparison}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Recommendation</p>
                            <p className="text-xs leading-relaxed">{opp.recommendation}</p>
                          </div>
                        </div>

                        <div className="rounded-lg bg-meta-light/50 border border-meta/20 p-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-meta-foreground shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-meta-foreground">Estimated Impact</p>
                            <p className="text-sm font-semibold text-meta-foreground">{opp.estimatedImpact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Wins & Investment Areas side by side */}
            <div className="grid gap-4 sm:grid-cols-2">
              {report.quickWins.length > 0 && (
                <Card className="print:break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Quick Wins (This Week)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.quickWins.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-meta-foreground shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.investmentAreas.length > 0 && (
                <Card className="print:break-inside-avoid">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Rocket className="h-5 w-5 text-primary" />
                      Recommended Investment Areas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.investmentAreas.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t print:mt-8">
              <p>This report was generated using live data and AI analysis. Estimates are projections based on industry benchmarks and current performance.</p>
              {generatedAt && <p className="mt-1">Generated: {format(generatedAt, 'dd MMM yyyy, HH:mm')}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
