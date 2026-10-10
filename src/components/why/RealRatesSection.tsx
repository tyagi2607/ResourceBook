/**
 * RealRatesSection — /gold/why#real-rates
 *
 *   1. Live formula: nominal 10-yr yield − expected inflation = real yield,
 *      filled with the latest FRED numbers (all from the same day).
 *   2. Two worked examples (positive and negative real rates).
 *   3. Chart: gold vs the inverted real yield since 2003.
 *
 * FRED's breakeven inflation (T10YIE) is defined as nominal − real, so the live
 * formula always adds up (give or take 0.01 from rounding).
 */

import { LONGTERMTRENDS_LINK, REAL_RATE_EXAMPLES } from "@/content/gold";
import type { GoldVsRealPoint, Observation, RealRatesSnapshot } from "@/lib/data/gold-macro";
import { formatDate } from "@/lib/format";
import { GoldVsRealYieldChart } from "@/components/charts/GoldVsRealYieldChart";
import { PageSection } from "@/components/ui/PageSection";
import { SourceNote } from "@/components/ui/SourceNote";

type RealRatesSectionProps = {
  snapshot: RealRatesSnapshot | null;
  history: GoldVsRealPoint[] | null;
  fredUpdatedAt?: string;
};

const pct = (value: number) => `${value.toFixed(2)}%`;
const signedPct = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(2)}%`;

export function RealRatesSection({ snapshot, history, fredUpdatedAt }: RealRatesSectionProps) {
  const monthChange =
    snapshot?.realMonthAgo != null ? snapshot.real.value - snapshot.realMonthAgo.value : null;

  return (
    <PageSection
      id="real-rates"
      title="Real interest rates"
      intro="A real rate is what a bond pays after inflation. Gold pays nothing, so when real rates are high, holding gold means giving up a solid return; when they're low or negative, that cost disappears."
    >
      {snapshot ? (
        <div className="rounded-lg border border-border bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              US 10-year, {formatDate(snapshot.real.date)}
            </p>
            {monthChange != null && (
              <p className="text-xs text-muted">
                Real yield {monthChange >= 0 ? "up" : "down"} {Math.abs(monthChange).toFixed(2)} pts over the past month
              </p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
            <Term label="Nominal yield" sub="DGS10" value={snapshot.nominal} />
            <Operator>−</Operator>
            <Term label="Expected inflation" sub="T10YIE breakeven" value={snapshot.breakeven} />
            <Operator>=</Operator>
            <Term label="Real yield" sub="DFII10 (TIPS)" value={snapshot.real} highlight />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Rate data is unavailable right now.</p>
      )}

      <ul className="mt-4 grid gap-4 md:grid-cols-2">
        {REAL_RATE_EXAMPLES.map((example) => {
          const real = example.nominal - example.inflation;
          return (
            <li key={example.nominal} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Example: {real >= 0 ? "positive" : "negative"} real rate
              </p>
              <p className="mt-2 font-mono text-sm text-zinc-900 dark:text-zinc-50">
                {pct(example.nominal)} − {pct(example.inflation)} ={" "}
                <span className={`font-semibold ${real >= 0 ? "text-zinc-900 dark:text-zinc-50" : "text-accent-fg"}`}>
                  {signedPct(real)}
                </span>
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{example.takeaway}</p>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-lg border border-border bg-surface p-4">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Gold vs the real yield (inverted), since 2003</p>
        <p className="text-xs text-muted">
          The yield axis is flipped, so the lines moving together means the usual inverse relationship. Since
          2022 gold has risen despite higher real rates, a break widely attributed to heavy central-bank buying.
        </p>
        <div className="mt-4">
          {history && history.length > 0 ? (
            <GoldVsRealYieldChart data={history} />
          ) : (
            <p className="text-sm text-muted">Chart data is unavailable right now.</p>
          )}
        </div>
      </div>

      <SourceNote
        sources={[
          ...(snapshot?.citations ?? []).map((item) => ({ label: item.citation, href: item.url })),
          { label: "Gold: COMEX front-month futures (GC=F) weekly closes, Yahoo Finance" },
        ]}
        updatedAt={fredUpdatedAt}
      >
        <p>
          Further reading:{" "}
          <a
            href={LONGTERMTRENDS_LINK.href}
            target="_blank"
            rel="noopener"
            className="underline underline-offset-2 hover:text-accent-fg"
          >
            {LONGTERMTRENDS_LINK.label}
          </a>
        </p>
      </SourceNote>
    </PageSection>
  );
}

function Term({
  label,
  sub,
  value,
  highlight = false,
}: {
  label: string;
  sub: string;
  value: Observation | null;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-2xl font-semibold tabular-nums ${
          highlight ? "text-accent-fg" : "text-zinc-900 dark:text-zinc-50"
        }`}
      >
        {value ? pct(value.value) : "—"}
      </p>
      <p className="text-xs text-zinc-700 dark:text-zinc-300">{label}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  );
}

function Operator({ children }: { children: string }) {
  return <span className="text-2xl font-light text-muted">{children}</span>;
}
