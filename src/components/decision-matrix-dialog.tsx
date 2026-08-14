"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Table2, X } from "lucide-react";
import { DecisionMatrix } from "@/components/decision-matrix";
import { Button } from "@/components/ui/button";

export function DecisionMatrixDialog() {
    return (
        <Dialog.Root>
            <Dialog.Trigger
                render={<Button variant="outline" size="sm" />}
            >
                <Table2 aria-hidden />
                See the Decision Matrix
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(40rem,96vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none transition-all data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
                    <div className="mb-3 flex items-center justify-between">
                        <Dialog.Title className="text-sm font-medium">Decision Matrix</Dialog.Title>
                        <Dialog.Close
                            render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}
                        >
                            <X aria-hidden />
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">
                        The decision matrix for choosing a trade direction from the zone, curve, and trend.
                    </Dialog.Description>
                    <DecisionMatrix embedded />
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
