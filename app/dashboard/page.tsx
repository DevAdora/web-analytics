"use client";

import { useState, useEffect } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { ThemeToggle } from "@/app/components/ThemeToggle";
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
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/* ─── Query Client ─────────────────────────────────────── */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 2, staleTime: 30000 },
  },
});

/* ─── Types ─────────────────────────────────────────────── */
interface User { id: string; email: string; }
interface Site { id: string; site_id: string; name: string; domain?: string; is_active?: boolean; }
interface TimeSeriesData { date: string; views: number; }
interface TopPage { path: string; count: number; }
interface TopBrowser { browser: string; count: number; }
interface SiteAnalytics {
  siteId: string; name?: string; domain?: string;
  totalPageViews: number; uniqueVisitors: number; bounceRate: number;
  topPages?: TopPage[]; timeSeriesData?: TimeSeriesData[];
}
interface SingleSiteData {
  siteId: string; totalPageViews: number; uniqueVisitors: number;
  bounceRate: number; avgSessionDuration: number;
  topPages: TopPage[]; timeSeriesData: TimeSeriesData[]; topBrowsers: TopBrowser[];
}
interface AllSitesData { type: "all"; sites: SiteAnalytics[]; totalSites: number; }
type AnalyticsData = SingleSiteData | AllSitesData;

