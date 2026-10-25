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

import { useId } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entryType, type Direction } from "@/lib/trade-builder";

export type ComputedEnhancer = "trend" | "curve" | "profitZone" | "total" | "totalSupply";

type Box = [x1: number, y1: number, x2: number, y2: number];

type Photo = {
  src: string;
  width: number;
  height: number;
  /** Heading text box for each option, left to right. */
  headings: [Box, Box, Box];
  /** Selection box drawn around each option's panel, left to right. */
  panels: [Box, Box, Box];
};

// Builds a photo layout from pixel measurements of the cleaned screenshots.
// `content` is each panel's measured horizontal extent; `pad` adds breathing
// room so the dashed box sits just outside the chart like the original marker.
function photo(
  src: string,
  width: number,
  height: number,
  headings: [Box, Box, Box],
  content: [number, number][],
  [top, bottom]: [number, number],
  pad: number,
): Photo {
  const inset = pad / 9;
  const panels = content.map(([x1, x2]) => [
    Math.max(inset, x1 - pad),
    top,
    Math.min(width - inset, x2 + pad),
    bottom,
  ]) as Photo["panels"];
  return { src, width, height, headings, panels };
}

const photos = {
  trend: photo("/odds-enhancers/trend.png", 693, 274,
    [[171, 56, 218, 67], [361, 56, 410, 67], [562, 56, 611, 67]],
    [[120, 265], [303, 469], [512, 664]], [44, 205], 18),
  curve: photo("/odds-enhancers/curve.png", 770, 292,
    [[170, 56, 215, 67], [377, 56, 440, 67], [599, 56, 647, 67]],
    [[118, 274], [333, 489], [549, 705]], [44, 222], 18),
  profitZone: photo("/odds-enhancers/profit-zone.png", 734, 263,
    [[168, 56, 215, 66], [375, 56, 425, 66], [585, 56, 633, 66]],
    [[117, 269], [326, 480], [537, 688]], [43, 214], 18),
  total: photo("/odds-enhancers/total-score.png", 650, 254,
    [[141, 37, 214, 63], [321, 37, 400, 63], [510, 39, 583, 48]],
    [[118, 236], [298, 424], [488, 605]], [26, 191], 20),
  trendSupply: photo("/odds-enhancers/trend-supply.png", 1356, 510,
    [[316, 100, 412, 121], [727, 100, 827, 121], [1115, 100, 1213, 121]],
    [[239, 515], [598, 931], [1020, 1325]], [76, 391], 36),
  curveSupply: photo("/odds-enhancers/curve-supply.png", 1510, 548,
    [[332, 104, 424, 125], [747, 104, 873, 125], [1190, 104, 1288, 125]],
    [[228, 541], [659, 972], [1090, 1403]], [80, 438], 36),
  profitZoneSupply: photo("/odds-enhancers/profit-zone-supply.png", 1390, 506,
    [[308, 96, 404, 117], [735, 96, 835, 117], [1167, 96, 1266, 117]],
    [[207, 517], [626, 935], [1068, 1370]], [72, 420], 36),
  totalSupply: photo("/odds-enhancers/total-score-supply.png", 647, 257,
    [[139, 36, 212, 62], [319, 36, 398, 62], [508, 38, 581, 47]],
    [[116, 234], [296, 429], [486, 603]], [25, 190], 20),
} satisfies Record<string, Photo>;

const supplyPhotos: Partial<Record<ComputedEnhancer, Photo>> = {
  trend: photos.trendSupply,
  curve: photos.curveSupply,
  profitZone: photos.profitZoneSupply,
};

const references: Record<ComputedEnhancer, {
  label: string;
  options: [string, string, string];
  summary: string;
  description: string;
  photo: Photo;
}> = {
  trend: {
    label: "Trend",
    options: ["Best = 2", "Good = 1", "Poor = 0"],
    summary: "Best = 2 when the zone is with the trend, Good = 1 when price is moving sideways, Poor = 0 when the zone is against the trend.",
    description: "How the trend you picked on the Market step scores this zone.",
    photo: photos.trend,
  },
  curve: {
    label: "Curve",
    options: ["Best = 1", "Good = 0.5", "Poor = 0"],
    summary: "Best = 1 when the zone is in the favorable third of the curve (low for demand, high for supply), Good = 0.5 at equilibrium, Poor = 0 in the unfavorable third.",
    description: "Where this zone sits within the curve high and low you entered.",
    photo: photos.curve,
  },
  profitZone: {
    label: "Profit zone",
    options: ["Best = 2", "Good = 1", "Poor = 0"],
    summary: "Best = 2 for a reward-to-risk ratio of 5:1 or more, Good = 1 for 3:1 up to 5:1, Poor = 0 below 3:1.",
    description: "How much room price has between this zone and the opposing zone.",
    photo: photos.profitZone,
  },
  total: {
    label: "Total score",
    options: ["Proximal", "Confirmation", "No trade"],
    summary: "Proximal entry for 8.5 or more out of 10, Confirmation entry for 7 to 8 out of 10, No trade below 7.",
    description: "Proximal entry for 8.5 or more, confirmation entry for 7 to 8, no trade below 7.",
    photo: photos.total,
  },
  totalSupply: {
    label: "Total score",
    options: ["Proximal", "Confirmation", "No trade"],
    summary: "Proximal entry for 8.5 or more out of 10, Confirmation entry for 7 to 8 out of 10, No trade below 7.",
    description: "Proximal entry for 8.5 or more, confirmation entry for 7 to 8, no trade below 7.",
    photo: photos.totalSupply,
  },
};

