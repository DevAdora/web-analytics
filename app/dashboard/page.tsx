"use client";

import { useEffect, useState } from "react";

interface TopPage {
  path: string;
  count: number;
}

interface AnalyticsResponse {
  siteId: string;
  totalPageViews: number;
  uniqueVisitors: number;
  topPages: TopPage[];
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState("arc-tech");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await fetch(`/api/analytics?siteId=${siteId}`);
      const json = await res.json();
      setData(json);
      setLoading(false);
    };

    fetchAnalytics();
  }, [siteId]);

  return (
    <main className="min-h-screen bg-[#080807] text-white p-8 font-onest">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">
        Analytics Dashboard
      </h1>

      <div className="mb-6">
        <label className="mr-2 text-sm uppercase tracking-wide">Site ID:</label>
        <input
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
          className="px-3 py-2 rounded bg-[#111] border border-gray-700 text-sm"
        />
      </div>

      {loading && <p>Loading...</p>}

      {!loading && data && !data.error && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#111] p-4 rounded-xl">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Total Page Views (7d)
              </p>
              <p className="text-2xl font-semibold">{data.totalPageViews}</p>
            </div>
            <div className="bg-[#111] p-4 rounded-xl">
              <p className="text-xs text-gray-400 uppercase tracking-wide">
                Unique Visitors (7d)
              </p>
              <p className="text-2xl font-semibold">{data.uniqueVisitors}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Top Pages</h2>
            <div className="bg-[#111] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black/40">
                  <tr>
                    <th className="text-left px-4 py-2">Path</th>
                    <th className="text-left px-4 py-2">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page) => (
                    <tr key={page.path} className="border-t border-white/5">
                      <td className="px-4 py-2">{page.path}</td>
                      <td className="px-4 py-2">{page.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!loading && (data as any)?.error && (
        <p className="text-red-400 text-sm mt-4">
          Error: {(data as any).error}
        </p>
      )}
    </main>
  );
}
