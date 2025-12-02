"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Users,
  Eye,
  TrendingUp,
  RefreshCw,
  Globe,
  BarChart3,
  PlusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Site {
  id: string;
  site_id: string;
  name: string;
  domain: string;
  created_at: string;
  is_active: boolean;
}

interface TopPage {
  path: string;
  count: number;
}

interface ReferrerData {
  referrer: string;
  count: number;
}

interface TimeSeriesData {
  date: string;
  views: number;
}

interface SingleSiteAnalytics {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: TopPage[];
  topReferrers?: ReferrerData[];
  timeSeriesData?: TimeSeriesData[];
  bounceRate?: number;
}

interface SiteStats {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: TopPage[];
}

interface AllSitesAnalytics {
  type: "all";
  sites: SiteStats[];
  totalSites: number;
}

type AnalyticsResponse = SingleSiteAnalytics | AllSitesAnalytics;

export default function MultiSiteDashboard() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("all");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Add this to your dashboard page.tsx - REPLACE the existing useEffect

  // In your dashboard page.tsx - UPDATE the script src
  useEffect(() => {
    if (window._analytics?.initialized) {
      console.log("🟡 Analytics already initialized");
      return;
    }

    const existingScript = document.querySelector(
      'script[data-analytics="true"]'
    );
    if (existingScript) {
      console.log("🟡 Tracking script already exists in DOM");
      return;
    }

    console.log("🟢 Creating tracking script");
    const script = document.createElement("script");

    script.src = "/api/track.js";
    script.setAttribute("data-site-id", "dashboard-test");
    script.setAttribute("data-analytics", "true"); // Add marker
    script.async = true;

    script.onload = () => {
      console.log("✅ Tracking script loaded successfully");
    };

    script.onerror = (e) => {
      console.error("❌ Failed to load tracking script:", e);
    };

    document.head.appendChild(script);
    console.log("🟢 Script appended to head");

    return () => {
      const s = document.querySelector('script[data-analytics="true"]');
      if (s) {
        console.log("🧹 Removing tracking script");
        s.remove();
      }
      if (window._analytics) {
        window._analytics.initialized = false;
      }
    };
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/sites");
      if (!res.ok) {
        throw new Error(`Failed to fetch sites: ${res.status}`);
      }
      const json = await res.json();
      setSites(json.sites || []);
    } catch (error) {
      console.error("Failed to fetch sites:", error);
      setError("Failed to load sites");
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?siteId=${selectedSite}`);
      if (!res.ok) {
        throw new Error(`Analytics fetch failed: ${res.status}`);
      }
      const json = await res.json();

      // ✅ Check for API errors
      if (json.error) {
        setError(json.error);
        setData(null);
      } else {
        setData(json);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setError("Failed to load analytics data");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSite]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedSite, autoRefresh]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find((s) => s.site_id === siteId);
    return site ? site.name : siteId;
  };

  return (
    <main
      className="min-h-screen bg-[#050505] text-white p-4 md:p-8 
        font-sans relative overflow-hidden"
    >
      {/* Scanline Overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[length:100%_2px]" />

      <div className="max-w-7xl mx-auto relative">
        {/* --- Header Panel --- */}
        <div
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-10
            bg-[#0d0d0d]/70 backdrop-blur-xl border border-[#1f1f1f] p-6 rounded-2xl shadow-lg
            shadow-blue-500/5"
        >
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold mb-2
                text-transparent bg-clip-text
                bg-gradient-to-r from-cyan-300 to-purple-400 drop-shadow-[0_0_12px_rgba(0,255,255,0.3)]"
            >
              NMS Analytics Control Center
            </h1>

            <p className="text-gray-400 text-sm tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 animate-pulse rounded-full" />
              Synced: {formatTime(lastUpdated)}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-6 md:mt-0">
            {/* Live Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all border
                flex items-center gap-2 shadow-lg hover:shadow-xl
                ${
                  autoRefresh
                    ? "bg-[#0f2517] text-green-300 border-green-600/40 shadow-green-400/10"
                    : "bg-[#111111] text-gray-400 border-gray-700 hover:border-gray-500"
                }`}
            >
              <Activity className="w-4 h-4" />
              {autoRefresh ? "Live Mode" : "Paused"}
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700
                hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-medium
                transition-all shadow-lg hover:shadow-blue-500/20
                disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {/* Add Button */}
            <button
              onClick={() => router.push("/dashboard/add")}
              className="px-5 py-2.5 rounded-xl
              bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500
              text-white text-sm font-medium transition-all shadow-lg hover:shadow-purple-500/20 
              flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* --- Site Selector Panel --- */}
        <div
          className="mb-8 bg-[#0d0d0d]/60 backdrop-blur-md p-5 rounded-2xl border border-[#1f1f1f]
            shadow-inner shadow-black/40"
        >
          <label className="block text-sm font-medium text-gray-300 mb-4 tracking-wide">
            Select Target Site
          </label>

          <div className="flex gap-3 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedSite("all")}
              className={`px-5 py-3 rounded-xl whitespace-nowrap flex items-center gap-2
                transition-all text-sm border shadow-lg
                ${
                  selectedSite === "all"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-cyan-500/20"
                    : "bg-[#0a0a0a] text-gray-400 border-gray-700 hover:border-gray-500"
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              All Sites
            </button>

            {sites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(site.site_id)}
                className={`px-5 py-3 rounded-xl whitespace-nowrap flex items-center gap-2
                transition-all text-sm border shadow-lg
                ${
                  selectedSite === site.site_id
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white border-transparent shadow-pink-500/20"
                    : "bg-[#0a0a0a] text-gray-400 border-gray-700 hover:border-gray-500"
                }`}
              >
                <Globe className="w-4 h-4" />
                {site.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- Loading Spinner --- */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div
              className="animate-spin rounded-full h-12 w-12 
              border-t-2 border-b-2 border-cyan-400"
            ></div>
          </div>
        )}

        {/* --- Error State --- */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center mb-6">
            <p className="text-red-400 font-medium text-lg">{error}</p>
          </div>
        )}

        {/* --- Analytics Display --- */}
        {!loading && data && !error && (
          <>
            {selectedSite === "all" &&
            (data as AllSitesAnalytics).type === "all" ? (
              <AllSitesView data={data as AllSitesAnalytics} sites={sites} />
            ) : (
              <SingleSiteView
                data={data as SingleSiteAnalytics}
                autoRefresh={autoRefresh}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function AllSitesView({
  data,
  sites,
}: {
  data: AllSitesAnalytics;
  sites: Site[];
}) {
  const getSiteName = (siteId: string) => {
    const site = sites.find((s) => s.site_id === siteId);
    return site ? site.name : siteId;
  };

  const getSiteDomain = (siteId: string) => {
    const site = sites.find((s) => s.site_id === siteId);
    return site?.domain || "N/A";
  };

  // ✅ Safety checks
  const sitesArray = data.sites || [];
  const totalViews = sitesArray.reduce(
    (acc, s) => acc + (s.totalPageViews || 0),
    0
  );
  const totalVisitors = sitesArray.reduce(
    (acc, s) => acc + (s.uniqueVisitors || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<Globe className="w-6 h-6" />}
          label="Total Sites"
          value={data.totalSites || 0}
          subtitle="Active websites"
          color="purple"
        />
        <MetricCard
          icon={<Eye className="w-6 h-6" />}
          label="Total Page Views"
          value={totalViews}
          subtitle="Across all sites"
          color="blue"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Total Visitors"
          value={totalVisitors}
          subtitle="Unique visitors"
          color="green"
        />
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sitesArray.length > 0 ? (
          sitesArray.map((site) => (
            <div
              key={site.siteId}
              className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {getSiteName(site.siteId)}
                    </h3>
                    <p className="text-xs text-gray-500 truncate max-w-[180px]">
                      {getSiteDomain(site.siteId)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Page Views</span>
                  <span className="text-2xl font-bold text-white">
                    {(site.totalPageViews || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Visitors</span>
                  <span className="text-2xl font-bold text-white">
                    {(site.uniqueVisitors || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Pages/Visitor</span>
                  <span className="text-lg font-semibold text-gray-300">
                    {site.uniqueVisitors > 0
                      ? (
                          (site.totalPageViews || 0) / site.uniqueVisitors
                        ).toFixed(1)
                      : "0.0"}
                  </span>
                </div>
              </div>

              {/* Top Page */}
              {site.topPages && site.topPages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Top Page</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300 truncate flex-1">
                      {site.topPages[0].path}
                    </span>
                    <span className="text-sm font-semibold text-blue-400 ml-2">
                      {site.topPages[0].count}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">No sites found</p>
            <p className="text-gray-600 text-sm mt-2">
              Add a site to start tracking analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Single Site View
function SingleSiteView({
  data,
  autoRefresh,
}: {
  data: SingleSiteAnalytics;
  autoRefresh: boolean;
}) {
  // ✅ Safety checks
  const totalPageViews = data.totalPageViews || 0;
  const uniqueVisitors = data.uniqueVisitors || 0;
  const topPages = data.topPages || [];
  const avgPages =
    uniqueVisitors > 0 ? (totalPageViews / uniqueVisitors).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Eye className="w-6 h-6" />}
          label="Total Page Views"
          value={totalPageViews}
          subtitle="Last 7 days"
          color="blue"
        />
        <MetricCard
          icon={<Users className="w-6 h-6" />}
          label="Unique Visitors"
          value={uniqueVisitors}
          subtitle="Last 7 days"
          color="purple"
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Avg. Pages/Visitor"
          value={avgPages}
          subtitle="Engagement metric"
          color="green"
        />
        <MetricCard
          icon={<Activity className="w-6 h-6" />}
          label="Active Now"
          value={autoRefresh ? "Live" : "Paused"}
          subtitle="Real-time tracking"
          color="orange"
          isText
        />
      </div>

      {/* Top Pages Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold">Top Pages</h2>
          <p className="text-sm text-gray-400 mt-1">
            Most visited pages in the last 7 days
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111111]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Path
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Views
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {topPages.length > 0 ? (
                topPages.map((page, index) => (
                  <tr
                    key={page.path}
                    className="hover:bg-[#222222] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-mono text-xs">
                          #{index + 1}
                        </span>
                        <span className="text-gray-200">{page.path}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {(page.count || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-800 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                totalPageViews > 0
                                  ? ((page.count || 0) / totalPageViews) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-400 min-w-[45px]">
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
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No data available yet. Start tracking to see analytics.
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

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle: string;
  color: "blue" | "purple" | "green" | "orange";
  isText?: boolean;
}

function MetricCard({
  icon,
  label,
  value,
  subtitle,
  color,
  isText,
}: MetricCardProps) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    purple:
      "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
    green:
      "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    orange:
      "from-orange-500/20 to-orange-600/20 border-orange-500/30 text-orange-400",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 transition-all hover:scale-105 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-1 ${isText ? "" : "tabular-nums"}`}>
        {isText
          ? value
          : typeof value === "number"
          ? value.toLocaleString()
          : value}
      </p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
