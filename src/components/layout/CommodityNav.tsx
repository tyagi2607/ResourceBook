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
 * Mobile: hover does not work well, so we use a tap-to-expand pattern for Gold.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { COMMODITIES, GOLD_NAV_LINKS } from "@/lib/commodities";

export function CommodityNav() {
  const pathname = usePathname();
  const [goldOpen, setGoldOpen] = useState(false);
  const goldRef = useRef<HTMLLIElement>(null);

  // Close the Gold dropdown when clicking outside of it.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!goldRef.current?.contains(event.target as Node)) {
        setGoldOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  // Close dropdown when the route changes (user navigated).
  useEffect(() => {
    setGoldOpen(false);
  }, [pathname]);

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
                // Desktop: open on hover
                onMouseEnter={() => setGoldOpen(true)}
                onMouseLeave={() => setGoldOpen(false)}
              >
                <div className="flex items-center">
                  {/* Clicking the label always goes to Overview */}
                  <Link
                    href="/gold"
                    className={navLinkClass(isActive)}
                  >
                    {commodity.label}
                  </Link>
                  {/* Chevron: helpful on mobile to expand the list without navigating */}
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

          // Non-gold: simple link to stub hub
          return (
            <li key={commodity.slug}>
              <Link
                href={`/${commodity.slug}`}
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

/** Shared styles for top-nav commodity links. */
function navLinkClass(active: boolean): string {
  return [
    "rounded-md px-2 py-1.5 text-sm font-medium transition",
    active
      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
  ].join(" ");
}
