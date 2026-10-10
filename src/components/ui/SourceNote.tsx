/**
 * SourceNote — the small print under a data section: where the numbers come
 * from (required by the data licenses) and when our copy was last refreshed.
 */

import type { ReactNode } from "react";
import { formatDate } from "@/lib/format";

export type Citation = { label: string; href?: string; asOf?: string };

type SourceNoteProps = {
  sources: Citation[];
  /** ISO timestamp of the last successful refresh (from data_refresh_log). */
  updatedAt?: string;
  /** Extra notes, e.g. "Tonnes converted from troy ounces by ResourceBook." */
  children?: ReactNode;
};

export function SourceNote({ sources, updatedAt, children }: SourceNoteProps) {
  return (
    <div className="mt-3 space-y-1 text-xs text-muted">
      {sources.map((source) => (
        <p key={source.label}>
          Source:{" "}
          {source.href ? (
            <a
              href={source.href}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-2 hover:text-accent-fg"
            >
              {source.label}
            </a>
          ) : (
            source.label
          )}
          {source.asOf && <> ({source.asOf})</>}
        </p>
      ))}
      {children}
      {updatedAt && <p>Updated {formatDate(updatedAt)}</p>}
    </div>
  );
}
