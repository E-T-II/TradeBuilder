"use client";

import { Dialog } from "@base-ui/react/dialog";
import { CirclePlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartTutorial } from "@/components/chart-tutorial";

// A play button that opens a short animated walkthrough of which chart lines
// map to the Zones-step fields.
export function ChartTutorialButton({
  curveHigh,
  curveLow,
}: {
  curveHigh?: string;
  curveLow?: string;
}) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
      >
        <CirclePlay aria-hidden />
        How to read your chart
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(34rem,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="mb-3 flex items-center justify-between">
            <Dialog.Title className="text-sm font-medium">
              How to read your chart
            </Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            An animated walkthrough of the chart lines you enter on the Zones
            step: the curve high and low, and the demand and supply zones.
          </Dialog.Description>
          <ChartTutorial
            curveHigh={curveHigh}
            curveLow={curveLow}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
