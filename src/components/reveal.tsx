"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// `clientOnly` callers are rendered only after mount (never in server HTML), so
// they can read the media query synchronously on the first render and skip the
// one animated frame that would otherwise show before the effect corrects. SSR
// callers keep the `false` default to stay hydration-safe.
export function usePrefersReducedMotion(clientOnly = false) {
  const [reduced, setReduced] = useState(
    () =>
      clientOnly &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

// Self-triggering on mount, so wrapping a freshly mounted subtree replays it.
export function Reveal({
  delay = 0,
  y = 8,
  className,
  children,
}: {
  delay?: number;
  y?: number;
  className?: string;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Next frame, so there's a from-state to transition out of.
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out motion-reduce:transition-none! motion-reduce:transform-none!",
        className,
      )}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
      }}
    >
      {children}
    </div>
  );
}
