import type { Direction } from "@/lib/trade-builder";

export function TimeReference({
  selected,
  onSelect,
  direction = "long",
}: {
  selected?: number | null;
  onSelect?: (score: number) => void;
  direction?: Direction;
}) {
  const short = direction === "short";
  return (
    <figure className="w-full rounded-lg border border-slate-700 bg-[#252b40] p-1">
      <svg
        viewBox="0 0 634 250"
        role="img"
        aria-label={`Time reference for a ${short ? "Supply Sell Setup (Short)" : "Demand Buy Setup (Long)"}: Best equals 1 for one to three basing candles, Good equals 0.5 for four to six basing candles, and Poor equals 0 for more than six basing candles.`}
        className="mx-auto block h-auto w-full text-slate-100 [shape-rendering:geometricPrecision]"
      >
        <rect width="634" height="250" fill="#252b40" />
        <text x="317" y="17" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
          How much time did price spend at the zone?
        </text>
        <text x="20" y="48" fill="#f8fafc" fontSize="14" fontWeight="700">Zone</text>
        <text x="20" y="108" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "Supply" : "Demand"}</text>
        <text x="20" y="123" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "Sell Setup" : "Buy Setup"}</text>
        <text x="20" y="138" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "(Short)" : "(Long)"}</text>
        <TimePanel direction={direction} x={95} title="Best" score="1" value={1} caption="1–3 Basing Candles" selected={selected === 1} onSelect={onSelect} />
        <TimePanel direction={direction} x={253} title="Good" score="0.5" value={0.5} caption="4–6 Basing Candles" selected={selected === 0.5} onSelect={onSelect} />
        <TimePanel direction={direction} x={434} title="Poor" score="0" value={0} caption=">6 Basing Candles" selected={selected === 0} onSelect={onSelect} />
        <text x="317" y="226" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
          The less time price spends at a zone,
        </text>
        <text x="317" y="243" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
          the more out-of-balance the supply or demand is at the zone
        </text>
      </svg>
    </figure>
  );
}

function TimePanel({
  x,
  title,
  score,
  value,
  caption,
  selected = false,
  onSelect,
  direction,
}: {
  x: number;
  title: string;
  score: string;
  value: number;
  caption: string;
  selected?: boolean;
  onSelect?: (score: number) => void;
  direction: Direction;
}) {
  const short = direction === "short";
  const width = title === "Good" ? 160 : title === "Poor" ? 160 : 138;
  const chartLeft = x + 11;
  const chartRight = x + width - 11;

  return (
    <g
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `${title} time, ${score} points` : undefined}
      onClick={onSelect ? () => onSelect(value) : undefined}
      onKeyDown={onSelect ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(value);
        }
      } : undefined}
      className={onSelect ? "cursor-pointer" : undefined}
    >
      <rect x={x} y={27} width={width} height={153} fill="none" stroke={selected ? "#fb744c" : "#394158"} />
      <text x={x + width / 2} y={48} textAnchor="middle" fill={selected ? "#fb744c" : "#f8fafc"} fontSize="12" fontWeight="700">
        {selected ? "✓ " : ""}{title} = {score}
      </text>
      <g transform={short ? "translate(0 250) scale(1 -1)" : undefined}>
      <g transform={`translate(0 ${short ? 70 : 38})`}>
        <BestTimeChart chartLeft={chartLeft} chartRight={chartRight} short={short} title={title} />
      </g>
      </g>
      <rect x={x} y={27} width={width} height={153} fill="transparent" pointerEvents="all" />
      <text x={x + width / 2} y={174} textAnchor="middle" fill="#9ba2e9" fontSize="13" fontWeight="600">{caption}</text>
    </g>
  );
}

