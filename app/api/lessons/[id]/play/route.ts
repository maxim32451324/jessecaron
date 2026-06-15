import type { NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

// Returns playback info for a lesson ONLY if the user may watch it
// (owner, enrolled, or the lesson is a preview). For mux/bunny this is where a
// short-lived signed token is minted server-side (stubbed until keys are added).
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await getServerClient();
  if (!supabase) return Response.json({ error: "not configured" }, { status: 503 });

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, module_id, video_provider, playback_id, is_preview, modules(course_id)")
    .eq("id", id)
    .single();
  if (!lesson) return Response.json({ error: "not found" }, { status: 404 });

  const courseId = (lesson as { modules?: { course_id?: string } }).modules?.course_id;

  // gate
  let allowed = Boolean(lesson.is_preview);
  if (!allowed && courseId) {
    const { data: ok } = await supabase.rpc("is_enrolled", { p_course_id: courseId });
    allowed = Boolean(ok);
  }
  if (!allowed) {
    const { data: owner } = await supabase.rpc("is_owner");
    allowed = Boolean(owner);
  }
  if (!allowed) return Response.json({ error: "forbidden" }, { status: 403 });

  // YouTube is public — no token needed.
  if (lesson.video_provider === "youtube") {
    return Response.json({ provider: "youtube", playbackId: lesson.playback_id });
  }

  // Mux / Bunny: mint a short-lived signed token here once provider keys exist.
  const hasMux = process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET;
  const hasBunny = process.env.BUNNY_API_KEY && process.env.BUNNY_LIBRARY_ID;
  if (!hasMux && !hasBunny) {
    return Response.json({
      provider: lesson.video_provider,
      playbackId: lesson.playback_id,
      token: null,
      note: "Signed playback not yet configured — add provider keys to mint tokens.",
    });
  }

  // Placeholder: real implementation signs a JWT (Mux) or builds a token URL (Bunny).
  return Response.json({
    provider: lesson.video_provider,
    playbackId: lesson.playback_id,
    token: "TODO_SIGNED_TOKEN",
    expiresIn: 600,
  });
}
