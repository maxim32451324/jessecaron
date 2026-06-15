import type { NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/admin";

// Owner-only: provision (or invite) a student, optionally enrolling them.
// Requires SUPABASE_SERVICE_ROLE_KEY (server env). See BACKEND.md.
export async function POST(req: NextRequest) {
  // 1) verify caller is the owner
  const supabase = await getServerClient();
  if (!supabase) return Response.json({ error: "not configured" }, { status: 503 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") return Response.json({ error: "forbidden" }, { status: 403 });

  // 2) need the service role to create auth users
  const admin = getServiceClient();
  if (!admin) {
    return Response.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.local to provision students." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim();
  const full_name = String(body.full_name ?? "").trim();
  const course_ids: string[] = Array.isArray(body.course_ids) ? body.course_ids : [];
  if (!email) return Response.json({ error: "email required" }, { status: 400 });

  // 3) invite by email (student sets their own password)
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
  });
  if (error || !data?.user) {
    return Response.json({ error: error?.message ?? "invite failed" }, { status: 400 });
  }

  // 4) optionally enroll straight away (service role bypasses RLS)
  if (course_ids.length) {
    await admin
      .from("enrollments")
      .insert(course_ids.map((c) => ({ user_id: data.user!.id, course_id: c })));
  }

  return Response.json({ ok: true, userId: data.user.id });
}
