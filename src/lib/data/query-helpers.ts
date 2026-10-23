/**
 * query-helpers.ts — small building blocks shared by the files in lib/data/.
 *
 * Every data file follows the same rule: a failed query is logged on the
 * server and the function returns `null`, so one broken section never takes
 * the whole page down. The page shows "data unavailable" for that section.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type Client = ReturnType<typeof createSupabaseServerClient>;

/** Run `work` with a client; log and return null on any failure. */
export async function safely<T>(label: string, work: (supabase: Client) => Promise<T>): Promise<T | null> {
  try {
    return await work(createSupabaseServerClient());
  } catch (error) {
    console.error(`[data] ${label} failed:`, error);
    return null;
  }
}

/** Throw on a Supabase error so `safely` logs it; otherwise return the rows. */
export function rowsOf<T>(result: { data: T[] | null; error: unknown }): T[] {
  if (result.error) throw result.error;
  return result.data ?? [];
}

/**
 * Supabase returns at most 1,000 rows per request. For long histories we ask for
 * rows 0–999, then 1000–1999, ... until a page comes back short.
 */
const PAGE_SIZE = 1000;
export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const rows = rowsOf(await page(from, from + PAGE_SIZE - 1));
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
  }
}

/** Today minus `days`, as "YYYY-MM-DD" (UTC). */
export function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
