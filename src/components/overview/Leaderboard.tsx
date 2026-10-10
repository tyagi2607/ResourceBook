/**
 * Leaderboard — a small ranked list (top movers, lowest AISC, ...).
 *
 * Shows `emptyMessage` when there are no rows yet, which is the normal state
 * until the ETL (prices) or curated fundamentals (AISC) are loaded.
 */

import Link from "next/link";

export type LeaderboardRow = {
  key: string;
  /** Bold left text, usually the ticker. */
  primary: string;
  /** Muted text under it, usually the company name. */
  secondary?: string;
  /** Right-aligned number. */
  value: string;
  valueClassName?: string;
};

type LeaderboardProps = {
  title: string;
  description: string;
  rows: LeaderboardRow[];
  emptyMessage: string;
  footerLink?: { href: string; label: string };
};

export function Leaderboard({
  title,
  description,
  rows,
  emptyMessage,
  footerLink,
}: LeaderboardProps) {
  return (
    <section className="flex flex-col rounded-lg border border-border bg-surface">
      <header className="border-b border-border px-4 py-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{title}</h3>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </header>

      {rows.length === 0 ? (
        <p className="flex-1 px-4 py-6 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <ol className="flex-1 divide-y divide-border">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-4 text-xs tabular-nums text-muted">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {row.primary}
                </span>
                {row.secondary && (
                  <span className="block truncate text-xs text-muted">{row.secondary}</span>
                )}
              </span>
              <span
                className={`text-sm font-medium tabular-nums ${
                  row.valueClassName ?? "text-zinc-900 dark:text-zinc-50"
                }`}
              >
                {row.value}
              </span>
            </li>
          ))}
        </ol>
      )}

      {footerLink && (
        <Link
          href={footerLink.href}
          className="border-t border-border px-4 py-2.5 text-xs font-medium text-accent-fg hover:underline"
        >
          {footerLink.label} →
        </Link>
      )}
    </section>
  );
}
