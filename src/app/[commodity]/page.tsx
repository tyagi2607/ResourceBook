/**
 * Dynamic commodity stub — `/silver`, `/copper`, `/uranium`, `/oil`, `/gas`, `/battery-metals`
 *
 * Next.js treats `[commodity]` as a URL parameter. Gold is NOT handled here
 * because `src/app/gold/` is a more specific folder and wins for `/gold/*`.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoonStub } from "@/components/ComingSoonStub";
import { isCommodityThemeId } from "@/lib/commodity-theme";
import { COMMODITIES, getCommodityBySlug } from "@/lib/commodities";

type PageProps = {
  params: Promise<{ commodity: string }>;
};

/** Tell Next which stub URLs to pre-build (all non-gold commodities). */
export function generateStaticParams() {
  return COMMODITIES.filter((c) => c.slug !== "gold").map((c) => ({
    commodity: c.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { commodity: slug } = await params;
  const commodity = getCommodityBySlug(slug);
  if (!commodity || commodity.slug === "gold") {
    return { title: "Not found" };
  }
  return {
    title: `${commodity.label} (Coming soon)`,
    description: `${commodity.label} hub — coming soon on ResourceBook.`,
  };
}

export default async function CommodityStubPage({ params }: PageProps) {
  const { commodity: slug } = await params;
  const commodity = getCommodityBySlug(slug);

  // Unknown slug, gold (handled elsewhere), or missing theme → 404
  if (
    !commodity ||
    commodity.slug === "gold" ||
    !isCommodityThemeId(commodity.slug)
  ) {
    notFound();
  }

  return <ComingSoonStub title={commodity.label} slug={commodity.slug} />;
}
