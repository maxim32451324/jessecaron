"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/training", label: "Training" },
  { href: "/videos", label: "Videos" },
  { href: "/blog", label: "Blog" },
  { href: "/shop", label: "Shop" },
  { href: "/academy", label: "Academy" },
  { href: "/contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      style={{
        position: "fixed",
        inset: "0 0 auto 0",
        zIndex: 100,
        transition: ".3s",
        background: scrolled ? "rgba(14,14,16,.92)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid var(--line-d)" : "1px solid transparent",
      }}
    >
      <div
        className="wrap"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 78,
        }}
      >
        <Link href="/" aria-label="Jesse Caron — home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="Jesse Caron" style={{ height: 38 }} />
        </Link>

        <nav className="nav-links" aria-label="Hoofdmenu">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
          <Link href="/aanmelden" className="nav-cta">
            Aanmelden
          </Link>
        </nav>

        <button
          className="burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span /> <span /> <span />
        </button>
      </div>

      {open && (
        <div className="mobile-menu">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/aanmelden" onClick={() => setOpen(false)}>
            Aanmelden
          </Link>
        </div>
      )}

      <style>{`
        .nav-links { display:flex; gap:30px; align-items:center; }
        .nav-link { font-size:13px; font-family:var(--font-jetbrains),monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--paper); opacity:.85; transition:.2s; }
        .nav-link:hover { opacity:1; color:var(--blue); }
        .nav-cta { padding:11px 20px; border:1px solid var(--blue); color:#fff; background:var(--blue); font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; transition:.2s; }
        .nav-cta:hover { background:transparent; color:var(--blue); }
        .burger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; }
        .burger span { width:26px; height:2px; background:var(--paper); transition:.3s; display:block; }
        .mobile-menu { position:fixed; inset:78px 0 0; background:var(--ink); z-index:99; padding:34px 28px; }
        .mobile-menu a { display:block; font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:30px; padding:14px 0; border-bottom:1px solid var(--line-d); }
        @media(max-width:860px){ .nav-links{display:none;} .burger{display:flex;} }
      `}</style>
    </header>
  );
}
