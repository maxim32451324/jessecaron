"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Dutch thousands separator, done by hand rather than through `toLocaleString`: the
 * value is rendered as 0 on the server and animated on the client, so the two
 * runtimes never have to agree about ICU data. 15493 -> "15.493".
 */
function groupDigits(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Counts up to `to` when scrolled into view. Respects reduced-motion.
export default function CountUp({
  to,
  suffix = "",
  duration = 1400,
  grouped = false,
}: {
  to: number;
  suffix?: string;
  duration?: number;
  /** Print a thousands separator — for the four- and five-digit counters. */
  grouped?: boolean;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          if (reduced) {
            setVal(to);
            return;
          }
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(eased * to));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {grouped ? groupDigits(val) : val}
      {suffix}
    </span>
  );
}
