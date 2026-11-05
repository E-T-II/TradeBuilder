export type IllustrationBox = [left: number, top: number, right: number, bottom: number];

export interface IllustrationLabel {
  box: IllustrationBox;
  lines: string[];
  color?: string;
  background?: string;
  fontSize?: number;
  align?: "start" | "middle";
  radius?: number;
}

interface OddsIllustration {
  labels: IllustrationLabel[];
  headings: [string[], string[], string[]];
  background: string;
}

const WHITE = "#f8fafc";
const BLUE = "#9797ff";
const GREEN = "#53bd36";
const RED = "#ff2929";
const NAVY = "#282b3f";
const SUPPLY_NAVY = "#292b3e";

function label(box: IllustrationBox, lines: string | string[], color = WHITE, fontSize = 12, align: "start" | "middle" = "middle", background?: string): IllustrationLabel {
  return { box, lines: typeof lines === "string" ? [lines] : lines, color, fontSize, align, background };
}

function zone(short: boolean, scale: number, x: number, y: number, width: number, headingTop = 51 * scale): IllustrationLabel[] {
  return [
    label([x, headingTop, x + width, headingTop + 20 * scale], "Zone", WHITE, 12 * scale, "start"),
    label([x, y, x + width, y + 48 * scale],
      short ? ["Supply", "Sell Setup", "(Short)"] : ["Demand", "Buy Setup", "(Long)"],
      short ? RED : GREEN, 11 * scale, "start"),
  ];
}

const rated: OddsIllustration["headings"] = [["Best = 2"], ["Good = 1"], ["Poor = 0"]];
const total: OddsIllustration["headings"] = [
  ["> 8 out of 10", "Proximal"], ["7–8 out of 10", "Confirmation"], ["< 7 out of 10"],
];

function curveBands(x: number, y: number, scale: number): IllustrationLabel[] {
  const s = scale;
  const upper = scale === 2 ? "#51363d" : "#50363c";
  const middle = scale === 2 ? "#3f404f" : "#3e4050";
  const lower = scale === 2 ? "#3f3156" : "#3e3156";
  return [
    label([x + 4 * s, y + 3 * s, x + 93 * s, y + 16 * s], "Supply (HTF)", RED, 9 * s, "start", upper),
    label([x + 22 * s, y + 19 * s, x + 106 * s, y + 35 * s], "High", "#ff803b", 10 * s, "start", upper),
    label([x + 22 * s, y + 46 * s, x + 106 * s, y + 63 * s], "Middle", "#a6a6a8", 10 * s, "start", middle),
    label([x + 22 * s, y + 73 * s, x + 106 * s, y + 88 * s], "Low", "#ae67bd", 10 * s, "start", lower),
    label([x + 4 * s, y + 92 * s, x + 105 * s, y + 107 * s], "Demand (HTF)", GREEN, 9 * s, "start", lower),
  ];
}

function zoneTag(box: IllustrationBox, short: boolean, scale: number): IllustrationLabel {
  return { ...label(box, short ? "SZ LTF" : "DZ LTF", WHITE, 9 * scale),
    background: short ? "#b82c32" : "#05a859", radius: 8 * scale };
}

