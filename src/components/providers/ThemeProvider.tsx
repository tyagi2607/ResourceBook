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
  useSyncExternalStore,
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
const THEME_EVENT = "resourcebook-theme-change";

/** Read OS preference: true if the user prefers dark mode. */
function getSystemPrefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
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

/** Read the saved choice from localStorage (defaults to "system"). */
function readSavedTheme(): Theme {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "system";
}

/**
 * Notify subscribers when the saved theme changes. "storage" fires when another
 * browser tab changes it; THEME_EVENT fires when this tab changes it.
 */
function subscribeToSavedTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

/** Notify subscribers when the OS switches between light and dark. */
function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // useSyncExternalStore = "read a value that lives outside React and re-render
  // when it changes". Here the outside values are localStorage and the OS theme.
  // The third argument is what the server assumes (it has neither), so server
  // HTML always starts as "system" / light and the browser corrects it.
  const theme = useSyncExternalStore(
    subscribeToSavedTheme,
    readSavedTheme,
    () => "system" as const,
  );
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    () => false,
  );

  // Derived value, recalculated on each render; nothing extra to keep in sync.
  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemPrefersDark ? "dark" : "light") : theme;

  // Paint: add/remove the `dark` class on <html> whenever the result changes.
  useEffect(() => {
    applyDomTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(THEME_EVENT));
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