function BestTimeChart({
  chartLeft,
  chartRight,
  short,
  title,
}: {
  chartLeft: number;
  chartRight: number;
  short: boolean;
  title: string;
}) {
  const duplicateGood = title === "Good" || title === "Poor";
  const poorGraphic = title === "Poor";
  const topLine = 82;
  const bottomLine = 114;
  const candleColors = poorGraphic
    ? ["#19c85a", "#19c85a", "#19c85a", "#ff263e", "#19c85a", "#ff263e", "#19c85a", "#ff263e", "#19c85a", "#ff263e", "#ff263e", "#ff263e"]
    : duplicateGood
      ? ["#19c85a", "#19c85a", "#19c85a", "#ff263e", "#19c85a", "#ff263e", "#ff263e", "#ff263e"]
    : title === "Best" && !short
      ? ["#ff263e", "#ff263e", "#19c85a", "#19c85a"]
    : short
      ? ["#19c85a", "#19c85a", "#ff263e", "#ff263e"]
      : ["#19c85a", "#ff263e", "#ff263e", "#ff263e"];
  const arrowCenter = (chartLeft + chartRight) / 2;
     const candleStart = arrowCenter - 16;
     const goodCandleStart = arrowCenter - 25;
    const poorCandleStart = arrowCenter - 49.5;
     const candleX = title === "Best"
       ? [chartLeft + 39, chartLeft + 48, chartLeft + 57, chartLeft + 66]
       : poorGraphic
         ? Array.from({ length: 12 }, (_, index) => poorCandleStart + index * 9 - (index === 11 ? 9 : 0))
       : duplicateGood
        ? [goodCandleStart - 9, goodCandleStart, goodCandleStart + 9, goodCandleStart + 18, goodCandleStart + 27, goodCandleStart + 36, goodCandleStart + 45, goodCandleStart + 54]
         : [candleStart, candleStart + 9, candleStart + 18, candleStart + 27];
  const candlePosition = (candleNumber: number) => candleX[candleNumber - 1];
  const leftArrowX = arrowCenter - (poorGraphic ? 24 : duplicateGood ? 12 : 5);
  const rightArrowX = arrowCenter + (poorGraphic ? 28 : duplicateGood ? 16 : 1);
  const lineInset = poorGraphic ? 18 : title === "Good" ? 48 : !short ? 16 : 0;

  return (
    <>
      <line x1={chartLeft + lineInset} y1={topLine} x2={chartRight - lineInset} y2={topLine} stroke={short ? "#ff0000" : "#53d67b"} strokeWidth="1" />
      <line x1={chartLeft + lineInset} y1={bottomLine} x2={chartRight - lineInset} y2={bottomLine} stroke={short ? "#ff0000" : "#53d67b"} strokeWidth="1" />
      {!short && title === "Best" && <rect x={candleX[0] + 5} y={topLine} width={candleX[3] - candleX[0] - 5} height={bottomLine - topLine} fill="#fb744c" fillOpacity="0.45" />}
      {duplicateGood && <rect x={candleX[1] + 4} y={topLine} width={poorGraphic ? candleX[9] - candleX[1] - 4 : candleX[6] - candleX[1] - 3} height={bottomLine - topLine} fill="#fb744c" fillOpacity="0.45" />}
      {duplicateGood && <rect x={candlePosition(1)} y={42} width="5" height="20" fill={candleColors[0]} />}
      {poorGraphic && [3, 4, 5, 6, 7].map((index) => (
        <line key={index} x1={candleX[index] + 2.5} y1={index === 3 ? 76 : index === 4 ? 72 : index === 5 ? 75 : index === 6 ? 72 : 70} x2={candleX[index] + 2.5} y2={index === 3 ? 113 : index === 4 ? 109 : index === 5 ? 112 : index === 6 ? 109 : 107} stroke="#9ca3af" strokeWidth="1" />
      ))}
      <rect x={candleX[duplicateGood ? 1 : 0]} y={duplicateGood ? 50 : 42} width="5" height="40" fill={candleColors[duplicateGood ? 1 : 0]} />
      <line x1={candleX[duplicateGood ? 2 : 1] + 2.5} y1={74} x2={candleX[duplicateGood ? 2 : 1] + 2.5} y2={title === "Best" && !short ? 112.75 : 114} stroke="#9ca3af" strokeWidth="1" />
      <rect x={candleX[duplicateGood ? 2 : 1]} y={82} width="5" height="20" fill={candleColors[duplicateGood ? 2 : 1]} />
        {duplicateGood && (
           <>
          <rect x={candlePosition(4)} y={poorGraphic ? 88 : 82} width="5" height="20" fill={candleColors[3]} />
          {title === "Good" && <rect x={candlePosition(5)} y={82} width="5" height="20" fill={candleColors[4]} />}
          {poorGraphic && (
            <>
              <rect x={candlePosition(5)} y={poorGraphic ? 84 : 82} width="5" height="20" fill={candleColors[4]} />
              <rect x={candlePosition(6)} y={poorGraphic ? 87 : 82} width="5" height="20" fill={candleColors[5]} />
              <rect x={candlePosition(7)} y={poorGraphic ? 84 : 82} width="5" height="20" fill={candleColors[6]} />
              <rect x={candlePosition(8)} y={82} width="5" height="20" fill={candleColors[7]} />
            </>
          )}
           </>
         )}
         <line x1={candleX[poorGraphic ? 8 : duplicateGood ? 5 : 2] + 2.5} y1={poorGraphic ? 74 : 70} x2={candleX[poorGraphic ? 8 : duplicateGood ? 5 : 2] + 2.5} y2={poorGraphic ? 111 : 107} stroke="#9ca3af" strokeWidth="1" />
         <rect x={candleX[poorGraphic ? 8 : duplicateGood ? 5 : 2]} y={poorGraphic ? 86 : 82} width="5" height="20" fill={candleColors[poorGraphic ? 8 : duplicateGood ? 5 : 2]} />
         <rect x={candleX[poorGraphic ? 9 : duplicateGood ? 6 : 3]} y={duplicateGood ? 62 : 54} width="5" height="28" fill={candleColors[poorGraphic ? 9 : duplicateGood ? 6 : 3]} />
         {duplicateGood && <rect x={candlePosition(poorGraphic ? 12 : 8)} y={38} width="5" height="28" fill={candleColors[poorGraphic ? 11 : 7]} />}
      <line x1={leftArrowX} y1={duplicateGood ? 30 : 42} x2={leftArrowX} y2={duplicateGood ? 52 : 64} stroke="#9ba2e9" strokeWidth="1" />
      <path d={`M ${leftArrowX - 3} ${duplicateGood ? 47 : 59} l 3 5 l 3 -5`} fill="none" stroke="#9ba2e9" />
      <line x1={rightArrowX} y1={52} x2={rightArrowX} y2={30} stroke="#9ba2e9" strokeWidth="1" />
      <path d={`M ${rightArrowX - 3} 35 l 3 -5 l 3 5`} fill="none" stroke="#9ba2e9" />
      {duplicateGood && (
        <>
          <line x1={arrowCenter - (poorGraphic ? 12 : 6)} y1={56} x2={arrowCenter + (poorGraphic ? 15 : 9)} y2={56} stroke="#9ba2e9" strokeWidth="1" />
          <path d={`M ${arrowCenter + (poorGraphic ? 12 : 6)} 53 l 3 3 l -3 3`} fill="none" stroke="#9ba2e9" />
        </>
      )}
    </>
  );
}
