import { useState } from "react";
import { DateFilter } from "@/components/DateFilter";
import { GA4Section } from "@/components/sections/GA4Section";
import { GoogleAdsSection } from "@/components/sections/GoogleAdsSection";
import { MetaAdsSection } from "@/components/sections/MetaAdsSection";
import { SubblySection } from "@/components/sections/SubblySection";
import { MailchimpSection } from "@/components/sections/MailchimpSection";
import { FunnelSection } from "@/components/sections/FunnelSection";
import { BarChart3 } from "lucide-react";
import { subDays } from "date-fns";

const Index = () => {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
          <p className="text-muted-foreground">Multi-source analytics across all channels</p>
        </div>
        <DateFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      <div className="space-y-12">
        <GA4Section />
        <GoogleAdsSection />
        <MetaAdsSection />
        <SubblySection />
        <MailchimpSection />
        <FunnelSection />
      </div>
    </div>
  );
};

export default Index;
