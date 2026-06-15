"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function client() {
  const supabase = await getServerClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

// ---- Courses --------------------------------------------------------------
export async function createCourse(formData: FormData) {
  const supabase = await client();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const slug = slugify(String(formData.get("slug") || title));
  const { data } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description: String(formData.get("description") ?? ""),
      access_type: String(formData.get("access_type") ?? "members"),
      cover_image: String(formData.get("cover_image") ?? "") || null,
    })
    .select("id")
    .single();
  revalidatePath("/admin/courses");
  if (data?.id) redirect(`/admin/courses/${data.id}`);
}

export async function updateCourse(formData: FormData) {
  const supabase = await client();
  const id = String(formData.get("id"));
  await supabase
    .from("courses")
    .update({
      title: String(formData.get("title") ?? ""),
      slug: slugify(String(formData.get("slug") ?? "")),
      description: String(formData.get("description") ?? ""),
      access_type: String(formData.get("access_type") ?? "members"),
      cover_image: String(formData.get("cover_image") ?? "") || null,
    })
    .eq("id", id);
  revalidatePath(`/admin/courses/${id}`);
}

export async function togglePublish(id: string, publish: boolean) {
  const supabase = await client();
  await supabase.from("courses").update({ is_published: publish }).eq("id", id);
  revalidatePath(`/admin/courses/${id}`);
  revalidatePath("/admin/courses");
}

export async function deleteCourse(id: string) {
  const supabase = await client();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/admin/courses");
  redirect("/admin/courses");
}

// ---- Modules --------------------------------------------------------------
export async function createModule(formData: FormData) {
  const supabase = await client();
  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const sort = Number(formData.get("sort") ?? 0) || 0;
  await supabase.from("modules").insert({ course_id: courseId, title, sort });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteModule(id: string, courseId: string) {
  const supabase = await client();
  await supabase.from("modules").delete().eq("id", id);
  revalidatePath(`/admin/courses/${courseId}`);
}

// ---- Lessons --------------------------------------------------------------
export async function createLesson(formData: FormData) {
  const supabase = await client();
  const moduleId = String(formData.get("module_id"));
  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await supabase.from("lessons").insert({
    module_id: moduleId,
    title,
    slug: slugify(String(formData.get("slug") || title)),
    body: String(formData.get("body") ?? "") || null,
    video_provider: String(formData.get("video_provider") ?? "") || null,
    playback_id: String(formData.get("playback_id") ?? "") || null,
    is_preview: formData.get("is_preview") === "on",
    sort: Number(formData.get("sort") ?? 0) || 0,
  });
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateLesson(formData: FormData) {
  const supabase = await client();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("course_id"));
  await supabase
    .from("lessons")
    .update({
      title: String(formData.get("title") ?? ""),
      slug: slugify(String(formData.get("slug") ?? "")),
      body: String(formData.get("body") ?? "") || null,
      video_provider: String(formData.get("video_provider") ?? "") || null,
      playback_id: String(formData.get("playback_id") ?? "") || null,
      is_preview: formData.get("is_preview") === "on",
      sort: Number(formData.get("sort") ?? 0) || 0,
    })
    .eq("id", id);
  revalidatePath(`/admin/courses/${courseId}`);
}

export async function deleteLesson(id: string, courseId: string) {
  const supabase = await client();
  await supabase.from("lessons").delete().eq("id", id);
  revalidatePath(`/admin/courses/${courseId}`);
}

// ---- Intakes --------------------------------------------------------------
export async function setIntakeStatus(id: string, status: string) {
  const supabase = await client();
  await supabase.from("intakes").update({ status }).eq("id", id);
  revalidatePath("/admin/intakes");
  revalidatePath("/admin");
}
