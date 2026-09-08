"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

const WHATSAPP = "https://wa.me/31613980227";
const MAILTO =
  "mailto:info@jessecaron.com?subject=" +
  encodeURIComponent("Aanmelding persoonlijke intake") +
  "&body=" +
  encodeURIComponent(
    "Naam:\nE-mail:\nTelefoon:\nSport:\nNiveau:\nTrainingsvorm:\n\nMijn doel:\n",
  );

export default function IntakeForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // The API only reports ok when the lead is actually stored. Anything
      // else means the enquiry is lost unless the visitor contacts Jesse
      // directly — so never show the success screen on a soft failure.
      const data = (await res.json().catch(() => null)) as { persisted?: boolean } | null;
      setStatus(res.ok && data?.persisted === true ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="intake-done">
        <h2 className="display" style={{ fontSize: "clamp(26px,3vw,42px)", marginBottom: 14 }}>
          Bedankt! ✓
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          Je aanmelding is ontvangen. Jesse neemt zo snel mogelijk contact met je op om de
          persoonlijke intake in te plannen.
        </p>
        <a href={WHATSAPP} target="_blank" rel="noopener" className="btn btn--blue" style={{ marginTop: 24 }}>
          Direct via WhatsApp ↗
        </a>
      </div>
    );
  }

  return (
    <form className="intake" onSubmit={onSubmit}>
      <div className="frow">
        <label>
          <span>Naam *</span>
          <input name="name" required autoComplete="name" />
        </label>
        <label>
          <span>E-mail *</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
      </div>
      <div className="frow">
        <label>
          <span>Telefoon</span>
          <input name="phone" inputMode="tel" autoComplete="tel" />
        </label>
        <label>
          <span>Sport</span>
          <input name="sport" placeholder="Voetbal, hockey, tennis…" />
        </label>
      </div>
      <div className="frow">
        <label>
          <span>Niveau</span>
          <select name="level" defaultValue="">
            <option value="" disabled>
              Kies…
            </option>
            <option>Recreatief</option>
            <option>Amateur / club</option>
            <option>Selectie / talent</option>
            <option>Professioneel</option>
          </select>
        </label>
        <label>
          <span>Trainingsvorm</span>
          <select name="format" defaultValue="">
            <option value="" disabled>
              Kies…
            </option>
            <option>Personal training</option>
            <option>Groepstraining</option>
            <option>Online training</option>
            <option>Weet ik nog niet</option>
          </select>
        </label>
      </div>
      <label className="full">
        <span>Jouw doel / bericht</span>
        <textarea name="message" rows={4} placeholder="Waar wil je in groeien?" />
      </label>

      {status === "error" ? (
        <div className="intake-fail" role="alert">
          <strong>Je aanmelding is niet doorgekomen.</strong>
          <p>
            Er ging iets mis bij het opslaan. Je gegevens staan nog in het formulier — probeer het
            zo nog eens, of stuur je aanmelding direct naar Jesse. Dan komt hij zeker aan.
          </p>
          <div className="intake-fail__acts">
            <a href={WHATSAPP} target="_blank" rel="noopener" className="btn btn--blue">
              Stuur via WhatsApp ↗
            </a>
            <a href={MAILTO} className="btn">
              Mail info@jessecaron.com
            </a>
          </div>
          <span className="intake-fail__tel">
            Liever bellen? <a href="tel:+31613980227">06 139 80 227</a>
          </span>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--blue" disabled={status === "sending"}>
          {status === "sending"
            ? "Versturen…"
            : status === "error"
              ? "Probeer opnieuw ↗"
              : "Verstuur aanmelding ↗"}
        </button>
      </div>

      <style>{`
        .intake { display:grid; gap:20px; max-width:720px; }
        .frow { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .intake label { display:flex; flex-direction:column; gap:8px; }
        .intake label.full { grid-column:1 / -1; }
        .intake span { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--ash); }
        .intake input, .intake select, .intake textarea {
          background:var(--ink-2); border:1px solid var(--line-d); color:var(--paper);
          padding:13px 14px; font-family:var(--font-inter),sans-serif; font-size:15px; border-radius:0;
        }
        .intake input:focus, .intake select:focus, .intake textarea:focus { border-color:var(--blue); }
        .intake input:focus-visible, .intake select:focus-visible, .intake textarea:focus-visible {
          border-color:var(--blue); outline:2px solid var(--blue); outline-offset:2px;
        }
        .intake textarea { resize:vertical; }
        .intake-done { background:var(--ink-2); border:1px solid var(--blue); padding:40px; max-width:560px; }
        .intake-fail { background:var(--ink-2); border:1px solid #a33; border-left-width:3px; padding:22px 24px; display:grid; gap:12px; }
        .intake-fail strong { color:#ffb3b3; font-size:16px; }
        .intake-fail p { color:var(--text-muted); font-size:14.5px; margin:0; }
        .intake-fail__acts { display:flex; gap:12px; flex-wrap:wrap; margin-top:4px; }
        .intake-fail__tel { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.06em; color:var(--ash); }
        .intake-fail__tel a { color:var(--blue); }
        @media(max-width:640px){ .frow{ grid-template-columns:1fr; } }
      `}</style>
    </form>
  );
}
