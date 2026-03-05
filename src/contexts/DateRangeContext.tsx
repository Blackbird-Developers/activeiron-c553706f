import { createContext, useContext, useState, ReactNode } from "react";
import { subDays } from "date-fns";
import { CountryCode } from "@/components/CountryFilter";
import { CompareMode } from "@/components/DateFilter";

interface DateRangeContextType {
  startDate: Date | undefined;
  endDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  selectedCountry: CountryCode;
  setSelectedCountry: (country: CountryCode) => void;
  compareMode: CompareMode;
  setCompareMode: (mode: CompareMode) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [compareMode, setCompareMode] = useState<CompareMode>("off");

  return (
    <DateRangeContext.Provider value={{
      startDate, endDate, setStartDate, setEndDate,
      selectedCountry, setSelectedCountry,
      compareMode, setCompareMode,
    }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) throw new Error("useDateRange must be used within DateRangeProvider");
  return context;
}
