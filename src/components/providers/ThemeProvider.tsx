"use client";

/**
 * =============================================================================
 * ThemeProvider — light / dark / system theme for ResourceBook
 * =============================================================================
 *
 * WHAT "use client" MEANS
 * -----------------------
 * Next.js pages are Server Components by default (they render on the server,
 * like a template engine). Anything that needs browser APIs (localStorage,
 * window.matchMedia, click handlers that change state) must opt into being a
 * Client Component with the "use client" line at the top of the file.
 *
 * THEME STRATEGY (from PLAN.md)
 * -----------------------------
 * 1. Default = follow the OS ("system"): Windows dark mode -> dark site
 * 2. User can override to "light" or "dark" via the toggle
 * 3. We remember the override in localStorage so it sticks on refresh
 *
 * We apply a CSS class `dark` on <html>. Tailwind then styles `.dark ...` rules.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/** The three theme choices the user (or system) can pick. */
export type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  /** What the user selected (may be "system"). */
  theme: Theme;
  /** The actual light/dark currently painted on screen. */
  resolvedTheme: "light" | "dark";
  /** Call this from the toggle button. */
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "resourcebook-theme";

/** Read OS preference: true if the user prefers dark mode. */
function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Turn Theme into a concrete light/dark value. */
function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return getSystemPrefersDark() ? "dark" : "light";
  }
  return theme;
}

/** Apply or remove the `dark` class on <html>. */
function applyDomTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start as "system" so SSR (server HTML) and first paint stay predictable.
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  // Avoid flashing the wrong theme before we read localStorage.
  const [ready, setReady] = useState(false);

  // On first client mount: read saved preference and paint the page.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial: Theme =
      saved === "light" || saved === "dark" || saved === "system"
        ? saved
        : "system";

    const resolved = resolveTheme(initial);
    setThemeState(initial);
    setResolvedTheme(resolved);
    applyDomTheme(resolved);
    setReady(true);
  }, []);

  // If theme is "system", re-apply when the OS theme changes (e.g. night mode).
  useEffect(() => {
    if (!ready || theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const resolved = resolveTheme("system");
      setResolvedTheme(resolved);
      applyDomTheme(resolved);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, ready]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    const resolved = resolveTheme(next);
    setResolvedTheme(resolved);
    applyDomTheme(resolved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {/*
        Optional: hide content until theme is ready to reduce a brief flash.
        We keep children visible so SEO/crawlers still see content.
      */}
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook used by ThemeToggle (and any other component that needs the theme).
 * Must be used inside <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
