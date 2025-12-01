import { useState } from "react";
import { DateFilter } from "@/components/DateFilter";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { subDays } from "date-fns";

export default function MetaPerformance() {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-meta-foreground">Meta Ads Performance</h1>
          <p className="text-muted-foreground">Comprehensive overview of all Meta advertising campaigns</p>
        </div>
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <MetaAdsSection />
    </div>
  );
}
