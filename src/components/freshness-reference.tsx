import type { Direction } from "@/lib/trade-builder";

export function FreshnessReference({
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
        <figure className="w-full rounded-lg border border-slate-700 bg-[#252b40] p-2">
            <svg
                viewBox="0 0 580 250"
                role="img"
                aria-label={`Freshness reference for a ${short ? "Supply Sell Setup (Short)" : "Demand Buy Setup (Long)"}: Best equals 2 when the zone is not pierced, Good equals 1 when price pierced 50 percent or less, and Poor equals 0 when price pierced greater than 50 percent.`}
                className="mx-auto block h-auto w-full text-slate-100 [shape-rendering:geometricPrecision]"
            >
                <rect width="580" height="250" fill="#252b40" />
                <text x="290" y="17" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="700">
                    Has price returned to the zone?
                </text>
                <text x="18" y="48" fill="#f8fafc" fontSize="14" fontWeight="700">Zone</text>
                <text x="18" y="108" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "Supply" : "Demand"}</text>
                <text x="18" y="123" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "Sell Setup" : "Buy Setup"}</text>
                <text x="18" y="138" fill={short ? "#ff0000" : "#4ade80"} fontSize="13">{short ? "(Short)" : "(Long)"}</text>
                <FreshnessPanel direction={direction} x={95} width={138} title="Best" score="2" value={2} caption="Zone not Pierced" selected={selected === 2} onSelect={onSelect} />
                <FreshnessPanel direction={direction} x={253} width={142} title="Good" score="1" value={1} caption="Pierced 50% or Less" selected={selected === 1} onSelect={onSelect} />
                <FreshnessPanel direction={direction} x={415} width={145} title="Poor" score="0" value={0} caption="Pierced Greater Than 50%" selected={selected === 0} onSelect={onSelect} />
                <text x="290" y="226" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
                    Scoring Freshness is based on how far,
                </text>
                <text x="290" y="243" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="600">
                    if at all, price has pierced the zone.
                </text>
            </svg>
        </figure>
    );
}

