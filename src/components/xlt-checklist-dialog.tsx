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

import { Dialog } from "@base-ui/react/dialog";
import { Check, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { XltScenario } from "@/lib/xlt-criteria";
import { useLanguage } from "@/components/language-provider";

export function XltChecklistDialog({
  scenario,
  checked,
  onToggle,
}: {
  scenario: XltScenario;
  checked: Set<number>;
  onToggle: (index: number, value: boolean) => void;
}) {
  const { text: tx } = useLanguage();
  const completeCount = checked.size;
  const complete = completeCount === scenario.items.length;

  return (
    <Dialog.Root>
      <Dialog.Trigger
        render={<Button variant={complete ? "secondary" : "outline"} />}
      >
        {complete ? <Check aria-hidden /> : <ClipboardCheck aria-hidden />}
        {tx(complete
          ? `XLT checklist complete · ${completeCount}/${scenario.items.length}`
          : `Review XLT checklist · ${completeCount}/${scenario.items.length}`)}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[min(36rem,96vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-card shadow-lg outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <div className="flex items-start justify-between gap-4 border-b p-5">
            <div className="space-y-1">
              <Dialog.Title className="text-base font-semibold">
                {tx(scenario.title)}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {tx(scenario.description)}
              </Dialog.Description>
            </div>
            <Dialog.Close
              render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close XLT checklist")} />}
            >
              <X aria-hidden />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5">
            <p className="mb-4 text-sm font-medium">{tx("Chart checks · {0} of {1} complete", [tx(completeCount), tx(scenario.items.length)])}</p>
            <fieldset className="space-y-4">
              <legend className="sr-only">{tx("{0} chart checks", [tx(scenario.title)])}</legend>
              {scenario.items.map((item, index) => (
                <Label key={item} className="items-start font-normal leading-snug">
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={checked.has(index)}
                    onChange={(event) => onToggle(index, event.target.checked)}
                  />
                  <span>{tx(item)}</span>
                </Label>
              ))}
            </fieldset>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
