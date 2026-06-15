"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markComplete } from "@/app/academy/actions";

export default function MarkComplete({
  lessonId,
  courseSlug,
  initialDone,
  nextHref,
}: {
  lessonId: string;
  courseSlug: string;
  initialDone: boolean;
  nextHref?: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const newVal = !done;
    setDone(newVal);
    start(async () => {
      await markComplete(lessonId, courseSlug, newVal);
      router.refresh();
    });
  }

  function nextLesson() {
    if (!done) {
      setDone(true);
      start(async () => {
        await markComplete(lessonId, courseSlug, true);
        if (nextHref) router.push(nextHref);
        else router.refresh();
      });
    } else if (nextHref) {
      router.push(nextHref);
    }
  }

  return (
    <div className="mc">
      <button className={`btn ${done ? "" : "btn--blue"}`} onClick={toggle} disabled={pending}>
        {done ? "✓ Voltooid — ongedaan maken" : "Markeer als voltooid"}
      </button>
      {nextHref && (
        <button className="btn btn--blue" onClick={nextLesson} disabled={pending}>
          Volgende les →
        </button>
      )}
      <style>{`
        .mc { display:flex; gap:12px; flex-wrap:wrap; margin-top:28px; }
      `}</style>
    </div>
  );
}
