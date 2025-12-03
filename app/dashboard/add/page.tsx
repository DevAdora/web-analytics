"use client";

import React, { useState } from "react";
import {
  Globe,
  Copy,
  Check,
  Plus,
  ExternalLink,
  Code,
  Zap,
  TrendingUp,
} from "lucide-react";

interface FormData {
  name: string;
  domain: string;
}

interface NewSite {
  id: string;
  site_id: string;
  siteId: string;
  name: string;
  domain: string;
  created_at: string;
  is_active: boolean;
}

export default function AddSiteView() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    domain: "",
  });
  const [newSite, setNewSite] = useState<NewSite | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const generateSiteId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    const siteId = generateSiteId(formData.name);

    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          name: formData.name,
          domain: formData.domain,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setNewSite({ ...data.site, siteId });
        setFormData({ name: "", domain: "" });
      } else {
        alert("Failed to add site: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error adding site:", error);
      alert("Failed to add site. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTrackingScript = (siteId: string): string => {
    const analyticsUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://your-analytics-app.vercel.app";

    return `<script src="${analyticsUrl}/track.js" data-site-id="${siteId}" async></script>`;
  };

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-slate-900">
            Add New Website
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Register your website and get started with analytics in seconds
          </p>
        </div>

        {/* Input Fields */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="space-y-5 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Awesome Website"
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              />
              {formData.name && (
                <p className="text-xs text-slate-500 mt-2">
                  Site ID will be:{" "}
                  <span className="text-slate-900 font-mono font-semibold">
                    {generateSiteId(formData.name)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.domain}
              className="w-full px-6 py-2.5 sm:py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span className="hidden sm:inline">Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Add Website</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message with Script */}
        {newSite && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 space-y-5 sm:space-y-6 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
                  Website Added Successfully!
                </h3>
                <p className="text-slate-700 text-sm">
                  Your site{" "}
                  <span className="font-semibold">{newSite.name}</span> is now
                  registered.
                </p>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Code className="w-5 h-5 text-slate-700" />
                <h4 className="font-semibold text-sm sm:text-base">
                  Installation Instructions
                </h4>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-700">
                  Copy and paste this one-line script into your website's{" "}
                  <code className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-900 text-xs">
                    &lt;head&gt;
                  </code>{" "}
                  section or before the closing{" "}
                  <code className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-900 text-xs">
                    &lt;/body&gt;
                  </code>{" "}
                  tag:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
                    <code className="text-green-400">
                      {getTrackingScript(newSite.siteId)}
                    </code>
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(getTrackingScript(newSite.siteId))
                    }
                    className="absolute top-2 right-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm rounded-lg transition-all flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example */}
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs text-slate-600 mb-2 font-medium">
                  Example for Next.js:
                </p>
                <pre className="text-xs text-slate-800 overflow-x-auto">
                  {`// app/layout.tsx
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <script 
          src="${
            typeof window !== "undefined"
              ? window.location.origin
              : "https://your-analytics.vercel.app"
          }/track.js" 
          data-site-id="${newSite.siteId}" 
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`}
                </pre>
              </div>

              {/* Quick Links */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`/dashboard?site=${newSite.siteId}`}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Analytics
                </a>
                <button
                  onClick={() => setNewSite(null)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-medium rounded-lg transition-all"
                >
                  Add Another Site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-semibold mb-1 text-slate-900 text-sm sm:text-base">
              One-Line Setup
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Just one script tag - no configuration needed
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-semibold mb-1 text-slate-900 text-sm sm:text-base">
              Automatic Tracking
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Page views tracked automatically on every page
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="font-semibold mb-1 text-slate-900 text-sm sm:text-base">
              Real-Time Data
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              See your analytics update in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