function FreshnessPanel({
    x,
    width,
    title,
    score,
    value,
    caption,
    selected = false,
    onSelect,
    direction,
}: {
    x: number;
    width: number;
    title: string;
    score: string;
    value: number;
    caption: string;
    selected?: boolean;
    onSelect?: (score: number) => void;
    direction: Direction;
}) {
    const short = direction === "short";
    const chartLeft = x + 11;
    const chartRight = x + width - 11;
    const zoneX = x + 37;
    const zoneWidth = 30;
    const candles = (title === "Good" || title === "Poor")
        ? ["#19c85a", "#19c85a", "#19c85a", "#ff263e", "#ff263e", "#19c85a", "#19c85a", "#ff263e", "#ff263e", "#19c85a", "#19c85a", "#19c85a", "#ff263e", "#ff263e"]
        : ["#19c85a", "#19c85a", "#19c85a", "#ff263e", "#ff263e", "#19c85a", "#19c85a", "#ff263e"];

    return (
        <g
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={onSelect ? `${title} freshness, ${score} points` : undefined}
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
            <g transform={short ? "translate(0 234) scale(1 -1)" : "translate(0 -16)"}>
                <line x1={chartLeft} y1={154} x2={chartRight} y2={154} stroke={short ? "#ff0000" : "#53d67b"} />
                <line x1={chartLeft} y1={177} x2={chartRight} y2={177} stroke={short ? "#ff0000" : "#53d67b"} />
                <text x={zoneX + zoneWidth / 2 - 12} y={short ? 162 : 170} transform={short ? "translate(0 324) scale(1 -1)" : undefined} textAnchor="middle" fill={short ? "#ff0000" : "#51d477"} fontSize="11">{short ? "SZ" : "DZ"}</text>
                {title !== "Best" && <line x1={zoneX + 17} y1={166} x2={zoneX + 79} y2={166} stroke={short ? "#ff0000" : "#53d67b"} strokeDasharray="2 2" />}
                <g transform={short ? "translate(0 8)" : undefined}>
                    <line x1={chartLeft + 6.5} y1={short ? 154 : 145} x2={chartLeft + 6.5} y2={short ? 134 : 157} stroke="#9ca3af" strokeWidth="1" />
                    {!short && <line x1={chartLeft + 6.5} y1={173} x2={chartLeft + 6.5} y2={178} stroke="#9ca3af" strokeWidth="1" />}
                    {candles.map((color, index) => {
                        const candleNumber = index + 1;
                        const xPosition = chartLeft + 4 + (candleNumber - 1) * 8;
                        const yPosition = !short && candleNumber === 4
                            ? 102
                            : !short && candleNumber === 5
                                ? 78
                                : !short && candleNumber === 6
                                    ? 77
                                    : !short && candleNumber === 8
                                        ? 112
                                        : !short && candleNumber <= 4
                                            ? 160 - (candleNumber - 1) * 12 - 6
                                            : short && (title === "Good" || title === "Poor") && candleNumber === 9
                                                ? 116
                                                : short && (title === "Good" || title === "Poor") && candleNumber === 10
                                                    ? 130
                                                    : short && (title === "Good" || title === "Poor") && candleNumber === 11
                                                        ? 110
                                                        : short && (title === "Good" || title === "Poor") && candleNumber === 12
                                                            ? 83
                                                            : short && (title === "Good" || title === "Poor") && candleNumber === 13
                                                                ? 83
                                                                : short && (title === "Good" || title === "Poor") && candleNumber === 14
                                                                    ? 87
                                                                    : 106 - Math.min(candleNumber - 1, 4) * 9 + (candleNumber > 5 ? (candleNumber - 5) * 5 : 0) + (short && candleNumber === 1 ? 40 : short && candleNumber === 2 ? 36 : short && candleNumber === 3 ? 24 : short && candleNumber === 4 ? 16 : short && candleNumber === 6 ? -5 : short && candleNumber === 8 ? 12 : 0);
                        const height = !short && candleNumber === 1 ? 18 : !short && candleNumber === 2 ? 28 : !short && candleNumber === 4 ? 28 : !short && candleNumber === 8 ? 28 : candleNumber === 5 ? 31 : short && candleNumber === 8 ? 36 : short && candleNumber === 10 && title === "Poor" ? 34 : short && candleNumber === 12 && (title === "Good" || title === "Poor") ? 28 : short && candleNumber === 9 && title === "Poor" ? 48 : short && candleNumber === 9 && title === "Good" ? 36 : short && candleNumber === 13 && (title === "Good" || title === "Poor") ? 16 : 20;
                        const mirroredColor = [5, 6].includes(index)
                            ? "#19c85a"
                            : ![0, 3, 4].includes(index)
                                ? (color === "#19c85a" ? "#ff263e" : "#19c85a")
                                : color;
                        const demandColor = !short && [0, 5, 6, 7, 8].includes(index) ? "#ff263e" : !short && [3, 4, 9].includes(index) ? "#19c85a" : color;
                        return <rect key={candleNumber} x={xPosition} y={yPosition} width="5" height={height} fill={short ? mirroredColor : demandColor} />;
                    })}
                </g>
                {title !== "Best" ? (
                    <>
                        <rect x={zoneX + (title === "Best" ? 11 : title === "Good" ? 39 : 39)} y={title === "Poor" ? 162 : title === "Good" ? 152 : 154} width={title === "Best" ? 8 : 20} height={title === "Best" ? 17 : title === "Poor" ? 17 : 12} fill="none" stroke="#9ba2e9" />
                        <text x={zoneX + 84} y={short ? 162 : 170} transform={short ? "translate(0 324) scale(1 -1)" : undefined} fill={short ? "#ff0000" : "#4ade80"} fontSize="11">50%</text>
                    </>
                ) : null}
            </g>
            <rect x={x} y={27} width={width} height={153} fill="transparent" pointerEvents="all" />
            <text x={x + width / 2} y={174} textAnchor="middle" fill="#9ba2e9" fontSize="11" fontWeight="600">{caption}</text>
        </g>
    );
}
