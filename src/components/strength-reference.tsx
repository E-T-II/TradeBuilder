import type { Direction } from "@/lib/trade-builder";

export function StrengthReference({
  selected,
  onSelect,
  direction = "long",
}: {
  selected?: number | null;
  onSelect?: (score: number) => void;
  direction?: Direction;
}) {
  const long = direction === "long";
  return (
    <figure className="w-full rounded-lg border border-slate-700 bg-[#252b40] p-2">
      <svg
        viewBox="0 0 634 250"
        role="img"
        aria-label={`Strength reference for a ${long ? "Demand Buy Setup (Long)" : "Supply Sell Setup (Short)"}: Best equals 2 for move out and breakout, Good equals 1 for move out only or breakout only, and Poor equals 0 for neither.`}
        className="mx-auto block h-auto w-full text-slate-100 [shape-rendering:geometricPrecision]"
      >
        <rect width="634" height="250" fill="#252b40" />
        <text x="317" y="17" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
          How did price leave the zone?
        </text>
        <text x="20" y="48" fill="#f8fafc" fontSize="14" fontWeight="700">Zone</text>
        <text x="20" y="108" fill={long ? "#4ade80" : "#fb7185"} fontSize="13">{long ? "Demand" : "Supply"}</text>
        <text x="20" y="123" fill={long ? "#4ade80" : "#fb7185"} fontSize="13">{long ? "Buy Setup" : "Sell Setup"}</text>
        <text x="20" y="138" fill={long ? "#4ade80" : "#fb7185"} fontSize="13">{long ? "(Long)" : "(Short)"}</text>

        <Panel x={95} title="Best" score="2" best direction={direction} selected={selected === 2} onSelect={onSelect} caption="Move out AND Breakout" />
        <Panel x={253} title="Good" score="1" direction={direction} selected={selected === 1} onSelect={onSelect} caption="Move out ONLY OR Breakout ONLY" />
        <Panel x={512} title="Poor" score="0" direction={direction} selected={selected === 0} onSelect={onSelect} caption="Neither" />

        <text x="317" y="226" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
          The stronger the Move out from the zone, with Breakout,
        </text>
        <text x="317" y="243" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
          the more likely that supply and demand are out of balance.
        </text>
      </svg>
    </figure>
  );
}

// Arrays use zero-based indexes; these names keep the one-based candle numbers
// in the graphic aligned with their styling rules.
const CANDLE_6_INDEX = 5;
const CANDLE_7_INDEX = 6;
const MIRROR_AXIS = 250;

function mirroredY(y: number, short: boolean): number {
  return short ? MIRROR_AXIS - y : y;
}

function mirroredCandleY(y: number, height: number, short: boolean): number {
  return short ? MIRROR_AXIS - y - height : y;
}

function mirroredColor(color: string, short: boolean): string {
  if (!short) return color;
  if (color === "#19c85a") return "#ff263e";
  if (color === "#ff263e") return "#19c85a";
  return color;
}

function uprightTextTransform(y: number, short: boolean): string | undefined {
  return short ? `translate(0 ${2 * (y - 4)}) scale(1 -1)` : undefined;
}

