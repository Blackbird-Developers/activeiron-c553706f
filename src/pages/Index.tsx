import { useState } from "react";
import { DateFilter } from "@/components/DateFilter";
import { GA4Section } from "@/components/sections/GA4Section";
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <BarChart3 className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Marketing Dashboard</h1>
              <p className="text-xs text-muted-foreground">Multi-source Analytics</p>
            </div>
          </div>
          
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8 md:px-6">
        <div className="space-y-12">
          <GA4Section />
          <MetaAdsSection />
          <SubblySection />
          <MailchimpSection />
          <FunnelSection />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground md:px-6">
          <p>Marketing Dashboard • Data updates every 24 hours</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
