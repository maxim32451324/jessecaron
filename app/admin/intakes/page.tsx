import { getServerClient } from "@/lib/supabase/server";
import { setIntakeStatus } from "../actions";

const STATUSES = ["new", "contacted", "converted", "archived"] as const;
const NEXT_LABEL: Record<string, string> = {
  new: "Markeer gecontacteerd",
  contacted: "Markeer geconverteerd",
  converted: "Archiveer",
  archived: "Heropen",
};
const NEXT_STATUS: Record<string, string> = {
  new: "contacted",
  contacted: "converted",
  converted: "archived",
  archived: "new",
};

export default async function AdminIntakes() {
  const supabase = await getServerClient();
  if (!supabase) return <p>Supabase niet geconfigureerd.</p>;

  const { data: intakes } = await supabase
    .from("intakes")
    .select("*")
    .order("created_at", { ascending: false });

  const counts: Record<string, number> = {};
  (intakes ?? []).forEach((i) => (counts[i.status] = (counts[i.status] ?? 0) + 1));

  return (
    <>
      <span className="eyebrow">Aanmeldingen</span>
      <h1 className="display" style={{ fontSize: "clamp(32px,5vw,60px)", margin: "10px 0 20px" }}>
        Intake-aanvragen
      </h1>
      <div className="in-filters">
        {STATUSES.map((s) => (
          <span key={s} className="in-count">
            {s}: <strong>{counts[s] ?? 0}</strong>
          </span>
        ))}
      </div>

      <div className="in-list">
        {(intakes ?? []).map((i) => (
          <div className="in-card" key={i.id}>
            <div className="in-main">
              <div className="in-top">
                <strong>{i.name}</strong>
                <span className={`role ${i.status}`}>{i.status}</span>
              </div>
              <div className="in-contact">
                <a href={`mailto:${i.email}`}>{i.email}</a>
                {i.phone ? <span> · {i.phone}</span> : null}
              </div>
              <div className="in-tags">
                {i.sport ? <span>{i.sport}</span> : null}
                {i.level ? <span>{i.level}</span> : null}
                {i.format ? <span>{i.format}</span> : null}
              </div>
              {i.message ? <p className="in-msg">“{i.message}”</p> : null}
              <span className="in-date">{new Date(i.created_at).toISOString().slice(0, 10)}</span>
            </div>
            <form action={setIntakeStatus.bind(null, i.id, NEXT_STATUS[i.status] ?? "contacted")}>
              <button className="btn">{NEXT_LABEL[i.status] ?? "Update"}</button>
            </form>
          </div>
        ))}
        {(intakes ?? []).length === 0 && <p style={{ color: "var(--ash)" }}>Nog geen aanmeldingen.</p>}
      </div>

      <style>{`
        .in-filters { display:flex; gap:18px; flex-wrap:wrap; margin-bottom:28px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--ash); }
        .in-count strong { color:var(--blue); }
        .in-list { display:grid; gap:12px; }
        .in-card { display:flex; justify-content:space-between; gap:20px; align-items:center; border:1px solid var(--line-d); background:var(--ink-2); padding:20px 22px; }
        .in-top { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
        .in-top strong { font-size:17px; }
        .in-contact { font-size:14px; color:var(--text-muted); margin-bottom:8px; }
        .in-contact a:hover, .in-contact a:focus-visible { color:var(--blue); }
        .in-tags { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
        .in-tags span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--ash); border:1px solid var(--line-d); padding:3px 8px; }
        .in-msg { font-size:14px; color:var(--text-muted); font-style:italic; margin-bottom:8px; max-width:60ch; }
        .in-date { font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); }
        .role { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; padding:3px 8px; border:1px solid var(--line-d); color:var(--ash); }
        .role.new { color:var(--blue); border-color:var(--blue); }
        .role.converted { color:#7CFFB2; border-color:#3a7; }
        @media(max-width:640px){ .in-card{ flex-direction:column; align-items:flex-start; } }
      `}</style>
    </>
  );
}
