import { useRef, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreCard } from "@/components/ScoreCard";
import { Users, UserPlus, Activity, TrendingDown, Clock, MousePointerClick, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ga4Data as placeholderData } from "@/data/placeholderData";
import { calcCompare } from "@/lib/compareUtils";

interface GA4SectionProps {
  data?: typeof placeholderData;
  compareData?: any;
  compareLabel?: string;
}

export function GA4Section({ data = placeholderData, compareData, compareLabel }: GA4SectionProps) {
  const COLORS = ["hsl(var(--ga4-primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 220;
    el.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-8 lg:w-12 rounded-full bg-ga4" />
        <h2 className="text-xl lg:text-2xl font-bold text-ga4-foreground">Traffic Analytics (GA4)</h2>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1.5 shadow-md hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-1.5 shadow-md hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Total Users" value={data.overview.totalUsers.toLocaleString()} icon={Users} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.totalUsers, compareData.overview?.totalUsers, compareLabel) : undefined} />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="New Users" value={data.overview.newUsers.toLocaleString()} icon={UserPlus} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.newUsers, compareData.overview?.newUsers, compareLabel) : undefined} />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Sessions" value={data.overview.sessions.toLocaleString()} icon={BarChart3} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.sessions, compareData.overview?.sessions, compareLabel) : undefined} />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Engaged Sessions" value={(data.overview.engagedSessions || 0).toLocaleString()} icon={MousePointerClick} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.engagedSessions || 0, compareData.overview?.engagedSessions, compareLabel) : undefined} />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Engagement Rate" value={`${data.overview.engagementRate}%`} icon={Activity} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.engagementRate, compareData.overview?.engagementRate, compareLabel) : undefined} />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Bounce Rate" value={`${data.overview.bounceRate}%`} icon={TrendingDown} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.bounceRate, compareData.overview?.bounceRate, compareLabel) : undefined} invertChange />
          </div>
          <div className="min-w-[200px] flex-shrink-0 flex-1">
            <ScoreCard title="Avg Engagement Time" value={formatDuration(data.overview.avgSessionDuration)} icon={Clock} colorScheme="ga4" compare={compareData && compareLabel ? calcCompare(data.overview.avgSessionDuration, compareData.overview?.avgSessionDuration, compareLabel) : undefined} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-ga4-foreground">User Trends</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.trendsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} width={45} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px"
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--ga4-primary))" strokeWidth={2} name="Total Users" dot={false} />
                <Line type="monotone" dataKey="newUsers" stroke="hsl(var(--chart-2))" strokeWidth={2} name="New Users" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 lg:pb-6">
            <CardTitle className="text-base lg:text-lg text-ga4-foreground">Traffic by Source</CardTitle>
          </CardHeader>
          <CardContent className="px-2 lg:px-6">
            <div className="flex items-center gap-6">
              <div className="w-[140px] h-[140px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.trafficBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="users"
                      stroke="none"
                    >
                      {data.trafficBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        fontSize: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                {data.trafficBySource.map((entry, index) => {
                  const total = data.trafficBySource.reduce((sum, e) => sum + e.users, 0);
                  const pct = total > 0 ? ((entry.users / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm text-foreground truncate">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-foreground">{entry.users.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground w-12 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
