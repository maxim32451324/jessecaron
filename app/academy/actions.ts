"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server";

export async function enrollFree(courseId: string, courseSlug: string) {
  const supabase = await getServerClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  // RLS allows self-enroll only into published free courses.
  await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
  revalidatePath(`/academy/${courseSlug}`);
}

export async function markComplete(lessonId: string, courseSlug: string, completed: boolean) {
  const supabase = await getServerClient();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("lesson_progress")
    .upsert(
      {
        user_id: user.id,
        lesson_id: lessonId,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" },
    );
  revalidatePath(`/academy/${courseSlug}`, "layout");
}
