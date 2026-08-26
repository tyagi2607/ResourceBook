/**
 * ComingSoonStub — shared body for non-Gold commodity hubs
 *
 * Using one component avoids copy-pasting the same "Coming soon" UI
 * into silver/copper/uranium/oil/gas/battery-metals pages.
 */

import Link from "next/link";

type ComingSoonStubProps = {
  title: string;
};

export function ComingSoonStub({ title }: ComingSoonStubProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Coming soon
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
        This commodity hub is on the roadmap. The Gold hub is live for the MVP —
        start there while we expand coverage.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/gold"
          className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
        >
          Explore Gold
        </Link>
        <Link
          href="/"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
