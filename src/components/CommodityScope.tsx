/**
 * CommodityScope — wraps a page (or layout) so accent CSS variables apply
 *
 * Usage:
 *   <CommodityScope id="gold"> ... gold-colored accents ... </CommodityScope>
 *
 * This sets data-commodity on a div. globals.css reads that attribute and
 * overrides --accent* for everything inside the wrapper.
 */

import type { ReactNode } from "react";
import type { CommodityThemeId } from "@/lib/commodity-theme";

type CommodityScopeProps = {
  id: CommodityThemeId;
  children: ReactNode;
  className?: string;
};

export function CommodityScope({
  id,
  children,
  className,
}: CommodityScopeProps) {
  return (
    <div data-commodity={id} className={className}>
      {children}
    </div>
  );
}
