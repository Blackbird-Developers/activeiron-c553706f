import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { metaAdsData as placeholderData } from "@/data/placeholderData";

interface MetaAdsSectionProps {
  data?: typeof placeholderData;
}

export function MetaAdsSection({ data = placeholderData }: MetaAdsSectionProps) {
  const metrics = [
    { label: "CPC", value: `$${data.overview.cpc}` },
    { label: "CTR", value: `${data.overview.ctr}%` },
    { label: "Conversions", value: data.overview.conversions.toLocaleString() },
    { label: "Ad Spend", value: `$${data.overview.adSpend.toLocaleString()}` },
    { label: "Cost per Conversion", value: `$${data.overview.costPerConversion}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-meta" />
        <h2 className="text-2xl font-bold text-meta-foreground">Meta Ads Performance</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-meta-foreground">Account Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow key={metric.label}>
                  <TableCell className="font-medium">{metric.label}</TableCell>
                  <TableCell>{metric.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
