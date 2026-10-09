/**
 * PageSection — heading + one-line intro + content, used down the hub pages.
 *
 * `id` makes the section linkable (e.g. /gold/why#real-rates). `scroll-mt-20`
 * stops the sticky site header from covering the heading after the jump.
 */

import type { ReactNode } from "react";

type PageSectionProps = {
  id?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
};

export function PageSection({ id, title, intro, children }: PageSectionProps) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
      {intro && <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}
