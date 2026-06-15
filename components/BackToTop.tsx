"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      aria-label="Terug naar boven"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 90,
        width: 46,
        height: 46,
        border: "1px solid var(--blue)",
        background: "var(--blue)",
        color: "#fff",
        cursor: "pointer",
        fontSize: 18,
        display: "grid",
        placeItems: "center",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(16px)",
        pointerEvents: show ? "auto" : "none",
        transition: ".3s",
      }}
    >
      ↑
    </button>
  );
}
