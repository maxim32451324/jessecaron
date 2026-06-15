import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import "../globals.css";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, configured } = await getUserAndProfile();
  if (!configured) redirect("/");
  if (!user) redirect("/login?next=/admin");
  if (profile?.role !== "owner") {
    return (
      <div className="wrap" style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <span className="eyebrow">403</span>
          <h1 className="display" style={{ fontSize: 48, margin: "12px 0 16px" }}>
            Geen toegang
          </h1>
          <p style={{ color: "#cfcfcc", maxWidth: "40ch", margin: "0 auto 24px" }}>
            Dit is het eigenaarsdashboard. Je account heeft de rol <code>{profile?.role ?? "member"}</code>.
            Promoveer dit account tot <code>owner</code> in Supabase om toegang te krijgen.
          </p>
          <Link href="/academy" className="btn btn--blue">
            Naar Academy
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="wrap adm-top__row">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/admin" aria-label="Admin">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="" style={{ height: 28 }} />
            </Link>
            <span className="adm-badge">Owner</span>
          </div>
          <nav className="adm-nav">
            <Link href="/admin">Overzicht</Link>
            <Link href="/admin/courses">Cursussen</Link>
            <Link href="/admin/members">Members</Link>
            <Link href="/admin/intakes">Aanmeldingen</Link>
            <Link href="/academy">Academy ↗</Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="adm-out">
                Uitloggen
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="wrap" style={{ paddingTop: 44, paddingBottom: 80 }}>
        {children}
      </main>
      <style>{`
        .adm { min-height:100vh; }
        .adm-top { position:sticky; top:0; z-index:50; background:rgba(14,14,16,.94); backdrop-filter:blur(10px); border-bottom:1px solid var(--line-d); }
        .adm-top__row { display:flex; align-items:center; justify-content:space-between; height:62px; }
        .adm-badge { font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; background:var(--blue); color:#fff; padding:4px 9px; }
        .adm-nav { display:flex; align-items:center; gap:22px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
        .adm-nav a { color:var(--paper); opacity:.82; }
        .adm-nav a:hover { opacity:1; color:var(--blue); }
        .adm-out { background:none; border:1px solid var(--line-d); color:var(--ash); font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; padding:7px 12px; cursor:pointer; }
        .adm-out:hover { color:var(--paper); border-color:var(--paper); }
      `}</style>
    </div>
  );
}
