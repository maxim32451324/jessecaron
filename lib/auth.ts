import { getServerClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

// Returns the current user + profile (or nulls). Server-only.
export async function getUserAndProfile(): Promise<{
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  configured: boolean;
}> {
  const supabase = await getServerClient();
  if (!supabase) return { user: null, profile: null, configured: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, configured: true };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return { user: { id: user.id, email: user.email }, profile: (profile as Profile) ?? null, configured: true };
}

export async function requireOwner(): Promise<boolean> {
  const { profile } = await getUserAndProfile();
  return profile?.role === "owner";
}
