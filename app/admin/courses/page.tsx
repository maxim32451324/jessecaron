import Link from "next/link";
import { getServerClient } from "@/lib/supabase/server";
import { createCourse } from "../actions";

export default async function AdminCourses() {
  const supabase = await getServerClient();
  const { data: courses } = supabase
    ? await supabase.from("courses").select("id, title, slug, access_type, is_published, sort").order("sort")
    : { data: [] };

  return (
    <>
      <span className="eyebrow">Cursussen</span>
      <h1 className="display" style={{ fontSize: "clamp(32px,5vw,60px)", margin: "10px 0 30px" }}>
        Beheer cursussen
      </h1>

      <div className="acl">
        <section>
          <div className="adm-list">
            {(courses ?? []).map((c) => (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="acl-item">
                <div>
                  <strong>{c.title}</strong>
                  <span className="acl-meta">
                    /{c.slug} · {c.access_type}
                  </span>
                </div>
                <span className={`pub ${c.is_published ? "on" : ""}`}>
                  {c.is_published ? "Live" : "Concept"}
                </span>
              </Link>
            ))}
            {(courses ?? []).length === 0 && <p style={{ color: "var(--ash)" }}>Nog geen cursussen.</p>}
          </div>
        </section>

        <aside className="acl-new">
          <h2>Nieuwe cursus</h2>
          <form action={createCourse} className="cform">
            <label>
              <span>Titel *</span>
              <input name="title" required />
            </label>
            <label>
              <span>Slug (optioneel)</span>
              <input name="slug" placeholder="auto van titel" />
            </label>
            <label>
              <span>Omschrijving</span>
              <textarea name="description" rows={3} />
            </label>
            <label>
              <span>Cover-afbeelding (pad/URL)</span>
              <input name="cover_image" placeholder="/brand/photos/..." />
            </label>
            <label>
              <span>Toegang</span>
              <select name="access_type" defaultValue="members">
                <option value="free">Gratis</option>
                <option value="members">Members</option>
                <option value="paid">Betaald</option>
              </select>
            </label>
            <button type="submit" className="btn btn--blue">
              Aanmaken →
            </button>
          </form>
        </aside>
      </div>

      <style>{`
        .acl { display:grid; grid-template-columns:1.4fr 1fr; gap:36px; align-items:start; }
        .adm-list { display:grid; gap:10px; }
        .acl-item { display:flex; justify-content:space-between; align-items:center; gap:14px; border:1px solid var(--line-d); padding:18px 20px; background:var(--ink-2); transition:transform var(--card-t), border-color var(--card-t); }
        .acl-item:hover, .acl-item:focus-visible { transform:translateY(var(--card-lift)); border-color:var(--blue); }
        .acl-meta { display:block; font-family:var(--font-jetbrains),monospace; font-size:12px; color:var(--ash); margin-top:4px; }
        .pub { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; border:1px solid var(--line-d); color:var(--ash); padding:4px 9px; }
        .pub.on { color:var(--blue); border-color:var(--blue); }
        .acl-new { border:1px solid var(--line-d); padding:26px; background:var(--ink-2); }
        .acl-new h2 { font-size:18px; font-weight:700; margin-bottom:18px; }
        .cform { display:grid; gap:14px; }
        .cform label { display:grid; gap:6px; }
        .cform span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ash); }
        .cform input, .cform select, .cform textarea { background:var(--ink); border:1px solid var(--line-d); color:var(--paper); padding:11px 12px; font-size:14px; }
        .cform input:focus, .cform select:focus, .cform textarea:focus { border-color:var(--blue); }
        .cform input:focus-visible, .cform select:focus-visible, .cform textarea:focus-visible { border-color:var(--blue); outline:2px solid var(--blue); outline-offset:2px; }
        @media(max-width:860px){ .acl{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
