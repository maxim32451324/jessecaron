"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavSub = { href: string; label: string; meta?: string };

type MenuKey = "training" | "blog";
type NavLink = { href: string; label: string; menu?: MenuKey };

const LINKS: NavLink[] = [
  { href: "/training", label: "Training", menu: "training" },
  { href: "/videos", label: "Videos" },
  { href: "/blog", label: "Blog", menu: "blog" },
  { href: "/shop", label: "Shop" },
  { href: "/academy", label: "Academy" },
  { href: "/contact", label: "Contact" },
];

/** How long the panel survives the pointer leaving it, in ms.
 *  Long enough for the diagonal run from "Training" to the eleventh item — a
 *  straight line from the trigger to a link near the bottom of the panel leaves
 *  the trigger's box before it enters the panel's, and a zero delay dismisses
 *  the menu mid-gesture. Short enough that it never feels stuck open. */
const CLOSE_DELAY = 180;

type MenuConfig = {
  key: MenuKey;
  /** First link in the panel — the section index the trigger itself points at, so
   *  keyboard users who press Enter to open lose nothing: Enter, Enter still lands
   *  on /training. */
  overview: string;
  eyebrow: string;
  items: NavSub[];
  /** Trailing "and the rest" link. Only the blog needs one. */
  more?: { href: string; label: string };
  numbered: boolean;
};