// Pixel bounds are measured on the English assets; only the text is replaced.
export const oddsIllustrations: Record<string, OddsIllustration> = {
  "/odds-enhancers/trend.png": {
    background: NAVY, headings: rated,
    labels: [
      label([94, 14, 620, 34], "Is the formation in the right location of the trend?"),
      ...zone(false, 1, 18, 116, 87),
      label([164, 185, 220, 201], "Uptrend", BLUE, 10),
      label([359, 185, 414, 201], "Sideways", BLUE, 10),
      label([554, 185, 621, 201], "Downtrend", BLUE, 10),
      label([199, 152, 218, 166], "DZ", GREEN, 9),
      label([408, 167, 427, 181], "DZ", GREEN, 9),
      label([644, 171, 664, 186], "DZ", GREEN, 9),
      label([145, 219, 675, 259], [
        "A demand zone in an uptrend increases the potential profit zone",
        "and the likelihood of the demand zone working.",
      ], WHITE, 12),
    ],
  },
  "/odds-enhancers/trend-supply.png": {
    background: SUPPLY_NAVY, headings: rated,
    labels: [
      label([179, 17, 1290, 54], "Is the formation in the right location of the trend?", WHITE, 26),
      ...zone(true, 2, 28, 221, 180, 96),
      label([301, 349, 429, 378], "Downtrend", BLUE, 23),
      label([710, 349, 851, 378], "Sideways", BLUE, 23),
      label([1117, 349, 1245, 378], "Uptrend", BLUE, 23),
      label([397, 161, 429, 189], "SZ", RED, 22),
      label([800, 139, 833, 165], "SZ", RED, 22),
      label([1286, 135, 1320, 163], "SZ", RED, 22),
      label([300, 421, 1272, 491], [
        "A supply zone in a downtrend increases the potential profit zone",
        "and the likelihood of the supply zone working.",
      ], WHITE, 26),
    ],
  },
  "/odds-enhancers/curve.png": {
    background: NAVY, headings: [["Best = 1"], ["Good = 0.5"], ["Poor = 0"]],
    labels: [
      label([92, 14, 753, 35], "How high or low is the Entry Zone located on the Curve?"),
      ...zone(false, 1, 18, 116, 88),
      ...[118, 333, 549].flatMap(x => curveBands(x, 80, 1)),
      zoneTag([224, 164, 275, 181], false, 1),
      zoneTag([438, 127, 491, 144], false, 1),
      zoneTag([654, 90, 707, 107], false, 1),
      label([153, 201, 234, 218], "Low on Curve", BLUE, 10),
      label([365, 201, 463, 218], "Middle of Curve", BLUE, 10),
      label([582, 201, 668, 218], "High on Curve", BLUE, 10),
      label([103, 237, 757, 275], [
        "A LTF demand zone found low on the curve",
        "will most likely have a larger maximum profit zone.",
      ], WHITE, 12),
    ],
  },
  "/odds-enhancers/curve-supply.png": {
    background: SUPPLY_NAVY, headings: [["Best = 1"], ["Good = 0.5"], ["Poor = 0"]],
    labels: [
      label([178, 17, 1480, 56], "How high or low is the Entry Zone located on the Curve?", WHITE, 26),
      ...zone(true, 2, 28, 226, 181),
      ...[228, 659, 1090].flatMap(x => curveBands(x, 152, 2)),
      zoneTag([439, 173, 543, 206], true, 2),
      zoneTag([870, 242, 975, 276], true, 2),
      zoneTag([1301, 319, 1405, 353], true, 2),
      label([300, 396, 461, 425], "High on Curve", BLUE, 22),
      label([724, 396, 909, 425], "Middle of Curve", BLUE, 22),
      label([1160, 396, 1320, 425], "Low on Curve", BLUE, 22),
      label([202, 467, 1490, 536], [
        "A LTF supply zone found high on the curve",
        "will most likely have a larger maximum profit zone.",
      ], WHITE, 26),
    ],
  },
  "/odds-enhancers/profit-zone.png": {
    background: NAVY, headings: rated,
    labels: [
      label([92, 13, 697, 35], "How far is the opposing Target zone?"),
      ...zone(false, 1, 18, 115, 87),
      ...[
        { target: [163, 77, 217, 90], entry: [145, 173, 198, 186], reward: [219, 120, 269, 134], risk: [219, 173, 250, 187] },
        { target: [374, 95, 429, 108], entry: [355, 171, 408, 184], reward: [430, 131, 480, 147], risk: [430, 171, 462, 186] },
        { target: [581, 110, 635, 123], entry: [562, 172, 616, 185], reward: [637, 132, 687, 149], risk: [637, 172, 670, 187] },
      ].flatMap(boxes => [
        label(boxes.target as IllustrationBox, "Target zone", RED, 8),
        label(boxes.entry as IllustrationBox, "Entry zone", GREEN, 8),
        label(boxes.reward as IllustrationBox, "Reward", GREEN, 11),
        label(boxes.risk as IllustrationBox, "Risk", RED, 11),
      ]),
      label([150, 229, 704, 250], "The larger the profit zone, the greater the probability of reaching the initial target.", WHITE, 12),
    ],
  },
  "/odds-enhancers/profit-zone-supply.png": {
    background: SUPPLY_NAVY, headings: rated,
    labels: [
      label([160, 12, 1300, 51], "How far is the opposing Target zone?", WHITE, 26),
      ...zone(true, 2, 10, 219, 178, 92),
      ...[
        { entry: [265, 140, 365, 166], target: [299, 333, 405, 360], risk: [417, 134, 474, 166], reward: [417, 241, 514, 274] },
        { entry: [685, 155, 786, 181], target: [721, 303, 828, 330], risk: [835, 151, 894, 184], reward: [834, 221, 931, 254] },
        { entry: [1118, 155, 1220, 181], target: [1157, 285, 1265, 312], risk: [1271, 151, 1330, 184], reward: [1271, 221, 1370, 254] },
      ].flatMap(boxes => [
        label(boxes.entry as IllustrationBox, "Entry zone", RED, 18),
        label(boxes.target as IllustrationBox, "Target zone", GREEN, 18),
        label(boxes.risk as IllustrationBox, "Risk", RED, 26),
        label(boxes.reward as IllustrationBox, "Reward", GREEN, 26),
      ]),
      label([276, 447, 1300, 485], "The larger the profit zone, the greater the probability of reaching the initial target.", WHITE, 26),
    ],
  },
  "/odds-enhancers/total-score.png": {
    background: NAVY, headings: total,
    labels: [
      label([18, 35, 96, 56], "Total score", WHITE, 11, "start"),
      label([19, 98, 105, 146], ["Demand", "Buy Setup", "(Long)"], GREEN, 11, "start"),
      label([351, 74, 434, 91], "Leaving Zone", BLUE, 10),
      label([159, 162, 242, 180], "Entering Zone", BLUE, 10),
      label([116, 132, 137, 149], "DZ", GREEN, 11),
      label([296, 138, 317, 156], "DZ", GREEN, 11),
      label([507, 99, 587, 121], "No trade", WHITE, 13),
      label([103, 205, 634, 243], [
        "Entry locations and order type may vary based on an individual's trade plan.",
        "Proximal entry uses Limit Orders. Confirmation entry uses Stop Orders.",
      ], WHITE, 12),
    ],
  },
  "/odds-enhancers/total-score-supply.png": {
    background: NAVY, headings: total,
    labels: [
      label([17, 34, 95, 55], "Total score", WHITE, 11, "start"),
      label([17, 97, 104, 145], ["Supply", "Sell Setup", "(Short)"], RED, 11, "start"),
      label([156, 77, 244, 95], "Entering Zone", BLUE, 10),
      label([355, 155, 441, 174], "Leaving Zone", BLUE, 10),
      label([114, 111, 136, 128], "SZ", RED, 11),
      label([294, 89, 316, 108], "SZ", RED, 11),
      label([504, 99, 586, 121], "No trade", WHITE, 13),
      label([101, 204, 632, 242], [
        "Entry locations and order type may vary based on an individual's trade plan.",
        "Proximal entry uses Limit Orders. Confirmation entry uses Stop Orders.",
      ], WHITE, 12),
    ],
  },
};
