/**
 * Supabase client for reading data in Server Components.
 *
 * Pages in ResourceBook fetch data on the server (before HTML is sent to the
 * browser), so visitors never talk to Supabase directly. This client uses the
 * PUBLISHABLE key, which Row Level Security limits to read-only access, the
 * same access a public visitor would have.
 *
 * Writes (seeding, the daily ETL) happen only in the Python scripts in /scripts
 * using the secret key. The secret key must never be imported here.
 *
 * Usage inside a Server Component:
 *   const supabase = createSupabaseServerClient();
 *   const { data, error } = await supabase.from("vehicles").select("*");
 */
import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Fill in NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see docs/05-database-setup.md).",
    );
  }

  return createClient(url, publishableKey, {
    // No user logins in the MVP, so there is no session to store or refresh.
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
