"use client";

import React, { useState } from "react";

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

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

  :root {
    --bg: #F6F5F1; --fg: #0D0D0B; --accent: #1C6B45;
    --accent-light: #E8F5EE; --muted: #7A7A72;
    --border: #E0DED7; --card: #FFFFFF; --input-bg: #FAFAF8;
    --success-bg: #F0FAF5; --success-border: #A7D9BB;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0D0D0B; --fg: #F6F5F1; --accent: #3DD68C;
      --accent-light: #0D2B1E; --muted: #8A8A82;
      --border: #222220; --card: #141412; --input-bg: #1A1A18;
      --success-bg: #0D2B1E; --success-border: #1C6B45;
    }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .add-root {
    min-height: 100vh;
    background: var(--bg);
    color: var(--fg);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    position: relative;
  }
  .add-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none; z-index: 0; opacity: 0.65;
  }

  /* Nav */
  .add-nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--card); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px; height: 56px;
  }
  .add-nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; font-weight: 600;
    color: var(--fg); text-decoration: none; letter-spacing: -0.02em;
  }
  .add-nav-back {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted); text-decoration: none; transition: color 0.18s;
  }
  .add-nav-back:hover { color: var(--fg); }

  /* Content */
  .add-content {
    position: relative; z-index: 1;
    max-width: 720px; margin: 0 auto;
    padding: 40px 24px 72px;
  }

  /* Header */
  .add-header { margin-bottom: 36px; }
  .add-kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .add-kicker::before {
    content: ''; display: block; width: 16px; height: 1px; background: var(--accent);
  }
  .add-title {
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem; font-weight: 600;
    letter-spacing: -0.03em; line-height: 1.08; color: var(--fg);
    margin-bottom: 10px;
  }
  .add-title em { font-style: italic; color: var(--accent); font-weight: 400; }
  .add-sub { font-size: 0.875rem; line-height: 1.7; color: var(--muted); }

  /* Section header */
  .add-shdr { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .add-slbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); white-space: nowrap;
  }
  .add-sline { flex: 1; height: 1px; background: var(--border); }

  /* Form card */
  .add-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 4px; padding: 28px 28px 24px;
    margin-bottom: 24px;
  }

  .add-field { margin-bottom: 20px; }
  .add-field:last-of-type { margin-bottom: 0; }

  .add-label {
    display: block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
  }

  .add-input {
    width: 100%; padding: 11px 14px;
    background: var(--input-bg); color: var(--fg);
    border: 1px solid var(--border); border-radius: 3px;
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 400;
    outline: none; transition: border-color 0.18s; -webkit-appearance: none;
  }
  .add-input::placeholder { color: var(--muted); opacity: 0.55; }
  .add-input:focus { border-color: var(--accent); }

  .add-hint {
    margin-top: 7px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.62rem; color: var(--muted);
    display: flex; align-items: center; gap: 6px;
  }
  .add-hint-val { color: var(--accent); letter-spacing: 0.04em; }

  .add-divider { height: 1px; background: var(--border); margin: 22px 0; }

  .add-submit {
    width: 100%; padding: 13px 20px;
    background: var(--fg); color: var(--bg);
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
    border: none; border-radius: 3px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity 0.18s; letter-spacing: 0.01em;
  }
  .add-submit:hover:not(:disabled) { opacity: 0.78; }
  .add-submit:disabled { opacity: 0.38; cursor: not-allowed; }
  .add-spinner {
    width: 14px; height: 14px; border: 1.5px solid currentColor;
    border-top-color: transparent; border-radius: 50%;
    animation: spin 0.7s linear infinite; opacity: 0.6;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Success card */
  .success-card {
    background: var(--success-bg); border: 1px solid var(--success-border);
    border-radius: 4px; overflow: hidden; margin-bottom: 24px;
  }

  .success-top {
    padding: 24px 28px 20px;
    border-bottom: 1px solid var(--success-border);
    display: flex; align-items: flex-start; gap: 16px;
  }
  .success-mark {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--accent-light); border: 1px solid var(--accent);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .success-mark svg { width: 16px; height: 16px; stroke: var(--accent); fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .success-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem; font-weight: 600; letter-spacing: -0.02em;
    color: var(--fg); margin-bottom: 4px;
  }
  .success-sub { font-size: 0.82rem; color: var(--muted); line-height: 1.55; }
  .success-sub strong { color: var(--fg); font-weight: 500; }

  .success-body { padding: 24px 28px 26px; }

  .install-step {
    margin-bottom: 20px;
  }
  .install-step-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
  }
  .install-step p {
    font-size: 0.82rem; line-height: 1.65; color: var(--muted);
    margin-bottom: 10px;
  }
  .install-step code {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem; color: var(--fg);
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: 2px; padding: 1px 6px;
  }

  /* Code block */
  .code-block {
    position: relative;
    background: #0D0D0B; border: 1px solid var(--border);
    border-radius: 3px; overflow: hidden;
  }
  .code-block pre {
    padding: 16px 20px; overflow-x: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.75rem; line-height: 1.7; color: #3DD68C;
  }
  .code-copy {
    position: absolute; top: 10px; right: 10px;
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px; border-radius: 2px; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase;
    background: rgba(255,255,255,0.08); color: #8A8A82;
    border: 1px solid rgba(255,255,255,0.12); transition: all 0.15s;
  }
  .code-copy:hover { background: rgba(255,255,255,0.14); color: #F6F5F1; }
  .code-copy.copied { color: #3DD68C; border-color: rgba(61,214,140,0.3); }
  .code-copy svg { width: 11px; height: 11px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  /* Example block */
  .example-block {
    background: var(--input-bg); border: 1px solid var(--border);
    border-radius: 3px; overflow: hidden;
  }
  .example-block-label {
    padding: 8px 16px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 8px;
  }
  .example-block-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
  .example-block pre {
    padding: 14px 16px; overflow-x: auto;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.72rem; line-height: 1.75; color: var(--fg);
  }

  .success-actions {
    display: flex; gap: 10px; margin-top: 22px; flex-wrap: wrap;
  }
  .action-primary {
    flex: 1; min-width: 140px; padding: 11px 20px; border-radius: 3px; cursor: pointer;
    background: var(--fg); color: var(--bg); border: none;
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
    text-decoration: none; display: inline-flex; align-items: center;
    justify-content: center; gap: 7px; transition: opacity 0.18s;
  }
  .action-primary:hover { opacity: 0.78; }
  .action-primary svg { width: 13px; height: 13px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .action-ghost {
    padding: 11px 20px; border-radius: 3px; cursor: pointer;
    background: transparent; color: var(--muted);
    border: 1px solid var(--border);
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 400;
    transition: all 0.18s;
  }
  .action-ghost:hover { border-color: var(--fg); color: var(--fg); }

  /* Feature grid */
  .add-feat-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--border);
    border: 1px solid var(--border); border-radius: 4px; overflow: hidden;
  }
  .add-feat {
    background: var(--card); padding: 22px 20px;
    transition: background 0.15s; cursor: default;
  }
  .add-feat:hover { background: var(--accent-light); }
  .add-feat-idx {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; color: var(--accent); letter-spacing: 0.08em; margin-bottom: 12px;
  }
  .add-feat-name {
    font-size: 0.875rem; font-weight: 500; color: var(--fg); margin-bottom: 6px;
    letter-spacing: -0.01em;
  }
  .add-feat-desc { font-size: 0.78rem; line-height: 1.55; color: var(--muted); }

  /* Responsive */
  @media (max-width: 640px) {
    .add-nav { padding: 0 16px; }
    .add-content { padding: 28px 16px 56px; }
    .add-title { font-size: 1.8rem; }
    .add-card { padding: 20px 18px 18px; }
    .success-top { padding: 18px 18px 16px; gap: 12px; }
    .success-body { padding: 18px 18px 20px; }
    .add-feat-grid { grid-template-columns: 1fr; }
    .success-actions { flex-direction: column; }
    .action-primary, .action-ghost { width: 100%; justify-content: center; text-align: center; }
  }
`;

const features = [
  { name: "One-line Setup", desc: "A single script tag is all it takes — no SDK, no config." },
  { name: "Automatic Tracking", desc: "Page views tracked on every navigation, zero extra code." },
  { name: "Real-time Data", desc: "Analytics update live as your visitors browse." },
];

export default function AddSiteView() {
  const [formData, setFormData] = useState<FormData>({ name: "", domain: "" });
  const [newSite, setNewSite] = useState<NewSite | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateSiteId = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setLoading(true);
    const siteId = generateSiteId(formData.name);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, name: formData.name, domain: formData.domain }),
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

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://your-analytics-app.vercel.app";

  const getTrackingScript = (siteId: string) =>
    `<script src="${origin}/track.js" data-site-id="${siteId}" async></script>`;

  const getNextjsExample = (siteId: string) =>
    `// app/layout.tsx
export default function Layout({ children }) {
  return (
    <html>
      <head>
        <script
          src="${origin}/track.js"
          data-site-id="${siteId}"
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className="add-root">

        {/* Nav */}
        <nav className="add-nav">
          <a href="/" className="add-nav-logo">Analytique</a>
          <a href="/dashboard" className="add-nav-back">← Dashboard</a>
        </nav>

        <div className="add-content">

          {/* Header */}
          <div className="add-header">
            <div className="add-kicker">Register a site</div>
            <h1 className="add-title">
              Add a new<br /><em>website</em>
            </h1>
            <p className="add-sub">
              Register your website and get a one-line tracking script.
              No configuration needed — just paste and go.
            </p>
          </div>

          {/* ── Form ── */}
          {!newSite && (
            <>
              <div className="add-shdr">
                <span className="add-slbl">Site details</span>
                <div className="add-sline" />
              </div>

              <div className="add-card">
                <div className="add-field">
                  <label className="add-label">Website Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Awesome Website"
                    className="add-input"
                    autoComplete="off"
                  />
                  {formData.name && (
                    <div className="add-hint">
                      Site ID →
                      <span className="add-hint-val">{generateSiteId(formData.name)}</span>
                    </div>
                  )}
                </div>

                <div className="add-field">
                  <label className="add-label">Website URL</label>
                  <input
                    type="url"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="https://example.com"
                    className="add-input"
                  />
                </div>

                <div className="add-divider" />

                <button
                  onClick={handleSubmit}
                  disabled={loading || !formData.name.trim() || !formData.domain.trim()}
                  className="add-submit"
                >
                  {loading ? (
                    <><div className="add-spinner" /> Adding site...</>
                  ) : (
                    "Add Website →"
                  )}
                </button>
              </div>
            </>
          )}

          {/* ── Success ── */}
          {newSite && (
            <>
              <div className="add-shdr">
                <span className="add-slbl">Site registered</span>
                <div className="add-sline" />
              </div>

              <div className="success-card">
                <div className="success-top">
                  <div className="success-mark">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <div className="success-title">{newSite.name} is live</div>
                    <div className="success-sub">
                      Site ID: <strong>{newSite.siteId}</strong> — now paste the script below into your site.
                    </div>
                  </div>
                </div>

                <div className="success-body">
                  <div className="install-step">
                    <div className="install-step-label">Step 1 — Copy the script</div>
                    <p>
                      Paste this into the <code>&lt;head&gt;</code> of your page or just before the closing <code>&lt;/body&gt;</code> tag.
                    </p>
                    <div className="code-block">
                      <pre>{getTrackingScript(newSite.siteId)}</pre>
                      <button
                        onClick={() => copyToClipboard(getTrackingScript(newSite.siteId))}
                        className={`code-copy ${copied ? "copied" : ""}`}
                      >
                        {copied ? (
                          <>
                            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="install-step">
                    <div className="install-step-label">Step 2 — Framework example</div>
                    <div className="example-block">
                      <div class="example-block-label" style="padding:8px 16px;font-family:'IBM Plex Mono',monospace;font-size:.58rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;">
                        <span class="example-block-dot" style="width:5px;height:5px;border-radius:50%;background:var(--accent);"></span>
                        Next.js · app/layout.tsx
                      </div>
                      <pre style="padding:14px 16px;overflow-x:auto;font-family:'IBM Plex Mono',monospace;font-size:.72rem;line-height:1.75;color:var(--fg);">{getNextjsExample(newSite.siteId)}</pre>
                    </div>
                  </div>

                  <div className="success-actions">
                    <a href={`/dashboard?site=${newSite.siteId}`} className="action-primary">
                      <svg viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                      View Analytics
                    </a>
                    <button onClick={() => setNewSite(null)} className="action-ghost">
                      Add Another Site
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Features ── */}
          <div className="add-shdr">
            <span className="add-slbl">What you get</span>
            <div className="add-sline" />
          </div>

          <div className="add-feat-grid">
            {features.map((f, i) => (
              <div key={f.name} className="add-feat">
                <div className="add-feat-idx">{String(i + 1).padStart(2, "0")}</div>
                <div className="add-feat-name">{f.name}</div>
                <div className="add-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}