import { createBrowserClient } from "@supabase/ssr";

// Browser client for Client Components. Uses the public anon key + RLS.
export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createBrowserClient(url, key);
}
