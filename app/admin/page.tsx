import Link from "next/link";
import { getServerClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await getServerClient();
  if (!supabase) return <p>Supabase niet geconfigureerd.</p>;

  const [{ data: members }, { data: courses }, { data: enrollments }, { data: progress }, { data: intakes }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, role, created_at").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title, is_published"),
      supabase.from("enrollments").select("user_id, course_id, status"),
      supabase.from("lesson_progress").select("user_id, completed_at"),
      supabase.from("intakes").select("id, name, email, sport, status, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

  const completedByUser = new Map<string, number>();
  (progress ?? []).forEach((p) => {
    if (p.completed_at) completedByUser.set(p.user_id, (completedByUser.get(p.user_id) ?? 0) + 1);
  });
  const enrollByUser = new Map<string, number>();
  (enrollments ?? []).forEach((e) => {
    if (e.status === "active") enrollByUser.set(e.user_id, (enrollByUser.get(e.user_id) ?? 0) + 1);
  });

  const stats = [
    { label: "Members", value: members?.length ?? 0 },
    { label: "Cursussen", value: courses?.length ?? 0 },
    { label: "Gepubliceerd", value: (courses ?? []).filter((c) => c.is_published).length },
    { label: "Inschrijvingen", value: (enrollments ?? []).filter((e) => e.status === "active").length },
    { label: "Aanmeldingen", value: intakes?.length ?? 0 },
  ];

  return (
    <>
      <span className="eyebrow">Owner dashboard</span>
      <h1 className="display" style={{ fontSize: "clamp(32px,5vw,60px)", margin: "10px 0 30px" }}>
        Overzicht
      </h1>

      <div className="stat-row">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__v">{s.value}</div>
            <div className="stat__l">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="adm-cols">
        <section>
          <div className="adm-h">
            <h2>Members &amp; voortgang</h2>
            <Link href="/admin/courses" className="adm-link">Cursussen beheren →</Link>
          </div>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Rol</th>
                <th>Inschr.</th>
                <th>Voltooid</th>
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
                  <td>{completedByUser.get(m.id) ?? 0} lessen</td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--ash)" }}>
                    Nog geen members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section>
          <div className="adm-h">
            <h2>Aanmeldingen (intake)</h2>
          </div>
          <div className="intake-list">
            {(intakes ?? []).map((i) => (
              <div className="intake-item" key={i.id}>
                <div>
                  <strong>{i.name}</strong>
                  <span className="intake-meta">
                    {i.email}
                    {i.sport ? ` · ${i.sport}` : ""}
                  </span>
                </div>
                <span className={`role ${i.status}`}>{i.status}</span>
              </div>
            ))}
            {(intakes ?? []).length === 0 && (
              <p style={{ color: "var(--ash)" }}>Nog geen aanmeldingen.</p>
            )}
          </div>
        </section>
      </div>

      <style>{`
        .stat-row { display:grid; grid-template-columns:repeat(5,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); margin-bottom:44px; }
        .stat { background:var(--ink-2); padding:24px 22px; }
        .stat__v { font-family:var(--font-anton),sans-serif; font-size:42px; line-height:1; color:var(--blue); }
        .stat__l { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--ash); margin-top:8px; }
        .adm-cols { display:grid; grid-template-columns:1.3fr 1fr; gap:36px; align-items:start; }
        .adm-h { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:16px; }
        .adm-h h2 { font-size:20px; font-weight:700; }
        .adm-link { font-family:var(--font-jetbrains),monospace; font-size:12px; font-weight:600; color:var(--blue-bright); }
        .adm-table { width:100%; border-collapse:collapse; font-size:14px; }
        .adm-table th { text-align:left; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:var(--ash); padding:10px 12px; border-bottom:1px solid var(--line-d); }
        .adm-table td { padding:12px; border-bottom:1px solid var(--line-d); }
        .role { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding:3px 8px; border:1px solid var(--line-d); color:var(--ash); }
        .role.owner { color:var(--blue); border-color:var(--blue); }
        .role.new { color:var(--blue); border-color:var(--blue); }
        .intake-list { display:grid; gap:10px; }
        .intake-item { display:flex; justify-content:space-between; align-items:center; gap:12px; border:1px solid var(--line-d); padding:14px 16px; background:var(--ink-2); }
        .intake-meta { display:block; font-size:12px; color:var(--ash); margin-top:3px; }
        @media(max-width:900px){ .stat-row{ grid-template-columns:repeat(2,1fr);} .adm-cols{ grid-template-columns:1fr; } }
      `}</style>
    </>
  );
}
