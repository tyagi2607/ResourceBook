"use client";

/**
 * TradingViewQuotes — live headline numbers from TradingView.
 *
 * Shown above the chart so the cards and the chart always agree: both come
 * from the same TradingView feed (OANDA spot prices), not from our database.
 *
 *  - Symbol Info widget: price, 1-day change, previous close, open, day's range
 *  - Single Quote widget: a ratio between two symbols (e.g. gold ÷ silver).
 *    TradingView accepts "A/B" as a symbol and divides the two prices live.
 */

import { TradingViewWidget } from "./TradingViewWidget";

type TradingViewQuotesProps = {
  /** Main symbol, e.g. "OANDA:XAUUSD". */
  symbol: string;
  /** Optional ratio panel shown beside the main quote. */
  ratio?: {
    symbol: string; // e.g. "OANDA:XAUUSD/OANDA:XAGUSD"
    label: string; // e.g. "Gold / silver ratio"
    description: string; // e.g. "Ounces of silver per ounce of gold"
  };
};

export function TradingViewQuotes({ symbol, ratio }: TradingViewQuotesProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className={`rounded-lg border border-border bg-surface p-2 ${ratio ? "lg:col-span-2" : "lg:col-span-3"}`}>
        <TradingViewWidget
          script="symbol-info"
          height={250}
          config={{ symbol, width: "100%", isTransparent: true }}
        />
      </div>

      {ratio && (
        <div className="flex flex-col rounded-lg border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{ratio.label}</p>
          <p className="mt-1 text-xs text-muted">{ratio.description}</p>
          <TradingViewWidget
            script="single-quote"
            height={80}
            className="mt-auto"
            config={{ symbol: ratio.symbol, width: "100%", isTransparent: true }}
          />
        </div>
      )}
    </div>
  );
}
