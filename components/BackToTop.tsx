"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <button
        className={`btt ${show ? "is-on" : ""}`}
        aria-label="Terug naar boven"
        aria-hidden={!show}
        tabIndex={show ? 0 : -1}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>
      <style>{`
        .btt {
          position:fixed; right:24px; bottom:24px; z-index:90;
          width:46px; height:46px; display:grid; place-items:center;
          border:1px solid var(--blue); background:var(--blue); color:#fff;
          font-size:18px; cursor:pointer;
          opacity:0; transform:translateY(16px); pointer-events:none;
          transition:opacity .3s, transform .3s, background .2s, color .2s, border-color .2s;
        }
        .btt.is-on { opacity:1; transform:translateY(0); pointer-events:auto; }
        .btt:hover, .btt:focus-visible { background:var(--blue-deep); border-color:var(--blue-deep); color:#fff; }
        @media(prefers-reduced-motion:reduce){ .btt { transition:opacity .01s; } }
      `}</style>
    </>
  );
}
