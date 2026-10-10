"use client";

/**
 * GoldVsRealYieldChart — gold price vs the US 10-year real yield since 2003.
 *
 * The real-yield axis (right) is INVERTED: higher on the chart = lower yield.
 * Gold usually rises when real yields fall, so with the flip the two lines tend
 * to move together, which makes the relationship easy to see.
 *
 * Built with Recharts (a React charting library) from OUR database, not
 * TradingView, because it combines two sources (Yahoo gold, FRED yields).
 * Colors use the CSS theme variables, so light/dark mode just works.
 */

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { GoldVsRealPoint } from "@/lib/data/gold-macro";

const goldFormat = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** X-axis labels: the first weekly point of every even year (2004, 2006, ...). */
function yearTicks(data: GoldVsRealPoint[]): string[] {
  const seen = new Set<string>();
  return data
    .filter((point) => {
      const year = point.date.slice(0, 4);
      if (Number(year) % 2 !== 0 || seen.has(year)) return false;
      seen.add(year);
      return true;
    })
    .map((point) => point.date);
}

export function GoldVsRealYieldChart({ data }: { data: GoldVsRealPoint[] }) {
  return (
    <div className="h-[380px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={yearTicks(data)}
            tickFormatter={(date: string) => date.slice(0, 4)}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            stroke="var(--border)"
          />
          <YAxis
            yAxisId="gold"
            tickFormatter={(value: number) => goldFormat.format(value)}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            stroke="var(--border)"
            width={64}
          />
          <YAxis
            yAxisId="real"
            orientation="right"
            reversed
            tickFormatter={(value: number) => `${value}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            stroke="var(--border)"
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)" }}
            labelFormatter={(date) => dateFormat.format(new Date(`${date}T12:00:00Z`))}
            formatter={(value, name) =>
              name === "Gold (USD/oz)"
                ? [goldFormat.format(Number(value)), name]
                : [`${Number(value).toFixed(2)}%`, name]
            }
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            yAxisId="gold"
            dataKey="gold"
            name="Gold (USD/oz)"
            stroke="var(--accent)"
            strokeWidth={1.75}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
          <Line
            yAxisId="real"
            dataKey="real"
            name="10-yr real yield (inverted)"
            stroke="var(--muted)"
            strokeWidth={1.25}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
