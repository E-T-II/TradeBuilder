"use client";

import { useId } from "react";
import { useLanguage } from "@/components/language-provider";

export const TRADE_PLAN_GRAPHIC_MESSAGES = [
  "Occasional Steps", "Recurrent Steps", "Annually/Quarterly/Monthly",
  "Before the Trade", "During the Trade", "After the Trade",
  "Define Purpose/Duration", "Set Risk & Reward Rules", "Create Watch List",
  "Review Results", "Pre-Steps", "Set Curve", "Check Trend", "Identify Zones",
  "Score Trade", "S.E.T.S. Trade", "Place Order", "Manage Trade", "Monitor Reports",
  "Log Trade", "Start", "Order Pending", "Order Executed", "Wait", "Trade Closed",
  "HTF", "ITF", "LTF", "Trend", "On Curve", "Up", "Sideways", "Down",
  "High", "Middle", "Low", "DECISION MATRIX", "O.E. Score", "Weak", "Strong",
  "No Trade", "Zone", "Supply", "Demand", "DownTrend", "UpTrend",
  "CURVE High", "CURVE Equilibrium", "CURVE Low", "Short", "Short*", "Long",
  "Long*", "No Action", "XLT", "* Offering Exceptional Profit Margin",
] as const;

type Message = (typeof TRADE_PLAN_GRAPHIC_MESSAGES)[number];
export type TradePlanGraphicId = "blueprintSteps" | "blueprintFlowChart" | "tradingProcess" | "decisionMatrix";

const navy = "#080577";
const arrowColor = "#05255f";
const red = "#c90000";
const green = "#006700";

function Label({
  message, x, y, width, size = 18, fill = navy, lines = 1,
}: {
  message: Message; x: number; y: number; width: number;
  size?: number; fill?: string; lines?: number;
}) {
  const { text: tx } = useLanguage();
  const translated = tx(message);
  const words = translated.split(/\s+/);
  const rows: string[] = [""];
  const limit = Math.max(1, Math.floor(width / (size * 0.53)));
  for (const word of words) {
    const index = rows.length - 1;
    if (rows[index] && rows[index].length + word.length + 1 > limit && rows.length < lines) {
      rows.push(word);
    } else {
      rows[index] += `${rows[index] ? " " : ""}${word}`;
    }
  }
  return (
    <text x={x} y={y} fill={fill} fontSize={size} fontWeight={700}
      textAnchor="middle" direction="ltr" style={{ unicodeBidi: "plaintext" }}>
      {rows.map((row, index) => (
        <tspan key={`${translated}-${index}`} x={x}
          dy={index === 0 ? -((rows.length - 1) * size * 0.59) : size * 1.18}
          dominantBaseline="middle" direction="ltr" style={{ unicodeBidi: "plaintext" }}
          ref={(node) => {
            if (!node?.getComputedTextLength) return;
            node.removeAttribute("textLength");
            node.removeAttribute("lengthAdjust");
            if (node.getComputedTextLength() > width) {
              node.setAttribute("textLength", String(width));
              node.setAttribute("lengthAdjust", "spacingAndGlyphs");
            }
          }}>
          {row}
        </tspan>
      ))}
    </text>
  );
}

function Arrow({ d, prefix, width = 4 }: { d: string; prefix: string; width?: number }) {
  return <path d={d} fill="none" stroke={arrowColor} strokeWidth={width}
    strokeLinejoin="round" markerEnd={`url(#${prefix}-arrow)`} />;
}

function Box({
  x, y, width, height, message, prefix, size = 17, fill, chevron = false,
}: {
  x: number; y: number; width: number; height: number; message: Message;
  prefix: string; size?: number; fill?: string; chevron?: boolean;
}) {
  return (
    <g>
      {chevron
        ? <path d={`M${x} ${y}H${x + width - 21}L${x + width} ${y + height / 2}L${x + width - 21} ${y + height}H${x}Z`}
          fill={fill ?? "#ffe694"} stroke={navy} strokeWidth={3.5} strokeLinejoin="round" />
        : <rect x={x} y={y} width={width} height={height} fill={fill ?? `url(#${prefix}-box)`}
          stroke="#111" strokeWidth={3.5} strokeLinejoin="round" />}
      <Label message={message} x={x + width / 2 - (chevron ? 6 : 0)} y={y + height / 2 + 1}
        width={width - (chevron ? 32 : 14)} size={size} lines={2} fill={chevron ? navy : "#080808"} />
    </g>
  );
}