/* ─── Data fetchers ─────────────────────────────────────── */
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
    if (response.status === 401) { window.location.href = "/auth/login"; throw new Error("Unauthorized"); }
    throw new Error("Failed to fetch sites");
  }
  const data = await response.json();
  return data.sites || [];
}
async function fetchAnalytics(siteId: string, timeRange: string = "7d"): Promise<AnalyticsData> {
  const response = await fetch(`/api/analytics?siteId=${siteId}&range=${timeRange}`);
  if (!response.ok) {
    if (response.status === 401) { window.location.href = "/auth/login"; throw new Error("Unauthorized"); }
    throw new Error("Failed to fetch analytics");
  }
  return response.json();
}
async function handleLogout() {
  try { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/auth/login"; }
  catch (error) { console.error("Logout failed:", error); }
}

/* ─── Global styles ─────────────────────────────────────── */
const DB_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

  :root {
    --bg: #F6F5F1;
    --fg: #0D0D0B;
    --accent: #1C6B45;
    --accent-light: #E8F5EE;
    --muted: #7A7A72;
    --border: #E0DED7;
    --card: #FFFFFF;
    --input-bg: #FAFAF8;
    --error-bg: #FEF2F2;
    --error-border: #FECACA;
    --error-fg: #991B1B;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0D0D0B;
      --fg: #F6F5F1;
      --accent: #3DD68C;
      --accent-light: #0D2B1E;
      --muted: #8A8A82;
      --border: #222220;
      --card: #141412;
      --input-bg: #1A1A18;
      --error-bg: #1F0808;
      --error-border: #7F1D1D;
      --error-fg: #FCA5A5;
    }
  }

  .db-root {
    min-height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    position: relative;
  }
  .db-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none; z-index: 0; opacity: 0.6;
  }

  /* Nav */
  .db-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px; gap: 16px;
  }
  .db-nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; font-weight: 600;
    color: var(--fg); text-decoration: none; letter-spacing: -0.02em;
    flex-shrink: 0;
  }
  .db-nav-meta {
    display: flex; align-items: center; gap: 20px; flex: 1;
    padding: 0 24px;
  }
  .db-nav-pill {
    display: flex; align-items: center; gap: 7px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.06em; color: var(--muted);
  }
  .db-nav-pulse {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    animation: db-pulse 2s ease-in-out infinite;
  }
  .db-nav-pulse.paused { background: var(--muted); animation: none; }
  @keyframes db-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  .db-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  /* Buttons */
  .db-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 3px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 500;
    border: 1px solid var(--border); background: transparent;
    color: var(--fg); transition: border-color 0.18s, background 0.18s;
    white-space: nowrap;
  }
  .db-btn:hover { border-color: var(--fg); }
  .db-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .db-btn svg { width: 13px; height: 13px; }

  .db-btn-primary {
    background: var(--fg); color: var(--bg); border-color: var(--fg);
  }
  .db-btn-primary:hover { opacity: 0.78; border-color: var(--fg); }

  .db-btn-live {
    background: var(--accent-light); color: var(--accent);
    border-color: var(--accent); font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .db-btn-live.paused {
    background: transparent; color: var(--muted); border-color: var(--border);
  }
  .db-btn-danger { background: transparent; color: var(--muted); border-color: var(--border); }
  .db-btn-danger:hover { border-color: #991B1B; color: #991B1B; }

  /* Content wrapper */
  .db-content {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    padding: 32px 24px 64px;
    display: flex; flex-direction: column; gap: 24px;
  }

  /* Section header (matching landing page pattern) */
  .db-section-hdr {
    display: flex; align-items: center; gap: 16px; margin-bottom: 16px;
  }
  .db-section-lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); white-space: nowrap;
  }
  .db-section-line { flex: 1; height: 1px; background: var(--border); }

  /* Site selector strip */
  .db-site-strip {
    background: var(--card); border: 1px solid var(--border); border-radius: 4px;
    padding: 16px 20px;
  }
  .db-site-strip-inner {
    display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px;
  }
  .db-site-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px; border-radius: 3px; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.06em;
    border: 1px solid var(--border); background: transparent;
    color: var(--muted); white-space: nowrap; transition: all 0.15s;
  }
  .db-site-btn:hover { color: var(--fg); border-color: var(--fg); }
  .db-site-btn.active {
    background: var(--fg); color: var(--bg); border-color: var(--fg);
  }
  .db-site-btn svg { width: 11px; height: 11px; }

  /* Metric Cards */
  .db-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .db-mc {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 4px; padding: 20px 20px 18px; position: relative;
  }
  .db-mc-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 10px;
  }
  .db-mc-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.9rem; font-weight: 600; letter-spacing: -0.04em;
    color: var(--fg); line-height: 1;
  }
  .db-mc-accent {
    position: absolute; top: 0; left: 0;
    width: 3px; height: 100%; background: var(--accent); border-radius: 4px 0 0 4px;
  }

  /* Cards */
  .db-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 4px; overflow: hidden;
  }
  .db-card-hdr { padding: 18px 20px 12px; border-bottom: 1px solid var(--border); }
  .db-card-title {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; font-weight: 500; color: var(--fg); margin-bottom: 2px;
  }
  .db-card-desc {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.08em; color: var(--muted);
  }
  .db-card-body { padding: 20px; }

  /* Charts grid */
  .db-charts-grid {
    display: grid; grid-template-columns: 1fr 2fr; gap: 12px;
  }

  /* Top pages table */
  .db-table { width: 100%; border-collapse: collapse; }
  .db-table thead tr { border-bottom: 1px solid var(--border); }
  .db-table th {
    text-align: left; padding: 10px 20px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
    font-weight: 400;
  }
  .db-table td { padding: 12px 20px; border-bottom: 1px solid var(--border); }
  .db-table tbody tr:last-child td { border-bottom: none; }
  .db-table tbody tr:hover td { background: var(--bg); }
  .db-table-index {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px;
    font-family: 'IBM Plex Mono', monospace; font-size: 0.58rem;
    color: var(--muted); border: 1px solid var(--border); border-radius: 2px;
    flex-shrink: 0;
  }
  .db-table-path {
    font-size: 0.85rem; font-weight: 400; color: var(--fg);
    font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;
  }
  .db-table-count {
    font-family: 'Playfair Display', serif;
    font-size: 1rem; font-weight: 600; color: var(--fg);
  }

  /* Progress bars */
  .db-bar-track {
    height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;
    flex: 1; max-width: 180px;
  }
  .db-bar-fill {
    height: 100%; background: var(--accent); border-radius: 2px; transition: width 0.4s ease;
  }
  .db-bar-pct {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; color: var(--muted); min-width: 38px;
  }

  /* Browser bars */
  .db-browser-row { margin-bottom: 16px; }
  .db-browser-row:last-child { margin-bottom: 0; }
  .db-browser-meta {
    display: flex; justify-content: space-between; margin-bottom: 6px;
  }
  .db-browser-name { font-size: 0.82rem; font-weight: 400; color: var(--fg); }
  .db-browser-count {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; color: var(--muted);
  }
  .db-browser-track {
    height: 3px; background: var(--border); border-radius: 2px; overflow: hidden;
  }
  .db-browser-fill { height: 100%; background: var(--accent); border-radius: 2px; }

  /* Site cards (all sites view) */
  .db-site-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .db-site-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 4px; padding: 20px;
    transition: border-color 0.18s;
  }
  .db-site-card:hover { border-color: var(--fg); }
  .db-site-card-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; font-weight: 500; color: var(--fg); margin-bottom: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .db-site-card-domain {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem; color: var(--muted); letter-spacing: 0.04em; margin-bottom: 16px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .db-site-card-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;
  }
  .db-site-card-lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.56rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
    margin-bottom: 4px;
  }
  .db-site-card-val {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem; font-weight: 600; letter-spacing: -0.03em; color: var(--fg);
  }
  .db-site-card-val-sm {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem; font-weight: 500; color: var(--fg);
  }
  .db-mini-chart {
    display: flex; align-items: flex-end; gap: 2px; height: 40px;
    border-top: 1px solid var(--border); padding-top: 12px;
  }
  .db-mini-bar { flex: 1; background: var(--accent); border-radius: 1px 1px 0 0; opacity: 0.7; min-height: 2px; }

  /* Range select */
  .db-select {
    padding: 7px 12px; border-radius: 3px;
    background: var(--input-bg); color: var(--fg);
    border: 1px solid var(--border);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.06em;
    outline: none; cursor: pointer; transition: border-color 0.18s;
    -webkit-appearance: none; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A7A72' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    padding-right: 28px;
  }
  .db-select:focus { border-color: var(--accent); }

  /* Error/empty states */
  .db-error {
    background: var(--error-bg); border: 1px solid var(--error-border);
    border-radius: 4px; padding: 16px 20px;
    display: flex; align-items: flex-start; gap: 14px;
  }
  .db-error-title {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--error-fg); margin-bottom: 4px; font-weight: 500;
  }
  .db-error-msg { font-size: 0.8rem; color: var(--error-fg); }
  .db-retry {
    padding: 7px 14px; border-radius: 3px; cursor: pointer; font-size: 0.78rem;
    border: 1px solid var(--error-border); background: transparent;
    color: var(--error-fg); font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.06em; white-space: nowrap; align-self: flex-start;
    transition: background 0.15s;
  }
  .db-retry:hover { background: var(--error-bg); }

  .db-empty {
    text-align: center; padding: 48px 20px;
    border: 1px dashed var(--border); border-radius: 4px;
    background: var(--card);
  }
  .db-empty-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem; font-weight: 600; color: var(--fg); margin-bottom: 8px;
  }
  .db-empty-sub { font-size: 0.82rem; color: var(--muted); margin-bottom: 20px; }

  /* Loading */
  .db-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 100vh; flex-direction: column; gap: 16px;
    background: var(--bg);
  }
  .db-spinner {
    width: 28px; height: 28px;
    border: 2px solid var(--border); border-top-color: var(--accent);
    border-radius: 50%; animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .db-spinner-lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .db-metrics { grid-template-columns: repeat(2, 1fr); }
    .db-charts-grid { grid-template-columns: 1fr; }
    .db-site-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .db-nav { padding: 0 16px; }
    .db-nav-meta { display: none; }
    .db-content { padding: 20px 14px 48px; gap: 16px; }
    .db-metrics { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .db-site-grid { grid-template-columns: 1fr; }
    .db-btn span { display: none; }
    .db-mc-value { font-size: 1.5rem; }
  }
`;

/* ─── Main Dashboard ─────────────────────────────────────── */
function AnalyticsDashboard() {
  const [selectedSite, setSelectedSite] = useState("all");
  const [timeRange, setTimeRange] = useState("7d");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"], queryFn: fetchUser, staleTime: 10 * 60 * 1000,
  });
  const { data: sites = [], isLoading: sitesLoading, error: sitesError } = useQuery({
    queryKey: ["sites"], queryFn: fetchSites, staleTime: 5 * 60 * 1000, enabled: !!user,
  });
  const {
    data: analyticsData, isLoading: analyticsLoading, isError: analyticsError,
    error, refetch, dataUpdatedAt, isFetching,
  } = useQuery({
    queryKey: ["analytics", selectedSite, timeRange],
    queryFn: () => fetchAnalytics(selectedSite, timeRange),
    refetchInterval: autoRefresh ? 30000 : false,
    enabled: !!user && (sites.length > 0 || selectedSite === "all"),
  });

  const lastUpdatedDate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  useEffect(() => { if (analyticsData) setLastUpdated(new Date()); }, [analyticsData]);
  const isLoading = userLoading || sitesLoading || analyticsLoading;
  useEffect(() => { if (!userLoading && !user) window.location.href = "/auth/login"; }, [user, userLoading]);

  if (userLoading) {
    return (
      <>
        <style>{DB_STYLES}</style>
        <div className="db-loading">
          <div className="db-spinner" />
          <span className="db-spinner-lbl">Loading</span>
        </div>
      </>
    );
  }
  if (!user) return null;

  return (
    <>
      <style>{DB_STYLES}</style>
      <div className="db-root">

        {/* ── Nav ── */}
        <nav className="db-nav">
          <a href="/" className="db-nav-logo">Analytique</a>

          <div className="db-nav-meta">
            <span className="db-nav-pill">
              <div className={`db-nav-pulse ${autoRefresh ? "" : "paused"}`} />
              {lastUpdatedDate ? formatTime(lastUpdatedDate) : "—"}
            </span>
            {user && (
              <span className="db-nav-pill">{user.email}</span>
            )}
          </div>

          <div className="db-nav-actions">
            <ThemeToggle />

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="db-select"
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`db-btn db-btn-live ${autoRefresh ? "" : "paused"}`}
            >
              <Activity size={11} />
              <span>{autoRefresh ? "Live" : "Paused"}</span>
            </button>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="db-btn"
            >
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              className="db-btn db-btn-primary"
              onClick={() => (window.location.href = "/dashboard/add")}
            >
              <PlusCircle size={13} />
              <span>Add Site</span>
            </button>

            <button onClick={handleLogout} className="db-btn db-btn-danger" title="Logout">
              <LogOut size={13} />
            </button>
          </div>
        </nav>

        {/* ── Content ── */}
        <div className="db-content">

          {/* Sites error */}
          {sitesError && (
            <div className="db-error">
              <div style={{ flex: 1 }}>
                <div className="db-error-title">Failed to load sites</div>
                <div className="db-error-msg">
                  {sitesError instanceof Error ? sitesError.message : "Unknown error"}
                </div>
              </div>
            </div>
          )}

          {/* Site selector */}
          {!sitesError && (
            <div className="db-site-strip">
              <div className="db-section-hdr" style={{ marginBottom: 12 }}>
                <span className="db-section-lbl">Site</span>
                <div className="db-section-line" />
              </div>
              <div className="db-site-strip-inner">
                <button
                  onClick={() => setSelectedSite("all")}
                  className={`db-site-btn ${selectedSite === "all" ? "active" : ""}`}
                >
                  <BarChart3 size={11} /> All Sites
                </button>
                {sites.map((site: Site) => (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSite(site.site_id)}
                    className={`db-site-btn ${selectedSite === site.site_id ? "active" : ""}`}
                  >
                    <Globe size={11} /> {site.name}
                  </button>
                ))}
              </div>

              {sites.length === 0 && !sitesLoading && (
                <div className="db-empty" style={{ marginTop: 16 }}>
                  <div className="db-empty-title">No sites yet</div>
                  <p className="db-empty-sub">Add your first site to start tracking analytics</p>
                  <button
                    onClick={() => (window.location.href = "/dashboard/add")}
                    className="db-btn db-btn-primary"
                  >
                    <PlusCircle size={13} /> Add Site
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {isLoading && sites.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div style={{ textAlign: "center" }}>
                <div className="db-spinner" style={{ margin: "0 auto 14px" }} />
                <span className="db-spinner-lbl">Loading analytics</span>
              </div>
            </div>
          )}

          {/* Analytics error */}
          {analyticsError && (
            <div className="db-error">
              <div style={{ flex: 1 }}>
                <div className="db-error-title">Failed to load analytics</div>
                <div className="db-error-msg">
                  {error instanceof Error ? error.message : "Unknown error"}
                </div>
              </div>
              <button onClick={() => refetch()} className="db-retry">Retry</button>
            </div>
          )}

          {/* Content */}
          {!isLoading && !analyticsError && analyticsData && sites.length > 0 && (
            <>
              {"type" in analyticsData && analyticsData.type === "all"
                ? <AllSitesView data={analyticsData} sites={sites} />
                : <SingleSiteView data={analyticsData as SingleSiteData} timeRange={timeRange} />
              }
            </>
          )}

          {/* No data */}
          {!isLoading && !analyticsError && analyticsData &&
            "type" in analyticsData && analyticsData.sites.length === 0 && (
              <div className="db-empty">
                <div className="db-empty-title">No analytics data yet</div>
                <p className="db-empty-sub">Install the tracking script on your website to start collecting data</p>
                <button
                  onClick={() => (window.location.href = "/dashboard/debug")}
                  className="db-btn"
                >
                  View Debug Info
                </button>
              </div>
            )
          }
        </div>

        <ReactQueryDevtools initialIsOpen={false} />
      </div>
    </>
  );
}

/* ─── Metric Card ────────────────────────────────────────── */
function MetricCard({ label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="db-mc">
      <div className="db-mc-accent" />
      <div className="db-mc-label">{label}</div>
      <div className="db-mc-value">{value}</div>
    </div>
  );
}

/* ─── All Sites View ─────────────────────────────────────── */
function AllSitesView({ data, sites }: { data: AllSitesData; sites: Site[] }) {
  const getSiteName = (siteId: string) =>
    sites.find((s: Site) => s.site_id === siteId)?.name || siteId;

  const sitesArray = data.sites || [];
  const totalViews = sitesArray.reduce((acc: number, s: SiteAnalytics) => acc + (s.totalPageViews || 0), 0);
  const totalVisitors = sitesArray.reduce((acc: number, s: SiteAnalytics) => acc + (s.uniqueVisitors || 0), 0);
  const avgBounceRate = sitesArray.length > 0
    ? (sitesArray.reduce((acc: number, s: SiteAnalytics) => acc + (s.bounceRate || 0), 0) / sitesArray.length).toFixed(1)
    : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Summary metrics */}
      <div>
        <div className="db-section-hdr">
          <span className="db-section-lbl">Overview</span>
          <div className="db-section-line" />
        </div>
        <div className="db-metrics">
          <MetricCard label="Active Sites" value={data.totalSites || 0} />
          <MetricCard label="Total Views" value={totalViews.toLocaleString()} />
          <MetricCard label="Total Visitors" value={totalVisitors.toLocaleString()} />
          <MetricCard label="Avg Bounce Rate" value={`${avgBounceRate}%`} />
        </div>
      </div>

      {/* Site cards */}
      <div>
        <div className="db-section-hdr">
          <span className="db-section-lbl">Sites</span>
          <div className="db-section-line" />
        </div>
        <div className="db-site-grid">
          {sitesArray.length > 0 ? (
            sitesArray.map((site: SiteAnalytics) => (
              <div key={site.siteId} className="db-site-card">
                <div className="db-site-card-name">{getSiteName(site.siteId)}</div>
                <div className="db-site-card-domain">{site.domain || site.siteId}</div>

                <div className="db-site-card-grid">
                  <div>
                    <div className="db-site-card-lbl">Page Views</div>
                    <div className="db-site-card-val">{(site.totalPageViews || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="db-site-card-lbl">Visitors</div>
                    <div className="db-site-card-val">{(site.uniqueVisitors || 0).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="db-site-card-lbl">Bounce Rate</div>
                    <div className="db-site-card-val-sm">{site.bounceRate || 0}%</div>
                  </div>
                  <div>
                    <div className="db-site-card-lbl">Avg Pages</div>
                    <div className="db-site-card-val-sm">
                      {site.uniqueVisitors > 0
                        ? ((site.totalPageViews || 0) / site.uniqueVisitors).toFixed(1)
                        : "0.0"}
                    </div>
                  </div>
                </div>

                {site.timeSeriesData && site.timeSeriesData.length > 0 && (
                  <div className="db-mini-chart">
                    {site.timeSeriesData.map((day: TimeSeriesData, i: number) => {
                      const maxViews = Math.max(...site.timeSeriesData!.map((d: TimeSeriesData) => d.views || 0), 1);
                      const height = ((day.views || 0) / maxViews) * 100;
                      return (
                        <div
                          key={i}
                          className="db-mini-bar"
                          style={{ height: height > 0 ? `${height}%` : "4%" }}
                          title={`${day.views || 0} views`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="db-empty" style={{ gridColumn: "1 / -1" }}>
              <div className="db-empty-title">No analytics data yet</div>
              <p className="db-empty-sub">Install tracking scripts to see your data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Single Site View ───────────────────────────────────── */
function SingleSiteView({ data, timeRange }: { data: SingleSiteData; timeRange: string }) {
  const totalPageViews = data.totalPageViews || 0;
  const uniqueVisitors = data.uniqueVisitors || 0;
  const bounceRate = data.bounceRate || 0;
  const avgSessionDuration = data.avgSessionDuration || 0;
  const topPages = data.topPages || [];
  const timeSeriesData = data.timeSeriesData || [];
  const topBrowsers = data.topBrowsers || [];

  const chartConfig = {
    views: { label: "Views", color: "#1C6B45" },
  } satisfies ChartConfig;

  const timeLabel = timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : "Last 30 days";
  const tickFormat = (value: string) => {
    const date = new Date(value);
    return timeRange === "24h"
      ? date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Key metrics */}
      <div>
        <div className="db-section-hdr">
          <span className="db-section-lbl">Metrics — {timeLabel}</span>
          <div className="db-section-line" />
        </div>
        <div className="db-metrics">
          <MetricCard label="Total Views" value={totalPageViews.toLocaleString()} />
          <MetricCard label="Unique Visitors" value={uniqueVisitors.toLocaleString()} />
          <MetricCard label="Bounce Rate" value={`${bounceRate}%`} />
          <MetricCard
            label="Avg Session"
            value={avgSessionDuration > 0
              ? `${Math.floor(avgSessionDuration / 60)}m ${avgSessionDuration % 60}s`
              : "0s"
            }
          />
        </div>
      </div>

      {/* Charts */}
      <div>
        <div className="db-section-hdr">
          <span className="db-section-lbl">Traffic</span>
          <div className="db-section-line" />
        </div>
        <div className="db-charts-grid">
          {/* Radial visitors */}
          <div className="db-card">
            <div className="db-card-hdr">
              <div className="db-card-title">Unique Visitors</div>
              <div className="db-card-desc">{timeLabel}</div>
            </div>
            <div className="db-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChartContainer
                config={{ visitors: { label: "Visitors", color: "#1C6B45" } }}
                className="mx-auto aspect-square max-h-[220px]"
              >
                <RadialBarChart
                  data={[{ visitors: uniqueVisitors, fill: "#1C6B45" }]}
                  startAngle={90}
                  endAngle={90 + (uniqueVisitors > 0 ? 270 : 0)}
                  innerRadius={70}
                  outerRadius={110}
                >
                  <PolarGrid
                    gridType="circle" radialLines={false} stroke="none"
                    className="first:fill-muted last:fill-background"
                    polarRadius={[76, 64]}
                  />
                  <RadialBar dataKey="visitors" background cornerRadius={6} />
                  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan
                                x={viewBox.cx} y={viewBox.cy}
                                style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 600, fill: "var(--fg)" }}
                              >
                                {uniqueVisitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx} y={(viewBox.cy || 0) + 22}
                                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.55rem", letterSpacing: "0.1em", fill: "var(--muted)", textTransform: "uppercase" }}
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
            </div>
          </div>

          {/* Area chart */}
          <div className="db-card">
            <div className="db-card-hdr">
              <div className="db-card-title">Traffic Trend</div>
              <div className="db-card-desc">
                {timeRange === "24h" ? "Hourly views" : "Daily views"} — {timeLabel}
              </div>
            </div>
            <div className="db-card-body">
              {timeSeriesData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[220px] w-full">
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1C6B45" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#1C6B45" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date" tickLine={false} axisLine={false}
                      tickMargin={8} minTickGap={32}
                      tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fill: "var(--muted)", letterSpacing: "0.05em" }}
                      tickFormatter={tickFormat}
                    />
                    <ChartTooltip content={<ChartTooltipContent hideIndicator className="min-w-[160px]" />} cursor={false} />
                    <Area dataKey="views" type="monotone" fill="url(#fillViews)" stroke="#1C6B45" strokeWidth={1.5} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="db-section-lbl">No data available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Browsers + Top Pages */}
      <div>
        <div className="db-section-hdr">
          <span className="db-section-lbl">Breakdown</span>
          <div className="db-section-line" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }} className="breakdown-grid">
          {/* Top Browsers */}
          <div className="db-card">
            <div className="db-card-hdr">
              <div className="db-card-title">Top Browsers</div>
              <div className="db-card-desc">Distribution by visitors</div>
            </div>
            <div className="db-card-body">
              {topBrowsers.length > 0 ? (
                topBrowsers.map((browser: TopBrowser, i: number) => {
                  const total = topBrowsers.reduce((sum: number, b: TopBrowser) => sum + (b.count || 0), 0);
                  const pct = total > 0 ? ((browser.count / total) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={i} className="db-browser-row">
                      <div className="db-browser-meta">
                        <span className="db-browser-name">{browser.browser}</span>
                        <span className="db-browser-count">{browser.count.toLocaleString()} · {pct}%</span>
                      </div>
                      <div className="db-browser-track">
                        <div className="db-browser-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <span className="db-section-lbl">No browser data</span>
                </div>
              )}
            </div>
          </div>

          {/* Top Pages */}
          <div className="db-card">
            <div className="db-card-hdr">
              <div className="db-card-title">Top Pages</div>
              <div className="db-card-desc">Most visited pages on your site</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Views</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.length > 0 ? (
                    topPages.map((page: TopPage, i: number) => {
                      const pct = totalPageViews > 0
                        ? (((page.count || 0) / totalPageViews) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span className="db-table-index">{i + 1}</span>
                              <span className="db-table-path">{page.path}</span>
                            </div>
                          </td>
                          <td><span className="db-table-count">{(page.count || 0).toLocaleString()}</span></td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="db-bar-track">
                                <div className="db-bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="db-bar-pct">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", padding: "32px 0" }}>
                        <span className="db-section-lbl">No page data available yet</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ─── Export ─────────────────────────────────────────────── */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsDashboard />
    </QueryClientProvider>
  );
}