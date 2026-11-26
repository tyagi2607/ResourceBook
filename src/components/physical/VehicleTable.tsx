/**
 * VehicleTable — the metal ETFs, trusts, and receipts for one market.
 *
 * This server component formats every value once (price in the fund's own
 * currency, fees as %, assets as "$141.7B") and hands plain rows to the
 * sortable DataTable. Default sort: largest funds first.
 *
 * The premium/discount column only appears when at least one fund in the list
 * has a dated NAV (PLAN.md "Missing NAV" rule; none yet, see docs/10).
 */

import { DataTable, type Column, type Row } from "@/components/ui/DataTable";
import { VEHICLE_COLUMN_HINTS, VEHICLE_STRUCTURES, type VehicleStructure } from "@/content/gold";
import type { Vehicle } from "@/lib/data/gold-physical";
import {
  EMPTY,
  formatCompactPrice,
  formatDate,
  formatFractionPercent,
  formatPercent,
  formatPrice,
} from "@/lib/format";

export function VehicleTable({ vehicles, marketLabel }: { vehicles: Vehicle[]; marketLabel: string }) {
  const showPremium = vehicles.some((vehicle) => vehicle.premiumDiscountPct != null);

  const columns: Column[] = [
    { key: "fund", label: "Fund" },
    { key: "type", label: "Type" },
    { key: "price", label: "Price", align: "right" },
    { key: "change", label: "1 day", align: "right" },
    ...(showPremium
      ? [{ key: "premium", label: "Premium", align: "right" as const, hint: "Price vs the fund's NAV per share" }]
      : []),
    { key: "fee", label: "Fee / yr", align: "right", hint: VEHICLE_COLUMN_HINTS.fee },
    { key: "assets", label: "Assets", align: "right", hint: VEHICLE_COLUMN_HINTS.assets },
    { key: "traded", label: "Traded / day", align: "right", hint: VEHICLE_COLUMN_HINTS.traded },
    { key: "vault", label: "Vault" },
    { key: "redeem", label: "Redeem for metal", hint: VEHICLE_COLUMN_HINTS.redeem },
  ];

  const rows: Row[] = vehicles.map((vehicle) => ({
    id: vehicle.symbol,
    cells: {
      fund: {
        text: vehicle.ticker,
        sub: vehicle.issuer ? `${vehicle.name} · ${vehicle.issuer}` : vehicle.name,
        href: vehicle.website ?? undefined,
        sort: vehicle.ticker,
      },
      type: {
        text: VEHICLE_STRUCTURES[vehicle.structure as VehicleStructure]?.label ?? vehicle.structure,
        sub: vehicle.exchange,
        sort: vehicle.structure,
      },
      price: { text: formatPrice(vehicle.price, vehicle.currency), sort: vehicle.price },
      change: {
        text: formatPercent(vehicle.changePct),
        sort: vehicle.changePct,
        tone: vehicle.changePct == null || vehicle.changePct === 0 ? undefined : vehicle.changePct > 0 ? "up" : "down",
      },
      premium: {
        text: formatPercent(vehicle.premiumDiscountPct),
        sub: vehicle.navAsOf ? `NAV ${formatDate(vehicle.navAsOf)}` : undefined,
        sort: vehicle.premiumDiscountPct,
      },
      fee: { text: formatFractionPercent(vehicle.expenseRatio), sort: vehicle.expenseRatio },
      assets: { text: formatCompactPrice(vehicle.aum, vehicle.currency), sort: vehicle.aum },
      traded: { text: formatCompactPrice(vehicle.avgDailyValue, vehicle.currency), sort: vehicle.avgDailyValue },
      vault: { text: vehicle.vaultLocation ?? EMPTY, sort: vehicle.vaultLocation },
      redeem: { text: vehicle.physicalRedemption ? "Yes" : "No", sort: vehicle.physicalRedemption ? 1 : 0 },
    },
  }));

  return (
    <DataTable
      columns={columns}
      rows={rows}
      defaultSort={{ key: "assets", direction: "desc" }}
      caption={`Physical gold ETFs, trusts, and receipts listed in ${marketLabel}`}
    />
  );
}