function Badge({ message, x, y }: { message: Message; x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={48} height={34} rx={1} fill={navy} />
      <Label message={message} x={x + 24} y={y + 18} width={40} size={19} fill="#fff" />
    </g>
  );
}

function StepNumber({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={19} fill={navy} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#fff" fontSize={21} fontWeight={700} direction="ltr">{n}</text>
    </g>
  );
}

function TradingProcess({ prefix }: { prefix: string }) {
  return (
    <g>
      <Arrow prefix={prefix} d="M116 69V108" />
      <Arrow prefix={prefix} d="M116 143V224" />
      <Arrow prefix={prefix} d="M116 259V399" />
      <Arrow prefix={prefix} d="M203 241H317" />
      <Arrow prefix={prefix} d="M203 416H317" />
      <Arrow prefix={prefix} d="M381 189V167H542" />
      <Arrow prefix={prefix} d="M443 241H542" />
      <Arrow prefix={prefix} d="M381 293V312H542" />
      <Arrow prefix={prefix} d="M381 365V346H542" />
      <Arrow prefix={prefix} d="M443 416H542" />
      <Arrow prefix={prefix} d="M381 468V487H542" />
      <Arrow prefix={prefix} d="M593 321H660V110H890V158" />
      <Arrow prefix={prefix} d="M890 193V234" />
      <Arrow prefix={prefix} d="M890 339V377" />
      <Arrow prefix={prefix} d="M890 412V467" />
      <Arrow prefix={prefix} d="M829 286H719V526" />
      <Label message="Start" x={120} y={20} width={160} size={26} fill="#080808" />
      <Box x={30} y={35} width={173} height={34} message="Pre-Steps" prefix={prefix} />
      <Box x={30} y={109} width={173} height={34} message="Set Curve" prefix={prefix} />
      <Box x={30} y={224} width={173} height={35} message="Check Trend" prefix={prefix} />
      <Box x={30} y={399} width={173} height={35} message="Identify Zones" prefix={prefix} />
      <Badge x={182} y={132} message="HTF" />
      <Badge x={180} y={249} message="ITF" />
      <Badge x={180} y={423} message="LTF" />
      <path d="M381 189L443 241L381 293L319 241Z" fill={`url(#${prefix}-box)`} stroke="#111" strokeWidth={3} />
      <path d="M381 364L443 416L381 468L319 416Z" fill={`url(#${prefix}-box)`} stroke="#111" strokeWidth={3} />
      <Label message="Trend" x={381} y={242} width={92} size={17} fill="#080808" />
      <Label message="On Curve" x={381} y={417} width={92} size={17} fill="#080808" />
      <Label message="Up" x={508} y={153} width={50} size={14} fill={green} />
      <Label message="Sideways" x={487} y={228} width={92} size={14} fill={arrowColor} />
      <Label message="Down" x={498} y={301} width={65} size={14} fill={red} />
      <Label message="High" x={502} y={334} width={58} size={14} fill={red} />
      <Label message="Middle" x={495} y={401} width={70} size={14} fill={arrowColor} />
      <Label message="Low" x={504} y={474} width={52} size={14} fill={green} />
      <rect x={542} y={138} width={51} height={367} fill={`url(#${prefix}-matrix)`} stroke="#111" strokeWidth={3} />
      <g transform="translate(568 322) rotate(-90)">
        <Label message="DECISION MATRIX" x={0} y={0} width={295} size={22} fill="#080808" />
      </g>
      <Box x={803} y={159} width={174} height={34} message="Score Trade" prefix={prefix} />
      <path d="M890 234L952 286L890 339L828 286Z" fill={`url(#${prefix}-box)`} stroke="#111" strokeWidth={3} />
      <Label message="O.E. Score" x={890} y={286} width={88} size={17} lines={2} fill="#080808" />
      <Label message="Weak" x={797} y={305} width={65} size={14} fill={red} />
      <Label message="Strong" x={924} y={355} width={75} size={14} fill={green} />
      <Box x={803} y={377} width={174} height={34} message="S.E.T.S. Trade" prefix={prefix} />
      <Box x={803} y={468} width={174} height={34} message="Place Order" prefix={prefix} />
      <Box x={665} y={526} width={108} height={64} message="No Trade" prefix={prefix} />
      {[[1, 30, 109], [2, 30, 224], [3, 30, 399], [4, 803, 159], [5, 803, 377], [6, 803, 467]].map(([n, x, y]) =>
        <StepNumber key={n} n={n} x={x} y={y} />)}
    </g>
  );
}

