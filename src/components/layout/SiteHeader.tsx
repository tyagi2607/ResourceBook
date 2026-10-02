/**
 * SiteHeader — logo | commodity nav | theme toggle
 *
 * This is a Server Component wrapper that embeds two Client Components
 * (CommodityNav, ThemeToggle). That is a normal Next.js pattern:
 * keep the shell simple, only "pay" for client JS where interaction exists.
 */

import Link from "next/link";
import { CommodityNav } from "@/components/layout/CommodityNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        {/* Brand — always links home */}
        <Link
          href="/"
          className="shrink-0 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          ResourceBook
        </Link>

        {/* Commodity menu grows to fill the middle */}
        <div className="min-w-0 flex-1">
          <CommodityNav />
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
