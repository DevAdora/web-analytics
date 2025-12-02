"use client"; 

import React, { useState } from "react";
import { Globe, Copy, Check, Plus, ExternalLink, Code } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Add New Website
          </h1>
          <p className="text-gray-400">
            Register your website and get started with analytics in seconds
          </p>
        </div>

        {/* Input Fields */}
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="My Awesome Website"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {formData.name && (
                <p className="text-xs text-gray-500 mt-2">
                  Site ID will be:{" "}
                  <span className="text-blue-400 font-mono">
                    {generateSiteId(formData.name)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.domain}
                onChange={(e) =>
                  setFormData({ ...formData, domain: e.target.value })
                }
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !formData.name || !formData.domain}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Website
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message with Script */}
        {newSite && (
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-1">
                  Website Added Successfully!
                </h3>
                <p className="text-gray-300 text-sm">
                  Your site{" "}
                  <span className="font-semibold">{newSite.name}</span> is now
                  registered.
                </p>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Code className="w-5 h-5 text-blue-400" />
                <h4 className="font-semibold">Installation Instructions</h4>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-300">
                  Copy and paste this one-line script into your website's{" "}
                  <code className="px-2 py-1 bg-[#0a0a0a] rounded text-blue-400">
                    &lt;head&gt;
                  </code>{" "}
                  section or before the closing{" "}
                  <code className="px-2 py-1 bg-[#0a0a0a] rounded text-blue-400">
                    &lt;/body&gt;
                  </code>{" "}
                  tag:
                </p>

                <div className="relative">
                  <pre className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm">
                    <code className="text-green-400">
                      {getTrackingScript(newSite.siteId)}
                    </code>
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(getTrackingScript(newSite.siteId))
                    }
                    className="absolute top-2 right-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example */}
              <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Example for Next.js:
                </p>
                <pre className="text-xs text-gray-300 overflow-x-auto">
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
              <div className="flex gap-3 pt-2">
                <a
                  href={`/dashboard?site=${newSite.siteId}`}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Analytics
                </a>
                <button
                  onClick={() => setNewSite(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-all"
                >
                  Add Another Site
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-1">One-Line Setup</h3>
            <p className="text-sm text-gray-400">
              Just one script tag - no configuration needed
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
              <Code className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-1">Automatic Tracking</h3>
            <p className="text-sm text-gray-400">
              Page views tracked automatically on every page
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
              <ExternalLink className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="font-semibold mb-1">Real-Time Data</h3>
            <p className="text-sm text-gray-400">
              See your analytics update in real-time
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