function BlueprintSteps({ prefix }: { prefix: string }) {
  const occasional: Message[] = ["Define Purpose/Duration", "Set Risk & Reward Rules", "Create Watch List", "Review Results"];
  const steps: Message[] = ["Pre-Steps", "Set Curve", "Check Trend", "Identify Zones", "Score Trade", "S.E.T.S. Trade"];
  return (
    <g>
      <rect x={12} y={14} width={257} height={57} rx={2} fill="#91b4e1" stroke={navy} strokeWidth={3.5} />
      <rect x={275} y={14} width={809} height={57} rx={2} fill="#ffce00" stroke={navy} strokeWidth={3.5} />
      <path d="M12 82H251L282 312L251 543H12Z" fill="#91b4e1" stroke={navy} strokeWidth={3.5} />
      <path d="M275 82H544L570 312L544 543H275L282 312Z" fill="#ffce00" stroke={navy} strokeWidth={3.5} />
      <path d="M564 82H809L843 312L809 543H564L570 312Z" fill="#ffce00" stroke={navy} strokeWidth={3.5} />
      <path d="M828 82H1084V543H828L843 312Z" fill="#ffce00" stroke={navy} strokeWidth={3.5} />
      <Label message="Occasional Steps" x={141} y={44} width={240} size={22} fill="#080808" />
      <Label message="Recurrent Steps" x={679} y={44} width={775} size={22} fill="#080808" />
      <Label message="Annually/Quarterly/Monthly" x={133} y={112} width={225} size={17} />
      <Label message="Before the Trade" x={411} y={109} width={251} size={22} />
      <Label message="During the Trade" x={694} y={109} width={235} size={22} />
      <Label message="After the Trade" x={956} y={109} width={236} size={22} />
      <path d="M16 131H257M280 133H520M570 130H812M835 130H1075" stroke={navy} strokeWidth={3.5} />
      {occasional.map((message, index) =>
        <Box key={message} x={39} y={155 + index * 92} width={203} height={85}
          message={message} prefix={prefix} chevron fill="#d5e4f7" size={19} />)}
      {steps.map((message, index) => {
        const y = index === 0 ? 163 : 211 + (index - 1) * 50;
        return (
          <g key={message}>
            <path d={`M299 ${y}H533V${y + 31}L416 ${y + 55}L299 ${y + 31}Z`}
              fill="#ffe694" stroke={navy} strokeWidth={3.5} strokeLinejoin="round" />
            {index > 0 && <text x={314} y={y + 26} fontSize={25} fontWeight={700} fill={navy} direction="ltr">{index}</text>}
            <Label message={message} x={index ? 430 : 416} y={y + 23} width={index ? 177 : 214} size={19} />
          </g>
        );
      })}
      <Box x={304} y={460} width={230} height={56} message="Place Order" prefix={prefix} chevron size={19} />
      <text x={315} y={498} fontSize={25} fontWeight={700} fill={navy} direction="ltr">{6}</text>
      <Box x={597} y={226} width={203} height={85} message="Manage Trade" prefix={prefix} chevron size={19} />
      <Box x={597} y={318} width={203} height={85} message="Monitor Reports" prefix={prefix} chevron size={19} />
      <Box x={869} y={269} width={203} height={85} message="Log Trade" prefix={prefix} chevron size={19} />
    </g>
  );
}

