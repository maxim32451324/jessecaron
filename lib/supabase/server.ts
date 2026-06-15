import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// SSR server client bound to the request cookies. Use in Server Components,
// Route Handlers, and Server Actions. Returns null if env is not configured.
export async function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // called from a Server Component — safe to ignore; the proxy refreshes sessions
        }
      },
    },
  });
}
