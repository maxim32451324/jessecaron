"use client";

import { useState } from "react";

type Course = { id: string; title: string };

export default function CreateStudent({ courses }: { courses: Course[] }) {
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    const course_ids = fd.getAll("course_ids").map(String);
    const res = await fetch("/api/admin/create-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        full_name: fd.get("full_name"),
        course_ids,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setStatus({ kind: "ok", text: "Uitnodiging verstuurd — de student stelt zelf een wachtwoord in." });
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus({ kind: "err", text: data.error ?? "Aanmaken mislukt." });
    }
  }

  return (
    <form onSubmit={onSubmit} className="cs">
      <div className="lrow">
        <label>
          <span>Naam</span>
          <input name="full_name" />
        </label>
        <label>
          <span>E-mail *</span>
          <input name="email" type="email" required />
        </label>
      </div>
      {courses.length > 0 && (
        <fieldset className="cs-courses">
          <legend>Direct inschrijven (optioneel)</legend>
          {courses.map((c) => (
            <label key={c.id} className="cs-chk">
              <input type="checkbox" name="course_ids" value={c.id} /> {c.title}
            </label>
          ))}
        </fieldset>
      )}
      <button className="btn btn--blue" disabled={busy}>
        {busy ? "Bezig…" : "Student uitnodigen →"}
      </button>
      {status && <div className={`cs-msg ${status.kind}`}>{status.text}</div>}

      <style>{`
        .cs { display:grid; gap:14px; }
        .cs .lrow { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .cs label { display:grid; gap:6px; }
        .cs span { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ash); }
        .cs input { background:var(--ink); border:1px solid var(--line-d); color:var(--paper); padding:10px 11px; font-size:14px; }
        .cs input:focus { border-color:var(--blue); }
        .cs input:focus-visible { border-color:var(--blue); outline:2px solid var(--blue); outline-offset:2px; }
        .cs-courses { border:1px solid var(--line-d); padding:14px 16px; display:grid; gap:8px; }
        .cs-courses legend { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--ash); padding:0 6px; }
        .cs-chk { display:flex !important; flex-direction:row; align-items:center; gap:8px; font-size:14px; color:var(--text-muted); }
        .cs-msg { padding:11px 13px; font-size:13px; border:1px solid; }
        .cs-msg.ok { border-color:var(--blue); color:#bfe6f8; }
        .cs-msg.err { border-color:#a33; color:#ffb3b3; }
        @media(max-width:640px){ .cs .lrow{ grid-template-columns:1fr; } }
      `}</style>
    </form>
  );
}
