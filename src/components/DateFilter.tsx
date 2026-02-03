import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

type PresetKey = "7d" | "30d" | "thisMonth" | "lastMonth";

const presets: { key: PresetKey; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
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
  const handlePresetClick = (key: PresetKey) => {
    const { start, end } = getPresetDates(key);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.key}
            variant="ghost"
            size="sm"
            onClick={() => handlePresetClick(preset.key)}
            className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <span className="text-muted-foreground hidden sm:inline">|</span>
      
      <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Custom:</span>
      
      <div className="flex items-center gap-2">
        <Popover>
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
              {startDate ? format(startDate, "dd MMM") : "Start"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              defaultMonth={startDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground">–</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "justify-start text-left font-normal h-8 text-xs sm:text-sm px-2 sm:px-3",
                !endDate && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
              {endDate ? format(endDate, "dd MMM") : "End"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              defaultMonth={endDate}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
