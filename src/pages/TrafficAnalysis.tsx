import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreCard } from "@/components/ScoreCard";
import { calcCompare } from "@/lib/compareUtils";
import { Globe, Users, ArrowUpDown, BarChart3, Clock } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Treemap } from "recharts";
import { subDays, subYears, differenceInDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CountryCode } from "@/components/CountryFilter";
import { CompareMode } from "@/components/DateFilter";

interface SourceMediumEntry {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  newUsers: number;
  engagementRate: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
}

const COLORS = [
  "hsl(var(--ga4-primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(210 60% 55%)",
  "hsl(280 60% 55%)",
  "hsl(30 80% 55%)",
  "hsl(160 60% 45%)",
  "hsl(350 70% 55%)",
];

export default function TrafficAnalysis() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [data, setData] = useState<SourceMediumEntry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("all");
  const [sortField, setSortField] = useState<keyof SourceMediumEntry>("sessions");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [compareMode, setCompareMode] = useState<CompareMode>("off");
  const [compareData, setCompareData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!startDate || !endDate) return;
    setIsLoading(true);
    try {
      const res = await supabase.functions.invoke("ga4-data", {
        body: { startDate: format(startDate, "yyyy-MM-dd"), endDate: format(endDate, "yyyy-MM-dd"), country: selectedCountry },
      });
      const sourceMedium = res.data?.data?.sourceMediumBreakdown || [];
      setData(sourceMedium);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to fetch traffic data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedCountry, toast]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      fetchData();
      return;
    }
    fetchData();
  }, [fetchData]);

  // Fetch comparison period data
  useEffect(() => {
    if (compareMode === 'off' || !startDate || !endDate) {
      setCompareData(null);
      return;
    }
    const daySpan = differenceInDays(endDate, startDate);
    let compStart: Date, compEnd: Date;
    if (compareMode === 'mom') {
      compEnd = subDays(startDate, 1);
      compStart = subDays(compEnd, daySpan);
    } else {
      compStart = subYears(startDate, 1);
      compEnd = subYears(endDate, 1);
    }
    supabase.functions.invoke('ga4-data', {
      body: { startDate: format(compStart, 'yyyy-MM-dd'), endDate: format(compEnd, 'yyyy-MM-dd'), country: selectedCountry }
    }).then(res => {
      const smb = res.data?.data?.sourceMediumBreakdown || [];
      // Aggregate into overview-like totals for scorecards
      const totals = smb.reduce((acc: any, d: any) => ({
        sessions: acc.sessions + (d.sessions || 0),
        users: acc.users + (d.users || 0),
        newUsers: acc.newUsers + (d.newUsers || 0),
      }), { sessions: 0, users: 0, newUsers: 0 });
      setCompareData(totals);
    }).catch(() => setCompareData(null));
  }, [compareMode, startDate, endDate, selectedCountry]);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      if (typeof av === "number" && typeof bv === "number") return sortDir === "desc" ? bv - av : av - bv;
      return sortDir === "desc" ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
    });
  }, [data, sortField, sortDir]);

  const toggleSort = (field: keyof SourceMediumEntry) => {
    if (sortField === field) setSortDir(d => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  // Aggregations for charts
  const byMedium = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.medium, (map.get(d.medium) || 0) + d.sessions));
    return Array.from(map, ([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions);
  }, [data]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => map.set(d.source, (map.get(d.source) || 0) + d.sessions));
    return Array.from(map, ([name, sessions]) => ({ name, sessions })).sort((a, b) => b.sessions - a.sessions).slice(0, 10);
  }, [data]);

  const totalSessions = useMemo(() => data.reduce((s, d) => s + d.sessions, 0), [data]);
  const totalUsers = useMemo(() => data.reduce((s, d) => s + d.users, 0), [data]);
  const totalNewUsers = useMemo(() => data.reduce((s, d) => s + d.newUsers, 0), [data]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  return (
    <>
      <LoadingOverlay isLoading={isLoading} />
      <div className="space-y-6 lg:space-y-8">
        <PageHeader
          title="Traffic Analysis"
          description="Source & medium breakdown from GA4"
          lastRefresh={lastRefresh}
          isLoading={isLoading}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          compareMode={compareMode}
          onCompareModeChange={setCompareMode}
        />

        {/* Overview scorecards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <ScoreCard title="Total Sessions" value={totalSessions.toLocaleString()} icon={BarChart3} colorScheme="ga4" compare={compareData && compareMode !== 'off' ? calcCompare(totalSessions, compareData.sessions, compareMode === 'mom' ? 'MoM' : 'YoY') : undefined} />
          <ScoreCard title="Total Users" value={totalUsers.toLocaleString()} icon={Users} colorScheme="ga4" compare={compareData && compareMode !== 'off' ? calcCompare(totalUsers, compareData.users, compareMode === 'mom' ? 'MoM' : 'YoY') : undefined} />
          <ScoreCard title="New Users" value={totalNewUsers.toLocaleString()} icon={Users} colorScheme="ga4" compare={compareData && compareMode !== 'off' ? calcCompare(totalNewUsers, compareData.newUsers, compareMode === 'mom' ? 'MoM' : 'YoY') : undefined} />
          <ScoreCard title="Sources Tracked" value={bySource.length.toString()} icon={Globe} colorScheme="ga4" />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Sessions by Medium - Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg text-ga4-foreground">Sessions by Medium</CardTitle>
            </CardHeader>
            <CardContent className="px-2 lg:px-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byMedium}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="sessions"
                    paddingAngle={2}
                  >
                    {byMedium.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  {/* Center label */}
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" style={{ fontSize: "11px" }}>
                    Total Sessions
                  </text>
                  <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" style={{ fontSize: "20px", fontWeight: 700 }}>
                    {totalSessions.toLocaleString()}
                  </text>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                  />
                  <Legend
                    formatter={(value: string) => {
                      const item = byMedium.find(d => d.name === value);
                      const pct = item && totalSessions ? ((item.sessions / totalSessions) * 100).toFixed(1) : "0";
                      return `${value} (${pct}%)`;
                    }}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Sources - Bar */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base lg:text-lg text-ga4-foreground">Top Sources by Sessions</CardTitle>
            </CardHeader>
            <CardContent className="px-2 lg:px-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bySource} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={75} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Bar dataKey="sessions" fill="hsl(var(--ga4-primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Full source/medium table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base lg:text-lg text-ga4-foreground">Source / Medium Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="px-0 lg:px-2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {[
                      { key: "source", label: "Source" },
                      { key: "medium", label: "Medium" },
                      { key: "sessions", label: "Sessions" },
                      { key: "users", label: "Users" },
                      { key: "newUsers", label: "New Users" },
                      { key: "engagementRate", label: "Eng. Rate" },
                      { key: "bounceRate", label: "Bounce Rate" },
                      { key: "avgSessionDuration", label: "Avg Duration" },
                      { key: "pageViews", label: "Page Views" },
                    ].map(col => (
                      <TableHead
                        key={col.key}
                        className="cursor-pointer select-none whitespace-nowrap hover:text-foreground"
                        onClick={() => toggleSort(col.key as keyof SourceMediumEntry)}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No data available for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    sorted.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.source}</TableCell>
                        <TableCell>{row.medium}</TableCell>
                        <TableCell className="text-right">{row.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.newUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.engagementRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{row.bounceRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{formatDuration(row.avgSessionDuration)}</TableCell>
                        <TableCell className="text-right">{row.pageViews.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
