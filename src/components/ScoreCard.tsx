import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
  colorScheme?: "ga4" | "google-ads" | "meta" | "subbly" | "mailchimp" | "default";
}

export function ScoreCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  colorScheme = "default",
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

  return (
    <Card className={cn("border shadow-sm", colorScheme !== "default" && colorClasses[colorScheme])}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 lg:space-y-2 flex-1 min-w-0">
            <p className="text-xs lg:text-sm font-medium opacity-80 truncate">{title}</p>
            <p className="text-xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
            {change && (
              <p className={cn("text-[10px] lg:text-xs font-medium truncate", changeColorClasses[changeType])}>
                {change}
              </p>
            )}
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
