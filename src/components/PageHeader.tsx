import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { DateFilter } from "@/components/DateFilter";
import { CountryFilter, CountryCode } from "@/components/CountryFilter";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  titleClassName?: string;
  lastRefresh?: Date | null;
  isLoading?: boolean;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  showDateFilter?: boolean;
  selectedCountry?: CountryCode;
  onCountryChange?: (country: CountryCode) => void;
  showCountryFilter?: boolean;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  titleClassName,
  lastRefresh,
  isLoading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showDateFilter = true,
  selectedCountry,
  onCountryChange,
  showCountryFilter = true,
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Row 1: Title and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold truncate ${titleClassName || ''}`}>
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {description}
          </p>
        </div>
        
        {actions && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Row 2: Date Filter, Country Filter, and Last Updated */}
      {(showDateFilter || showCountryFilter || lastRefresh) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4">
          <div className="flex flex-wrap items-center gap-4">
            {showDateFilter && onStartDateChange && onEndDateChange && (
              <DateFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
              />
            )}
            
            {showCountryFilter && selectedCountry && onCountryChange && (
              <CountryFilter
                value={selectedCountry}
                onChange={onCountryChange}
              />
            )}
          </div>
          
          {lastRefresh && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isLoading ? 'Updating...' : `Updated ${formatDistanceToNow(lastRefresh, { addSuffix: true })}`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