const ORANGE = "#fb744c";

/** Which option (0 = left, 2 = right) the computed score lands on, if any. */
export function selectedOptionIndex(enhancer: ComputedEnhancer, score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  if (enhancer === "total" || enhancer === "totalSupply") {
    return { proximal: 0, confirmation: 1, "no-trade": 2 }[entryType(score)];
  }
  const best = enhancer === "curve" ? 1 : 2;
  if (score >= best) return 0;
  return score > 0 ? 1 : 2;
}

export function ComputedEnhancerReference({
  enhancer,
  direction,
  score = null,
}: {
  enhancer: ComputedEnhancer;
  direction: Direction;
  score?: number | null;
}) {
  const reference = references[enhancer];
  const { label, options, summary, description } = reference;
  const image = (direction === "short" && supplyPhotos[enhancer]) || reference.photo;
  const long = direction === "long";
  const zone = long ? "Demand Buy Setup (Long)" : "Supply Sell Setup (Short)";
  const selected = selectedOptionIndex(enhancer, score);

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`About ${label}`}
            className="text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Info aria-hidden className="size-4" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(48rem,94vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="mb-2 flex items-center justify-end">
            <Dialog.Title className="sr-only">{label} reference</Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" aria-label={`Close ${label} reference`} />}
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {description} Informational only. Scores are calculated automatically.
          </Dialog.Description>
          <figure>
            <div className="relative">
              <Image
                src={image.src}
                width={image.width}
                height={image.height}
                alt={`${label} reference for a ${zone}: ${summary}`}
                unoptimized
                className="block h-auto w-full rounded-lg"
              />
              {selected !== null && (
                <SelectionOverlay photo={image} index={selected} option={options[selected]} />
              )}
            </div>
          </figure>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Re-creates the original orange marker on top of the photo: a dashed box
// around the panel, a checkmark, and the panel heading recolored orange. The
// heading is a filtered copy of the photo clipped to the heading, so it keeps
// the screenshot's own font.
function SelectionOverlay({ photo, index, option }: { photo: Photo; index: number; option: string }) {
  const id = useId().replace(/:/g, "");
  const scale = photo.width > 1000 ? 2 : 1;
  const [px1, py1, px2, py2] = photo.panels[index];
  const [hx1, hy1, hx2, hy2] = photo.headings[index];
  const pad = 2 * scale;
  const size = 11 * scale;
  const cx = hx1 - 6 * scale - size;
  const cy = hy2 - 5.5 * scale - size / 2;

  return (
    <svg
      aria-hidden
      data-selected-option={option}
      viewBox={`0 0 ${photo.width} ${photo.height}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <clipPath id={`${id}-heading`}>
          <rect x={hx1 - pad} y={hy1 - pad} width={hx2 - hx1 + 2 * pad} height={hy2 - hy1 + 2 * pad} />
        </clipPath>
        {/* Turns the white heading text into an orange layer; the navy background becomes transparent. */}
        <filter id={`${id}-orange`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 1.3 0 0 -0.3"
            result="text"
          />
          <feFlood floodColor={ORANGE} />
          <feComposite in2="text" operator="in" />
        </filter>
      </defs>
      <image
        href={photo.src}
        width={photo.width}
        height={photo.height}
        clipPath={`url(#${id}-heading)`}
        filter={`url(#${id}-orange)`}
      />
      <rect
        x={px1}
        y={py1}
        width={px2 - px1}
        height={py2 - py1}
        rx={4 * scale}
        fill="none"
        stroke={ORANGE}
        strokeWidth={2 * scale}
        strokeDasharray={`${6 * scale} ${4 * scale}`}
      />
      <path
        d={`M${cx} ${cy + size * 0.55} L${cx + size * 0.38} ${cy + size * 0.9} L${cx + size} ${cy + size * 0.1}`}
        fill="none"
        stroke={ORANGE}
        strokeWidth={2.2 * scale}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
