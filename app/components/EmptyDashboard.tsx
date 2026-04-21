"use client";

import Link from "next/link";

const EMPTY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

  .ed-root {
    min-height: 100vh;
    background: var(--bg, #F6F5F1);
    color: var(--fg, #0D0D0B);
    font-family: 'DM Sans', sans-serif;
    font-weight: 300;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    position: relative;
  }
  .ed-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image: radial-gradient(circle, var(--border, #E0DED7) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none; z-index: 0; opacity: 0.65;
  }

  .ed-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 640px;
    background: var(--card, #FFFFFF);
    border: 1px solid var(--border, #E0DED7);
    border-radius: 4px;
    overflow: hidden;
  }

  .ed-top {
    padding: 48px 40px 36px;
    border-bottom: 1px solid var(--border, #E0DED7);
  }

  .ed-kicker {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--accent, #1C6B45);
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }
  .ed-kicker::before {
    content: ''; display: block;
    width: 16px; height: 1px; background: var(--accent, #1C6B45);
  }

  .ed-title {
    font-family: 'Playfair Display', serif;
    font-size: 2rem; font-weight: 600;
    letter-spacing: -0.03em; line-height: 1.1;
    color: var(--fg, #0D0D0B);
    margin-bottom: 12px;
  }

  .ed-title em {
    font-style: italic;
    color: var(--accent, #1C6B45);
    font-weight: 400;
  }

  .ed-sub {
    font-size: 0.875rem; line-height: 1.7;
    color: var(--muted, #7A7A72);
    max-width: 460px;
    margin-bottom: 28px;
  }

  .ed-cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px; border-radius: 3px;
    background: var(--fg, #0D0D0B); color: var(--bg, #F6F5F1);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem; font-weight: 500;
    text-decoration: none; border: none; cursor: pointer;
    transition: opacity 0.18s;
  }
  .ed-cta:hover { opacity: 0.78; }
  .ed-cta svg { width: 14px; height: 14px; }

  .ed-features {
    padding: 32px 40px 36px;
  }

  .ed-feat-hdr {
    display: flex; align-items: center; gap: 16px;
    margin-bottom: 24px;
  }
  .ed-feat-lbl {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted, #7A7A72); white-space: nowrap;
  }
  .ed-feat-line { flex: 1; height: 1px; background: var(--border, #E0DED7); }

  .ed-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--border, #E0DED7);
    border: 1px solid var(--border, #E0DED7);
    border-radius: 3px; overflow: hidden;
  }

  .ed-feat {
    background: var(--card, #FFFFFF);
    padding: 20px 18px;
    transition: background 0.15s;
  }
  .ed-feat:hover { background: var(--accent-light, #E8F5EE); }

  .ed-feat-idx {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.58rem; color: var(--accent, #1C6B45);
    letter-spacing: 0.08em; margin-bottom: 10px; opacity: 0.9;
  }

  .ed-feat-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.82rem; font-weight: 500;
    color: var(--fg, #0D0D0B); margin-bottom: 5px;
    letter-spacing: -0.01em;
  }

  .ed-feat-desc {
    font-size: 0.75rem; line-height: 1.55;
    color: var(--muted, #7A7A72);
  }

  @media (max-width: 540px) {
    .ed-top { padding: 32px 24px 28px; }
    .ed-features { padding: 24px 24px 28px; }
    .ed-title { font-size: 1.6rem; }
    .ed-grid { grid-template-columns: 1fr; }
  }
`;

const features = [
  {
    name: "Track Visitors",
    desc: "Real-time visitor counts and page views across all your sites.",
  },
  {
    name: "View Analytics",
    desc: "Detailed insights into traffic trends, bounce rates, and sessions.",
  },
  {
    name: "Manage Sites",
    desc: "Add multiple properties and switch between them instantly.",
  },
];

export default function EmptyDashboard() {
  return (
    <>
      <style>{EMPTY_STYLES}</style>
      <div className="ed-root">
        <div className="ed-card">
          {/* Top section */}
          <div className="ed-top">
            <div className="ed-kicker">Getting started</div>
            <h1 className="ed-title">
              Your dashboard<br />is <em>ready to go.</em>
            </h1>
            <p className="ed-sub">
              You haven't added any websites yet. Add your first site to start
              collecting privacy-friendly analytics — no cookies, no consent banners.
            </p>
            <Link href="/dashboard/add" className="ed-cta">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Add Your First Website →
            </Link>
          </div>

          {/* Features section */}
          <div className="ed-features">
            <div className="ed-feat-hdr">
              <span className="ed-feat-lbl">What you can track</span>
              <div className="ed-feat-line" />
            </div>
            <div className="ed-grid">
              {features.map((f, i) => (
                <div key={f.name} className="ed-feat">
                  <div className="ed-feat-idx">{String(i + 1).padStart(2, "0")}</div>
                  <div className="ed-feat-name">{f.name}</div>
                  <div className="ed-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}