function Panel({
  x,
  title,
  score,
  caption,
  direction,
  best = false,
  selected = false,
  onSelect,
}: {
  x: number;
  title: string;
  score: string;
  caption: string;
  direction: Direction;
  best?: boolean;
  selected?: boolean;
  onSelect?: (score: number) => void;
}) {
  const short = direction === "short";
  const width = title === "Good" ? 240 : title === "Poor" ? 110 : 138;
  const chartLeft = x + 11;
  const chartRight = x + width - 11;
  const zoneX = chartLeft + (title === "Poor" ? 26 : 38);
  const zoneWidth = 30;
  const braceX = chartRight - (best ? 12 : 8);
  const numberX = braceX + (best ? 9 : 7);
  const candles: [string, number, number, number, number][] = title === "Best"
    ? [
      // Three ascending greens.
      ["#19c85a", 146, 24, 0, 0], ["#19c85a", 134, 22, 0, 0], ["#19c85a", 105, 40, 0, 0],
      // Small red, then an equal-length green; both share the prior top edge.
      ["#ff263e", 105, 8, 0, 0], ["#19c85a", 105, 8, 0, 0],
      // Red is 2.5x the small candle and shares the green candle's top edge.
      ["#ff263e", 105, 40, 0, 0],
      // Lower two-wick candle, enclosed by the demand-zone lines.
      ["#ff263e", 147, 8, 8, 8],
      // Four ascending green candles after the zone.
      ["#19c85a", 132, 22, 0, 0], ["#19c85a", 116, 22, 0, 0],
      ["#19c85a", 98, 22, 0, 0], ["#19c85a", 84, 22, 0, 0],
    ]
    : title === "Good"
      ? [
        ["#19c85a", 111, 35, 7, 5], ["#ff263e", 101, 42, 5, 6], ["#ff263e", 96, 38, 6, 5],
        ["#19c85a", 109, 29, 5, 6], ["#ff263e", 106, 37, 5, 5], ["#19c85a", 98, 46, 6, 6],
        ["#ff263e", 92, 35, 5, 5], ["#19c85a", 84, 51, 5, 6], ["#19c85a", 77, 57, 6, 5],
      ]
      : [
        ["#19c85a", 111, 31, 6, 5], ["#ff263e", 101, 38, 5, 6], ["#ff263e", 95, 33, 5, 5],
        ["#19c85a", 104, 29, 5, 6], ["#ff263e", 99, 34, 6, 5], ["#19c85a", 92, 40, 5, 6],
      ];

  return (
    <g
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${title} strength, ${score} points` : undefined}
      onClick={onSelect ? () => onSelect(Number(score)) : undefined}
      onKeyDown={onSelect ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(Number(score));
        }
      } : undefined}
      className={onSelect ? "cursor-pointer" : undefined}
    >
      <rect x={x} y={27} width={width} height={153} fill="none" stroke={selected ? "#fb744c" : "#394158"} />
      <text x={x + width / 2} y={48} textAnchor="middle" fill={selected ? "#fb744c" : "#f8fafc"} fontSize="12" fontWeight="700">
        {selected ? "✓ " : ""}{title} = {score}
      </text>
      <g transform={best ? "translate(0 -16)" : undefined}>
      {title === "Good" ? (
        <g transform="translate(0 -20)">
          <GoodExamples chartLeft={chartLeft} direction={direction} />
        </g>
      ) : title === "Poor" ? (
        <PoorExample chartLeft={chartLeft} chartRight={chartRight} direction={direction} />
      ) : (
        <>
      <line x1={chartLeft} y1={mirroredY(best ? 95 : 112, short)} x2={chartRight} y2={mirroredY(best ? 95 : 112, short)} stroke={short ? "#fb7185" : "#53d67b"} strokeWidth={best ? 0.75 : 1} />
      <line x1={zoneX + (best ? 6 : 0)} y1={mirroredY(best ? 139 : 128, short)} x2={chartRight} y2={mirroredY(best ? 139 : 128, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={best ? 0.75 : 1} />
      <line x1={zoneX + (best ? 6 : 0)} y1={mirroredY(best ? 154 : 157, short)} x2={chartRight} y2={mirroredY(best ? 154 : 157, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={best ? 0.75 : 1} />
      <text x={zoneX + zoneWidth / 2} y={mirroredY(169, short)} textAnchor="middle" fill={short ? "#fb7185" : "#51d477"} fontSize="11">{short ? "SZ" : "DZ"}</text>
      <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
      <path d={best
        ? `M ${braceX - 14} 100 q 4 0 4 4 v 10 q 0 4 4 4 q -4 0 -4 4 v 10 q 0 4 -4 4`
        : `M ${braceX} 113 q 5 0 5 5 v 12 q 0 5 5 5 q -5 0 -5 5 v 12 q 0 5 -5 5`}
        fill="none" stroke="#9ba2e9" strokeWidth="1" />
      <text x={numberX - (best ? 12 : 0)} y={120} transform={uprightTextTransform(120, short)} fill="#9ba2e9" fontSize={best ? 12 : 8}>≥2:1</text>
      </g>
      <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
      <path d={`M ${braceX - (best ? 14 : 0)} ${best ? 140.5 : 140} q 2 0 2 2 v 3 q 0 2 2 2 q -2 0 -2 2 v 1 q 0 2 -2 2`} fill="none" stroke="#9ba2e9" strokeWidth="1" />
      <text x={numberX - (best ? 8 : 0)} y={150.5} transform={uprightTextTransform(150.5, short)} fill="#9ba2e9" fontSize={best ? 12 : 8}>1</text>
      </g>
      {candles.map(([color, y, height, wickTop, wickBottom], index) => (
        <Candle
          key={`${title}-${index}`}
          x={chartLeft + 2 + index * 8}
          y={mirroredCandleY(y - (best ? 10 : 0), height, short)}
          wickTop={short ? wickBottom : wickTop}
          wickBottom={short ? wickTop : wickBottom}
          height={height}
          color={mirroredColor(color, short)}
          wickColor={best && index === CANDLE_7_INDEX ? "#94a3b8" : mirroredColor(color, short)}
          wickWidth={best && index === CANDLE_7_INDEX ? 1 : 2}
        />
      ))}
        </>
      )}
      </g>
      <text x={x + width / 2} y={174} textAnchor="middle" fill="#9ba2e9" fontSize="11" fontWeight="600">{caption}</text>
      {onSelect ? (
        <rect
          x={x}
          y={27}
          width={width}
          height={153}
          fill="transparent"
          pointerEvents="all"
        />
      ) : null}
    </g>
  );
}

function GoodExamples({ chartLeft, direction }: { chartLeft: number; direction: Direction }) {
  const short = direction === "short";
  const examples = [
    { x: chartLeft - 8, zoneX: chartLeft + 34, candles: [
      ["#19c85a", 125, 18], ["#19c85a", 95, 30],
      ["#ff263e", 95, 7], ["#19c85a", 95, 7], ["#ff263e", 95, 30, 0, 0],
      ["#ff263e", 136, 7, 8, 8], ["#19c85a", 124, 20], ["#19c85a", 95, 35],
      ["#ff263e", 95, 17],
    ] },
    { x: chartLeft + 112, zoneX: chartLeft + 154, candles: [
      ["#19c85a", 125, 18], ["#19c85a", 95, 30],
      ["#ff263e", 95, 7], ["#19c85a", 95, 7], ["#ff263e", 95, 30, 0, 0],
      ["#ff263e", 128, 15, 8, 8], ["#19c85a", 124, 20], ["#19c85a", 95, 35],
      ["#19c85a", 89, 17],
    ] },
  ] as const;

  return (
    <>
      {examples.map((example, exampleIndex) => {
        const miniRight = example.x + 100;
        const zoneWidth = 26;
        const braceX = miniRight - 21;
        const upperNumberY = exampleIndex === 1 ? 116.5 : 120;
        const lowerNumberY = exampleIndex === 1 ? 144 : 147.5;
        return (
          <g key={exampleIndex}>
            <line x1={example.x} y1={mirroredY(95, short)} x2={miniRight} y2={mirroredY(95, short)} stroke={short ? "#fb7185" : "#53d67b"} />
            {example.candles.map(([color, y, height, wickTop = 0, wickBottom = 0], index) => (
              <Candle
                key={index + 1}
                x={example.x + 3 + index * 8}
                y={mirroredCandleY(y, height, short)}
                height={height}
                wickTop={wickTop}
                wickBottom={wickBottom}
                color={mirroredColor(color, short)}
                wickColor={index === CANDLE_6_INDEX ? "#94a3b8" : mirroredColor(color, short)}
                wickWidth={index === CANDLE_6_INDEX ? 1 : 2}
              />
            ))}
            <line x1={example.zoneX - 4} y1={mirroredY(exampleIndex === 1 ? 128 : 136, short)} x2={miniRight} y2={mirroredY(exampleIndex === 1 ? 128 : 136, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={0.75} />
            <line x1={example.zoneX - 4} y1={mirroredY(151, short)} x2={miniRight} y2={mirroredY(151, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={0.75} />
            <text x={example.zoneX + zoneWidth / 2} y={mirroredY(169, short)} textAnchor="middle" fill={short ? "#fb7185" : "#51d477"} fontSize="11">{short ? "SZ" : "DZ"}</text>
            <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
            <path d={exampleIndex === 1
              ? `M ${braceX} 98 q 3 0 3 3 v 8 q 0 3 3 3 q -3 0 -3 3 v 8 q 0 3 -3 3`
              : `M ${braceX} 97 q 4 0 4 4 v 11 q 0 4 4 4 q -4 0 -4 4 v 11 q 0 4 -4 4`}
              fill="none" stroke="#9ba2e9" strokeWidth="1" />
            <text x={braceX + 10} y={upperNumberY} transform={uprightTextTransform(upperNumberY, short)} fill="#9ba2e9" fontSize={12}>{exampleIndex === 1 ? "<2:1" : "≥2:1"}</text>
            </g>
            <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
            <path d={exampleIndex === 1
              ? `M ${braceX} 130 q 3 0 3 3 v 4.5 q 0 3 3 3 q -3 0 -3 3 v 4 q 0 3 -3 3`
              : `M ${braceX} 138 q 2 0 2 2 v 3 q 0 2 2 2 q -2 0 -2 2 v 1 q 0 2 -2 2`}
              fill="none" stroke="#9ba2e9" strokeWidth="1" />
            <text x={braceX + 10} y={lowerNumberY} transform={uprightTextTransform(lowerNumberY, short)} fill="#9ba2e9" fontSize={11}>1</text>
            </g>
          </g>
        );
      })}
    </>
  );
}

function PoorExample({ chartLeft, chartRight, direction }: { chartLeft: number; chartRight: number; direction: Direction }) {
  const short = direction === "short";
  const candles: [string, number, number, number, number][] = [
    ["#19c85a", 95, 30, 0, 0],
    ["#ff263e", 95, 7, 0, 0], ["#19c85a", 95, 7, 0, 0], ["#ff263e", 95, 30, 0, 0],
    ["#ff263e", 128, 15, 0, 8], ["#19c85a", 124, 20, 0, 0], ["#19c85a", 104, 26, 0, 0],
  ];
  const zoneX = chartLeft + 42;
  const zoneWidth = 26;
  const braceX = chartRight - 21;
  const upperNumberY = 116.5;
  const lowerNumberY = 143.5;

  return (
    <g transform="translate(-4 -20)">
      <line x1={chartLeft} y1={mirroredY(95, short)} x2={chartRight} y2={mirroredY(95, short)} stroke={short ? "#fb7185" : "#53d67b"} />
      {candles.map(([color, y, height, wickTop, wickBottom], index) => (
          <Candle key={index + 1} x={chartLeft + 3 + index * 8} y={mirroredCandleY(y, height, short)} height={height} wickTop={short ? wickBottom : wickTop} wickBottom={short ? wickTop : wickBottom} color={mirroredColor(color, short)} wickColor={index + 1 === 5 || index + 1 === 6 ? "#94a3b8" : mirroredColor(color, short)} wickWidth={index + 1 === 5 || index + 1 === 6 ? 1 : 2} />
      ))}
      <line x1={zoneX - 12} y1={mirroredY(128, short)} x2={chartRight} y2={mirroredY(128, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={0.75} />
      <line x1={zoneX - 12} y1={mirroredY(151, short)} x2={chartRight} y2={mirroredY(151, short)} stroke={short ? "#fb7185" : "#51d477"} strokeWidth={0.75} />
      <text x={zoneX + zoneWidth / 2} y={mirroredY(169, short)} textAnchor="middle" fill={short ? "#fb7185" : "#51d477"} fontSize="11">{short ? "SZ" : "DZ"}</text>
      <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
        <path d={`M ${braceX} 98 q 3 0 3 3 v 8 q 0 3 3 3 q -3 0 -3 3 v 8 q 0 3 -3 3`} fill="none" stroke="#9ba2e9" strokeWidth="1" />
      <text x={braceX + 10} y={upperNumberY} transform={uprightTextTransform(upperNumberY, short)} fill="#9ba2e9" fontSize="12">&lt;2:1</text>
      </g>
      <g transform={short ? `translate(0 ${MIRROR_AXIS}) scale(1 -1)` : undefined}>
        <path d={`M ${braceX} 130 q 3 0 3 3 v 4.5 q 0 3 3 3 q -3 0 -3 3 v 4 q 0 3 -3 3`} fill="none" stroke="#9ba2e9" strokeWidth="1" />
      <text x={braceX + 10} y={lowerNumberY} transform={uprightTextTransform(lowerNumberY, short)} fill="#9ba2e9" fontSize="11">1</text>
      </g>
    </g>
  );
}

function Candle({ x, y, height, wickTop, wickBottom, color, wickColor, wickWidth }: { x: number; y: number; height: number; wickTop: number; wickBottom: number; color: string; wickColor: string; wickWidth: number }) {
  return (
    <g>
      <line x1={x + 3} y1={y - wickTop} x2={x + 3} y2={y + height + wickBottom} stroke={wickColor} strokeWidth={wickWidth} />
      <rect x={x + 0.5} y={y} width="5" height={height} fill={color} />
    </g>
  );
}
