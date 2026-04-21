"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signupError) throw signupError;
      if (!data.user) throw new Error("Failed to create user account");
      if (data.user && !data.session) {
        setSuccess(true);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred during signup.";
      setError(message);
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
          :root {
            --bg: #F6F5F1; --fg: #0D0D0B; --accent: #1C6B45;
            --accent-light: #E8F5EE; --muted: #7A7A72;
            --border: #E0DED7; --card-bg: #FFFFFF;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #0D0D0B; --fg: #F6F5F1; --accent: #3DD68C;
              --accent-light: #0D2B1E; --muted: #8A8A82;
              --border: #222220; --card-bg: #141412;
            }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .success-root {
            min-height: 100vh; background: var(--bg); color: var(--fg);
            font-family: 'DM Sans', sans-serif; display: flex;
            align-items: center; justify-content: center; padding: 20px;
            position: relative;
          }
          .success-root::before {
            content: ''; position: fixed; inset: 0;
            background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
            background-size: 28px 28px; pointer-events: none; z-index: 0; opacity: 0.7;
          }
          .success-card {
            position: relative; z-index: 1; background: var(--card-bg);
            border: 1px solid var(--border); border-radius: 4px;
            padding: 48px 40px; max-width: 400px; width: 100%; text-align: center;
          }
          .success-mark {
            width: 52px; height: 52px; border-radius: 50%;
            background: var(--accent-light); border: 1px solid var(--accent);
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
          }
          .success-mark svg { width: 22px; height: 22px; stroke: var(--accent); fill: none; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
          .success-kicker {
            font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem;
            letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px;
          }
          .success-title {
            font-family: 'Playfair Display', serif; font-size: 1.7rem; font-weight: 600;
            letter-spacing: -0.02em; color: var(--fg); margin-bottom: 10px;
          }
          .success-desc { font-size: 0.85rem; color: var(--muted); line-height: 1.65; }
          .success-btn {
            display: inline-flex; align-items: center; margin-top: 28px;
            padding: 12px 28px; background: var(--fg); color: var(--bg);
            font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
            border-radius: 3px; text-decoration: none; transition: opacity 0.2s;
          }
          .success-btn:hover { opacity: 0.78; }
        `}</style>
        <div className="success-root">
          <div className="success-card">
            <div className="success-mark">
              <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="success-kicker">All done</div>
            <h2 className="success-title">Account created</h2>
            <p className="success-desc">
              Check your inbox — we sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account.
            </p>
            <Link href="/auth/login" className="success-btn">Go to Sign In →</Link>
          </div>
        </div>
      </>
    );
  }

  /* ── Main form ── */
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
          --input-bg: #FAFAF8;
          --error-bg: #FEF2F2;
          --error-border: #FECACA;
          --error-text: #991B1B;
          --error-sub: #B91C1C;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --bg: #0D0D0B; --fg: #F6F5F1; --accent: #3DD68C;
            --accent-light: #0D2B1E; --muted: #8A8A82;
            --border: #222220; --card-bg: #141412; --input-bg: #1A1A18;
            --error-bg: #1F0808; --error-border: #7F1D1D;
            --error-text: #FCA5A5; --error-sub: #F87171;
          }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh; background-color: var(--bg); color: var(--fg);
          font-family: 'DM Sans', sans-serif; font-weight: 300;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }
        .auth-root::before {
          content: ''; position: fixed; inset: 0;
          background-image: radial-gradient(circle, var(--border) 1px, transparent 1px);
          background-size: 28px 28px; pointer-events: none; z-index: 0; opacity: 0.7;
        }

        .auth-nav {
          position: relative; z-index: 1; display: flex; align-items: center;
          justify-content: space-between; padding: 24px 40px;
          border-bottom: 1px solid var(--border);
        }
        .auth-logo {
          font-family: 'Playfair Display', serif; font-size: 1.15rem; font-weight: 600;
          color: var(--fg); text-decoration: none; letter-spacing: -0.02em;
        }
        .auth-back {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
          text-decoration: none; transition: color 0.2s;
        }
        .auth-back:hover { color: var(--fg); }

        .auth-main {
          position: relative; z-index: 1; flex: 1; display: flex;
          align-items: center; justify-content: center; padding: 40px 20px;
        }

        /* Two-column layout on wider screens */
        .auth-panel {
          width: 100%; max-width: 820px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start;
        }

        .auth-header { padding-top: 8px; position: sticky; top: 40px; }

        .auth-kicker {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.65rem;
          letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent);
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .auth-kicker::before {
          content: ''; display: block; width: 16px; height: 1px; background: var(--accent);
        }
        .auth-title {
          font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 600;
          letter-spacing: -0.03em; color: var(--fg); margin-bottom: 16px; line-height: 1.1;
        }
        .auth-sub { font-size: 0.875rem; color: var(--muted); line-height: 1.7; margin-bottom: 28px; }

        .auth-perks { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .auth-perk {
          display: flex; align-items: flex-start; gap: 10px;
          font-size: 0.82rem; color: var(--muted); line-height: 1.5;
        }
        .auth-perk-dot {
          width: 5px; height: 5px; border-radius: 50%; background: var(--accent);
          flex-shrink: 0; margin-top: 6px;
        }

        /* Card */
        .auth-card {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 4px; padding: 32px;
        }

        .auth-error {
          background: var(--error-bg); border: 1px solid var(--error-border);
          border-radius: 3px; padding: 14px 16px; margin-bottom: 24px;
        }
        .auth-error-title {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--error-text);
          margin-bottom: 4px; font-weight: 500;
        }
        .auth-error-msg { font-size: 0.8rem; color: var(--error-sub); line-height: 1.5; }

        .field { margin-bottom: 18px; }
        .field-label {
          display: block; font-family: 'IBM Plex Mono', monospace; font-size: 0.62rem;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 7px;
        }
        .field-input {
          width: 100%; padding: 12px 14px; background: var(--input-bg);
          border: 1px solid var(--border); border-radius: 3px;
          font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 400;
          color: var(--fg); outline: none; transition: border-color 0.2s; -webkit-appearance: none;
        }
        .field-input::placeholder { color: var(--muted); opacity: 0.6; }
        .field-input:focus { border-color: var(--accent); }
        .field-hint { font-size: 0.72rem; color: var(--muted); margin-top: 5px; }

        .field-password-wrap { position: relative; }
        .field-password-wrap .field-input { padding-right: 48px; }

        .toggle-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px;
          color: var(--muted); transition: color 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .toggle-btn:hover { color: var(--fg); }
        .toggle-btn svg {
          width: 15px; height: 15px; stroke: currentColor; fill: none;
          stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
        }

        .submit-btn {
          width: 100%; margin-top: 24px; padding: 13px 20px;
          background: var(--fg); color: var(--bg);
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
          border: none; border-radius: 3px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: opacity 0.2s; letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) { opacity: 0.78; }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .spinner {
          width: 14px; height: 14px; border: 1.5px solid currentColor;
          border-top-color: transparent; border-radius: 50%;
          animation: spin 0.7s linear infinite; opacity: 0.6;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .auth-divider {
          display: flex; align-items: center; gap: 16px; margin: 22px 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: var(--border); }
        .auth-divider-text {
          font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); white-space: nowrap;
        }

        .auth-link-btn {
          display: block; width: 100%; text-align: center; padding: 12px 20px;
          background: transparent; border: 1px solid var(--border); border-radius: 3px;
          font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 400;
          color: var(--fg); text-decoration: none; transition: border-color 0.2s;
        }
        .auth-link-btn:hover { border-color: var(--fg); }

        /* Responsive */
        @media (max-width: 680px) {
          .auth-panel { grid-template-columns: 1fr; gap: 32px; max-width: 420px; }
          .auth-header { position: static; padding-top: 0; }
          .auth-perks { display: none; }
          .auth-nav { padding: 18px 20px; }
          .auth-card { padding: 24px 20px; }
          .auth-title { font-size: 1.7rem; }
        }
      `}</style>

      <div className="auth-root">
        <nav className="auth-nav">
          <Link href="/" className="auth-logo">Analytique</Link>
          <Link href="/" className="auth-back">← Home</Link>
        </nav>

        <main className="auth-main">
          <div className="auth-panel">
            {/* Left: header + perks */}
            <div className="auth-header">
              <div className="auth-kicker">Get started</div>
              <h1 className="auth-title">Create your<br />free account</h1>
              <p className="auth-sub">
                Join teams who trust Analytique for privacy-first analytics that respect their visitors.
              </p>
              <ul className="auth-perks">
                <li className="auth-perk"><span className="auth-perk-dot" />Cookie-free tracking, GDPR-compliant out of the box</li>
                <li className="auth-perk"><span className="auth-perk-dot" />Self-hosted — your data stays on your servers</li>
                <li className="auth-perk"><span className="auth-perk-dot" />Single lightweight script, under 1kb</li>
                <li className="auth-perk"><span className="auth-perk-dot" />Open source, audit every line</li>
              </ul>
            </div>

            {/* Right: form card */}
            <div className="auth-card">
              {error && (
                <div className="auth-error">
                  <div className="auth-error-title">Signup Failed</div>
                  <div className="auth-error-msg">{error}</div>
                </div>
              )}

              <form onSubmit={handleSignup}>
                <div className="field">
                  <label htmlFor="fullName" className="field-label">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="field-input"
                    placeholder="Jane Smith"
                    autoComplete="name"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email" className="field-label">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="field-input"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label htmlFor="password" className="field-label">Password</label>
                  <div className="field-password-wrap">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="field-input"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="field-hint">Must be at least 6 characters</p>
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
                  <div className="field-password-wrap">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="field-input"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? (
                    <><div className="spinner" /> Creating Account...</>
                  ) : (
                    "Create Account →"
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <div className="auth-divider-line" />
                <span className="auth-divider-text">Have an account?</span>
                <div className="auth-divider-line" />
              </div>

              <Link href="/auth/login" className="auth-link-btn">Sign In</Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}