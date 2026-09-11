/*
 * Copyright (C) 2026 [e.t.ii aka genoTrades]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://gnu.org>.
 */

"use client";

import { useEffect, useState } from "react";
import { Blocks } from "lucide-react";

// Once per session (sessionStorage clears when the session ends).
const SESSION_KEY = "tradebuilder-intro-shown";
const HOLD = 1600; // wordmark on screen before it steps aside
const FADE = 600; // overlay fade-out

export function SplashIntro() {
  const [hidden, setHidden] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let played = false;
    try {
      played = sessionStorage.getItem(SESSION_KEY) === "1";
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch { }

    if (played || reduced) {
      // The pre-paint CSS already hid it; just unmount.
      const raf = requestAnimationFrame(() => setHidden(true));
      return () => cancelAnimationFrame(raf);
    }

    const fadeTimer = setTimeout(() => setLeaving(true), HOLD);
    const doneTimer = setTimeout(() => setHidden(true), HOLD + FADE);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden
      className={`intro-splash fixed inset-0 z-60 flex items-center justify-center bg-background transition-opacity ease-out ${leaving ? "opacity-0" : "opacity-100"
        }`}
      style={{ transitionDuration: `${FADE}ms` }}
    >
      <div className="flex items-center gap-3">
        <Blocks
          className="size-9 text-primary"
          style={{ animation: "intro-pop 800ms cubic-bezier(.2,.7,.3,1) both" }}
          aria-hidden
        />
        <span
          className="text-3xl font-semibold tracking-tight"
          style={{ animation: "intro-rise 800ms ease-out 200ms both" }}
        >
          Trade Builder
        </span>
      </div>
    </div>
  );
}
