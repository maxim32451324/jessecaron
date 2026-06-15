import Link from "next/link";
import { listCourses, getCompletedLessonIds, getCourseBySlug, courseProgress } from "@/lib/academy";
import { getUserAndProfile } from "@/lib/auth";
import { localImg } from "@/lib/content";
import ProgressRing from "@/components/ProgressRing";

const ACCESS_LABEL: Record<string, string> = { free: "Gratis", members: "Members", paid: "Betaald" };

export default async function AcademyCatalog() {
  const { profile } = await getUserAndProfile();
  const courses = await listCourses();
  const completed = await getCompletedLessonIds();

  // progress per course
  const details = await Promise.all(courses.map((c) => getCourseBySlug(c.slug)));
  const progressBySlug = new Map<string, number>();
  details.forEach((d) => {
    if (d) progressBySlug.set(d.slug, courseProgress(d, completed));
  });

  // continue learning = first course with progress > 0 and < 100, else first course
  const inProgress = courses.find((c) => {
    const p = progressBySlug.get(c.slug) ?? 0;
    return p > 0 && p < 100;
  });

  return (
    <>
      <span className="eyebrow">Academy</span>
      <h1 className="display" style={{ fontSize: "clamp(34px,5vw,64px)", margin: "10px 0 8px" }}>
        Welkom{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
      </h1>
      <p style={{ color: "#bdbdba", maxWidth: "52ch", marginBottom: 44 }}>
        Train de vaardigheid, niet de oefening. Kies een cursus en ga verder waar je gebleven was.
      </p>

      {inProgress && (
        <Link href={`/academy/${inProgress.slug}`} className="continue">
          <div>
            <span className="continue__k">Ga verder met leren</span>
            <h2 className="continue__t">{inProgress.title}</h2>
          </div>
          <ProgressRing pct={progressBySlug.get(inProgress.slug) ?? 0} size={58} />
        </Link>
      )}

      {courses.length === 0 ? (
        <div className="empty">
          <p>Nog geen cursussen gepubliceerd.</p>
          {profile?.role === "owner" && (
            <Link href="/admin/courses" className="btn btn--blue" style={{ marginTop: 16 }}>
              Maak je eerste cursus ↗
            </Link>
          )}
        </div>
      ) : (
        <div className="cat-grid">
          {courses.map((c) => {
            const pct = progressBySlug.get(c.slug) ?? 0;
            const detail = details.find((d) => d?.slug === c.slug);
            return (
              <Link key={c.id} href={`/academy/${c.slug}`} className="ccard">
                <div className="ccard__img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cover_image ? localImg(c.cover_image) : ""} alt="" />
                  <span className="ccard__badge">{ACCESS_LABEL[c.access_type] ?? c.access_type}</span>
                </div>
                <div className="ccard__b">
                  <div style={{ flex: 1 }}>
                    <h3 className="ccard__t">{c.title}</h3>
                    <p className="ccard__d">{c.description}</p>
                    <span className="ccard__meta">{detail?.lessonCount ?? 0} lessen</span>
                  </div>
                  <ProgressRing pct={pct} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        .continue { display:flex; align-items:center; justify-content:space-between; gap:20px; background:var(--blue); color:#fff; padding:24px 28px; margin-bottom:44px; }
        .continue__k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; opacity:.9; }
        .continue__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:28px; line-height:1; margin-top:6px; }
        .cat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:24px; }
        .ccard { background:var(--ink-2); border:1px solid var(--line-d); display:flex; flex-direction:column; transition:.3s; }
        .ccard:hover { border-color:var(--blue); transform:translateY(-4px); }
        .ccard__img { position:relative; aspect-ratio:16/9; overflow:hidden; background:#000; }
        .ccard__img img { width:100%; height:100%; object-fit:cover; filter:grayscale(.3) brightness(.8); transition:.5s; }
        .ccard:hover .ccard__img img { filter:grayscale(0) brightness(.95); transform:scale(1.04); }
        .ccard__badge { position:absolute; top:12px; left:12px; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; background:var(--ink); color:var(--paper); padding:4px 9px; border:1px solid var(--line-d); }
        .ccard__b { padding:22px; display:flex; gap:16px; align-items:flex-start; }
        .ccard__t { font-size:20px; font-weight:700; line-height:1.2; margin-bottom:8px; }
        .ccard__d { font-size:14px; color:#a9a9a5; margin-bottom:12px; }
        .ccard__meta { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--blue); }
        .empty { border:1px dashed var(--line-d); padding:48px; text-align:center; color:var(--ash); }
        @media(max-width:760px){ .cat-grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
