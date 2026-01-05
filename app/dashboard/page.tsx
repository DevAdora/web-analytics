"use client";

import { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Activity,
  Users,
  Eye,
  TrendingUp,
  Globe,
  BarChart3,
  PlusCircle,
  RefreshCw,
  Clock,
  MousePointer,
  AlertCircle,
  LogOut,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Bar,
  BarChart,
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30000,
    },
  },
});

// Types
interface User {
  id: string;
  email: string;
}

interface Site {
  id: string;
  site_id: string;
  name: string;
  domain?: string;
  is_active?: boolean;
}

interface TimeSeriesData {
  date: string;
  views: number;
}

interface TopPage {
  path: string;
  count: number;
}

interface TopBrowser {
  browser: string;
  count: number;
}

interface SiteAnalytics {
  siteId: string;
  name?: string;
  domain?: string;
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  topPages?: TopPage[];
  timeSeriesData?: TimeSeriesData[];
}

interface SingleSiteData {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: TopPage[];
  timeSeriesData: TimeSeriesData[];
  topBrowsers: TopBrowser[];
}

interface AllSitesData {
  type: "all";
  sites: SiteAnalytics[];
  totalSites: number;
}

type AnalyticsData = SingleSiteData | AllSitesData;

async function fetchUser(): Promise<User | null> {
  const res = await fetch("/api/auth/user");
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.authenticated) return null;
  return { id: data.id, email: data.email };
}

async function fetchSites(): Promise<Site[]> {
  const response = await fetch("/api/sites");
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch sites");
  }
  const data = await response.json();
  return data.sites || [];
}

async function fetchAnalytics(
  siteId: string,
  timeRange: string = "7d"
): Promise<AnalyticsData> {
  const response = await fetch(
    `/api/analytics?siteId=${siteId}&range=${timeRange}`
  );
  if (!response.ok) {
    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
}

async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  } catch (error) {
    console.error("Logout failed:", error);
  }
}

