import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CurveZone, Trend, ZoneType } from "@/lib/trade-builder";

const cellClasses =
  "border border-slate-300 bg-white px-2 py-2 text-center text-sm text-slate-900 first:font-semibold first:text-left dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";

const headerCellClasses =
  "border border-slate-300 bg-slate-100 px-2 py-2 text-center text-[8px] leading-snug uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 whitespace-normal break-normal";

const accentCellClasses =
  "border border-slate-300 bg-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const pulseStyles = `
  @keyframes pulse-ring {
    0%, 100% { 
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.8);
    }
    50% { 
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0);
    }
  }
  .animate-pulse-ring {
    animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

// Column index: supply = cols 0-2, demand = cols 3-5; trend = down/sideways/up
const ZONE_COL: Record<ZoneType, number> = { supply: 0, demand: 3 };
const TREND_COL: Record<Trend, number> = { downtrend: 0, sideways: 1, uptrend: 2 };
const CURVE_ROW: Record<CurveZone, number> = { retail: 0, equilibrium: 1, wholesale: 2 };

interface DecisionMatrixProps {
  zoneType?: ZoneType;
  curve?: CurveZone;
  trend?: Trend;
}

function cell(classes: string, highlighted: boolean): string {
  return highlighted
    ? classes + " ring-1 ring-blue-500 dark:ring-blue-400 animate-pulse-ring"
    : classes;
}

export function DecisionMatrix({ zoneType, curve, trend }: DecisionMatrixProps) {
  const colOffset = zoneType != null ? ZONE_COL[zoneType] + (trend != null ? TREND_COL[trend] : -1) : -1;
  const activeRow = curve != null ? CURVE_ROW[curve] : -1;

  function isActive(row: number, col: number): boolean {
    return row === activeRow && col === colOffset;
  }

  return (
    <Card>
      <style>{pulseStyles}</style>
      <CardHeader>
        <CardTitle>Decision Matrix</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="w-full overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700">
          <table className="w-full border-collapse table-fixed rounded-2xl">
            <thead>
              <tr>
                <th className={headerCellClasses} rowSpan={2}>
                  <div className="flex h-full flex-col justify-between gap-2 py-2">
                    <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                      Zone
                    </span>
                    <span className="block border-t border-slate-300 pt-2 text-[10px] uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Trend
                    </span>
                  </div>
                </th>
                <th className={headerCellClasses} colSpan={3}>
                  <span className="text-rose-600 text-xs">LTF Supply</span>
                </th>
                <th className={headerCellClasses} colSpan={3}>
                  <span className="text-emerald-600 text-xs">LTF Demand</span>
                </th>
              </tr>
              <tr>
                <th className={headerCellClasses}>
                  <span className="text-rose-600">
                    <span className="sm:hidden">ITF Down<br />trend</span>
                    <span className="hidden sm:inline">ITF Downtrend</span>
                  </span>
                </th>
                <th className={headerCellClasses}><span className="sm:hidden">ITF Side<br />ways</span><span className="hidden sm:inline">ITF Sideways</span></th>
                <th className={headerCellClasses}><span className="text-emerald-600">ITF Uptrend</span></th>
                <th className={headerCellClasses}>
                  <span className="text-rose-600">
                    <span className="sm:hidden">ITF Down<br />trend</span>
                    <span className="hidden sm:inline">ITF Downtrend</span>
                  </span>
                </th>
                <th className={headerCellClasses}><span className="sm:hidden">ITF Side<br />ways</span><span className="hidden sm:inline">ITF Sideways</span></th>
                <th className={headerCellClasses}><span className="text-emerald-600">ITF Uptrend</span></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={accentCellClasses}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">HTF</div>
                  <div className="font-semibold text-rose-600 dark:text-rose-400">Curve High</div>
                </td>
                <td className={cell(cellClasses, isActive(0, 0))}><span className="text-rose-600">Short</span></td>
                <td className={cell(cellClasses, isActive(0, 1))}><span className="text-rose-600">Short</span></td>
                <td className={cell(cellClasses, isActive(0, 2))}>
                  <div><span className="text-rose-600">Short</span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">XLT</div>
                </td>
                <td className={cell(cellClasses, isActive(0, 3))}>No action</td>
                <td className={cell(cellClasses, isActive(0, 4))}>No action</td>
                <td className={cell(cellClasses, isActive(0, 5))}>
                  <div><span className="text-emerald-600">Long<span className="text-xl">*</span></span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">XLT</div>
                </td>
              </tr>
              <tr>
                <td className={accentCellClasses}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">HTF</div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">Curve Middle</div>
                </td>
                <td className={cell(cellClasses, isActive(1, 0))}><span className="text-rose-600">Short</span></td>
                <td className={cell(cellClasses, isActive(1, 1))}><span className="text-rose-600">Short</span></td>
                <td className={cell(cellClasses, isActive(1, 2))}>No action</td>
                <td className={cell(cellClasses, isActive(1, 3))}>No action</td>
                <td className={cell(cellClasses, isActive(1, 4))}><span className="text-emerald-600">Long</span></td>
                <td className={cell(cellClasses, isActive(1, 5))}><span className="text-emerald-600">Long</span></td>
              </tr>
              <tr>
                <td className={accentCellClasses}>
                  <div className="text-xs text-slate-500 dark:text-slate-400">HTF</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Curve Low</div>
                </td>
                <td className={cell(cellClasses, isActive(2, 0))}>
                  <div><span className="text-rose-600">Short<span className="text-xl">*</span></span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">XLT</div>
                </td>
                <td className={cell(cellClasses, isActive(2, 1))}>No action</td>
                <td className={cell(cellClasses, isActive(2, 2))}>No action</td>
                <td className={cell(cellClasses, isActive(2, 3))}>
                  <div><span className="text-emerald-600">Long</span></div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">XLT</div>
                </td>
                <td className={cell(cellClasses, isActive(2, 4))}><span className="text-emerald-600">Long</span></td>
                <td className={cell(cellClasses, isActive(2, 5))}><span className="text-emerald-600">Long</span></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-4">
            <p className="ml-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-xl">*</span> Offering Profit Zone ≥ 5:1.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
