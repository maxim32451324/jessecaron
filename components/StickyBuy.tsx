"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The buy block, repeated at the bottom of the viewport once the real one has
 * scrolled away.
 *
 * It is driven by `getBoundingClientRect()` measured on every scroll frame, not
 * by IntersectionObserver crossings. An observer only fires when an edge is
 * crossed, so a reader who *arrives* already below the buy block — a restored
 * scroll position, a hash link, a fast fling that lands past it — never gets a
 * crossing and never gets the bar. Measuring the rect answers "where am I now",
 * which is the actual question.
 *
 * Rendering `null` until the first measurement means the server emits nothing:
 * with JavaScript off there is no bar, and the page is exactly as it was.
 */
export default function StickyBuy({
  name,
  price,
  url,
  anchorId,
}: {
  name: string;
  price: string;
  url: string;
  anchorId: string;
}) {
  const [show, setShow] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;

    const measure = () => {
      frame.current = 0;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Past the buy block: its bottom edge has left the top of the viewport.
      const buy = anchor.getBoundingClientRect();
      const past = buy.bottom < 0;

      // Never sit on top of the footer. Once its top edge rises into the bottom
      // strip of the viewport the bar has run out of room and steps aside.
      const footer = document.querySelector("footer");
      const clearOfFooter = !footer || footer.getBoundingClientRect().top > vh - 96;

      setShow(past && clearOfFooter);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame.current) window.cancelAnimationFrame(frame.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [anchorId]);

  if (!show) return null;

  return (
    <>
      <div className="sbuy">
        <div className="sbuy__in">
          <div className="sbuy__meta">
            <span className="sbuy__name">{name}</span>
            <span className="sbuy__price">{price}</span>
          </div>
          <a
            className="btn btn--blue sbuy__cta"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Toevoegen aan winkelwagen ↗
          </a>
        </div>
      </div>
      <style>{`
        .sbuy {
          position:fixed; left:0; right:0; bottom:0; z-index:80;
          background:var(--ink-2); border-top:1px solid var(--line-d);
          padding-bottom:env(safe-area-inset-bottom);
          /* No fill-mode: if the animation never runs — a background tab, a
             browser that skips it — the bar sits where it belongs rather than
             being held off-screen at the keyframe it started from. */
          animation:sbuy-in .22s ease-out;
        }
        .sbuy__in { max-width:var(--maxw); margin:0 auto; padding:10px 28px;
          display:flex; align-items:center; justify-content:space-between; gap:16px; }
        .sbuy__meta { display:flex; align-items:baseline; gap:14px; min-width:0; }
        .sbuy__name { font-size:14px; font-weight:600; color:var(--paper);
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sbuy__price { font-family:var(--font-jetbrains),monospace; font-size:15px;
          color:var(--blue); white-space:nowrap; }
        .sbuy__cta { flex:0 0 auto; }
        @keyframes sbuy-in { from { transform:translateY(100%); } to { transform:translateY(0); } }

        /* The back-to-top button lives in the same corner. This stylesheet is in
           the document only while the bar is, so the lift is self-cleaning; the
           :has() keeps it from depending on which <style> the browser saw last. */
        body:has(.sbuy) .btt { bottom:calc(96px + env(safe-area-inset-bottom)); }
        @media(max-width:640px){
          .sbuy__in { padding:9px 16px; gap:12px; }
          .sbuy__name { font-size:12.5px; }
          .sbuy__price { font-size:13.5px; }
          .sbuy__cta { font-size:10.5px; padding:12px 14px; letter-spacing:.08em; }
        }
        /* On a narrow phone the button alone is most of the width, so the name
           and price take a line of their own rather than being ellipsised down
           to two letters. */
        @media(max-width:430px){
          .sbuy__in { flex-direction:column; align-items:stretch; gap:7px; padding:8px 16px; }
          .sbuy__meta { justify-content:space-between; gap:10px; }
          .sbuy__cta { justify-content:center; }
        }
        @media(prefers-reduced-motion:reduce){ .sbuy { animation:none; } }
        @media print { .sbuy { display:none; } }
      `}</style>
    </>
  );
}
