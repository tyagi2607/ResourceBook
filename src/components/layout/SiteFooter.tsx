/**
 * SiteFooter — minimal footer + investment disclaimer (PLAN.md)
 */

import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-zinc-600 dark:text-zinc-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            ResourceBook
          </span>
          <Link href="/gold" className="hover:text-accent-fg">
            Explore Gold
          </Link>
        </div>
        <p className="text-xs leading-relaxed">
          ResourceBook is for informational and educational purposes only. Nothing
          on this site is investment, tax, or legal advice. Do your own research
          before making financial decisions.
        </p>
      </div>
    </footer>
  );
}
