"use client";

/**
 * =============================================================================
 * DataTable — a small sortable table (click a column header to sort)
 * =============================================================================
 *
 * WHY A CLIENT COMPONENT
 * ----------------------
 * Sorting reacts to clicks, so it runs in the browser ("use client"). The page
 * (a server component) does all the formatting first and passes plain data:
 * for every cell, the text to show AND the raw value to sort by. That keeps
 * this component generic: the Physical and Companies pages both use it.
 *
 * Think of `rows` as a pre-formatted result set, and `columns` as its header
 * metadata. Empty values always sort to the bottom, whichever direction.
 */

import Link from "next/link";
import { useMemo, useState } from "react";

export type Cell = {
  /** What the visitor sees. */
  text: string;
  /** Optional second line in smaller, muted text (e.g. fund name under a ticker). */
  sub?: string;
  /** Raw value used for sorting. null/undefined = "no data" (sorted last). */
  sort?: number | string | null;
  /**
   * Link for the main text. Paths starting with `/` stay in-app (company pages).
   * Other URLs open in a new tab (issuer / dealer sites).
   */
  href?: string;
  /** Green for gains, red for losses. */
  tone?: "up" | "down";
};

export type Column = {
  key: string;
  label: string;
  /** Numbers read best right-aligned. */
  align?: "left" | "right";
  /** Short explanation shown when hovering the header. */
  hint?: string;
  /** Set false for columns where sorting means nothing (e.g. notes). */
  sortable?: boolean;
};

export type Row = { id: string; cells: Record<string, Cell> };

type SortState = { key: string; direction: "asc" | "desc" };

type DataTableProps = {
  columns: Column[];
  rows: Row[];
  /** Initial sort, e.g. largest funds first. */
  defaultSort?: SortState;
  /** Read by screen readers; describes the table. */
  caption: string;
};

const TONE_CLASS = {
  up: "text-emerald-700 dark:text-emerald-400",
  down: "text-rose-700 dark:text-rose-400",
};

export function DataTable({ columns, rows, defaultSort, caption }: DataTableProps) {
  const [sort, setSort] = useState<SortState | undefined>(defaultSort);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => compare(a.cells[sort.key]?.sort, b.cells[sort.key]?.sort, sort.direction));
  }, [rows, sort]);

  function toggleSort(column: Column) {
    if (column.sortable === false) return;
    setSort((current) =>
      current?.key === column.key
        ? { key: column.key, direction: current.direction === "asc" ? "desc" : "asc" }
        : // First click: numbers start biggest-first, text starts A→Z.
          { key: column.key, direction: column.align === "right" ? "desc" : "asc" },
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-xs text-muted">
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const alignClass = column.align === "right" ? "text-right" : "text-left";
              return (
                <th
                  key={column.key}
                  scope="col"
                  title={column.hint}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}
                  className={`whitespace-nowrap px-4 py-2.5 font-medium ${alignClass}`}
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleSort(column)}
                      className={`inline-flex items-center gap-1 hover:text-accent-fg ${active ? "text-accent-fg" : ""}`}
                    >
                      {column.label}
                      <span aria-hidden="true" className="w-2">
                        {active ? (sort.direction === "asc" ? "↑" : "↓") : ""}
                      </span>
                    </button>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-b-0">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 align-top ${column.align === "right" ? "text-right tabular-nums" : ""}`}
                >
                  <CellContent cell={row.cells[column.key]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const LINK_CLASS =
  "font-medium text-zinc-900 underline-offset-2 hover:text-accent-fg hover:underline dark:text-zinc-100";

function CellContent({ cell }: { cell: Cell | undefined }) {
  if (!cell) return <span className="text-muted">—</span>;
  const toneClass = cell.tone ? TONE_CLASS[cell.tone] : "text-zinc-900 dark:text-zinc-100";
  const internal = cell.href?.startsWith("/");
  return (
    <>
      {cell.href ? (
        internal ? (
          <Link href={cell.href} className={LINK_CLASS}>
            {cell.text}
          </Link>
        ) : (
          <a href={cell.href} target="_blank" rel="noopener" className={LINK_CLASS}>
            {cell.text}
          </a>
        )
      ) : (
        <span className={toneClass}>{cell.text}</span>
      )}
      {cell.sub && <span className="mt-0.5 block text-xs text-muted">{cell.sub}</span>}
    </>
  );
}

/** Compare two sort values; empty values always go last. */
function compare(
  a: Cell["sort"],
  b: Cell["sort"],
  direction: SortState["direction"],
): number {
  const aEmpty = a == null || a === "";
  const bEmpty = b == null || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  const result =
    typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));
  return direction === "asc" ? result : -result;
}
