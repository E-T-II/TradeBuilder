"use client";

import { IllustrationText } from "@/components/illustration-text";
import { useLanguage } from "@/components/language-provider";
import { oddsIllustrations, type IllustrationBox, type IllustrationLabel } from "@/lib/odds-illustrations";
import { translateIllustration } from "@/lib/odds-illustration-translations";

export function OddsIllustrationOverlay({
  src, width, height, headings, panels, selected,
}: {
  src: string;
  width: number;
  height: number;
  headings: [IllustrationBox, IllustrationBox, IllustrationBox];
  panels: [IllustrationBox, IllustrationBox, IllustrationBox];
  selected: number | null;
}) {
  const { language } = useLanguage();
  const rtl = language === "ar" || language === "he";
  const illustration = oddsIllustrations[src];
  if (!illustration) throw new Error(`Illustration coordinates are missing for ${src}.`);
  const scale = width > 1000 ? 2 : 1;
  const labels: IllustrationLabel[] = [
    ...illustration.labels,
    ...headings.map(([x1, y1, x2, y2], index): IllustrationLabel => ({
      box: [x1 - 2 * scale, y1 - 2 * scale, x2 + 2 * scale, y2 + 2 * scale],
      lines: illustration.headings[index],
      color: selected === index ? "#fb744c" : "#f8fafc",
      fontSize: 12 * scale,
    })),
  ];

  return (
    <svg aria-hidden viewBox={`0 0 ${width} ${height}`} data-illustration-language={language}
      className="pointer-events-none absolute inset-0 size-full">
      {labels.map(({ box: [x1, y1, x2, y2], lines, background, color, fontSize = 12, align = "middle", radius }, index) => {
        const heading = index >= illustration.labels.length ? index - illustration.labels.length : null;
        const textLeft = heading === null ? x1 : headings[heading][0];
        const textRight = heading === null ? x2 : panels[heading][2] - 4 * scale;
        const lineHeight = (y2 - y1) / lines.length;
        return (
          <g key={index} data-text-box={`${x1},${y1},${x2},${y2}`}>
            <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1}
              fill={background ?? illustration.background} rx={radius} />
            {lines.map((line, lineIndex) => (
              <IllustrationText key={lineIndex} maxWidth={textRight - textLeft}
                x={align === "start" ? (rtl ? textRight : textLeft) : (textLeft + textRight) / 2}
                y={y1 + lineHeight * (lineIndex + 0.5)}
                dominantBaseline="central" textAnchor={align}
                fill={color} fontSize={Math.min(fontSize, lineHeight * 0.85)} fontWeight="600">
                {translateIllustration(language, line)}
              </IllustrationText>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
