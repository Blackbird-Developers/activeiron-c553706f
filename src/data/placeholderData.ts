// Placeholder data for the marketing dashboard

export const ga4Data = {
  overview: {
    totalUsers: 45678,
    newUsers: 12345,
    engagementRate: 62.5,
    bounceRate: 42.3,
    sessions: 58000,
    pageViews: 125000,
    avgSessionDuration: 185,
    engagedSessions: 36250,
  },
  trafficBySource: [
    { name: "Organic Search", sessions: 18500, users: 18500, percentage: 40.5 },
    { name: "Direct", sessions: 12000, users: 12000, percentage: 26.3 },
    { name: "Social Media", sessions: 8900, users: 8900, percentage: 19.5 },
    { name: "Referral", sessions: 4278, users: 4278, percentage: 9.4 },
    { name: "Email", sessions: 2000, users: 2000, percentage: 4.3 },
  ],
  trendsOverTime: [
    { date: "Jan 1", users: 3200, newUsers: 890, sessions: 4100, pageViews: 8500 },
    { date: "Jan 8", users: 3500, newUsers: 950, sessions: 4400, pageViews: 9200 },
    { date: "Jan 15", users: 3800, newUsers: 1020, sessions: 4800, pageViews: 10100 },
    { date: "Jan 22", users: 4100, newUsers: 1150, sessions: 5200, pageViews: 11000 },
    { date: "Jan 29", users: 4400, newUsers: 1200, sessions: 5600, pageViews: 11800 },
    { date: "Feb 5", users: 4200, newUsers: 1100, sessions: 5300, pageViews: 11200 },
    { date: "Feb 12", users: 4600, newUsers: 1280, sessions: 5800, pageViews: 12300 },
  ],
  countryBreakdown: [
    { country: "Ireland", users: 15000, sessions: 19000, pageViews: 41000, engagementRate: 68.5 },
    { country: "United Kingdom", users: 12000, sessions: 15000, pageViews: 33000, engagementRate: 64.2 },
    { country: "United States", users: 10000, sessions: 13000, pageViews: 27000, engagementRate: 59.8 },
    { country: "Germany", users: 5000, sessions: 6500, pageViews: 14000, engagementRate: 55.1 },
  ],
};

export const googleAdsData = {
  overview: {
    cpc: 1.58,
    ctr: 4.12,
    conversions: 1089,
    adSpend: 9234.56,
    costPerConversion: 8.48,
    impressions: 245000,
    clicks: 10098,
    reach: 180000,
  },
  performanceOverTime: [
    { date: "Jan 1", spend: 1250, conversions: 145, ctr: 3.9, impressions: 32000, clicks: 1248 },
    { date: "Jan 8", spend: 1350, conversions: 160, ctr: 4.0, impressions: 35000, clicks: 1400 },
    { date: "Jan 15", spend: 1280, conversions: 152, ctr: 4.1, impressions: 33000, clicks: 1353 },
    { date: "Jan 22", spend: 1450, conversions: 172, ctr: 4.2, impressions: 37000, clicks: 1554 },
    { date: "Jan 29", spend: 1400, conversions: 168, ctr: 4.3, impressions: 35500, clicks: 1527 },
    { date: "Feb 5", spend: 1550, conversions: 185, ctr: 4.1, impressions: 38500, clicks: 1579 },
    { date: "Feb 12", spend: 1480, conversions: 178, ctr: 4.2, impressions: 37000, clicks: 1554 },
  ],
  campaignPerformance: [
    { campaign: "Campaign X", spend: 2800, conversions: 335, roas: 3.9 },
    { campaign: "Campaign Y", spend: 2400, conversions: 290, roas: 3.6 },
    { campaign: "Campaign Z", spend: 2100, conversions: 258, roas: 3.3 },
    { campaign: "Campaign W", spend: 1934, conversions: 206, roas: 3.0 },
  ],
  countryBreakdown: [
    { country: "Ireland", impressions: 80000, clicks: 3300, spend: 3000, conversions: 360, cpc: 0.91, ctr: 4.1 },
    { country: "United Kingdom", impressions: 70000, clicks: 2900, spend: 2700, conversions: 310, cpc: 0.93, ctr: 4.1 },
    { country: "United States", impressions: 60000, clicks: 2500, spend: 2300, conversions: 270, cpc: 0.92, ctr: 4.2 },
    { country: "Germany", impressions: 35000, clicks: 1398, spend: 1234, conversions: 149, cpc: 0.88, ctr: 4.0 },
  ],
};

