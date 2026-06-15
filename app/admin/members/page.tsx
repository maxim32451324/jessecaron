import { getServerClient } from "@/lib/supabase/server";
import CreateStudent from "@/components/CreateStudent";

export default async function AdminMembers() {
  const supabase = await getServerClient();
  if (!supabase) return <p>Supabase niet geconfigureerd.</p>;

  const [{ data: members }, { data: courses }, { data: enrollments }, { data: progress }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("sort"),
      supabase.from("enrollments").select("user_id, course_id, status"),
      supabase.from("lesson_progress").select("user_id, completed_at"),
    ]);

  const completedByUser = new Map<string, number>();
  (progress ?? []).forEach((p) => {
    if (p.completed_at) completedByUser.set(p.user_id, (completedByUser.get(p.user_id) ?? 0) + 1);
  });
  const enrollByUser = new Map<string, number>();
  (enrollments ?? []).forEach((e) => {
    if (e.status === "active") enrollByUser.set(e.user_id, (enrollByUser.get(e.user_id) ?? 0) + 1);
  });

  return (
    <>
      <span className="eyebrow">Members</span>
      <h1 className="display" style={{ fontSize: "clamp(32px,5vw,60px)", margin: "10px 0 30px" }}>
        Studenten
      </h1>

      <div className="mgrid">
        <section>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Rol</th>
                <th>Inschrijvingen</th>
                <th>Voltooide lessen</th>
                <th>Lid sinds</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.id}>
                  <td>{m.full_name || "—"}</td>
                  <td>
                    <span className={`role ${m.role}`}>{m.role}</span>
                  </td>
                  <td>{enrollByUser.get(m.id) ?? 0}</td>
                  <td>{completedByUser.get(m.id) ?? 0}</td>
                  <td style={{ color: "var(--ash)", fontSize: 13 }}>{m.created_at.slice(0, 10)}</td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--ash)" }}>
                    Nog geen members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <aside className="mnew">
          <h2>Student uitnodigen</h2>
          <p className="mnote">
            Verstuurt een uitnodiging per e-mail (student stelt zelf wachtwoord in). Vereist
            <code> SUPABASE_SERVICE_ROLE_KEY</code> in <code>.env.local</code>.
          </p>
          <CreateStudent courses={(courses ?? []).map((c) => ({ id: c.id, title: c.title }))} />
        </aside>
      </div>

      <style>{`
        .mgrid { display:grid; grid-template-columns:1.5fr 1fr; gap:36px; align-items:start; }
        .adm-table { width:100%; border-collapse:collapse; font-size:14px; }
        .adm-table th { text-align:left; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--ash); padding:10px 12px; border-bottom:1px solid var(--line-d); }
        .adm-table td { padding:12px; border-bottom:1px solid var(--line-d); }
        .role { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding:3px 8px; border:1px solid var(--line-d); color:var(--ash); }
        .role.owner { color:var(--blue); border-color:var(--blue); }
        .mnew { border:1px solid var(--line-d); background:var(--ink-2); padding:26px; }
        .mnew h2 { font-size:18px; font-weight:700; margin-bottom:10px; }
        .mnote { font-size:12.5px; color:var(--ash); margin-bottom:18px; line-height:1.5; }
        @media(max-width:900px){ .mgrid{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