function AnalyticsDashboard() {
  const [selectedSite, setSelectedSite] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 10 * 60 * 1000,
  });

  const {
    data: sites = [],
    isLoading: sitesLoading,
    error: sitesError,
  } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError: analyticsError,
    error,
    refetch,
    dataUpdatedAt,
    isFetching,
  } = useQuery({
    queryKey: ["analytics", selectedSite, timeRange],
    queryFn: () => fetchAnalytics(selectedSite, timeRange),
    refetchInterval: autoRefresh ? 30000 : false,
    enabled: !!user && (sites.length > 0 || selectedSite === "all"),
  });

  const lastUpdatedDate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  useEffect(() => {
    if (analyticsData) {
      setLastUpdated(new Date());
    }
  }, [analyticsData]);

  const isLoading = userLoading || sitesLoading || analyticsLoading;

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/auth/login";
    }
  }, [user, userLoading]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-900 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Analytics Dashboard
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  <span>
                    Last Synced:{" "}
                    {lastUpdatedDate ? formatTime(lastUpdatedDate) : "—"}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      autoRefresh
                        ? "bg-green-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  />
                </div>
                {user && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg bg-white text-slate-700 border border-slate-300 hover:border-slate-400 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last Week</option>
                <option value="30d">Last Month</option>
              </select>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-2 border ${
                  autoRefresh
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {autoRefresh ? "Live" : "Paused"}
                </span>
              </button>

              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="px-3 py-2 text-sm rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all flex items-center gap-2"
                onClick={() => (window.location.href = "/dashboard/add")}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Site</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all flex items-center gap-2"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Sites Error */}
        {sitesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">
                Failed to load sites
              </h3>
              <p className="text-sm text-red-700">
                {sitesError instanceof Error
                  ? sitesError.message
                  : "Unknown error"}
              </p>
            </div>
          </div>
        )}

        {/* Site Selector */}
        {!sitesError && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Site
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedSite("all")}
                className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap flex items-center gap-2 transition-all font-medium ${
                  selectedSite === "all"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                All Sites
              </button>

              {sites.map((site: Site) => (
                <button
                  key={site.id}
                  onClick={() => setSelectedSite(site.site_id)}
                  className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap flex items-center gap-2 transition-all font-medium ${
                    selectedSite === site.site_id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  {site.name}
                </button>
              ))}
            </div>

            {sites.length === 0 && !sitesLoading && (
              <div className="text-center py-8 bg-slate-50 rounded-lg mt-4">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium mb-2">No sites yet</p>
                <p className="text-sm text-slate-500 mb-4">
                  Add your first site to start tracking analytics
                </p>
                <button
                  onClick={() => (window.location.href = "/dashboard/add")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Site
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && sites.length > 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-900 mx-auto mb-4" />
              <p className="text-slate-600">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {analyticsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">
                Failed to load analytics
              </h3>
              <p className="text-sm text-red-700">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-all text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Analytics Content */}
        {!isLoading && !analyticsError && analyticsData && sites.length > 0 && (
          <>
            {"type" in analyticsData && analyticsData.type === "all" ? (
              <AllSitesView data={analyticsData} sites={sites} />
            ) : (
              <SingleSiteView
                data={analyticsData as SingleSiteData}
                timeRange={timeRange}
              />
            )}
          </>
        )}

        {/* No Data State */}
        {!isLoading &&
          !analyticsError &&
          analyticsData &&
          "type" in analyticsData &&
          analyticsData.sites.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                No analytics data yet
              </h3>
              <p className="text-slate-500 mb-4">
                Install the tracking script on your website to start collecting
                data
              </p>
              <button
                onClick={() => (window.location.href = "/dashboard/debug")}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                View Debug Info
              </button>
            </div>
          )}
      </div>

      <ReactQueryDevtools initialIsOpen={false} />
    </div>
  );
}
function AllSitesView({ data, sites }: { data: AllSitesData; sites: Site[] }) {
  const getSiteName = (siteId: string) =>
    sites.find((s: Site) => s.site_id === siteId)?.name || siteId;

  const sitesArray = data.sites || [];
  const totalViews = sitesArray.reduce(
    (acc: number, s: SiteAnalytics) => acc + (s.totalPageViews || 0),
    0
  );
  const totalVisitors = sitesArray.reduce(
    (acc: number, s: SiteAnalytics) => acc + (s.uniqueVisitors || 0),
    0
  );
  const avgBounceRate =
    sitesArray.length > 0
      ? (
          sitesArray.reduce(
            (acc: number, s: SiteAnalytics) => acc + (s.bounceRate || 0),
            0
          ) / sitesArray.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={<Globe />}
          label="Active Sites"
          value={data.totalSites || 0}
        />
        <MetricCard
          icon={<Eye />}
          label="Total Views"
          value={totalViews.toLocaleString()}
        />
        <MetricCard
          icon={<Users />}
          label="Total Visitors"
          value={totalVisitors.toLocaleString()}
        />
        <MetricCard
          icon={<TrendingUp />}
          label="Avg Bounce Rate"
          value={`${avgBounceRate}%`}
        />
      </div>

      {/* Sites Grid - FIXED CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sitesArray.length > 0 ? (
          sitesArray.map((site: SiteAnalytics) => (
            <Card
              key={site.siteId}
              className="hover:shadow-md transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                      <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate text-slate-900 dark:text-white">
                        {getSiteName(site.siteId)}
                      </CardTitle>
                      <CardDescription className="truncate text-slate-600 dark:text-slate-400">
                        {site.domain || site.siteId}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Page Views
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {(site.totalPageViews || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Visitors
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {(site.uniqueVisitors || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Bounce Rate
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                      {site.bounceRate || 0}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Avg. Pages
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300">
                      {site.uniqueVisitors > 0
                        ? (
                            (site.totalPageViews || 0) / site.uniqueVisitors
                          ).toFixed(1)
                        : "0.0"}
                    </p>
                  </div>
                </div>

                {/* Mini Chart */}
                {site.timeSeriesData && site.timeSeriesData.length > 0 && (
                  <div className="h-12 sm:h-16 flex items-end gap-1">
                    {site.timeSeriesData.map(
                      (day: TimeSeriesData, i: number) => {
                        const maxViews = Math.max(
                          ...site.timeSeriesData!.map(
                            (d: TimeSeriesData) => d.views || 0
                          ),
                          1
                        );
                        const height = ((day.views || 0) / maxViews) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-blue-600 dark:bg-blue-500 rounded-t hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                            style={{
                              height: height > 0 ? `${height}%` : "4%",
                              minHeight: "4px",
                            }}
                            title={`${day.views || 0} views`}
                          />
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">
              No analytics data yet
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Install tracking scripts to see your data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SingleSiteView({
  data,
  timeRange,
}: {
  data: SingleSiteData;
  timeRange: string;
}) {
  const totalPageViews = data.totalPageViews || 0;
  const uniqueVisitors = data.uniqueVisitors || 0;
  const bounceRate = data.bounceRate || 0;
  const avgSessionDuration = data.avgSessionDuration || 0;
  const topPages = data.topPages || [];
  const timeSeriesData = data.timeSeriesData || [];
  const topBrowsers = data.topBrowsers || [];

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const browserChartConfig = {
    count: {
      label: "Visitors",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          icon={<Eye />}
          label="Total Views"
          value={totalPageViews.toLocaleString()}
        />
        <MetricCard
          icon={<Users />}
          label="Unique Visitors"
          value={uniqueVisitors.toLocaleString()}
        />
        <MetricCard
          icon={<MousePointer />}
          label="Bounce Rate"
          value={`${bounceRate}%`}
        />
        <MetricCard
          icon={<Clock />}
          label="Avg. Session"
          value={
            avgSessionDuration > 0
              ? `${Math.floor(avgSessionDuration / 60)}m ${
                  avgSessionDuration % 60
                }s`
              : "0s"
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Visitors Radial Chart */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Unique Visitors
            </CardTitle>
            <CardDescription>
              {timeRange === "24h"
                ? "Last 24 hours"
                : timeRange === "7d"
                ? "Last 7 days"
                : "Last 30 days"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={{
                visitors: {
                  label: "Visitors",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="mx-auto aspect-square max-h-[250px]"
            >
              <RadialBarChart
                data={[
                  {
                    visitors: uniqueVisitors,
                    fill: "hsl(var(--chart-1))",
                  },
                ]}
                startAngle={90}
                endAngle={90 + (uniqueVisitors > 0 ? 270 : 0)}
                innerRadius={80}
                outerRadius={140}
              >
                <PolarGrid
                  gridType="circle"
                  radialLines={false}
                  stroke="none"
                  className="first:fill-muted last:fill-background"
                  polarRadius={[86, 74]}
                />
                <RadialBar dataKey="visitors" background cornerRadius={10} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-4xl font-bold"
                            >
                              {uniqueVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Visitors
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </PolarRadiusAxis>
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Traffic Trend
            </CardTitle>
            <CardDescription>
              {timeRange === "24h"
                ? "Hourly views for the last 24 hours"
                : timeRange === "7d"
                ? "Daily views for the last 7 days"
                : "Daily views for the last 30 days"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-views)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-views)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return timeRange === "24h"
                        ? date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                    }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        hideIndicator
                        className="min-w-[180px]"
                      />
                    }
                    cursor={false}
                  />
                  <Area
                    dataKey="views"
                    type="monotone"
                    fill="url(#fillViews)"
                    stroke="var(--color-views)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Top Browsers */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Top Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Top Browsers
            </CardTitle>
            <CardDescription>Browser distribution by visitors</CardDescription>
          </CardHeader>
          <CardContent>
            {topBrowsers.length > 0 ? (
              <div className="space-y-4">
                {topBrowsers.map((browser: TopBrowser, i: number) => {
                  const total = topBrowsers.reduce(
                    (sum: number, b: TopBrowser) => sum + (b.count || 0),
                    0
                  );
                  const percentage =
                    total > 0
                      ? ((browser.count / total) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">
                          {browser.browser}
                        </span>
                        <span className="text-sm text-slate-500">
                          {browser.count.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400">
                No browser data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Pages
          </CardTitle>
          <CardDescription>Most visited pages on your site</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-600 uppercase">
                    Page
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-600 uppercase">
                    Views
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 sm:py-4 text-xs font-semibold text-slate-600 uppercase">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topPages.length > 0 ? (
                  topPages.map((page: TopPage, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {i + 1}
                          </span>
                          <span className="font-medium text-slate-900 text-sm truncate">
                            {page.path}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900">
                        {(page.count || 0).toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-[120px] sm:max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 rounded-full"
                              style={{
                                width:
                                  totalPageViews > 0
                                    ? `${
                                        ((page.count || 0) / totalPageViews) *
                                        100
                                      }%`
                                    : "0%",
                              }}
                            />
                          </div>
                          <span className="text-sm text-slate-500 min-w-[40px]">
                            {totalPageViews > 0
                              ? (
                                  ((page.count || 0) / totalPageViews) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 sm:px-6 py-8 text-center text-slate-500"
                    >
                      No page data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="p-2 sm:p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
            <div className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-200">
              {icon}
            </div>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-1">
          {label}
        </p>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  );
}
