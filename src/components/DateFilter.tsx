import { Calendar } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { DateRange } from "react-day-picker";

type PresetKey = "7d" | "30d" | "thisMonth" | "lastMonth";

const presets: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
];

const getPresetDates = (key: PresetKey): { start: Date; end: Date } => {
  const today = new Date();
  switch (key) {
    case "7d":
      return { start: subDays(today, 6), end: today };
    case "30d":
      return { start: subDays(today, 29), end: today };
    case "thisMonth":
      return { start: startOfMonth(today), end: today };
    case "lastMonth":
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
  }
};

interface DateFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateFilterProps) {
  const [open, setOpen] = useState(false);

  const handlePresetClick = (key: PresetKey) => {
    const { start, end } = getPresetDates(key);
    onStartDateChange(start);
    onEndDateChange(end);
    setOpen(false);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    onStartDateChange(range?.from);
    onEndDateChange(range?.to);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd MMM")} – ${format(endDate, "dd MMM yyyy")}`;
    }
    if (startDate) {
      return `${format(startDate, "dd MMM yyyy")} – ...`;
    }
    return "Select date range";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "justify-start text-left font-normal h-8 text-xs sm:text-sm px-2 sm:px-3",
            !startDate && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets sidebar */}
          <div className="flex flex-col gap-1 p-3 border-r border-border">
            <span className="text-xs font-medium text-muted-foreground mb-1">Quick Select</span>
            {presets.map((preset) => (
              <Button
                key={preset.key}
                variant="ghost"
                size="sm"
                onClick={() => handlePresetClick(preset.key)}
                className="justify-start h-8 px-2 text-xs font-normal hover:bg-accent"
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Calendar */}
          <CalendarComponent
            mode="range"
            selected={{ from: startDate, to: endDate }}
            onSelect={handleRangeSelect}
            defaultMonth={startDate}
            numberOfMonths={2}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
