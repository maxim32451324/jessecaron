import Link from "next/link";
import { brand } from "@/lib/content";

export default function Footer() {
  const year = 2025;
  return (
    <footer
      id="contact-foot"
      style={{ background: "var(--paper)", color: "var(--ink)", padding: "96px 0 40px" }}
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
          </div>
          <div className="foot-copy">© {year} Jesse Caron — Origami™</div>
        </div>
      </div>

      <style>{`
        .foot-top { display:grid; grid-template-columns:1.3fr 1fr; gap:60px; margin-bottom:70px; }
        .foot-contact { display:grid; gap:22px; align-content:start; }
        .foot-contact .row { border-bottom:1px solid var(--line-l); padding-bottom:14px; }
        .foot-contact .k { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:var(--ash); margin-bottom:5px; }
        .foot-contact .v { font-size:18px; font-weight:600; }
        .foot-contact .v a:hover { color:var(--blue-deep); }
        .foot-bottom { display:flex; justify-content:space-between; align-items:center; gap:24px; padding-top:26px; border-top:1px solid var(--line-l); flex-wrap:wrap; }
        .foot-social { display:flex; gap:22px; font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.1em; text-transform:uppercase; }
        .foot-social a:hover { color:var(--blue-deep); }
        .foot-copy { font-family:var(--font-jetbrains),monospace; font-size:11px; color:var(--ash); letter-spacing:.06em; }
        @media(max-width:860px){ .foot-top{ grid-template-columns:1fr; gap:36px; } }
      `}</style>
    </footer>
  );
}
