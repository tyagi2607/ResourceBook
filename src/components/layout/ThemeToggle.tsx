"use client";

/**
 * ThemeToggle — cycles system → light → dark → system
 *
 * WHY A CYCLE?
 * ------------
 * One button is simpler than a 3-option dropdown for MVP.
 * Icon hints which mode you are in:
 *   Monitor = following OS
 *   Sun     = forced light
 *   Moon    = forced dark
 */

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/providers/ThemeProvider";

const ORDER: Theme[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function cycleTheme() {
    const index = ORDER.indexOf(theme);
    const next = ORDER[(index + 1) % ORDER.length];
    setTheme(next);
  }

  const label =
    theme === "system"
      ? "Theme: system (click for light)"
      : theme === "light"
        ? "Theme: light (click for dark)"
        : "Theme: dark (click for system)";

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {theme === "system" && <Monitor className="h-4 w-4" aria-hidden />}
      {theme === "light" && <Sun className="h-4 w-4" aria-hidden />}
      {theme === "dark" && <Moon className="h-4 w-4" aria-hidden />}
    </button>
  );
}