export default function NavClient({
  training,
  topics,
  topicTotal,
}: {
  training: NavSub[];
  topics: NavSub[];
  topicTotal: number;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openKey, setOpenKey] = useState<MenuKey | null>(null);
  /** Only the groups the reader has actually touched. Everything else falls back
   *  to "open if you are inside that section", derived from the path at render —
   *  which keeps it correct after a client-side navigation without an effect that
   *  writes state (and the cascading render that comes with one). */
  const [groupOverride, setGroupOverride] = useState<Partial<Record<MenuKey, boolean>>>({});
  const pathname = usePathname() ?? "/";
  const navRef = useRef<HTMLElement | null>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const isCurrent = (href: string) => pathname === href;

  const MENUS: Record<MenuKey, MenuConfig> = {
    training: {
      key: "training",
      overview: "Alle trainingen",
      eyebrow: "Trainingen",
      items: training,
      numbered: true,
    },
    blog: {
      key: "blog",
      overview: "Blog overzicht",
      eyebrow: "Onderwerpen",
      items: topics,
      more: { href: "/blog/onderwerpen", label: `Alle ${topicTotal} onderwerpen` },
      numbered: false,
    },
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Touch has no "leave", so a tap anywhere else is the only way back out.
  useEffect(() => {
    if (!openKey) return;
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenKey(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openKey]);

  const requestOpen = useCallback((key: MenuKey) => setOpenKey(key), []);
  const requestClose = useCallback(
    (key: MenuKey) => setOpenKey((k) => (k === key ? null : k)),
    [],
  );

  const groupOpen = (key: MenuKey) => groupOverride[key] ?? pathname.startsWith(`/${key}/`);
  const toggleGroup = (key: MenuKey) =>
    setGroupOverride((g) => ({ ...g, [key]: !groupOpen(key) }));

  return (
    <>
      <header className={`site-head ${scrolled ? "is-scrolled" : ""}`}>
        <div className="wrap site-head__row">
          <Link href="/" aria-label="Jesse Caron — home" className="site-head__logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-White.png" alt="Jesse Caron" style={{ height: 38 }} />
          </Link>

          <nav className="nav-links" aria-label="Hoofdmenu" ref={navRef}>
            {LINKS.map((l) => {
              const active = isActive(l.href);
              if (l.menu) {
                return (
                  <Dropdown
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    config={MENUS[l.menu]}
                    active={active}
                    open={openKey === l.menu}
                    onRequestOpen={requestOpen}
                    onRequestClose={requestClose}
                    isCurrent={isCurrent}
                  />
                );
              }
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
          descendants and would squash this menu into the header's height.
          (The desktop panels are position:absolute inside the header instead,
          which that containing block does not affect.) */}
      {open && (
        <div className="mobile-menu">
          {LINKS.map((l) => {
            const active = isActive(l.href);
            const sub = l.menu ? MENUS[l.menu] : null;
            const expanded = Boolean(l.menu && groupOpen(l.menu));
            return (
              <div className="mm-group" key={l.href}>
                <div className="mm-row">
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`mm-link ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                  >
                    {l.label}
                  </Link>
                  {sub && (
                    <button
                      type="button"
                      className={`mm-toggle ${expanded ? "is-open" : ""}`}
                      aria-expanded={expanded}
                      aria-controls={`mm-sub-${sub.key}`}
                      aria-label={`${l.label} — onderdelen ${expanded ? "verbergen" : "tonen"}`}
                      onClick={() => toggleGroup(sub.key)}
                    >
                      <span className="mm-toggle__i" aria-hidden="true" />
                    </button>
                  )}
                </div>
                {sub && (
                  <ul className="mm-sub" id={`mm-sub-${sub.key}`} hidden={!expanded}>
                    {sub.items.map((s) => (
                      <li key={s.href}>
                        <Link
                          href={s.href}
                          onClick={() => setOpen(false)}
                          className={isCurrent(s.href) ? "is-current" : ""}
                          aria-current={isCurrent(s.href) ? "page" : undefined}
                        >
                          <span className="mm-sub__n">{s.label}</span>
                          {s.meta && <span className="mm-sub__c">{s.meta}</span>}
                        </Link>
                      </li>
                    ))}
                    {sub.more && (
                      <li>
                        <Link href={sub.more.href} onClick={() => setOpen(false)} className="mm-sub__all">
                          {sub.more.label} →
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="mm-group">
            <div className="mm-row">
              <Link href="/aanmelden" onClick={() => setOpen(false)} className="mm-link">
                Aanmelden
              </Link>
            </div>
          </div>
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
        /* align-self:stretch on both the row and each dropdown wrapper is what makes
           top:100% land on the header's bottom edge — and it removes the dead gap a
           mouse would otherwise have to cross between the link text and the panel. */
        .nav-links { display:flex; gap:30px; align-items:center; align-self:stretch; }
        .nav-link { position:relative; font-size:13px; font-family:var(--font-jetbrains),monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--paper); opacity:.85; transition:.2s; padding-bottom:4px; }
        .nav-link::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px; background:var(--blue); transform:scaleX(0); transform-origin:left; transition:transform .25s; }
        .nav-link:hover, .nav-link:focus-visible { opacity:1; color:var(--blue); }
        .nav-link:hover::after, .nav-link:focus-visible::after { transform:scaleX(1); }
        .nav-link.is-active { opacity:1; color:var(--paper); }
        .nav-link.is-active::after { transform:scaleX(1); }
        .nav-cta { padding:11px 20px; border:1px solid var(--blue); color:#fff; background:var(--blue); font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; transition:.2s; }
        .nav-cta:hover, .nav-cta:focus-visible { background:var(--blue-deep); border-color:var(--blue-deep); color:#fff; }

        /* ---- dropdowns -------------------------------------------------- */
        .nav-item { position:relative; display:flex; align-items:center; align-self:stretch; }
        .nav-item .nav-link { display:inline-flex; align-items:center; gap:8px; }
        .nav-caret { width:5px; height:5px; flex:none; border-right:1.5px solid currentColor; border-bottom:1.5px solid currentColor; transform:translateY(-2px) rotate(45deg); transition:transform .2s; }
        .nav-item .nav-link[aria-expanded="true"] { opacity:1; color:var(--blue); }
        .nav-item .nav-link[aria-expanded="true"]::after { transform:scaleX(1); }
        .nav-item .nav-link[aria-expanded="true"] .nav-caret { transform:translateY(1px) rotate(-135deg); }

        /* position:absolute, not fixed. The scrolled header sets backdrop-filter and
           is therefore a containing block for fixed descendants — a fixed panel here
           would resolve against the 78px header box, which is exactly how the mobile
           menu collapsed to a strip once before. */
        .nav-panel { position:absolute; top:100%; left:0; z-index:2; width:340px; max-width:calc(100vw - 32px);
          max-height:calc(100vh - 96px); overflow-y:auto; overscroll-behavior:contain;
          background:var(--ink-2); border:1px solid var(--line-d); padding:8px 0 10px;
          opacity:0; visibility:hidden; transform:translateY(-6px);
          transition:opacity .18s ease, transform .18s ease, visibility 0s linear .18s; }
        .nav-panel.is-open { opacity:1; visibility:visible; transform:none; transition:opacity .18s ease, transform .18s ease, visibility 0s; }
        .nav-panel--blog { width:320px; }
        .np-all { display:flex; align-items:baseline; justify-content:space-between; gap:12px; min-width:0;
          padding:9px 18px 11px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--text-muted); border-bottom:1px solid var(--line-d); transition:color .2s; }
        .np-all:hover, .np-all:focus-visible { color:var(--blue); }
        .np-eyebrow { padding:14px 18px 8px; font-family:var(--font-jetbrains),monospace; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:var(--ash); }
        .np-list { list-style:none; display:grid; gap:0; }
        .np-list > li { min-width:0; }
        /* Same hover language as the mobile sub-list and the rest of the site: a
           brand-blue edge and blue type. The background step is ink on ink-2, one
           surface token darker — not a grey wash. */
        .np-list a { display:flex; align-items:baseline; gap:12px; min-width:0; padding:7px 18px 7px 16px; border-left:2px solid transparent; font-size:15px; line-height:1.35; color:var(--text-muted); transition:color .2s, background .2s, border-color .2s; }
        .np-list a:hover, .np-list a:focus-visible { color:var(--blue); background:var(--ink); border-left-color:var(--blue); }
        .np-list a.is-current { color:var(--paper); border-left-color:var(--blue); }
        .np-list a.is-current .np-no { color:var(--blue); }
        .np-no { flex:none; font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); transition:color .2s; }
        .np-n { min-width:0; overflow-wrap:anywhere; }
        .np-c { flex:none; margin-left:auto; font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); }
        .np-more { display:block; margin-top:6px; padding:11px 18px 4px; border-top:1px solid var(--line-d); font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--blue); transition:color .2s; }
        .np-more:hover, .np-more:focus-visible { color:var(--paper); }

        .burger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:6px; }
        .burger span { width:26px; height:2px; background:var(--paper); transition:transform .3s, opacity .2s; display:block; }
        .burger:hover span, .burger:focus-visible span { background:var(--blue); }
        .burger.is-open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
        .burger.is-open span:nth-child(2) { opacity:0; }
        .burger.is-open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

        .mobile-menu { position:fixed; inset:78px 0 0; background:var(--ink); z-index:99; padding:34px 28px; overflow-y:auto; }
        .mm-group { border-bottom:1px solid var(--line-d); }
        /* min-width:0 on the link: "Schoolsport Vereniging Rotterdam Atletiek" and
           friends must be allowed to wrap rather than widen the row past 390px. */
        .mm-row { display:flex; align-items:center; justify-content:space-between; gap:14px; }
        .mm-link { display:block; min-width:0; flex:1; font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:30px; padding:14px 0; }
        .mm-link.is-active { color:var(--blue); }
        .mm-toggle { flex:none; width:46px; height:46px; display:flex; align-items:center; justify-content:center; background:none; border:1px solid var(--line-d); cursor:pointer; color:var(--paper); transition:color .2s, border-color .2s; }
        .mm-toggle:hover, .mm-toggle:focus-visible { color:var(--blue); border-color:var(--blue); }
        .mm-toggle__i { width:9px; height:9px; border-right:2px solid currentColor; border-bottom:2px solid currentColor; transform:translateY(-3px) rotate(45deg); transition:transform .2s; }
        .mm-toggle.is-open .mm-toggle__i { transform:translateY(2px) rotate(-135deg); }
        .mm-sub { list-style:none; display:grid; gap:0; padding:0 0 14px; }
        .mm-sub > li { min-width:0; }
        .mm-sub a { display:flex; align-items:baseline; gap:12px; min-width:0; padding:9px 0 9px 16px; border-left:1px solid var(--line-d); font-size:16px; color:var(--text-muted); transition:color .2s, border-color .2s; }
        .mm-sub a:hover, .mm-sub a:focus-visible { color:var(--blue); border-left-color:var(--blue); }
        .mm-sub a.is-current { color:var(--paper); border-left-color:var(--blue); }
        .mm-sub__n { min-width:0; overflow-wrap:anywhere; }
        .mm-sub__c { flex:none; margin-left:auto; font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); }
        .mm-sub__all { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--blue); }

        @media(max-width:860px){ .nav-links{display:none;} .burger{display:flex;} }
        @media(prefers-reduced-motion:reduce){
          .nav-link::after, .nav-caret, .mm-toggle__i { transition:none; }
          .nav-panel, .nav-panel.is-open { transition:none; transform:none; }
        }
      `}</style>
    </>
  );
}

function Dropdown({
  href,
  label,
  config,
  active,
  open,
  onRequestOpen,
  onRequestClose,
  isCurrent,
}: {
  href: string;
  label: string;
  config: MenuConfig;
  active: boolean;
  open: boolean;
  onRequestOpen: (k: MenuKey) => void;
  onRequestClose: (k: MenuKey) => void;
  isCurrent: (href: string) => boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLAnchorElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Which end of the panel to focus once React has actually made it visible.
   *  visibility:hidden is not focusable, so this cannot be done in the handler. */
  const pendingFocus = useRef<"first" | "last" | null>(null);
  /** onClick carries no pointerType, so the last pointerdown records it. */
  const lastPointer = useRef<string>("mouse");
  const panelId = `nav-panel-${config.key}`;
  const triggerId = `nav-trigger-${config.key}`;

  const items = useCallback(
    () => Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? []),
    [],
  );

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!open) {
      pendingFocus.current = null;
      return;
    }
    const which = pendingFocus.current;
    pendingFocus.current = null;
    if (!which) return;
    const list = items();
    (which === "first" ? list[0] : list[list.length - 1])?.focus();
  }, [open, items]);

  const openAndFocus = (which: "first" | "last") => {
    if (open) {
      const list = items();
      (which === "first" ? list[0] : list[list.length - 1])?.focus();
    } else {
      pendingFocus.current = which;
      onRequestOpen(config.key);
    }
  };

  const close = (focusTrigger: boolean) => {
    clearTimer();
    onRequestClose(config.key);
    if (focusTrigger) triggerRef.current?.focus();
  };

  /** The next real nav stop after this trigger, ignoring everything in the panel. */
  const afterTrigger = (): HTMLElement | null => {
    const nav = wrapRef.current?.closest("nav");
    const trigger = triggerRef.current;
    if (!nav || !trigger) return null;
    const all = Array.from(
      nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ).filter((el) => !panelRef.current?.contains(el));
    const i = all.indexOf(trigger);
    return i < 0 ? null : (all[i + 1] ?? null);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    switch (e.key) {
      // Enter and Space open instead of following the link. Nothing is lost: the
      // first item in the panel IS this link, so Enter-Enter still reaches /training.
      case "Enter":
      case " ":
      case "Spacebar":
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        openAndFocus("first");
        break;
      case "ArrowUp":
      case "Up":
        e.preventDefault();
        openAndFocus("last");
        break;
      case "Escape":
      case "Esc":
        if (open) {
          e.preventDefault();
          close(true);
        }
        break;
      case "Tab":
        if (open) close(false);
        break;
      default:
        break;
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    if (!list.length) return;
    const i = list.indexOf(document.activeElement as HTMLAnchorElement);
    switch (e.key) {
      case "ArrowDown":
      case "Down":
        e.preventDefault();
        list[(i + 1) % list.length]?.focus();
        break;
      case "ArrowUp":
      case "Up":
        e.preventDefault();
        list[(i - 1 + list.length) % list.length]?.focus();
        break;
      case "Home":
        e.preventDefault();
        list[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        list[list.length - 1]?.focus();
        break;
      case "Escape":
      case "Esc":
        e.preventDefault();
        close(true);
        break;
      case "Tab": {
        // Tab leaves the menu rather than walking its items; the arrows do that.
        const next = e.shiftKey ? triggerRef.current : afterTrigger();
        if (!next) {
          close(false);
          return;
        }
        e.preventDefault();
        next.focus();
        close(false);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div
      className="nav-item"
      ref={wrapRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimer();
        onRequestOpen(config.key);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        clearTimer();
        timer.current = setTimeout(() => onRequestClose(config.key), CLOSE_DELAY);
      }}
      // Safety net for every way focus can leave that the key handlers miss.
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) close(false);
      }}
    >
      <Link
        href={href}
        id={triggerId}
        ref={triggerRef}
        className={`nav-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onKeyDown={onTriggerKeyDown}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType || "mouse";
        }}
        onClick={(e) => {
          // A mouse click follows the link, as it always has. A tap opens the panel
          // first — there is no hover to open it with — and a second tap navigates.
          if (lastPointer.current !== "mouse" && !open) {
            e.preventDefault();
            onRequestOpen(config.key);
            return;
          }
          onRequestClose(config.key);
        }}
      >
        {label}
        <span className="nav-caret" aria-hidden="true" />
      </Link>

      <div
        id={panelId}
        ref={panelRef}
        role="group"
        aria-labelledby={triggerId}
        className={`nav-panel nav-panel--${config.key} ${open ? "is-open" : ""}`}
        onKeyDown={onPanelKeyDown}
        // Following any link in here leaves the panel behind; there is no route
        // change to hang a reset off without writing state from an effect.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a[href]")) onRequestClose(config.key);
        }}
      >
        <Link href={href} className="np-all">
          {config.overview}
          <span aria-hidden="true">→</span>
        </Link>
        <div className="np-eyebrow">{config.eyebrow}</div>
        <ul className="np-list">
          {config.items.map((s, i) => {
            const current = isCurrent(s.href);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className={current ? "is-current" : ""}
                  aria-current={current ? "page" : undefined}
                >
                  {config.numbered && (
                    <span className="np-no" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                  <span className="np-n">{s.label}</span>
                  {s.meta && <span className="np-c">{s.meta}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        {config.more && (
          <Link href={config.more.href} className="np-more">
            {config.more.label} →
          </Link>
        )}
      </div>
    </div>
  );
}
