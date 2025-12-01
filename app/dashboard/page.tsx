"use client";

import { useEffect, useState } from "react";
import { Activity, Users, Eye, TrendingUp, RefreshCw } from "lucide-react";

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

interface AnalyticsResponse {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: TopPage[];
  topReferrers?: ReferrerData[];
  timeSeriesData?: TimeSeriesData[];
  bounceRate?: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState("arc-tech");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?siteId=${siteId}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [siteId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [siteId, autoRefresh]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 text-sm">
              Real-time insights • Last updated: {formatTime(lastUpdated)}
            </p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                autoRefresh
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-800 text-gray-400 border border-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {autoRefresh ? "Live" : "Paused"}
              </div>
            </button>

            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </div>
            </button>
          </div>
        </div>

        {/* Site ID Input */}
        <div className="mb-6 bg-[#1a1a1a] p-4 rounded-xl border border-gray-800">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Site ID
          </label>
          <input
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full md:w-auto px-4 py-2 rounded-lg bg-[#0a0a0a] border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter site ID"
          />
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && data && !(data as any)?.error && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={<Eye className="w-6 h-6" />}
                label="Total Page Views"
                value={data.totalPageViews}
                subtitle="Last 7 days"
                color="blue"
              />
              <MetricCard
                icon={<Users className="w-6 h-6" />}
                label="Unique Visitors"
                value={data.uniqueVisitors}
                subtitle="Last 7 days"
                color="purple"
              />
              <MetricCard
                icon={<TrendingUp className="w-6 h-6" />}
                label="Avg. Pages/Visitor"
                value={(
                  data.totalPageViews / (data.uniqueVisitors || 1)
                ).toFixed(1)}
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
                    {data.topPages.length > 0 ? (
                      data.topPages.map((page, index) => (
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
                            {page.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-800 rounded-full h-2 max-w-[100px]">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      (page.count / data.totalPageViews) * 100
                                    }%`,
                                  }}
                                />
                              </div>
                              <span className="text-gray-400 min-w-[45px]">
                                {(
                                  (page.count / data.totalPageViews) *
                                  100
                                ).toFixed(1)}
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
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && (data as any)?.error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">
              Error: {(data as any).error}
            </p>
          </div>
        )}
      </div>
    </main>
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
