import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { updateProfile } from "./actions";

export const metadata = { title: "Profiel" };

export default async function AccountPage() {
  const { user, profile, configured } = await getUserAndProfile();
  if (!configured) redirect("/");
  if (!user) redirect("/login?next=/account");

  return (
    <div style={{ minHeight: "100vh", paddingTop: 100 }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <Link href="/academy" className="back" style={{ fontFamily: "var(--font-jetbrains),monospace", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ash)" }}>
          ← Academy
        </Link>
        <span className="eyebrow" style={{ display: "block", marginTop: 24 }}>
          Profiel
        </span>
        <h1 className="display" style={{ fontSize: "clamp(32px,5vw,56px)", margin: "10px 0 32px" }}>
          Jouw account
        </h1>

        <form action={updateProfile} className="acct">
          <label>
            <span>Naam</span>
            <input name="full_name" defaultValue={profile?.full_name ?? ""} />
          </label>
          <label>
            <span>E-mail</span>
            <input value={user.email ?? ""} disabled />
          </label>
          <label>
            <span>Rol</span>
            <input value={profile?.role ?? "member"} disabled />
          </label>
          <button type="submit" className="btn btn--blue">
            Opslaan
          </button>
        </form>

        <form action="/auth/signout" method="post" style={{ marginTop: 28 }}>
          <button type="submit" className="btn">
            Uitloggen
          </button>
        </form>
      </div>
      <style>{`
        .acct { display:grid; gap:18px; max-width:480px; }
        .acct label { display:grid; gap:7px; }
        .acct span { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--ash); }
        .acct input { background:var(--ink-2); border:1px solid var(--line-d); color:var(--paper); padding:12px 13px; font-size:15px; }
        .acct input:focus { border-color:var(--blue); }
        .acct input:focus-visible { border-color:var(--blue); outline:2px solid var(--blue); outline-offset:2px; }
        .acct input:disabled { color:var(--ash); }
      `}</style>
    </div>
  );
}
