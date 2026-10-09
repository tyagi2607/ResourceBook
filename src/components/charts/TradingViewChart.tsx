"use client";

/**
 * TradingViewChart — TradingView's free "Advanced Chart" (interactive price chart).
 *
 * Built on TradingViewWidget, which handles embedding and light/dark theme.
 * Config options: https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/
 */

import { useTheme } from "@/components/providers/ThemeProvider";
import { TradingViewAttribution, TradingViewWidget } from "./TradingViewWidget";

type TradingViewChartProps = {
  /** TradingView symbol, e.g. "OANDA:XAUUSD" (gold spot in USD). */
  symbol: string;
  /** Pixel height of the chart area. */
  height?: number;
  /** Initial visible range, e.g. "12M", "60M", "ALL". */
  range?: string;
};

export function TradingViewChart({ symbol, height = 460, range = "12M" }: TradingViewChartProps) {
  const isDark = useTheme().resolvedTheme === "dark";

  return (
    <div className="space-y-2">
      <TradingViewWidget
        script="advanced-chart"
        height={height}
        className="overflow-hidden rounded-lg border border-border bg-surface"
        config={{
          autosize: true,
          symbol,
          range,
          interval: "D",
          timezone: "Etc/UTC",
          style: "2", // line chart; users can switch to candles inside the widget
          hide_volume: true, // spot metals trade over-the-counter, so there's no real volume
          hide_side_toolbar: true,
          allow_symbol_change: false,
          save_image: false,
          calendar: false,
          // Match our surface colors (--surface in globals.css) so the chart blends in.
          backgroundColor: isDark ? "#18181b" : "#ffffff",
          gridColor: isDark ? "rgba(63, 63, 70, 0.4)" : "rgba(228, 228, 231, 0.6)",
          support_host: "https://www.tradingview.com",
        }}
      />
      <TradingViewAttribution label="Chart by" />
    </div>
  );
}
