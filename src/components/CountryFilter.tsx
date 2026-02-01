import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CountryCode = "all" | "IE" | "UK";

interface CountryFilterProps {
  value: CountryCode;
  onChange: (value: CountryCode) => void;
}

const countryOptions: { value: CountryCode; label: string }[] = [
  { value: "all", label: "All Markets" },
  { value: "IE", label: "Ireland" },
  { value: "UK", label: "United Kingdom" },
];

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Market:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[140px] sm:w-[160px] text-xs sm:text-sm">
          <Globe className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
        {countryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Helper to detect country from campaign name
export function parseCountryFromCampaignName(campaignName: string): CountryCode | null {
  const nameLower = campaignName.toLowerCase();
  
  // Ireland patterns
  if (
    nameLower.includes('ireland') ||
    nameLower.includes('ire ') ||
    nameLower.includes('ire-') ||
    nameLower.includes(' ire') ||
    nameLower.includes('-ire') ||
    nameLower.startsWith('ire ') ||
    nameLower.startsWith('ire-') ||
    nameLower.includes(' ie ') ||
    nameLower.includes('-ie-') ||
    nameLower.endsWith(' ie') ||
    nameLower.endsWith('-ie')
  ) {
    return 'IE';
  }
  
  // UK patterns
  if (
    nameLower.includes('united kingdom') ||
    nameLower.includes(' uk ') ||
    nameLower.includes('-uk-') ||
    nameLower.includes(' uk-') ||
    nameLower.includes('-uk ') ||
    nameLower.startsWith('uk ') ||
    nameLower.startsWith('uk-') ||
    nameLower.endsWith(' uk') ||
    nameLower.endsWith('-uk') ||
    nameLower.includes('britain') ||
    nameLower.includes('british')
  ) {
    return 'UK';
  }
  
  return null;
}

// Helper to filter campaigns by country
export function filterCampaignsByCountry<T extends { campaign?: string; name?: string }>(
  campaigns: T[],
  country: CountryCode
): T[] {
  if (country === 'all') return campaigns;
  
  return campaigns.filter((campaign) => {
    const name = campaign.campaign || campaign.name || '';
    const parsedCountry = parseCountryFromCampaignName(name);
    return parsedCountry === country;
  });
}

// Helper to aggregate metrics for filtered campaigns
export function aggregateCampaignMetrics(campaigns: Array<{
  spend?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  conversionsValue?: number;
}>) {
  return campaigns.reduce(
    (acc, campaign) => ({
      spend: acc.spend + (campaign.spend || 0),
      clicks: acc.clicks + (campaign.clicks || 0),
      impressions: acc.impressions + (campaign.impressions || 0),
      conversions: acc.conversions + (campaign.conversions || 0),
      conversionsValue: acc.conversionsValue + (campaign.conversionsValue || 0),
    }),
    { spend: 0, clicks: 0, impressions: 0, conversions: 0, conversionsValue: 0 }
  );
}