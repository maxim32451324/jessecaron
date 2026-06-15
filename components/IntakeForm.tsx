"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

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
      setStatus(res.ok ? "ok" : "error");
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
        <p style={{ color: "#cfcfcc" }}>
          Je aanmelding is ontvangen. Jesse neemt zo snel mogelijk contact met je op om de
          persoonlijke intake in te plannen.
        </p>
        <a href="https://wa.me/31613980227" target="_blank" rel="noopener" className="btn btn--blue" style={{ marginTop: 24 }}>
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

      <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
        <button type="submit" className="btn btn--blue" disabled={status === "sending"}>
          {status === "sending" ? "Versturen…" : "Verstuur aanmelding ↗"}
        </button>
        {status === "error" ? (
          <span style={{ color: "#ff8a8a", fontSize: 14 }}>
            Er ging iets mis. Bel of app gerust direct: 06 139 80 227.
          </span>
        ) : null}
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
        .intake input:focus, .intake select:focus, .intake textarea:focus { border-color:var(--blue); outline:none; }
        .intake textarea { resize:vertical; }
        .intake-done { background:var(--ink-2); border:1px solid var(--blue); padding:40px; max-width:560px; }
        @media(max-width:640px){ .frow{ grid-template-columns:1fr; } }
      `}</style>
    </form>
  );
}