function BlueprintFlowChart({ prefix }: { prefix: string }) {
  return (
    <g>
      <rect x={13} y={9} width={260} height={633} fill="#d9e2f2" />
      <rect x={273} y={9} width={812} height={633} fill="#ffe694" />
      <rect x={13} y={9} width={257} height={65} rx={1} fill="#aebccb" stroke={navy} strokeWidth={3.5} />
      {[[275, 9, 809, 27], [275, 42, 375, 32], [655, 42, 237, 32], [897, 42, 187, 32]].map(([x, y, width, height]) =>
        <rect key={`${x}-${y}`} x={x} y={y} width={width} height={height} rx={1} fill="#ffd367" stroke={navy} strokeWidth={3.5} />)}
      <Label message="Occasional Steps" x={141} y={41} width={235} size={19} fill="#080808" />
      <Label message="Recurrent Steps" x={679} y={23} width={780} size={19} fill="#080808" />
      <Label message="Before the Trade" x={462} y={60} width={352} size={19} fill="#080808" />
      <Label message="During the Trade" x={773} y={60} width={215} size={19} fill="#080808" />
      <Label message="After the Trade" x={991} y={60} width={168} size={19} fill="#080808" />
      <Label message="Start" x={141} y={133} width={173} size={24} fill="#080808" />
      <Arrow prefix={prefix} d="M142 229V262" />
      <Arrow prefix={prefix} d="M142 332V373" />
      <Arrow prefix={prefix} d="M230 407H255V257H281" />
      <Arrow prefix={prefix} d="M468 373V400H374V428" />
      <Arrow prefix={prefix} d="M468 400H549V428" />
      <Arrow prefix={prefix} d="M374 461V515" />
      <Arrow prefix={prefix} d="M623 444H671V195H700" />
      <Arrow prefix={prefix} d="M671 303H700" />
      <Arrow prefix={prefix} d="M874 195H910V247H945" />
      <path d="M874 303H910V247" fill="none" stroke={arrowColor} strokeWidth={4} />
      <Arrow prefix={prefix} d="M989 269V415" />
      <Arrow prefix={prefix} d="M989 459V597H142V539" />
      <Box x={56} y={161} width={174} height={68} message="Define Purpose/Duration" prefix={prefix} size={16} />
      <Box x={56} y={263} width={174} height={69} message="Set Risk & Reward Rules" prefix={prefix} size={16} />
      <Box x={56} y={374} width={174} height={67} message="Create Watch List" prefix={prefix} size={16} />
      <Box x={56} y={471} width={174} height={68} message="Review Results" prefix={prefix} size={16} />
      <rect x={281} y={144} width={375} height={229} rx={8} fill="#fff" stroke="#111" strokeWidth={3.5} />
      <svg x={285} y={147} width={367} height={222} viewBox="0 0 997 605" direction="ltr">
        <TradingProcess prefix={prefix} />
      </svg>
      <Box x={300} y={428} width={149} height={32} message="Order Pending" prefix={prefix} size={16} />
      <Box x={474} y={428} width={149} height={32} message="Order Executed" prefix={prefix} size={16} />
      <Box x={334} y={515} width={82} height={32} message="Wait" prefix={prefix} size={16} />
      <Box x={700} y={178} width={173} height={34} message="Manage Trade" prefix={prefix} size={17} />
      <Box x={700} y={286} width={173} height={34} message="Monitor Reports" prefix={prefix} size={17} />
      <Box x={946} y={226} width={86} height={43} message="Trade Closed" prefix={prefix} size={16} />
      <Box x={946} y={416} width={86} height={43} message="Log Trade" prefix={prefix} size={16} />
    </g>
  );
}

