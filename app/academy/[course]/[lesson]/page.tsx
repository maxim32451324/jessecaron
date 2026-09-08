import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourseBySlug, getCompletedLessonIds, isEnrolled } from "@/lib/academy";
import Markdown from "@/components/Markdown";
import VideoFacade from "@/components/VideoFacade";
import MarkComplete from "@/components/MarkComplete";

export default async function LessonPlayer({
  params,
}: {
  params: Promise<{ course: string; lesson: string }>;
}) {
  const { course: slug, lesson: lessonSlug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const flat = course.modules.flatMap((m) => m.lessons);
  const idx = flat.findIndex((l) => l.slug === lessonSlug);
  if (idx === -1) notFound();
  const lesson = flat[idx];
  const next = flat[idx + 1];

  const completed = await getCompletedLessonIds();
  const enrolled = await isEnrolled(course.id);
  const locked = !enrolled && course.access_type !== "free" && !lesson.is_preview;

  return (
    <div className="player">
      <aside className="player__side">
        <Link href={`/academy/${slug}`} className="player__back">
          ← {course.title}
        </Link>
        <div className="player__modules">
          {course.modules.map((m) => (
            <div key={m.id} className="psm">
              <div className="psm__t">{m.title}</div>
              <ul>
                {m.lessons.map((l) => {
                  const done = completed.has(l.id);
                  const active = l.slug === lessonSlug;
                  return (
                    <li key={l.id}>
                      <Link href={`/academy/${slug}/${l.slug}`} className={`psl ${active ? "active" : ""}`}>
                        <span className={`psl__tick ${done ? "on" : ""}`}>{done ? "✓" : ""}</span>
                        <span>{l.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      <section className="player__main">
        {locked ? (
          <div className="locked">
            <span className="eyebrow">Vergrendeld</span>
            <h1 className="display" style={{ fontSize: "clamp(26px,3.5vw,44px)", margin: "10px 0 14px" }}>
              {lesson.title}
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: "46ch", marginBottom: 24 }}>
              Deze les is alleen voor ingeschreven members. Vraag toegang aan of meld je aan.
            </p>
            <Link href={`/academy/${slug}`} className="btn btn--blue">
              Naar cursusoverzicht
            </Link>
          </div>
        ) : (
          <>
            <div className="player__video">
              {lesson.video_provider === "youtube" && lesson.playback_id ? (
                <VideoFacade youtubeId={lesson.playback_id} title={lesson.title} main />
              ) : lesson.playback_id ? (
                <div className="provider-stub">
                  <p>
                    Video via <strong>{lesson.video_provider}</strong> (playback id{" "}
                    <code>{lesson.playback_id}</code>).
                  </p>
                  <p style={{ color: "var(--ash)", fontSize: 13, marginTop: 8 }}>
                    Signed-token afspelen wordt geactiveerd zodra de provider-keys zijn ingesteld.
                  </p>
                </div>
              ) : (
                <div className="provider-stub">
                  <p style={{ color: "var(--ash)" }}>Nog geen video gekoppeld aan deze les.</p>
                </div>
              )}
            </div>

            <span className="eyebrow" style={{ marginTop: 28, display: "block" }}>
              Les {idx + 1} / {flat.length}
            </span>
            <h1 className="display" style={{ fontSize: "clamp(26px,3.5vw,44px)", margin: "8px 0 20px" }}>
              {lesson.title}
            </h1>

            {lesson.body ? <Markdown>{lesson.body}</Markdown> : null}

            <MarkComplete
              lessonId={lesson.id}
              courseSlug={slug}
              initialDone={completed.has(lesson.id)}
              nextHref={next ? `/academy/${slug}/${next.slug}` : undefined}
            />
          </>
        )}
      </section>

      <style>{`
        .player { display:grid; grid-template-columns:300px 1fr; gap:40px; align-items:start; }
        .player__side { position:sticky; top:88px; }
        .player__back { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); display:block; margin-bottom:18px; }
        .player__back:hover { color:var(--blue); }
        .psm { margin-bottom:18px; }
        .psm__t { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--blue); margin-bottom:8px; }
        .psm ul { list-style:none; display:grid; gap:2px; }
        .psl { display:flex; align-items:center; gap:10px; padding:9px 10px; font-size:14px; color:var(--text-muted); border-left:2px solid transparent; }
        .psl:hover, .psl:focus-visible { background:var(--ink-2); border-left-color:var(--blue); color:#fff; }
        .psl.active { background:var(--ink-2); border-left-color:var(--blue); color:#fff; }
        .psl__tick { width:18px; height:18px; border:1px solid var(--line-d); border-radius:50%; display:grid; place-items:center; font-size:10px; color:var(--blue); flex-shrink:0; }
        .psl__tick.on { background:var(--blue); border-color:var(--blue); color:#fff; }
        .player__video { border:1px solid var(--line-d); }
        .provider-stub { aspect-ratio:16/9; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px; background:var(--ink-2); }
        .locked { border:1px dashed var(--line-d); padding:48px; text-align:center; }
        @media(max-width:860px){ .player{ grid-template-columns:1fr; } .player__side{ position:static; } }
      `}</style>
    </div>
  );
}
