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
} from "lucide-react";
import { useRouter } from "next/navigation";

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

// API Functions
async function fetchSites(): Promise<Site[]> {
  const response = await fetch("/api/sites");
  if (!response.ok) throw new Error("Failed to fetch sites");
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
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
}

function AnalyticsDashboard() {
  const router = useRouter();
  const [selectedSite, setSelectedSite] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date());
  }, []);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["analytics", selectedSite, timeRange],
    queryFn: () => fetchAnalytics(selectedSite, timeRange),
    refetchInterval: autoRefresh ? 30000 : false,
    enabled: sites.length > 0 || selectedSite === "all",
  });

  const isLoading = sitesLoading || analyticsLoading;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                Analytics Dashboard
              </h1>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
                <Clock className="w-4 h-4" />
                <span>
                  Last Synced:{" "}
                  {mounted && lastUpdated
                    ? formatTime(lastUpdated)
                    : "--:--:--"}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    autoRefresh ? "bg-green-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
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
                onClick={() => router.push("/dashboard/add")}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Site</span>
              </button>
            </div>
          </div>
        </header>

        {/* Site Selector */}
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
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-slate-900" />
          </div>
        )}

        {/* Error State */}
        {isError && (
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
        {!isLoading && !isError && analyticsData && (
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
        {!isLoading && !isError && !analyticsData && (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              No data available
            </h3>
            <p className="text-slate-500">
              Start tracking analytics to see your data here
            </p>
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

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sitesArray.length > 0 ? (
          sitesArray.map((site: SiteAnalytics) => (
            <div
              key={site.siteId}
              className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 hover:border-slate-300 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-slate-100 border border-slate-200">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                      {getSiteName(site.siteId)}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {site.domain || site.siteId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Page Views</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {(site.totalPageViews || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Visitors</p>
                  <p className="text-xl sm:text-2xl font-bold text-slate-900">
                    {(site.uniqueVisitors || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Bounce Rate</p>
                  <p className="text-base sm:text-lg font-semibold text-slate-700">
                    {site.bounceRate || 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Avg. Pages</p>
                  <p className="text-base sm:text-lg font-semibold text-slate-700">
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
                  {site.timeSeriesData.map((day: TimeSeriesData, i: number) => {
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
                        className="flex-1 bg-slate-900 rounded-t hover:bg-slate-700 transition-colors"
                        style={{
                          height: height > 0 ? `${height}%` : "4%",
                          minHeight: "4px",
                        }}
                        title={`${day.views || 0} views`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Globe className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-lg">No sites found</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Time Series Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 text-slate-900">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            Traffic Trend
          </h3>
          {timeSeriesData.length > 0 ? (
            <div className="h-40 sm:h-48 flex items-end justify-between gap-1">
              {timeSeriesData.map((day: TimeSeriesData, i: number) => {
                const maxViews = Math.max(
                  ...timeSeriesData.map((d: TimeSeriesData) => d.views || 0),
                  1
                );
                const height = ((day.views || 0) / maxViews) * 100;
                const displayHeight = Math.max(height, 2);

                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-end gap-2 flex-1 min-w-0"
                    style={{ height: "100%" }}
                  >
                    <div
                      className="w-full flex flex-col justify-end"
                      style={{ height: "85%" }}
                    >
                      <div
                        className="w-full bg-slate-900 rounded-t hover:bg-slate-700 transition-all cursor-pointer relative group"
                        style={{
                          height: `${displayHeight}%`,
                          minHeight: "4px",
                        }}
                      >
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          {day.views || 0} views
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs text-slate-500 truncate w-full text-center"
                      style={{ height: "15%" }}
                    >
                      {timeRange === "24h"
                        ? new Date(day.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(day.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-40 sm:h-48 flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Top Browsers */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 text-slate-900">
            <Globe className="w-5 h-5 text-slate-700" />
            Top Browsers
          </h3>
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
                        {percentage}%
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
            <div className="h-full flex items-center justify-center text-slate-400">
              No browser data
            </div>
          )}
        </div>
      </div>

      {/* Top Pages Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200">
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-slate-700" />
            Top Pages
          </h3>
        </div>
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
                                      ((page.count || 0) / totalPageViews) * 100
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
      </div>
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
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 rounded-lg bg-slate-100">
          <div className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700">{icon}</div>
        </div>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  );
}
