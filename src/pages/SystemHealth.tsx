import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, RefreshCw, Clock, Activity, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Status = "healthy" | "error" | "warning" | "checking" | "unknown";

interface DataSourceCheck {
  key: string;
  name: string;
  fn: string;
  colorClass: string;
  description: string;
}

const SOURCES: DataSourceCheck[] = [
  { key: "ga4", name: "Google Analytics 4", fn: "ga4-data", colorClass: "text-ga4-foreground", description: "Website traffic & user data" },
  { key: "google-ads", name: "Google Ads", fn: "google-ads-data", colorClass: "text-google-ads-foreground", description: "Search & display campaigns" },
  { key: "meta-ads", name: "Meta Ads", fn: "meta-ads-data", colorClass: "text-meta-ads-foreground", description: "Facebook & Instagram campaigns" },
  { key: "mailerlite", name: "MailerLite", fn: "mailerlite-data", colorClass: "text-mailerlite-foreground", description: "Email marketing metrics" },
  { key: "shopify", name: "Shopify", fn: "shopify-data", colorClass: "text-shopify-foreground", description: "Orders, revenue & products" },
];

interface CheckResult {
  status: Status;
  message?: string;
  detail?: string;
  checkedAt?: Date;
  durationMs?: number;
}

const STORAGE_KEY = "system_health_last_results";

export default function SystemHealth() {
  const [results, setResults] = useState<Record<string, CheckResult>>({});
  const [checking, setChecking] = useState(false);

  // Restore last results on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const restored: Record<string, CheckResult> = {};
        for (const [k, v] of Object.entries<any>(parsed)) {
          restored[k] = { ...v, checkedAt: v.checkedAt ? new Date(v.checkedAt) : undefined };
        }
        setResults(restored);
      }
    } catch { /* ignore */ }
  }, []);

  const runCheck = useCallback(async (src: DataSourceCheck): Promise<CheckResult> => {
    const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");
    const t0 = performance.now();
    try {
      const { data, error } = await supabase.functions.invoke(src.fn, {
        body: { startDate, endDate },
      });
      const durationMs = Math.round(performance.now() - t0);
      if (error) {
        return { status: "error", message: "Edge function error", detail: error.message || String(error), checkedAt: new Date(), durationMs };
      }
      if (data?.error) {
        const detail = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        return { status: "error", message: "API returned error", detail, checkedAt: new Date(), durationMs };
      }
      const payload = data?.data ?? data;
      const hasAnyData =
        payload &&
        (payload.overview || payload.totalOrders !== undefined || payload.totalRevenue !== undefined || payload.campaigns || payload.trafficBySource);
      if (!hasAnyData) {
        return { status: "warning", message: "Empty payload", detail: "The function responded but returned no data.", checkedAt: new Date(), durationMs };
      }
      return { status: "healthy", message: "OK", checkedAt: new Date(), durationMs };
    } catch (e: any) {
      const durationMs = Math.round(performance.now() - t0);
      return { status: "error", message: "Request failed", detail: e?.message || String(e), checkedAt: new Date(), durationMs };
    }
  }, []);

  const runAll = useCallback(async () => {
    setChecking(true);
    setResults((prev) => {
      const next = { ...prev };
      SOURCES.forEach((s) => { next[s.key] = { ...(prev[s.key] || {}), status: "checking" }; });
      return next;
    });
    const entries = await Promise.all(
      SOURCES.map(async (s) => [s.key, await runCheck(s)] as const)
    );
    const next: Record<string, CheckResult> = {};
    entries.forEach(([k, v]) => { next[k] = v; });
    setResults(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    setChecking(false);
  }, [runCheck]);

  const errorCount = Object.values(results).filter((r) => r.status === "error").length;
  const warningCount = Object.values(results).filter((r) => r.status === "warning").length;
  const healthyCount = Object.values(results).filter((r) => r.status === "healthy").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold">System Health</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Diagnose which data sources are working and which need attention.
          </p>
        </div>
        <Button onClick={runAll} disabled={checking}>
          <RefreshCw className={cn("h-4 w-4 mr-2", checking && "animate-spin")} />
          {checking ? "Running checks…" : "Run all checks"}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="py-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold">{healthyCount}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
          </CardContent>
        </Card>
        <Card className={warningCount > 0 ? "border-yellow-500/30 bg-yellow-500/5" : ""}>
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className={cn("h-6 w-6", warningCount > 0 ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground")} />
            <div>
              <div className="text-2xl font-bold">{warningCount}</div>
              <div className="text-xs text-muted-foreground">Warnings</div>
            </div>
          </CardContent>
        </Card>
        <Card className={errorCount > 0 ? "border-destructive/40 bg-destructive/5" : ""}>
          <CardContent className="py-4 flex items-center gap-3">
            <XCircle className={cn("h-6 w-6", errorCount > 0 ? "text-destructive" : "text-muted-foreground")} />
            <div>
              <div className="text-2xl font-bold">{errorCount}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Errors first */}
      {errorCount + warningCount > 0 && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Issues that need attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SOURCES.filter((s) => results[s.key] && (results[s.key].status === "error" || results[s.key].status === "warning")).map((s) => {
              const r = results[s.key];
              return (
                <div key={s.key} className="rounded-md border p-3 bg-background">
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {r.status === "error" ? <XCircle className="h-4 w-4 text-destructive" /> : <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                      <span className="font-medium">{s.name}</span>
                      <Badge variant={r.status === "error" ? "destructive" : "outline"}>{r.message}</Badge>
                    </div>
                    {r.checkedAt && (
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(r.checkedAt, { addSuffix: true })}</span>
                    )}
                  </div>
                  {r.detail && (
                    <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-words max-h-40">
                      {r.detail}
                    </pre>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Sources</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {SOURCES.map((s) => {
              const r = results[s.key] || { status: "unknown" as Status };
              const statusMap: Record<Status, { icon: any; className: string; label: string }> = {
                healthy: { icon: CheckCircle2, className: "text-green-600 dark:text-green-400", label: "Healthy" },
                error: { icon: XCircle, className: "text-destructive", label: "Error" },
                warning: { icon: AlertTriangle, className: "text-yellow-600 dark:text-yellow-400", label: "Warning" },
                checking: { icon: RefreshCw, className: "text-muted-foreground animate-spin", label: "Checking…" },
                unknown: { icon: Clock, className: "text-muted-foreground", label: "Not checked" },
              };
              const S = statusMap[r.status];
              return (
                <div key={s.key} className="flex items-center gap-4 px-4 py-3">
                  <S.icon className={cn("h-5 w-5 shrink-0", S.className)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-medium", s.colorClass)}>{s.name}</span>
                      <Badge variant="outline" className="text-[10px]">{s.fn}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div className="font-medium text-foreground">{S.label}</div>
                    {r.checkedAt && (
                      <div>{formatDistanceToNow(r.checkedAt, { addSuffix: true })} · {r.durationMs}ms</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Checks call each edge function with a 7-day date range and verify a valid payload comes back.
      </p>
    </div>
  );
}
