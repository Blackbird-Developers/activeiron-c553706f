import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Settings2 } from "lucide-react";

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
  impressions?: number;
  clicks?: number;
  reach?: number;
  frequency?: number;
}

interface CampaignsTableProps {
  campaigns: Campaign[];
}

type ColumnKey = 'status' | 'spend' | 'cpc' | 'ctr' | 'conversions' | 'cpa' | 'roas' | 'impressions' | 'clicks' | 'reach' | 'frequency';

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'spend', label: 'Spend', defaultVisible: true },
  { key: 'impressions', label: 'Impressions', defaultVisible: false },
  { key: 'reach', label: 'Reach', defaultVisible: false },
  { key: 'clicks', label: 'Clicks', defaultVisible: false },
  { key: 'cpc', label: 'CPC', defaultVisible: true },
  { key: 'ctr', label: 'CTR', defaultVisible: true },
  { key: 'conversions', label: 'Conversions', defaultVisible: true },
  { key: 'cpa', label: 'CPA', defaultVisible: true },
  { key: 'roas', label: 'ROAS', defaultVisible: true },
  { key: 'frequency', label: 'Frequency', defaultVisible: false },
];

const ITEMS_PER_PAGE = 10;

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const activeCampaigns = campaigns.filter((c) => c.spend > 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );

  if (activeCampaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No campaigns with spend found for the selected period.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(activeCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCampaigns = activeCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const renderCellValue = (campaign: Campaign, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'status':
        return (
          <Badge
            variant={campaign.status === "ACTIVE" ? "default" : "secondary"}
            className={campaign.status === "ACTIVE" ? "bg-green-500/20 text-green-600 hover:bg-green-500/30" : ""}
          >
            {campaign.status}
          </Badge>
        );
      case 'spend':
        return `£${campaign.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'cpc':
        return `£${campaign.cpc.toFixed(2)}`;
      case 'ctr':
        return `${campaign.ctr.toFixed(2)}%`;
      case 'conversions':
        return campaign.conversions;
      case 'cpa':
        return `£${campaign.costPerConversion.toFixed(2)}`;
      case 'roas':
        return campaign.roas ? `${campaign.roas.toFixed(2)}x` : '-';
      case 'impressions':
        return campaign.impressions?.toLocaleString('en-GB') ?? '-';
      case 'clicks':
        return campaign.clicks?.toLocaleString('en-GB') ?? '-';
      case 'reach':
        return campaign.reach?.toLocaleString('en-GB') ?? '-';
      case 'frequency':
        return campaign.frequency?.toFixed(2) ?? '-';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 rounded-full bg-meta" />
          <h2 className="text-2xl font-bold text-meta-foreground">Active Campaigns</h2>
          <span className="text-sm text-muted-foreground">({activeCampaigns.length} campaigns)</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_COLUMNS.map((column) => (
              <div
                key={column.key}
                className="flex items-center space-x-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm"
                onClick={() => toggleColumn(column.key)}
              >
                <Checkbox
                  id={column.key}
                  checked={visibleColumns.has(column.key)}
                  onCheckedChange={() => toggleColumn(column.key)}
                />
                <label
                  htmlFor={column.key}
                  className="text-sm cursor-pointer flex-1"
                >
                  {column.label}
                </label>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px] sticky left-0 bg-card z-10">Campaign</TableHead>
              {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map((column) => (
                <TableHead key={column.key} className={column.key !== 'status' ? 'text-right' : ''}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCampaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium sticky left-0 bg-card z-10">{campaign.name}</TableCell>
                {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map((column) => (
                  <TableCell key={column.key} className={column.key !== 'status' ? 'text-right' : ''}>
                    {renderCellValue(campaign, column.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, activeCampaigns.length)} of {activeCampaigns.length} campaigns
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
