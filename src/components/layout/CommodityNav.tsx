"use client";

/**
 * =============================================================================
 * CommodityNav — top commodity links + simple Gold hover dropdown
 * =============================================================================
 *
 * BEHAVIOR (PLAN.md)
 * ------------------
 * - Click "Gold"     -> go to /gold (Overview)
 * - Hover "Gold"     -> show a SINGLE list of Gold pages (not a mega-menu)
 * - Other commodities -> go to stub pages ("Coming soon")
 *
 * COLORING
 * --------
 * Active nav pill uses that commodity’s accent (gold pill on /gold, silver
 * pill on /silver, etc.) via CSS class .commodity-nav-pill + data-slug.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COMMODITIES, GOLD_NAV_LINKS } from "@/lib/commodities";

export function CommodityNav() {
  const pathname = usePathname();
  const goldRef = useRef<HTMLLIElement>(null);

  // We remember WHICH page the dropdown was opened on (or null = closed).
  // The menu counts as open only while we're still on that page, so it
  // closes automatically after navigating — no extra effect needed.
  const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
  const goldOpen = openedOnPath === pathname;
  const setGoldOpen = (open: boolean | ((open: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(goldOpen) : open;
    setOpenedOnPath(next ? pathname : null);
  };

  // Close the Gold dropdown when clicking outside of it.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!goldRef.current?.contains(event.target as Node)) {
        setOpenedOnPath(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <nav aria-label="Commodities" className="min-w-0">
      <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
        {COMMODITIES.map((commodity) => {
          const isGold = commodity.slug === "gold";
          const isActive =
            pathname === `/${commodity.slug}` ||
            pathname.startsWith(`/${commodity.slug}/`);

          if (isGold) {
            return (
              <li
                key={commodity.slug}
                ref={goldRef}
                className="relative"
                onMouseEnter={() => setGoldOpen(true)}
                onMouseLeave={() => setGoldOpen(false)}
              >
                <div className="flex items-center">
                  <Link
                    href="/gold"
                    data-slug={commodity.slug}
                    data-active={isActive ? "true" : "false"}
                    className={navLinkClass(isActive)}
                  >
                    {commodity.label}
                  </Link>
                  <button
                    type="button"
                    className="ml-0.5 rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    aria-expanded={goldOpen}
                    aria-controls="gold-submenu"
                    aria-label="Gold page menu"
                    onClick={() => setGoldOpen((open) => !open)}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {goldOpen && (
                  <ul
                    id="gold-submenu"
                    className="absolute left-0 top-full z-40 mt-0 min-w-[16rem] rounded-md border border-zinc-200 bg-white py-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    {GOLD_NAV_LINKS.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                          onClick={() => setGoldOpen(false)}
                        >
                          <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {link.label}
                          </span>
                          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                            {link.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          return (
            <li key={commodity.slug}>
              <Link
                href={`/${commodity.slug}`}
                data-slug={commodity.slug}
                data-active={isActive ? "true" : "false"}
                className={navLinkClass(isActive)}
              >
                {commodity.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Base pill styles. When active, .commodity-nav-pill[data-active=true] in
 * globals.css applies that commodity’s soft fill + foreground color.
 */
function navLinkClass(active: boolean): string {
  return [
    "commodity-nav-pill rounded-md px-2 py-1.5 text-sm font-medium transition",
    active
      ? ""
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
  ].join(" ");
}
