"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";

export default function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/academy";
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const supabase = getBrowserClient();

  async function sendMagic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    setMsg(
      error
        ? { kind: "err", text: error.message }
        : { kind: "ok", text: "Check je inbox — we hebben je een inloglink gestuurd." },
    );
  }

  async function withPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setMsg({ kind: "err", text: error.message });
    } else {
      location.href = next;
    }
  }

  async function signUp() {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    setMsg(
      error
        ? { kind: "err", text: error.message }
        : { kind: "info", text: "Account aangemaakt. Bevestig je e-mail (indien gevraagd) en log daarna in." },
    );
  }

  return (
    <div className="lf">
      <div className="lf-tabs">
        <button className={mode === "magic" ? "on" : ""} onClick={() => setMode("magic")} type="button">
          Magic link
        </button>
        <button className={mode === "password" ? "on" : ""} onClick={() => setMode("password")} type="button">
          Wachtwoord
        </button>
      </div>

      <form onSubmit={mode === "magic" ? sendMagic : withPassword}>
        <label>
          <span>E-mail</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        {mode === "password" && (
          <label>
            <span>Wachtwoord</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={6}
            />
          </label>
        )}
        <button type="submit" className="btn btn--blue" disabled={busy} style={{ width: "100%", justifyContent: "center" }}>
          {busy ? "Bezig…" : mode === "magic" ? "Stuur inloglink" : "Inloggen"}
        </button>
        {mode === "password" && (
          <button type="button" onClick={signUp} disabled={busy} className="lf-link">
            Nog geen account? Registreer
          </button>
        )}
      </form>

      {msg && <div className={`lf-msg ${msg.kind}`}>{msg.text}</div>}

      <style>{`
        .lf-tabs { display:flex; gap:8px; margin-bottom:20px; }
        .lf-tabs button { flex:1; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; padding:10px; border:1px solid var(--line-d); background:transparent; color:var(--ash); cursor:pointer; }
        .lf-tabs button.on { background:var(--blue); border-color:var(--blue); color:#fff; }
        .lf form { display:grid; gap:16px; }
        .lf label { display:grid; gap:7px; }
        .lf span { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ash); }
        .lf input { background:var(--ink); border:1px solid var(--line-d); color:var(--paper); padding:12px 13px; font-size:15px; }
        .lf input:focus { border-color:var(--blue); outline:none; }
        .lf-link { background:none; border:none; color:var(--blue); font-size:13px; cursor:pointer; text-align:center; }
        .lf-msg { margin-top:16px; padding:12px 14px; font-size:13.5px; border:1px solid; }
        .lf-msg.ok { border-color:var(--blue); color:#bfe6f8; }
        .lf-msg.info { border-color:var(--ash); color:#d9d9d4; }
        .lf-msg.err { border-color:#a33; color:#ffb3b3; }
      `}</style>
    </div>
  );
}
