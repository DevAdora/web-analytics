// components/DashboardHeader.tsx
"use client";

import { createClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, PlusCircle, RefreshCw, Activity } from "lucide-react";

interface DashboardHeaderProps {
  userEmail: string;
  /** ISO string or Date of last data sync */
  lastSyncedAt?: Date | null;
  /** Whether auto-refresh is active */
  autoRefresh?: boolean;
  onToggleRefresh?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Selected time range value */
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

const HEADER_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .dh-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--card, #FFFFFF);
    border-bottom: 1px solid var(--border, #E0DED7);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px; gap: 16px;
  }

  .dh-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; font-weight: 600;
    color: var(--fg, #0D0D0B); text-decoration: none;
    letter-spacing: -0.02em; flex-shrink: 0;
  }

  .dh-meta {
    display: flex; align-items: center; gap: 20px;
    flex: 1; padding: 0 24px;
  }

  .dh-pill {
    display: inline-flex; align-items: center; gap: 7px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.06em;
    color: var(--muted, #7A7A72);
  }

  .dh-pulse {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent, #1C6B45);
    animation: dh-pulse-anim 2s ease-in-out infinite;
  }
  .dh-pulse.off { background: var(--muted, #7A7A72); animation: none; }
  @keyframes dh-pulse-anim { 0%,100%{opacity:1} 50%{opacity:.3} }

  .dh-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .dh-select {
    padding: 7px 28px 7px 12px;
    border-radius: 3px; outline: none; cursor: pointer;
    background: var(--input-bg, #FAFAF8);
    color: var(--fg, #0D0D0B);
    border: 1px solid var(--border, #E0DED7);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.06em;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A7A72' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 10px center;
    transition: border-color 0.18s;
  }
  .dh-select:focus { border-color: var(--accent, #1C6B45); }

  .dh-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 13px; border-radius: 3px; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.06em; text-transform: uppercase;
    border: 1px solid var(--border, #E0DED7); background: transparent;
    color: var(--muted, #7A7A72); white-space: nowrap;
    transition: border-color 0.18s, color 0.18s;
  }
  .dh-btn:hover { border-color: var(--fg, #0D0D0B); color: var(--fg, #0D0D0B); }
  .dh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dh-btn svg { width: 12px; height: 12px; }

  .dh-btn-primary {
    background: var(--fg, #0D0D0B); color: var(--bg, #F6F5F1);
    border-color: var(--fg, #0D0D0B);
  }
  .dh-btn-primary:hover { opacity: 0.78; color: var(--bg, #F6F5F1); border-color: var(--fg, #0D0D0B); }

  .dh-btn-live {
    background: var(--accent-light, #E8F5EE);
    color: var(--accent, #1C6B45);
    border-color: var(--accent, #1C6B45);
  }
  .dh-btn-live.off {
    background: transparent;
    color: var(--muted, #7A7A72);
    border-color: var(--border, #E0DED7);
  }

  .dh-btn-ghost { color: var(--muted, #7A7A72); }
  .dh-btn-ghost:hover { color: #991B1B; border-color: #FECACA; }

  .spin { animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .dh-nav { padding: 0 16px; }
    .dh-meta { display: none; }
    .dh-btn span { display: none; }
  }
`;

export default function DashboardHeader({
  userEmail,
  lastSyncedAt,
  autoRefresh = true,
  onToggleRefresh,
  onRefresh,
  isRefreshing = false,
  timeRange = "7d",
  onTimeRangeChange,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

  return (
    <>
      <style>{HEADER_STYLES}</style>
      <nav className="dh-nav">
        {/* Logo */}
        <Link href="/" className="dh-logo">Analytique</Link>

        {/* Meta info */}
        <div className="dh-meta">
          <span className="dh-pill">
            <div className={`dh-pulse ${autoRefresh ? "" : "off"}`} />
            {lastSyncedAt ? formatTime(lastSyncedAt) : "—"}
          </span>
          <span className="dh-pill">{userEmail}</span>
        </div>

        {/* Actions */}
        <div className="dh-actions">
          <ThemeToggle />

          {onTimeRangeChange && (
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="dh-select"
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          )}

          {onToggleRefresh && (
            <button
              onClick={onToggleRefresh}
              className={`dh-btn dh-btn-live ${autoRefresh ? "" : "off"}`}
            >
              <Activity />
              <span>{autoRefresh ? "Live" : "Paused"}</span>
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="dh-btn"
            >
              <RefreshCw className={isRefreshing ? "spin" : ""} />
              <span>Refresh</span>
            </button>
          )}

          <button
            className="dh-btn dh-btn-primary"
            onClick={() => router.push("/dashboard/add")}
          >
            <PlusCircle />
            <span>Add Site</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="dh-btn dh-btn-ghost"
            title="Logout"
          >
            <LogOut />
          </button>
        </div>
      </nav>
    </>
  );
}