export const metaAdsData = {
  overview: {
    cpc: 1.24,
    ctr: 3.45,
    conversions: 1234,
    adSpend: 8456.78,
    costPerConversion: 6.85,
    impressions: 320000,
    clicks: 11040,
    reach: 250000,
    thruplays: 0,
    cpr: 6.85,
    engagements: 0,
    cpe: 0,
  },
  performanceOverTime: [
    { date: "Jan 1", spend: 1100, conversions: 165, ctr: 3.2, impressions: 42000, clicks: 1344 },
    { date: "Jan 8", spend: 1200, conversions: 178, ctr: 3.3, impressions: 45000, clicks: 1485 },
    { date: "Jan 15", spend: 1150, conversions: 172, ctr: 3.4, impressions: 44000, clicks: 1496 },
    { date: "Jan 22", spend: 1300, conversions: 185, ctr: 3.5, impressions: 48000, clicks: 1680 },
    { date: "Jan 29", spend: 1250, conversions: 180, ctr: 3.6, impressions: 46000, clicks: 1656 },
    { date: "Feb 5", spend: 1400, conversions: 198, ctr: 3.4, impressions: 50000, clicks: 1700 },
    { date: "Feb 12", spend: 1350, conversions: 192, ctr: 3.5, impressions: 48000, clicks: 1680 },
  ],
  campaignPerformance: [
    { campaign: "Campaign A", spend: 2500, conversions: 380, roas: 4.2 },
    { campaign: "Campaign B", spend: 2200, conversions: 320, roas: 3.8 },
    { campaign: "Campaign C", spend: 1800, conversions: 285, roas: 3.5 },
    { campaign: "Campaign D", spend: 1956, conversions: 249, roas: 3.2 },
  ],
  countryBreakdown: [
    { country: "Ireland", impressions: 100000, clicks: 3450, spend: 2700, conversions: 400, cpc: 0.78, ctr: 3.5 },
    { country: "United Kingdom", impressions: 90000, clicks: 3100, spend: 2400, conversions: 350, cpc: 0.77, ctr: 3.4 },
    { country: "United States", impressions: 80000, clicks: 2800, spend: 2100, conversions: 300, cpc: 0.75, ctr: 3.5 },
    { country: "Germany", impressions: 50000, clicks: 1690, spend: 1256, conversions: 184, cpc: 0.74, ctr: 3.4 },
  ],
};

export const mailerliteData = {
  overview: {
    emailOpens: 8765,
    emailClicks: 2543,
    openRate: 28.5,
    clickThroughRate: 8.3,
    clickToOpenRate: 29.0,
    totalSubscribers: 15420,
    activeSubscribers: 14850,
    totalSent: 30750,
  },
  campaignPerformance: [
    { date: "Jan 1", opens: 1100, clicks: 320, openRate: 27.5, ctr: 8.0 },
    { date: "Jan 8", opens: 1200, clicks: 350, openRate: 28.0, ctr: 8.2 },
    { date: "Jan 15", opens: 1250, clicks: 365, openRate: 28.5, ctr: 8.3 },
    { date: "Jan 22", opens: 1300, clicks: 380, openRate: 29.0, ctr: 8.5 },
    { date: "Jan 29", opens: 1150, clicks: 340, openRate: 27.8, ctr: 8.1 },
    { date: "Feb 5", opens: 1400, clicks: 405, openRate: 30.0, ctr: 8.7 },
    { date: "Feb 12", opens: 1365, clicks: 383, openRate: 29.5, ctr: 8.4 },
  ],
  topCampaigns: [
    { name: "Newsletter #45", opens: 2100, clicks: 630, openRate: 35.0 },
    { name: "Product Launch", opens: 1850, clicks: 555, openRate: 31.0 },
    { name: "Weekly Digest", opens: 1650, clicks: 495, openRate: 27.5 },
    { name: "Special Offer", opens: 1900, clicks: 475, openRate: 31.7 },
  ],
  campaigns: [
    { id: "1", name: "Newsletter #45", subject: "Your Weekly Iron Insights", status: "sent", sentAt: "2024-02-12T10:00:00Z", sent: 6000, opens: 2100, clicks: 630, bounced: 45, unsubscribed: 12, openRate: 35.0, clickRate: 10.5, clickToOpenRate: 30.0 },
    { id: "2", name: "Product Launch", subject: "Introducing Active Iron Plus", status: "sent", sentAt: "2024-02-08T09:00:00Z", sent: 5970, opens: 1850, clicks: 555, bounced: 38, unsubscribed: 8, openRate: 31.0, clickRate: 9.3, clickToOpenRate: 30.0 },
    { id: "3", name: "Weekly Digest", subject: "This Week in Wellness", status: "sent", sentAt: "2024-02-05T10:00:00Z", sent: 6000, opens: 1650, clicks: 495, bounced: 52, unsubscribed: 15, openRate: 27.5, clickRate: 8.3, clickToOpenRate: 30.0 },
    { id: "4", name: "Special Offer", subject: "Exclusive 20% Off This Weekend", status: "sent", sentAt: "2024-02-01T14:00:00Z", sent: 6000, opens: 1900, clicks: 475, bounced: 41, unsubscribed: 22, openRate: 31.7, clickRate: 7.9, clickToOpenRate: 25.0 },
    { id: "5", name: "January Recap", subject: "Your January Health Journey", status: "sent", sentAt: "2024-01-29T10:00:00Z", sent: 5800, opens: 1450, clicks: 380, bounced: 35, unsubscribed: 10, openRate: 25.0, clickRate: 6.6, clickToOpenRate: 26.2 },
  ],
};

// Keep mailchimpData as alias for backward compatibility during transition
export const mailchimpData = mailerliteData;

export const shopifyData = {
  overview: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalProducts: 0,
  },
  ordersOverTime: [] as Array<{ date: string; orders: number; revenue: number }>,
  topProducts: [] as Array<{ name: string; quantity: number; revenue: number }>,
  ordersByStatus: [] as Array<{ status: string; count: number; percentage: number }>,
};

export const funnelData = [
  { stage: "Total Users", value: 45678, percentage: 100, color: "hsl(var(--ga4-primary))" },
  { stage: "Total Conversions", value: 2323, percentage: 5.08, color: "hsl(var(--chart-2))" },
  { stage: "Subscriptions", value: 987, percentage: 2.16, color: "hsl(var(--subbly-primary))" },
  { stage: "Email Clicks", value: 2543, percentage: 5.57, color: "hsl(var(--mailchimp-primary))" },
];
