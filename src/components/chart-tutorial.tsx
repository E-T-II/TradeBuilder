"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Direction } from "@/lib/trade-builder";
import { usePrefersReducedMotion } from "@/components/reveal";
import { Button } from "@/components/ui/button";

// The four things the user reads off their own chart, revealed in order.
// Direction decides which zone is the entry and which is the target.
export function ChartTutorial({ direction }: { direction: Direction }) {
  // Client-only (mounted inside an opened dialog), so read the preference on the
  // first render to avoid a flash of motion for reduced-motion users.
  const reduced = usePrefersReducedMotion(true);
  const [runId, setRunId] = useState(0);
  const long = direction === "long";

  // Each callout fades in after its delay; reduced motion shows them at once.
  const cue = (delay: number) =>
    reduced ? undefined : { animation: `tutorial-cue 0.5s ease ${delay}s both` };

  const demandRole = long ? "your entry" : "your target";
  const supplyRole = long ? "your target" : "your entry";
  // The entry zone gets the bolder outline and a foreground label.
  const demandEntry = long;

  return (
    <div className="space-y-3">
      {/* Inline so Tailwind's CSS build can't prune the keyframe as unused. */}
      <style>{`@keyframes tutorial-cue{0%{opacity:0;transform:translateX(6px)}100%{opacity:1;transform:none}}`}</style>
      <div className="overflow-x-auto">
      <svg
        key={runId}
        viewBox="0 0 430 270"
        className="w-full min-w-[400px] text-foreground"
        role="img"
        aria-label={`A price chart split into wholesale, equilibrium and retail thirds, pointing out the curve high and low and the demand and supply zones. For a ${direction}, the ${long ? "demand" : "supply"} zone is the entry and the ${long ? "supply" : "demand"} zone is the target. The supply zone's top edge is Supply distal and its bottom is Supply proximal; the demand zone's top edge is Demand proximal and its bottom is Demand distal.`}
      >
        <text x="60" y="28" textAnchor="end" fontSize="11" className="fill-muted-foreground">130</text>
        <text x="60" y="252" textAnchor="end" fontSize="11" className="fill-muted-foreground">100</text>
        <rect x="70" y="24" width="180" height="224" fill="none" className="stroke-border" />
        <line x1="70" y1="98.7" x2="250" y2="98.7" className="stroke-border" strokeDasharray="3 3" />
        <line x1="70" y1="173.3" x2="250" y2="173.3" className="stroke-border" strokeDasharray="3 3" />
        <text x="78" y="63" fontSize="10.5" className="fill-muted-foreground">retail</text>
        <text x="78" y="139" fontSize="10.5" className="fill-muted-foreground">equilibrium</text>
        <text x="78" y="215" fontSize="10.5" className="fill-muted-foreground">wholesale</text>

        <g style={cue(0.2)}>
          <line x1="70" y1="24" x2="250" y2="24" className="stroke-sky-600" strokeWidth="2" />
          <circle cx="250" cy="24" r="3" className="fill-sky-600" />
          <line x1="250" y1="24" x2="266" y2="24" className="stroke-border" />
          <text x="272" y="28" fontSize="12.5" className="fill-foreground">Curve high</text>
        </g>
        <g style={cue(1)}>
          <line x1="70" y1="248" x2="250" y2="248" className="stroke-sky-600" strokeWidth="2" />
          <circle cx="250" cy="248" r="3" className="fill-sky-600" />
          <line x1="250" y1="248" x2="266" y2="248" className="stroke-border" />
          <text x="272" y="252" fontSize="12.5" className="fill-foreground">Curve low</text>
        </g>
        <g style={cue(1.8)}>
          <rect x="70" y="53.9" width="180" height="14.9" className="fill-red-500/15 stroke-red-600" strokeWidth={demandEntry ? 1 : 2.25} />
          <text x="160" y="50" textAnchor="middle" fontSize="10" className="fill-muted-foreground">distal</text>
          <text x="160" y="79" textAnchor="middle" fontSize="10" className="fill-muted-foreground">proximal</text>
          <circle cx="250" cy="61" r="3" className="fill-red-600" />
          <line x1="250" y1="61" x2="266" y2="61" className="stroke-border" />
          <text x="272" y="58" fontSize="12.5" className="fill-foreground">Supply zone</text>
          <text x="272" y="73" fontSize="11" className={demandEntry ? "fill-muted-foreground" : "fill-foreground"}>{supplyRole}</text>
        </g>
        <g style={cue(2.6)}>
          <rect x="70" y="188.3" width="180" height="14.9" className="fill-emerald-500/18 stroke-emerald-600" strokeWidth={demandEntry ? 2.25 : 1} />
          <text x="160" y="184" textAnchor="middle" fontSize="10" className="fill-muted-foreground">proximal</text>
          <text x="160" y="213" textAnchor="middle" fontSize="10" className="fill-muted-foreground">distal</text>
          <circle cx="250" cy="196" r="3" className="fill-emerald-600" />
          <line x1="250" y1="196" x2="266" y2="196" className="stroke-border" />
          <text x="272" y="193" fontSize="12.5" className="fill-foreground">Demand zone</text>
          <text x="272" y="208" fontSize="11" className={demandEntry ? "fill-foreground" : "fill-muted-foreground"}>{demandRole}</text>
        </g>
      </svg>
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
