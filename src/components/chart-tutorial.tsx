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

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { usePrefersReducedMotion } from "@/components/reveal";
import { Button } from "@/components/ui/button";

// The four things the user reads off their own chart, revealed in order.
// Direction decides which zone is the entry and which is the target.
export function ChartTutorial({
  curveHigh,
  curveLow,
}: {
  curveHigh?: string;
  curveLow?: string;
}) {
  // Client-only (mounted inside an opened dialog), so read the preference on the
  // first render to avoid a flash of motion for reduced-motion users.
  const reduced = usePrefersReducedMotion(true);
  const [runId, setRunId] = useState(0);

  // Each callout fades in after its delay; reduced motion shows them at once.
  const cue = (delay: number) =>
    reduced ? undefined : { animation: `tutorial-cue 0.5s ease ${delay}s both` };

  const high = Number(curveHigh);
  const low = Number(curveLow);
  const hasCurve = Number.isFinite(high) && Number.isFinite(low) && high > low;
  const curveFactor = hasCurve
    ? Math.floor(((high - low) / 3) * 100) / 100
    : null;
  const highLabel = hasCurve ? high.toFixed(2) : "130.00";
  const lowLabel = hasCurve ? low.toFixed(2) : "100.00";
  const upperBoundary = hasCurve && curveFactor !== null ? high - curveFactor : 120;
  const lowerBoundary = hasCurve && curveFactor !== null ? low + curveFactor : 110;
  const priceY = (price: number) => 248 - ((price - low) / (high - low)) * 224;
  const upperBoundaryY = hasCurve ? priceY(upperBoundary) : 98.7;
  const lowerBoundaryY = hasCurve ? priceY(lowerBoundary) : 173.3;
  const truncatePrice = (price: number) => (Math.floor(price * 100) / 100).toFixed(2);
  const curveFactorLabel =
    curveFactor === null
      ? "Enter both prices"
      : `$${curveFactor.toFixed(2)}`;

  return (
    <div className="space-y-3">
      {/* Inline so Tailwind's CSS build can't prune the keyframe as unused. */}
      <style>{`@keyframes tutorial-cue{0%{opacity:0;transform:translateX(6px)}100%{opacity:1;transform:none}}`}</style>
      <div className="w-full overflow-hidden">
        <svg
          key={runId}
          viewBox="0 0 430 270"
          className="block h-auto w-full text-foreground"
          role="img"
          aria-label="A price chart split into wholesale, equilibrium and retail thirds, pointing out the curve high and low and the demand and supply zones. The supply zone's top edge is Supply distal and its bottom is Supply proximal; the demand zone's top edge is Demand proximal and its bottom is Demand distal."
        >
          <text x="60" y="28" textAnchor="end" fontSize="11" className="fill-muted-foreground">{highLabel}</text>
          <text x="60" y="252" textAnchor="end" fontSize="11" className="fill-muted-foreground">{lowLabel}</text>
          <rect x="70" y="24" width="180" height="224" fill="none" className="stroke-border" />
          <line x1="70" y1={upperBoundaryY} x2="250" y2={upperBoundaryY} className="stroke-border" strokeDasharray="3 3" />
          <line x1="70" y1={lowerBoundaryY} x2="250" y2={lowerBoundaryY} className="stroke-border" strokeDasharray="3 3" />
          <text x="60" y={upperBoundaryY + 4} textAnchor="end" fontSize="10" className="fill-muted-foreground">{truncatePrice(upperBoundary)}</text>
          <text x="60" y={lowerBoundaryY + 4} textAnchor="end" fontSize="10" className="fill-muted-foreground">{truncatePrice(lowerBoundary)}</text>
          <text x="78" y="68" fontSize="10.5" fontStyle="italic" className="fill-muted-foreground">retail</text>
          <text x="78" y="139" fontSize="10.5" fontStyle="italic" className="fill-muted-foreground">equilibrium</text>
          <text x="78" y="210" fontSize="10.5" fontStyle="italic" className="fill-muted-foreground">wholesale</text>

          <g style={cue(2.1)}>
            <line x1="70" y1="24" x2="250" y2="24" className="stroke-red-700" strokeWidth="3" />
            <circle cx="250" cy="24" r="3" className="fill-red-700" />
            <line x1="250" y1="24" x2="266" y2="24" className="stroke-border" />
            <text x="272" y="28" fontSize="12.5" className="fill-foreground">Curve high</text>
          </g>
          <g style={cue(3.0)}>
            <line x1="70" y1="248" x2="250" y2="248" className="stroke-emerald-700" strokeWidth="3" />
            <circle cx="250" cy="248" r="3" className="fill-emerald-700" />
            <line x1="250" y1="248" x2="266" y2="248" className="stroke-border" />
            <text x="272" y="252" fontSize="12.5" className="fill-foreground">Curve low</text>
          </g>
          <g style={cue(0.3)}>
            <rect x="70" y="24" width="180" height="14.9" className="fill-red-500/15 stroke-red-600" />
            <text x="160" y="20" textAnchor="middle" fontSize="10" className="fill-muted-foreground">distal</text>
            <text x="160" y="50" textAnchor="middle" fontSize="10" className="fill-muted-foreground">proximal</text>
            <text x="272" y="44" fontSize="12.5" className="fill-foreground">Supply zone</text>
          </g>
          <g style={cue(1.2)}>
            <rect x="70" y="233.1" width="180" height="14.9" className="fill-emerald-500/18 stroke-emerald-600" />
            <text x="160" y="229" textAnchor="middle" fontSize="10" className="fill-muted-foreground">proximal</text>
            <text x="160" y="264" textAnchor="middle" fontSize="10" className="fill-muted-foreground">distal</text>
            <text x="272" y="237" fontSize="12.5" className="fill-foreground">Demand zone</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 px-2 py-2 text-xs sm:px-3 sm:text-sm">
        <div>
          <span className="text-muted-foreground">Curve high</span>
          <div className="font-mono tabular-nums">${highLabel}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Curve low</span>
          <div className="font-mono tabular-nums">${lowLabel}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Curve factor</span>
          <div className="font-mono tabular-nums">
            {curveFactorLabel}
          </div>
        </div>
      </div>

      {!reduced ? (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setRunId((n) => n + 1)}>
            <RotateCcw aria-hidden />
            Replay
          </Button>
        </div>
      ) : null}
    </div>
  );
}
