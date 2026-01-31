import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange, DateRangePreset, getDateRangeFromPreset } from "@/hooks/useReportsData";

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onExportCSV?: () => void;
  onPrint?: () => void;
}

const presetLabels: Record<DateRangePreset, string> = {
  today: "Today",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_quarter: "This Quarter",
  this_year: "This Year",
  all_time: "All Time",
  custom: "Custom Range",
};

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  onExportCSV,
  onPrint,
}: DateRangeFilterProps) {
  const [customStart, setCustomStart] = useState<Date | undefined>(dateRange.start);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(dateRange.end);

  const handlePresetChange = (preset: DateRangePreset) => {
    if (preset === "custom") {
      onDateRangeChange({
        start: customStart || dateRange.start,
        end: customEnd || dateRange.end,
        preset: "custom",
      });
    } else {
      onDateRangeChange(getDateRangeFromPreset(preset));
    }
  };

  const handleCustomDateChange = (start?: Date, end?: Date) => {
    if (start) setCustomStart(start);
    if (end) setCustomEnd(end);
    
    onDateRangeChange({
      start: start || customStart || dateRange.start,
      end: end || customEnd || dateRange.end,
      preset: "custom",
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <Select
          value={dateRange.preset}
          onValueChange={(value) => handlePresetChange(value as DateRangePreset)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(presetLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {dateRange.preset === "custom" && (
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customStart ? format(customStart, "MMM d, yyyy") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customStart}
                  onSelect={(date) => handleCustomDateChange(date, undefined)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal",
                    !customEnd && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customEnd ? format(customEnd, "MMM d, yyyy") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customEnd}
                  onSelect={(date) => handleCustomDateChange(undefined, date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <span className="text-sm text-muted-foreground hidden sm:inline">
          {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
        </span>
      </div>

      <div className="flex gap-2">
        {onExportCSV && (
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        )}
      </div>
    </div>
  );
}
