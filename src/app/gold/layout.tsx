/**
 * Gold layout — wraps every /gold/* page in the Gold accent palette
 *
 * One layout means we do not repeat <CommodityScope id="gold"> on each page.
 */

import type { ReactNode } from "react";
import { CommodityScope } from "@/components/CommodityScope";

export default function GoldLayout({ children }: { children: ReactNode }) {
  return <CommodityScope id="gold">{children}</CommodityScope>;
}
