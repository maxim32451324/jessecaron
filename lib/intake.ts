import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/admin";

export type Intake = {
  name: string;
  email: string;
  phone?: string;
  sport?: string;
  level?: string;
  format?: string;
  message?: string;
};

// Persists an intake to Supabase. Uses the anon server client (an RLS policy
// allows public inserts); falls back to the service client if available.
// Degrades gracefully (logs only) when Supabase isn't configured at all.
export async function saveIntake(intake: Intake): Promise<{ persisted: boolean }> {
  const row = {
    name: intake.name,
    email: intake.email,
    phone: intake.phone || null,
    sport: intake.sport || null,
    level: intake.level || null,
    format: intake.format || null,
    message: intake.message || null,
  };

  const client = (await getServerClient()) ?? getServiceClient();
  if (!client) {
    console.info("[intake] (not persisted — Supabase not configured)", row);
    return { persisted: false };
  }

  const { error } = await client.from("intakes").insert(row);
  if (error) {
    console.error("[intake] insert failed:", error.message);
    return { persisted: false };
  }
  return { persisted: true };
}
