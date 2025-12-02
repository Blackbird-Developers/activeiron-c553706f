import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Campaign {
  id: string;
  name: string;
  status: string;
  spend: number;
  cpc: number;
  ctr: number;
  conversions: number;
  costPerConversion: number;
  roas?: number;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
}

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const activeCampaigns = campaigns.filter((c) => c.spend > 0);

  if (activeCampaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No campaigns with spend found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 rounded-full bg-meta" />
        <h2 className="text-2xl font-bold text-meta-foreground">Active Campaigns</h2>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">CTR</TableHead>
              <TableHead className="text-right">Conversions</TableHead>
              <TableHead className="text-right">CPA</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
                    className={campaign.status === "ACTIVE" ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : ""}
                  >
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">£{campaign.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-right">£{campaign.cpc.toFixed(2)}</TableCell>
                <TableCell className="text-right">{campaign.ctr.toFixed(2)}%</TableCell>
                <TableCell className="text-right">{campaign.conversions}</TableCell>
                <TableCell className="text-right">£{campaign.costPerConversion.toFixed(2)}</TableCell>
                <TableCell className="text-right">{campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
