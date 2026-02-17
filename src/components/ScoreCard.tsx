import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompareData {
  percentChange: number;
  label: string; // "MoM" or "YoY"
}

interface ScoreCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  colorScheme?: "ga4" | "google-ads" | "meta" | "subbly" | "mailchimp" | "default";
  compare?: CompareData;
  compareLoading?: boolean;
  invertChange?: boolean;
}

export function ScoreCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  colorScheme = "default",
  compare,
  compareLoading = false,
  invertChange = false,
}: ScoreCardProps) {
  const colorClasses = {
    ga4: "bg-ga4-light text-ga4-foreground border-ga4/20",
    "google-ads": "bg-google-ads-light text-google-ads-foreground border-google-ads/20",
    meta: "bg-meta-light text-meta-foreground border-meta/20",
    subbly: "bg-subbly-light text-subbly-foreground border-subbly/20",
    mailchimp: "bg-mailchimp-light text-mailchimp-foreground border-mailchimp/20",
    default: "bg-card text-card-foreground",
  };

  const changeColorClasses = {
    positive: "text-meta-foreground",
    negative: "text-destructive",
    neutral: "text-muted-foreground",
  };

  const getCompareType = (pct: number): "positive" | "negative" | "neutral" => {
    if (pct === 0) return "neutral";
    const isUp = pct > 0;
    if (invertChange) return isUp ? "negative" : "positive";
    return isUp ? "positive" : "negative";
  };

  return (
    <Card className={cn("border shadow-sm", colorScheme !== "default" && colorClasses[colorScheme])}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 lg:space-y-2 flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium opacity-80 truncate">{title}</p>
            <p className="text-xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
            {compareLoading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-0.5">
                <span className="h-3 w-12 rounded-full bg-muted-foreground/20 animate-pulse" />
              </span>
            ) : compare ? (
              <CompareBadge compare={compare} type={getCompareType(compare.percentChange)} />
            ) : change ? (
              <p className={cn("text-[10px] lg:text-xs font-medium truncate", changeColorClasses[changeType])}>
                {change}
              </p>
            ) : null}
          </div>
          {Icon && (
            <div className="rounded-lg bg-background/50 p-1.5 lg:p-2.5 shrink-0">
              <Icon className="h-4 w-4 lg:h-5 lg:w-5 opacity-70" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CompareBadge({ compare, type }: { compare: CompareData; type: "positive" | "negative" | "neutral" }) {
  const pct = compare.percentChange;
  const formatted = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;

  const colors = {
    positive: "bg-meta-light text-meta-foreground",
    negative: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
  };

  const TrendIcon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] lg:text-xs font-semibold", colors[type])}>
      <TrendIcon className="h-3 w-3" />
      {formatted} {compare.label}
    </span>
  );
}
