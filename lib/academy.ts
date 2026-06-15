import { getServerClient } from "@/lib/supabase/server";

export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  access_type: string;
  is_published: boolean;
  sort: number;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  body: string | null;
  video_provider: string | null;
  playback_id: string | null;
  is_preview: boolean;
  sort: number;
};

export type ModuleWithLessons = {
  id: string;
  title: string;
  sort: number;
  lessons: Lesson[];
};

export type CourseDetail = Course & {
  modules: ModuleWithLessons[];
  lessonCount: number;
};

export async function listCourses(): Promise<Course[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, description, cover_image, access_type, is_published, sort")
    .order("sort", { ascending: true });
  return (data as Course[]) ?? [];
}

export async function getCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, description, cover_image, access_type, is_published, sort")
    .eq("slug", slug)
    .single();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort")
    .eq("course_id", course.id)
    .order("sort", { ascending: true });

  const moduleIds = (modules ?? []).map((m) => m.id);
  let lessons: Lesson[] = [];
  if (moduleIds.length) {
    const { data: ls } = await supabase
      .from("lessons")
      .select("id, module_id, title, slug, body, video_provider, playback_id, is_preview, sort")
      .in("module_id", moduleIds)
      .order("sort", { ascending: true });
    lessons = (ls as Lesson[]) ?? [];
  }

  const withLessons: ModuleWithLessons[] = (modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    sort: m.sort,
    lessons: lessons.filter((l) => l.module_id === m.id),
  }));

  return {
    ...(course as Course),
    modules: withLessons,
    lessonCount: lessons.length,
  };
}

// Set of completed lesson ids for the current user.
export async function getCompletedLessonIds(): Promise<Set<string>> {
  const supabase = await getServerClient();
  if (!supabase) return new Set();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("lesson_progress")
    .select("lesson_id, completed_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null);
  return new Set((data ?? []).map((r) => r.lesson_id));
}

export async function isEnrolled(courseId: string): Promise<boolean> {
  const supabase = await getServerClient();
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

export function courseProgress(course: CourseDetail, completed: Set<string>): number {
  if (!course.lessonCount) return 0;
  const done = course.modules
    .flatMap((m) => m.lessons)
    .filter((l) => completed.has(l.id)).length;
  return Math.round((done / course.lessonCount) * 100);
}
