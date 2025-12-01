import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function GoogleAdsPerformance() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-google-ads-foreground">Google Ads Performance</h1>
        <p className="text-muted-foreground">Comprehensive overview of all Google Ads campaigns</p>
      </div>

      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-muted-foreground">
            <Construction className="h-6 w-6" />
            Work in Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Google Ads integration is currently under development. This page will display detailed campaign performance metrics once the integration is complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
