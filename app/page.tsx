"use client";

import Link from "next/link";

const features = [
  {
    label: "Real-time Tracking",
    description: "Live visitor data with sub-second latency across all your sites.",
  },
  {
    label: "Zero Cookies",
    description: "Fully GDPR-compliant by design. No consent banners required.",
  },
  {
    label: "Multi-site",
    description: "Manage all your properties from a single unified dashboard.",
  },
  {
    label: "Open Source",
    description: "Audit every line. Contribute. Own your analytics stack entirely.",
  },
  {
    label: "One Script",
    description: "A single lightweight tag is all it takes to get started.",
  },
  {
    label: "Self-hosted",
    description: "Deploy on your infrastructure. Your data never leaves your servers.",
  },
];

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --bg: #F6F5F1;
          --fg: #0D0D0B;
          --accent: #1C6B45;
          --accent-light: #E8F5EE;
          --muted: #7A7A72;
          --border: #E0DED7;
          --card-bg: #FFFFFF;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0D0D0B;
            --fg: #F6F5F1;
            --accent: #3DD68C;
            --accent-light: #0D2B1E;
            --muted: #8A8A82;
            --border: #222220;
            --card-bg: #141412;
          }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .page-root {
          min-height: 100vh;
          background-color: var(--bg);
          color: var(--fg);
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle dot grid background */
        .page-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.7;
        }

        .container {
          position: relative;
          z-index: 1;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Nav */
        .nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 28px 0;
          border-bottom: 1px solid var(--border);
        }

        .nav-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--fg);
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .nav-badge {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--accent);
          background: var(--accent-light);
          padding: 4px 10px;
          border-radius: 2px;
        }

        /* Hero */
        .hero {
          padding: 80px 0 72px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: end;
        }

        .hero-left {}

        .hero-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hero-kicker::before {
          content: '';
          display: block;
          width: 20px;
          height: 1px;
          background: var(--accent);
        }

        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(2.8rem, 5vw, 4.2rem);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: var(--fg);
          margin-bottom: 24px;
        }

        .hero-title em {
          font-style: italic;
          color: var(--accent);
        }

        .hero-desc {
          font-size: 1rem;
          line-height: 1.75;
          color: var(--muted);
          max-width: 420px;
        }

        .hero-right {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: flex-start;
          padding-bottom: 4px;
        }

        .hero-stat {
          width: 100%;
          padding: 20px 24px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .hero-stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: var(--fg);
          letter-spacing: -0.04em;
          line-height: 1;
        }

        .hero-stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
        }

        /* CTA */
        .cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 32px 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: var(--fg);
          color: var(--bg);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          border-radius: 3px;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .btn-primary:hover { opacity: 0.78; }

        .btn-primary .arrow {
          font-size: 0.75rem;
          opacity: 0.7;
          transition: transform 0.2s;
        }

        .btn-primary:hover .arrow { transform: translateX(3px); }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 28px;
          background: transparent;
          color: var(--fg);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 400;
          border: 1px solid var(--border);
          border-radius: 3px;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-secondary:hover {
          border-color: var(--fg);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 13px 20px;
          background: transparent;
          color: var(--muted);
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.04em;
          border-radius: 3px;
          text-decoration: none;
          transition: color 0.2s;
        }

        .btn-ghost:hover { color: var(--fg); }

        /* Features */
        .features-section {
          padding: 64px 0 80px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
        }

        .section-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--muted);
        }

        .section-line {
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }

        .feature-card {
          background: var(--card-bg);
          padding: 28px 24px;
          transition: background 0.2s;
        }

        .feature-card:hover {
          background: var(--accent-light);
        }

        .feature-index {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.6rem;
          color: var(--accent);
          letter-spacing: 0.08em;
          margin-bottom: 16px;
          opacity: 0.8;
        }

        .feature-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--fg);
          margin-bottom: 8px;
          letter-spacing: -0.01em;
        }

        .feature-desc {
          font-size: 0.82rem;
          line-height: 1.6;
          color: var(--muted);
        }

        /* Footer */
        .footer {
          padding: 24px 0;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-copy {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.06em;
          color: var(--muted);
        }

        .footer-links {
          display: flex;
          gap: 20px;
        }

        .footer-link {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-link:hover { color: var(--fg); }

        /* Responsive */
        @media (max-width: 768px) {
          .nav { padding: 20px 0; }

          .hero {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 52px 0 48px;
          }

          .hero-right {
            flex-direction: row;
            overflow-x: auto;
            gap: 10px;
            padding-bottom: 0;
          }

          .hero-stat {
            min-width: 160px;
            flex-direction: column;
            gap: 6px;
          }

          .hero-stat-number { font-size: 1.6rem; }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .features-section { padding: 48px 0 60px; }
          .footer { flex-direction: column; align-items: flex-start; gap: 16px; }
        }

        @media (max-width: 480px) {
          .container { padding: 0 18px; }
          .hero { padding: 40px 0 36px; }
          .hero-title { font-size: 2.4rem; }
          .btn-primary, .btn-secondary { padding: 12px 22px; width: 100%; justify-content: center; }
          .cta-row { flex-direction: column; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="page-root">
        <div className="container">

          {/* Nav */}
          <nav className="nav">
            <a href="/" className="nav-logo">Analytique</a>
            <span className="nav-badge">Open Source</span>
          </nav>

          {/* Hero */}
          <section className="hero">
            <div className="hero-left">
              <div className="hero-kicker">Privacy-first analytics</div>
              <h1 className="hero-title">
                Know your audience.<br />
                <em>Own your data.</em>
              </h1>
              <p className="hero-desc">
                Track what matters without compromising your visitors' privacy.
                Self-hosted, cookie-free, and built for teams that care about
                doing things the right way.
              </p>
            </div>

            <div className="hero-right">
              <div className="hero-stat">
                <span className="hero-stat-number">0</span>
                <span className="hero-stat-label">Cookies used</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">100%</span>
                <span className="hero-stat-label">Data ownership</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-number">&lt; 1kb</span>
                <span className="hero-stat-label">Script size</span>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="cta-row">
            <Link href="/auth/login" className="btn-primary">
              Sign In <span className="arrow">→</span>
            </Link>
            <Link href="/auth/signup" className="btn-secondary">
              Create Account
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
            >
              github ↗
            </a>
          </div>

          {/* Features */}
          <section className="features-section">
            <div className="section-header">
              <span className="section-label">What's included</span>
              <div className="section-line" />
            </div>

            <div className="features-grid">
              {features.map((f, i) => (
                <div key={f.label} className="feature-card">
                  <div className="feature-index">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="feature-label">{f.label}</div>
                  <div className="feature-desc">{f.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <span className="footer-copy">
              © {new Date().getFullYear()} Analytique by DevAdora — All rights reserved
            </span>
            <div className="footer-links">
              <a href="/docs" className="footer-link">Docs</a>
              <a href="/privacy" className="footer-link">Privacy</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
            </div>
          </footer>

        </div>
      </div>
    </>
  );
}