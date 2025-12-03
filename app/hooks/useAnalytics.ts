// hooks/useAnalyticsData.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
export interface Site {
  id: string;
  site_id: string;
  name: string;
  domain: string;
  is_active: boolean;
  created_at: string;
}

export interface AnalyticsData {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  timeSeriesData: { date: string; views: number }[];
  topBrowsers: { browser: string; count: number }[];
  lastUpdated: string;
  timeRange?: string;
}

export interface AllSitesAnalytics {
  type: "all";
  sites: AnalyticsData[];
  totalSites: number;
  timeRange?: string;
}

// Fetch sites
export function useSites() {
  return useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const response = await fetch("/api/sites");
      if (!response.ok) throw new Error("Failed to fetch sites");
      const data = await response.json();
      return data.sites as Site[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch analytics for a single site or all sites
export function useAnalytics(siteId: string, timeRange: string = "7d", autoRefresh: boolean = false) {
  return useQuery({
    queryKey: ["analytics", siteId, timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics?siteId=${siteId}&range=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json() as Promise<AnalyticsData | AllSitesAnalytics>;
    },
    refetchInterval: autoRefresh ? 30000 : false, // Auto-refresh every 30s
    staleTime: 30000, // 30 seconds
  });
}

// Create a new site
export function useCreateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newSite: { siteId: string; name: string; domain?: string }) => {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSite),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create site");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch sites list
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

// Update a site
export function useUpdateSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updateData: {
      siteId: string;
      name?: string;
      domain?: string;
      isActive?: boolean
    }) => {
      const response = await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update site");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });
}

// Delete a site
export function useDeleteSite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (siteId: string) => {
      const response = await fetch(`/api/sites?siteId=${siteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete site");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

// Manually refetch analytics
export function useRefreshAnalytics() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
  };
}

// Get real-time stats (optimistic updates)
export function useRealtimeStats(siteId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["realtime", siteId],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/realtime?siteId=${siteId}`);
      if (!response.ok) throw new Error("Failed to fetch realtime stats");
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 5000,
  });
}

// Prefetch analytics for better UX
export function usePrefetchAnalytics() {
  const queryClient = useQueryClient();

  return (siteId: string, timeRange: string = "7d") => {
    queryClient.prefetchQuery({
      queryKey: ["analytics", siteId, timeRange],
      queryFn: async () => {
        const response = await fetch(`/api/analytics?siteId=${siteId}&range=${timeRange}`);
        if (!response.ok) throw new Error("Failed to prefetch analytics");
        return response.json();
      },
    });
  };
}