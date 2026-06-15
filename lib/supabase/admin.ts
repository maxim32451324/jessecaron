import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client — SERVER ONLY. Never import into client components.
// Used for admin user creation, signed tokens, and trusted inserts.
// Returns null when env is not configured so callers can degrade gracefully.
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
