/**
 * HubPageHeader — the title block at the top of every hub page.
 *
 *   [mark]  Gold hub            <- eyebrow, accent color
 *           Gold overview       <- page title
 *   One-paragraph intro underneath.
 *
 * The mark and eyebrow pick up the hub's accent from the surrounding
 * `data-commodity` wrapper (set by the hub's layout or CommodityScope).
 */

import type { ReactNode } from "react";
import type { CommodityThemeId } from "@/lib/commodity-theme";
import { HubMark } from "./HubMark";

type HubPageHeaderProps = {
  slug: CommodityThemeId;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
};

export function HubPageHeader({ slug, eyebrow, title, intro }: HubPageHeaderProps) {
  return (
    <header>
      <div className="flex items-center gap-4">
        <HubMark slug={slug} size={52} />
        <div>
          <p className="text-sm font-medium text-accent-fg">{eyebrow}</p>
          <h1 className="mt-0.5 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
        </div>
      </div>
      {intro && <div className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{intro}</div>}
    </header>
  );
}
