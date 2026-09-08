import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getCompletedLessonIds, isEnrolled, courseProgress } from "@/lib/academy";
import { localImg } from "@/lib/content";
import ProgressRing from "@/components/ProgressRing";
import { enrollFree } from "../actions";

const ACCESS_LABEL: Record<string, string> = { free: "Gratis", members: "Members", paid: "Betaald" };

export default async function CourseOverview({
  params,
}: {
  params: Promise<{ course: string }>;
}) {
  const { course: slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const completed = await getCompletedLessonIds();
  const enrolled = await isEnrolled(course.id);
  const pct = courseProgress(course, completed);
  const firstLesson = course.modules.flatMap((m) => m.lessons)[0];
  const canEnrollFree = !enrolled && course.access_type === "free";

  return (
    <>
      <Link href="/academy" className="back">
        ← Catalogus
      </Link>

      <div className="co-hero">
        <div className="co-hero__b">
          <span className="eyebrow">{ACCESS_LABEL[course.access_type] ?? course.access_type}</span>
          <h1 className="display" style={{ fontSize: "clamp(30px,4.5vw,56px)", margin: "10px 0 14px" }}>
            {course.title}
          </h1>
          <p style={{ color: "var(--text-muted)", maxWidth: "52ch", marginBottom: 22 }}>{course.description}</p>
          <div className="co-meta">
            <span>{course.lessonCount} lessen</span>
            <span>{course.modules.length} modules</span>
            {enrolled && <span style={{ color: "var(--blue)" }}>Ingeschreven</span>}
          </div>
          <div style={{ marginTop: 26, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {firstLesson && (
              <Link href={`/academy/${slug}/${firstLesson.slug}`} className="btn btn--blue">
                {pct > 0 ? "Verder leren →" : "Start cursus →"}
              </Link>
            )}
            {canEnrollFree && (
              <form
                action={async () => {
                  "use server";
                  await enrollFree(course.id, slug);
                }}
              >
                <button type="submit" className="btn">
                  Schrijf in (gratis)
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="co-hero__img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={course.cover_image ? localImg(course.cover_image) : ""} alt="" />
          <div className="co-hero__ring">
            <ProgressRing pct={pct} size={64} />
          </div>
        </div>
      </div>

      <div className="curriculum">
        {course.modules.map((m, mi) => (
          <div className="mod" key={m.id}>
            <div className="mod__head">
              <span className="mod__no">{String(mi + 1).padStart(2, "0")}</span>
              <h2 className="mod__t">{m.title}</h2>
            </div>
            <ul className="mod__lessons">
              {m.lessons.map((l) => {
                const done = completed.has(l.id);
                const locked = !enrolled && course.access_type !== "free" && !l.is_preview;
                return (
                  <li key={l.id} className={`les ${done ? "done" : ""}`}>
                    <span className={`les__tick ${done ? "on" : ""}`} aria-hidden>
                      {done ? "✓" : ""}
                    </span>
                    <Link href={`/academy/${slug}/${l.slug}`} className="les__t">
                      {l.title}
                    </Link>
                    {l.is_preview && <span className="les__tag">Preview</span>}
                    {locked && <span className="les__tag les__tag--lock">Vergrendeld</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <style>{`
        .back { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; color:var(--ash); }
        .back:hover, .back:focus-visible { color:var(--blue); }
        .co-hero { display:grid; grid-template-columns:1.3fr 1fr; gap:40px; align-items:center; margin:24px 0 56px; }
        .co-meta { display:flex; gap:18px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); }
        .co-hero__img { position:relative; aspect-ratio:16/10; overflow:hidden; border:1px solid var(--line-d); background:#000; }
        .co-hero__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.3) brightness(.8); }
        .co-hero__ring { position:absolute; bottom:14px; right:14px; background:var(--ink); padding:6px; border:1px solid var(--line-d); }
        .curriculum { display:grid; gap:14px; }
        .mod { border:1px solid var(--line-d); background:var(--ink-2); }
        .mod__head { display:flex; align-items:center; gap:14px; padding:18px 22px; border-bottom:1px solid var(--line-d); }
        .mod__no { font-family:var(--font-anton),sans-serif; font-size:22px; color:var(--blue); }
        .mod__t { font-size:17px; font-weight:700; }
        .mod__lessons { list-style:none; }
        .les { display:flex; align-items:center; gap:14px; padding:14px 22px; border-bottom:1px solid var(--line-d); }
        .les:last-child { border-bottom:0; }
        .les__tick { width:22px; height:22px; border:1px solid var(--line-d); border-radius:50%; display:grid; place-items:center; font-size:12px; color:var(--blue); flex-shrink:0; }
        .les__tick.on { background:var(--blue); border-color:var(--blue); color:#fff; }
        .les__t { flex:1; font-size:15px; }
        .les__t:hover, .les__t:focus-visible { color:var(--blue); }
        .les__tag { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; font-weight:600; color:var(--blue-bright); border:1px solid var(--line-d); padding:3px 7px; }
        .les__tag--lock { color:var(--ash); }
        @media(max-width:760px){ .co-hero{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
