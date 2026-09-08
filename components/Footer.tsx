import Link from "next/link";
import { brand, getCategories, categoryHref } from "@/lib/content";

export default function Footer() {
  const year = new Date().getFullYear();
  /* The old site's category cloud lived in a sidebar that only appeared on single
     posts. Here it is on every page instead, as the ten biggest archives with their
     counts — the information the client actually pointed at, minus the widget. */
  const topics = getCategories({ pagesOnly: true }).slice(0, 10);
  return (
    <footer
      id="contact-foot"
      /* extra bottom padding keeps the fixed BackToTop button off the colophon */
      style={{ background: "var(--paper)", color: "var(--ink)", padding: "96px 0 96px" }}
    >
      <div className="wrap">
        <div className="foot-top">
          <div>
            <span className="sec-num" style={{ color: "var(--ash)" }}>
              Aanmelden
            </span>
            <h2 className="display" style={{ marginTop: 14, fontSize: "clamp(34px,6vw,86px)", maxWidth: "12ch" }}>
              Work hard in silence.
              <br />
              Let your success
              <br />
              make the noise.
            </h2>
            <div style={{ marginTop: 30 }}>
              <Link href="/aanmelden" className="btn btn--ink">
                Persoonlijke intake ↗
              </Link>
            </div>
          </div>

          <div className="foot-contact">
            <div className="row">
              <div className="k">Telefoon</div>
              <div className="v">
                <a href="tel:+31613980227">{brand.phone}</a>
              </div>
            </div>
            <div className="row">
              <div className="k">Locatie</div>
              <div className="v">{brand.location}</div>
            </div>
            <div className="row">
              <div className="k">Instagram</div>
              <div className="v">
                <a href={brand.socials.instagram} target="_blank" rel="noopener">
                  @caron_jesse
                </a>
              </div>
            </div>
            <div className="row">
              <div className="k">Merk</div>
              <div className="v">Origami™ — Functionele Snelheid</div>
            </div>
          </div>

          <div className="foot-topics">
            <div className="k">Onderwerpen</div>
            <ul>
              {topics.map((c) => (
                <li key={c.slug}>
                  <Link href={categoryHref(c.slug)}>
                    <span className="n">{c.name}</span>
                    <span className="c">{c.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/blog/onderwerpen" className="foot-topics__all">
              Alle onderwerpen →
            </Link>
          </div>
        </div>

        <div className="foot-bottom">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo/Jesse-Caron-Origami-Adelaar-Eagle-Logo-Black.png"
            alt="Jesse Caron"
            style={{ height: 30 }}
          />
          <div className="foot-social">
            <a href={brand.socials.instagram} target="_blank" rel="noopener">
              Instagram
            </a>
            <a href={brand.socials.facebook} target="_blank" rel="noopener">
              Facebook
            </a>
            <a href={brand.socials.linkedin} target="_blank" rel="noopener">
              LinkedIn
            </a>
            <Link href="/prijzen">Prijzen</Link>
            <Link href="/voorwaarden">Voorwaarden</Link>
          </div>
          <div className="foot-copy">© {year} Jesse Caron — Origami™</div>
        </div>
      </div>

      <style>{`
        /* min-width:0 on all three: the default min-width:auto refuses to shrink a
           track below its widest unbreakable word, and this row carries a phone
           number, a URL-ish Instagram handle and Dutch compounds like
           "Looptraining Voetbal". That is the same fault that made the footer links
           row set the scrollWidth of every page on the site. */
        .foot-top { display:grid; grid-template-columns:1.2fr .9fr .9fr; gap:60px; margin-bottom:70px; }
        .foot-top > * { min-width:0; }
        .foot-contact { display:grid; gap:22px; align-content:start; }
        .foot-topics .k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--ash); margin-bottom:14px; }
        .foot-topics ul { list-style:none; display:grid; gap:0; }
        .foot-topics li { border-bottom:1px solid var(--line-l); }
        .foot-topics li a { display:flex; justify-content:space-between; align-items:baseline; gap:12px; padding:8px 0; font-size:15px; font-weight:600; }
        .foot-topics li a:hover, .foot-topics li a:focus-visible { color:var(--blue-deep); }
        .foot-topics .n { min-width:0; overflow-wrap:anywhere; }
        .foot-topics .c { font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); flex:none; }
        .foot-topics__all { display:inline-block; margin-top:16px; font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--blue-deep); }
        .foot-contact .row { border-bottom:1px solid var(--line-l); padding-bottom:14px; }
        .foot-contact .k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--ash); margin-bottom:5px; }
        .foot-contact .v { font-size:18px; font-weight:600; }
        .foot-contact .v a:hover, .foot-contact .v a:focus-visible { color:var(--blue-deep); }
        .foot-bottom { display:flex; justify-content:space-between; align-items:center; gap:24px; padding-top:26px; border-top:1px solid var(--line-l); flex-wrap:wrap; }
        /* flex-wrap here is load-bearing. This row was three social links and fitted a
           phone; it is now five, and unwrapped it measured 449px inside a 375px viewport
           — which set the scrollWidth of EVERY page on the site and let the whole thing
           pan sideways. body{overflow-x:hidden} did not save it: iOS still pans, and it
           would only have hidden the symptom in any case. */
        .foot-social { display:flex; flex-wrap:wrap; gap:12px 22px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
        .foot-social a:hover, .foot-social a:focus-visible { color:var(--blue-deep); }
        .foot-copy { font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); letter-spacing:.06em; }
        @media(max-width:1000px){ .foot-top{ grid-template-columns:1fr 1fr; gap:44px; } }
        @media(max-width:640px){ .foot-top{ grid-template-columns:1fr; gap:36px; } }
      `}</style>
    </footer>
  );
}
