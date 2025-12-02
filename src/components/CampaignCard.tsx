import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, MousePointerClick, Target, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    status: string;
    spend: number;
    cpc: number;
    ctr: number;
    conversions: number;
    costPerConversion: number;
    roas?: number;
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('meta-campaign-insights', {
        body: { campaign }
      });

      if (error) throw error;

      setInsights(data.insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      toast({
        title: "Error",
        description: "Failed to generate campaign insights.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{campaign.name}</CardTitle>
          <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Spend</span>
            </div>
            <p className="text-lg font-bold">£{campaign.spend.toFixed(2)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              <span>CPC</span>
            </div>
            <p className="text-lg font-bold">£{campaign.cpc.toFixed(2)}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>CTR</span>
            </div>
            <p className="text-lg font-bold">{campaign.ctr.toFixed(2)}%</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Conversions</span>
            </div>
            <p className="text-lg font-bold">{campaign.conversions}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>CPA</span>
            </div>
            <p className="text-lg font-bold">£{campaign.costPerConversion.toFixed(2)}</p>
          </div>
          
          {campaign.roas !== undefined && campaign.roas > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>ROAS</span>
              </div>
              <p className="text-lg font-bold">{campaign.roas.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          {!insights ? (
            <Button
              onClick={generateInsights}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Insights
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                <span>AI Insights</span>
              </div>
              <div className="text-sm text-foreground whitespace-pre-line bg-muted/50 p-3 rounded-md">
                {insights}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
