"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname() ?? "/";

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
    <>
      <header className={`site-head ${scrolled ? "is-scrolled" : ""}`}>
        <div className="wrap site-head__row">
          <Link href="/" aria-label="Jesse Caron — home" className="site-head__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="Jesse Caron" style={{ height: 38 }} />
          </Link>

          <nav className="nav-links" aria-label="Hoofdmenu">
            {LINKS.map((l) => {
              const active = isActive(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`nav-link ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/aanmelden"
              className="nav-cta"
              aria-current={isActive("/aanmelden") ? "page" : undefined}
            >
              Aanmelden
            </Link>
          </nav>

          <button
            className={`burger ${open ? "is-open" : ""}`}
            aria-label={open ? "Menu sluiten" : "Menu openen"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span /> <span /> <span />
          </button>
        </div>
      </header>

      {/* Rendered as a sibling of <header>: a scrolled header sets
          backdrop-filter, which makes it a containing block for fixed
          descendants and would squash this menu into the header's height. */}
      {open && (
        <div className="mobile-menu">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={active ? "is-active" : ""}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/aanmelden" onClick={() => setOpen(false)}>
            Aanmelden
          </Link>
        </div>
      )}

      <style>{`
        .site-head { position:fixed; inset:0 0 auto 0; z-index:100; transition:background .3s, border-color .3s;
          /* scrim so the white mark never sits bare on the hero photo */
          background:linear-gradient(180deg, rgba(14,14,16,.78) 0%, rgba(14,14,16,.42) 60%, rgba(14,14,16,0) 100%);
          border-bottom:1px solid transparent; }
        .site-head.is-scrolled { background:rgba(14,14,16,.92); backdrop-filter:blur(10px); border-bottom-color:var(--line-d); }
        .site-head__row { display:flex; align-items:center; justify-content:space-between; height:78px; }
        .site-head__logo { display:inline-flex; }
        .nav-links { display:flex; gap:30px; align-items:center; }
        .nav-link { position:relative; font-size:13px; font-family:var(--font-jetbrains),monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--paper); opacity:.85; transition:.2s; padding-bottom:4px; }
        .nav-link::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px; background:var(--blue); transform:scaleX(0); transform-origin:left; transition:transform .25s; }
        .nav-link:hover, .nav-link:focus-visible { opacity:1; color:var(--blue); }
        .nav-link:hover::after, .nav-link:focus-visible::after { transform:scaleX(1); }
        .nav-link.is-active { opacity:1; color:var(--paper); }
        .nav-link.is-active::after { transform:scaleX(1); }
        .nav-cta { padding:11px 20px; border:1px solid var(--blue); color:#fff; background:var(--blue); font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; transition:.2s; }
        .nav-cta:hover, .nav-cta:focus-visible { background:var(--blue-deep); border-color:var(--blue-deep); color:#fff; }
        .burger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; }
        .burger span { width:26px; height:2px; background:var(--paper); transition:transform .3s, opacity .2s; display:block; }
        .burger:hover span, .burger:focus-visible span { background:var(--blue); }
        .burger.is-open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
        .burger.is-open span:nth-child(2) { opacity:0; }
        .burger.is-open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }
        .mobile-menu { position:fixed; inset:78px 0 0; background:var(--ink); z-index:99; padding:34px 28px; overflow-y:auto; }
        .mobile-menu a { display:block; font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:30px; padding:14px 0; border-bottom:1px solid var(--line-d); }
        .mobile-menu a.is-active { color:var(--blue); }
        @media(max-width:860px){ .nav-links{display:none;} .burger{display:flex;} }
        @media(prefers-reduced-motion:reduce){ .nav-link::after { transition:none; } }
      `}</style>
    </>
  );
}
