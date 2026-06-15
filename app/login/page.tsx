import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Inloggen" };

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div className="login-card">
        <Link href="/" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="Jesse Caron" style={{ height: 40, margin: "0 auto 28px" }} />
        </Link>
        <span className="eyebrow" style={{ display: "block", textAlign: "center" }}>
          Academy
        </span>
        <h1 className="display" style={{ fontSize: 36, textAlign: "center", margin: "10px 0 28px" }}>
          Log in
        </h1>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p style={{ marginTop: 24, fontSize: 13, color: "var(--ash)", textAlign: "center" }}>
          ← <Link href="/" style={{ color: "var(--blue)" }}>Terug naar de site</Link>
        </p>
      </div>
      <style>{`
        .login-wrap { min-height:100vh; display:grid; place-items:center; padding:28px; background:radial-gradient(1200px 600px at 50% -10%, #15151b, var(--ink)); }
        .login-card { width:100%; max-width:420px; background:var(--ink-2); border:1px solid var(--line-d); padding:40px 34px; }
      `}</style>
    </div>
  );
}
