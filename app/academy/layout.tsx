import Link from "next/link";
import { getUserAndProfile } from "@/lib/auth";
import "../globals.css";

export const metadata = { title: "Academy" };

export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  const { profile, user } = await getUserAndProfile();
  const isOwner = profile?.role === "owner";

  return (
    <div className="acad">
      <header className="acad-top">
        <div className="wrap acad-top__row">
          <Link href="/academy" aria-label="Academy">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="Jesse Caron" style={{ height: 30 }} />
          </Link>
          <nav className="acad-nav">
            <Link href="/academy">Catalogus</Link>
            <Link href="/account">Profiel</Link>
            {isOwner && (
              <Link href="/admin" className="acad-admin">
                Admin
              </Link>
            )}
            <Link href="/" className="acad-site">
              Site ↗
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="acad-out">
                Uitloggen
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="wrap acad-main">{children}</main>
      <footer className="acad-foot">
        <div className="wrap" style={{ fontSize: 12, color: "var(--ash)", fontFamily: "var(--font-jetbrains), monospace" }}>
          {user?.email ? `Ingelogd als ${user.email}` : "Academy"} · Jesse Caron Origami™
        </div>
      </footer>
      <style>{`
        .acad { min-height:100vh; display:flex; flex-direction:column; }
        .acad-top { position:sticky; top:0; z-index:50; background:rgba(14,14,16,.92); backdrop-filter:blur(10px); border-bottom:1px solid var(--line-d); }
        .acad-top__row { display:flex; align-items:center; justify-content:space-between; height:64px; }
        .acad-nav { display:flex; align-items:center; gap:22px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
        .acad-nav a { color:var(--paper); opacity:.82; }
        .acad-nav a:hover, .acad-nav a:focus-visible { opacity:1; color:var(--blue); }
        .acad-admin { color:var(--blue) !important; opacity:1 !important; }
        .acad-out { background:none; border:1px solid var(--line-d); color:var(--ash); font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; padding:7px 12px; cursor:pointer; }
        .acad-out:hover, .acad-out:focus-visible { color:var(--blue); border-color:var(--blue); }
        .acad-main { flex:1; padding-top:48px; padding-bottom:80px; }
        .acad-foot { border-top:1px solid var(--line-d); padding:22px 0; }
        @media(max-width:640px){ .acad-nav{ gap:14px; } .acad-site{ display:none; } }
      `}</style>
    </div>
  );
}
