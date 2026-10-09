"use client";

/**
 * =============================================================================
 * TradingViewWidget — embeds any free TradingView widget
 * =============================================================================
 *
 * HOW TRADINGVIEW EMBEDS WORK
 * ---------------------------
 * Each widget is a <script> tag whose body is a JSON config. When the script
 * loads, it replaces the empty <div> next to it with the widget (an iframe).
 * React doesn't run scripts placed in JSX, so we build the script element by
 * hand inside useEffect (which only runs in the browser).
 *
 * The widget is a sealed iframe: it displays TradingView's data, but our code
 * cannot read the numbers back out of it.
 *
 * THEME
 * -----
 * Widgets can't change theme after loading, so when the site flips between
 * light and dark we clear the container and embed a fresh widget.
 *
 * Usage:
 *   <TradingViewWidget
 *     script="symbol-info"
 *     config={{ symbol: "OANDA:XAUUSD" }}
 *     height={180}
 *   />
 */

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

type TradingViewWidgetProps = {
  /** Widget name from TradingView's embed URL, e.g. "advanced-chart", "symbol-info". */
  script: string;
  /** Widget-specific settings. Theme settings are added automatically. */
  config: Record<string, unknown>;
  /** Pixel height of the widget area. */
  height: number;
  className?: string;
};

export function TradingViewWidget({ script, config, height, className }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  // Objects are new on every render; comparing their JSON text avoids re-embedding needlessly.
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isDark = resolvedTheme === "dark";

    const widgetTarget = document.createElement("div");
    widgetTarget.className = "tradingview-widget-container__widget";
    widgetTarget.style.height = "100%";
    widgetTarget.style.width = "100%";

    const scriptElement = document.createElement("script");
    scriptElement.src = `https://s3.tradingview.com/external-embedding/embed-widget-${script}.js`;
    scriptElement.type = "text/javascript";
    scriptElement.async = true;
    scriptElement.innerHTML = JSON.stringify({
      // Different widgets use different names for the theme setting; send both.
      theme: isDark ? "dark" : "light",
      colorTheme: isDark ? "dark" : "light",
      locale: "en",
      ...JSON.parse(configJson),
    });

    container.replaceChildren(widgetTarget, scriptElement);
    return () => container.replaceChildren();
  }, [script, configJson, resolvedTheme]);

  return (
    // The widget script overwrites the inner container's style with height: 100%,
    // so the fixed height must live on this outer wrapper.
    <div className={className} style={{ height }}>
      <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
    </div>
  );
}

/** "Chart by TradingView" style attribution, required by TradingView's terms. */
export function TradingViewAttribution({ label = "Data by" }: { label?: string }) {
  return (
    <p className="text-xs text-muted">
      {label}{" "}
      <a
        href="https://www.tradingview.com/"
        target="_blank"
        rel="noopener nofollow"
        className="underline-offset-2 hover:text-accent-fg hover:underline"
      >
        TradingView
      </a>
    </p>
  );
}