function DecisionMatrix({ prefix }: { prefix: string }) {
  const columns: Message[] = ["DownTrend", "Sideways", "UpTrend", "DownTrend", "Sideways", "UpTrend"];
  const rows: Message[] = ["CURVE High", "CURVE Equilibrium", "CURVE Low"];
  const cells: { message: Message; xlt?: boolean }[][] = [
    [{ message: "Short" }, { message: "Short" }, { message: "Short", xlt: true }, { message: "No Action" }, { message: "No Action" }, { message: "Long*", xlt: true }],
    [{ message: "Short" }, { message: "Short" }, { message: "No Action" }, { message: "No Action" }, { message: "Long" }, { message: "Long" }],
    [{ message: "Short*", xlt: true }, { message: "No Action" }, { message: "No Action" }, { message: "Long", xlt: true }, { message: "Long" }, { message: "Long" }],
  ];
  const edges = [175, 320, 491, 666];
  return (
    <g>
      <clipPath id={`${prefix}-table-clip`}>
        <rect x={10} y={9} width={1460} height={657} rx={36} />
      </clipPath>
      <g clipPath={`url(#${prefix}-table-clip)`}>
        <rect x={10} y={9} width={1460} height={657} fill="#d9d9d9" />
        {cells.map((row, r) => row.map(({ message, xlt }, c) => {
          const x = 220 + c * (1250 / 6);
          const y = edges[r];
          const width = 1250 / 6;
          const height = edges[r + 1] - y;
          const noAction = message === "No Action";
          return (
            <g key={`${r}-${c}`}>
              <rect x={x} y={y} width={width} height={height}
                fill={xlt ? "#b1dceb" : noAction ? `url(#${prefix}-dots)` : "#fff"}
                stroke="#888" strokeWidth={2} />
              <Label message={message} x={x + width / 2} y={y + height * (xlt ? 0.3 : 0.5)}
                width={width - (noAction ? 50 : 22)} size={xlt ? 31 : noAction ? 35 : 47}
                lines={noAction ? 2 : 1} fill={noAction ? "#080808" : message.startsWith("Short") ? red : green} />
              {xlt && <Label message="XLT" x={x + width / 2} y={y + height * 0.7}
                width={width - 35} size={37} />}
            </g>
          );
        }))}
        <path d="M10 320H220M10 491H220M418 95V175M629 95V175M839 9V175M1050 95V175M1261 95V175" stroke="#888" strokeWidth={2} />
        <path d="M220 9V666M10 175H1470M10 56L220 95H1470" fill="none" stroke={navy} strokeWidth={5} />
        <Label message="Zone" x={142} y={49} width={150} size={46} fill="#080808" />
        <Label message="Trend" x={117} y={126} width={178} size={44} fill="#080808" />
        <Badge message="LTF" x={398} y={29} />
        <Label message="Supply" x={562} y={54} width={210} size={50} fill={red} />
        <Badge message="LTF" x={1008} y={29} />
        <Label message="Demand" x={1190} y={54} width={250} size={50} fill={green} />
        {columns.map((message, c) => {
          const x = 220 + (c + 0.5) * (1250 / 6);
          return (
            <g key={c}>
              <Badge message="ITF" x={x - 24} y={103} />
              <Label message={message} x={x} y={159} width={194} size={27}
                fill={c % 3 === 0 ? red : c % 3 === 2 ? green : "#080808"} />
            </g>
          );
        })}
        {rows.map((message, r) => {
          const y = (edges[r] + edges[r + 1]) / 2;
          return (
            <g key={message}>
              <Badge message="HTF" x={25} y={y - 17} />
              <Label message={message} x={151} y={y} width={122} size={29} lines={3}
                fill={r === 0 ? red : r === 2 ? green : "#080808"} />
            </g>
          );
        })}
      </g>
      <rect x={10} y={9} width={1460} height={657} rx={36} fill="none" stroke={navy} strokeWidth={5} />
      <Label message="* Offering Exceptional Profit Margin" x={510} y={694} width={940} size={32} fill="#080808" />
    </g>
  );
}

const dimensions: Record<TradePlanGraphicId, readonly [number, number]> = {
  blueprintSteps: [1099, 554],
  blueprintFlowChart: [1097, 650],
  tradingProcess: [997, 605],
  decisionMatrix: [1479, 716],
};

export function TradePlanGraphic({ id, title }: { id: TradePlanGraphicId; title: string }) {
  const { text: tx } = useLanguage();
  const prefix = `trade-plan-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [width, height] = dimensions[id];
  return (
    <svg role="img" aria-label={tx(title)} viewBox={`0 0 ${width} ${height}`}
      width={width} height={height} className="block h-auto w-1/2 shrink-0"
      direction="ltr" style={{ aspectRatio: `${width} / ${height}`, fontFamily: "Arial, sans-serif" }}>
      <defs>
        <marker id={`${prefix}-arrow`} viewBox="0 0 10 10" refX={9} refY={5}
          markerWidth={3} markerHeight={3} orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10Z" fill={arrowColor} />
        </marker>
        <linearGradient id={`${prefix}-box`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#aaa" />
          <stop offset=".48" stopColor="#fff" />
          <stop offset=".7" stopColor="#fff" />
          <stop offset="1" stopColor="#aaa" />
        </linearGradient>
        <linearGradient id={`${prefix}-matrix`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#aaa" />
          <stop offset=".5" stopColor="#eee" />
          <stop offset="1" stopColor="#aaa" />
        </linearGradient>
        <pattern id={`${prefix}-dots`} width={4} height={4} patternUnits="userSpaceOnUse">
          <rect width={4} height={4} fill="#fff" />
          <circle cx={1} cy={1} r={0.55} fill="#555" />
          <circle cx={3} cy={3} r={0.55} fill="#555" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="#fff" />
      {id === "blueprintSteps" && <BlueprintSteps prefix={prefix} />}
      {id === "blueprintFlowChart" && <BlueprintFlowChart prefix={prefix} />}
      {id === "tradingProcess" && <TradingProcess prefix={prefix} />}
      {id === "decisionMatrix" && <DecisionMatrix prefix={prefix} />}
    </svg>
  );
}
