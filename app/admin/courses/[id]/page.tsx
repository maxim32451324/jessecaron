import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import {
  updateCourse,
  togglePublish,
  deleteCourse,
  createModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
} from "../../actions";

export default async function CourseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getServerClient();
  if (!supabase) return <p>Supabase niet geconfigureerd.</p>;

  const { data: course } = await supabase.from("courses").select("*").eq("id", id).single();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort")
    .eq("course_id", id)
    .order("sort");
  const moduleIds = (modules ?? []).map((m) => m.id);
  const { data: lessons } = moduleIds.length
    ? await supabase
        .from("lessons")
        .select("id, module_id, title, slug, body, video_provider, playback_id, is_preview, sort")
        .in("module_id", moduleIds)
        .order("sort")
    : { data: [] };

  return (
    <>
      <Link href="/admin/courses" className="back" style={{ fontFamily: "var(--font-jetbrains),monospace", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ash)" }}>
        ← Alle cursussen
      </Link>

      <div className="ce-head">
        <h1 className="display" style={{ fontSize: "clamp(28px,4vw,48px)", margin: "16px 0 0" }}>
          {course.title}
        </h1>
        <div className="ce-actions">
          <form action={togglePublish.bind(null, id, !course.is_published)}>
            <button className={`btn ${course.is_published ? "" : "btn--blue"}`}>
              {course.is_published ? "Depubliceren" : "Publiceren"}
            </button>
          </form>
          {course.is_published && (
            <Link href={`/academy/${course.slug}`} className="btn" target="_blank">
              Bekijk ↗
            </Link>
          )}
        </div>
      </div>
      <p className="ce-status">
        Status: <strong style={{ color: course.is_published ? "var(--blue)" : "var(--ash)" }}>{course.is_published ? "Live" : "Concept"}</strong>
      </p>

      <div className="ce-grid">
        {/* SETTINGS */}
        <section className="ce-box">
          <h2>Instellingen</h2>
          <form action={updateCourse} className="cform">
            <input type="hidden" name="id" value={id} />
            <label>
              <span>Titel</span>
              <input name="title" defaultValue={course.title} />
            </label>
            <label>
              <span>Slug</span>
              <input name="slug" defaultValue={course.slug} />
            </label>
            <label>
              <span>Omschrijving</span>
              <textarea name="description" rows={3} defaultValue={course.description ?? ""} />
            </label>
            <label>
              <span>Cover-afbeelding</span>
              <input name="cover_image" defaultValue={course.cover_image ?? ""} />
            </label>
            <label>
              <span>Toegang</span>
              <select name="access_type" defaultValue={course.access_type}>
                <option value="free">Gratis</option>
                <option value="members">Members</option>
                <option value="paid">Betaald</option>
              </select>
            </label>
            <button className="btn btn--blue">Opslaan</button>
          </form>

          <form action={deleteCourse.bind(null, id)} style={{ marginTop: 18 }}>
            <button className="btn" style={{ borderColor: "#a33", color: "#ffb3b3" }}>
              Verwijder cursus
            </button>
          </form>
        </section>

        {/* CURRICULUM */}
        <section className="ce-box">
          <h2>Curriculum</h2>

          {(modules ?? []).map((m) => (
            <div className="cemod" key={m.id}>
              <div className="cemod__head">
                <strong>{m.title}</strong>
                <form action={deleteModule.bind(null, m.id, id)}>
                  <button className="x" aria-label="Verwijder module">✕</button>
                </form>
              </div>

              <ul className="cemod__lessons">
                {(lessons ?? [])
                  .filter((l) => l.module_id === m.id)
                  .map((l) => (
                    <li key={l.id}>
                      <details>
                        <summary>
                          <span>{l.title}</span>
                          <span className="lmeta">
                            {l.is_preview ? "preview · " : ""}
                            {l.video_provider ?? "geen video"}
                          </span>
                        </summary>
                        <form action={updateLesson} className="lform">
                          <input type="hidden" name="id" value={l.id} />
                          <input type="hidden" name="course_id" value={id} />
                          <div className="lrow">
                            <label><span>Titel</span><input name="title" defaultValue={l.title} /></label>
                            <label><span>Slug</span><input name="slug" defaultValue={l.slug} /></label>
                          </div>
                          <label><span>Body</span><textarea name="body" rows={2} defaultValue={l.body ?? ""} /></label>
                          <div className="lrow">
                            <label>
                              <span>Provider</span>
                              <select name="video_provider" defaultValue={l.video_provider ?? ""}>
                                <option value="">geen</option>
                                <option value="youtube">youtube</option>
                                <option value="mux">mux</option>
                                <option value="bunny">bunny</option>
                              </select>
                            </label>
                            <label><span>Playback ID</span><input name="playback_id" defaultValue={l.playback_id ?? ""} /></label>
                            <label><span>Sort</span><input name="sort" type="number" defaultValue={l.sort} /></label>
                          </div>
                          <label className="chk">
                            <input type="checkbox" name="is_preview" defaultChecked={l.is_preview} /> Preview (gratis zichtbaar)
                          </label>
                          <div style={{ display: "flex", gap: 10 }}>
                            <button className="btn btn--blue">Opslaan</button>
                            <button formAction={deleteLesson.bind(null, l.id, id)} className="btn" style={{ borderColor: "#a33", color: "#ffb3b3" }}>
                              Verwijder
                            </button>
                          </div>
                        </form>
                      </details>
                    </li>
                  ))}
              </ul>

              <details className="add-les">
                <summary>+ Les toevoegen</summary>
                <form action={createLesson} className="lform">
                  <input type="hidden" name="module_id" value={m.id} />
                  <input type="hidden" name="course_id" value={id} />
                  <div className="lrow">
                    <label><span>Titel *</span><input name="title" required /></label>
                    <label><span>Slug</span><input name="slug" placeholder="auto" /></label>
                  </div>
                  <label><span>Body</span><textarea name="body" rows={2} /></label>
                  <div className="lrow">
                    <label>
                      <span>Provider</span>
                      <select name="video_provider" defaultValue="youtube">
                        <option value="">geen</option>
                        <option value="youtube">youtube</option>
                        <option value="mux">mux</option>
                        <option value="bunny">bunny</option>
                      </select>
                    </label>
                    <label><span>Playback ID</span><input name="playback_id" placeholder="YouTube ID" /></label>
                    <label><span>Sort</span><input name="sort" type="number" defaultValue={0} /></label>
                  </div>
                  <label className="chk"><input type="checkbox" name="is_preview" /> Preview</label>
                  <button className="btn btn--blue">Les toevoegen</button>
                </form>
              </details>
            </div>
          ))}

          <details className="add-mod">
            <summary>+ Module toevoegen</summary>
            <form action={createModule} className="cform" style={{ marginTop: 12 }}>
              <input type="hidden" name="course_id" value={id} />
              <div className="lrow">
                <label><span>Titel *</span><input name="title" required /></label>
                <label><span>Sort</span><input name="sort" type="number" defaultValue={(modules?.length ?? 0) + 1} /></label>
              </div>
              <button className="btn btn--blue">Module toevoegen</button>
            </form>
          </details>
        </section>
      </div>

      <style>{`
        .ce-head { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-wrap:wrap; }
        .ce-actions { display:flex; gap:10px; }
        .ce-status { color:var(--ash); font-size:13px; margin:8px 0 32px; font-family:var(--font-jetbrains),monospace; }
        .ce-grid { display:grid; grid-template-columns:360px 1fr; gap:32px; align-items:start; }
        .ce-box { border:1px solid var(--line-d); background:var(--ink-2); padding:26px; }
        .ce-box h2 { font-size:18px; font-weight:700; margin-bottom:18px; }
        .cform { display:grid; gap:14px; }
        .cform label, .lform label { display:grid; gap:6px; }
        .cform span, .lform span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ash); }
        .cform input, .cform select, .cform textarea, .lform input, .lform select, .lform textarea { background:var(--ink); border:1px solid var(--line-d); color:var(--paper); padding:10px 11px; font-size:14px; width:100%; }
        .cform input:focus, .lform input:focus, .cform textarea:focus, .lform textarea:focus, .cform select:focus, .lform select:focus { border-color:var(--blue); outline:none; }
        .cemod { border:1px solid var(--line-d); margin-bottom:14px; }
        .cemod__head { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid var(--line-d); background:var(--ink); }
        .x { background:none; border:none; color:var(--ash); cursor:pointer; font-size:14px; }
        .x:hover { color:#ffb3b3; }
        .cemod__lessons { list-style:none; }
        .cemod__lessons > li { border-bottom:1px solid var(--line-d); }
        .cemod__lessons summary, .add-les summary, .add-mod summary { cursor:pointer; padding:12px 16px; display:flex; justify-content:space-between; gap:12px; align-items:center; font-size:14px; }
        .cemod__lessons summary:hover, .add-les summary:hover, .add-mod summary:hover { background:var(--ink); }
        .lmeta { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); }
        .lform { display:grid; gap:12px; padding:16px; background:var(--ink); }
        .lrow { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .lform .lrow:has(> label:nth-child(3)) { grid-template-columns:1fr 1fr 80px; }
        .chk { display:flex !important; flex-direction:row !important; align-items:center; gap:8px; font-size:13px; color:#cfcfcc; }
        .chk input { width:auto; }
        .add-les, .add-mod { border:1px dashed var(--line-d); margin-top:10px; }
        .add-mod { margin-top:16px; }
        @media(max-width:900px){ .ce-grid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
