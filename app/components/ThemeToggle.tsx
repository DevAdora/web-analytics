// components/ThemeToggle.tsx
"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const TOGGLE_STYLES = `
  .tt-wrap { position: relative; }

  .tt-trigger {
    display: inline-flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; border-radius: 3px; cursor: pointer;
    background: transparent; border: 1px solid var(--tt-border, #E0DED7);
    color: var(--tt-muted, #7A7A72); transition: border-color 0.18s, color 0.18s;
  }
  .tt-trigger:hover { border-color: var(--tt-fg, #0D0D0B); color: var(--tt-fg, #0D0D0B); }
  .tt-trigger svg { width: 14px; height: 14px; }

  .tt-dropdown {
    position: absolute; right: 0; top: calc(100% + 6px);
    width: 148px;
    background: var(--tt-card, #FFFFFF);
    border: 1px solid var(--tt-border, #E0DED7);
    border-radius: 4px; overflow: hidden;
    z-index: 100;
    animation: tt-in 0.12s ease;
  }
  @keyframes tt-in { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }

  .tt-option {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 9px 14px; background: transparent; border: none; cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 0.65rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--tt-muted, #7A7A72); transition: background 0.12s, color 0.12s;
    border-bottom: 1px solid var(--tt-border, #E0DED7);
  }
  .tt-option:last-child { border-bottom: none; }
  .tt-option:hover { background: var(--tt-bg, #F6F5F1); color: var(--tt-fg, #0D0D0B); }
  .tt-option.active { color: var(--tt-accent, #1C6B45); background: var(--tt-accent-light, #E8F5EE); }
  .tt-option svg { width: 12px; height: 12px; flex-shrink: 0; }

  .tt-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--tt-accent, #1C6B45); margin-left: auto; flex-shrink: 0;
  }
`;

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentTheme = themes.find((t) => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <>
      <style>{TOGGLE_STYLES}</style>
      <div className="tt-wrap" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="tt-trigger"
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          <CurrentIcon />
        </button>

        {isOpen && (
          <div className="tt-dropdown">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setTheme(value); setIsOpen(false); }}
                className={`tt-option ${theme === value ? "active" : ""}`}
              >
                <Icon />
                {label}
                {theme === value && <span className="tt-dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* Simple cycle toggle — single button, no dropdown */
export function ThemeToggleSimple() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <>
      <style>{TOGGLE_STYLES}</style>
      <button
        onClick={cycleTheme}
        className="tt-trigger"
        aria-label="Toggle theme"
        title={`Current: ${theme}`}
      >
        <Icon />
      </button>
    </>
  );
}

/* Button group — shows all three options inline */
export function ThemeToggleGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <style>{`
        .ttg-wrap {
          display: inline-flex; align-items: center;
          border: 1px solid var(--tt-border, #E0DED7); border-radius: 3px; overflow: hidden;
        }
        .ttg-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 30px; height: 30px; background: transparent; border: none; cursor: pointer;
          color: var(--tt-muted, #7A7A72); transition: background 0.12s, color 0.12s;
          border-right: 1px solid var(--tt-border, #E0DED7);
        }
        .ttg-btn:last-child { border-right: none; }
        .ttg-btn:hover { background: var(--tt-bg, #F6F5F1); color: var(--tt-fg, #0D0D0B); }
        .ttg-btn.active { background: var(--tt-fg, #0D0D0B); color: var(--tt-card, #FFFFFF); }
        .ttg-btn svg { width: 12px; height: 12px; }
      `}</style>
      <div className="ttg-wrap">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`ttg-btn ${theme === value ? "active" : ""}`}
            aria-label={`${label} mode`}
            title={`${label} mode`}
          >
            <Icon />
          </button>
        ))}
      </div>
    </>
  );
}