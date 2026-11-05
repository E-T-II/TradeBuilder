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

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CirclePlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopEmbeddedYouTubeVideo, tutorialVideoUrl } from "@/lib/youtube";
import { useLanguage } from "@/components/language-provider";
import { TutorialLanguageHint } from "@/components/tutorial-language-hint";

const YOUTUBE_CURVE_VIDEO_ID = "7YBiZB5RIUc";

export function CurveVideoDialog() {
    const { language, text: tx } = useLanguage();
    const [open, setOpen] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        if (!open) stopEmbeddedYouTubeVideo(iframeRef.current);
    }, [open]);

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
                render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
            >
                <CirclePlay aria-hidden />{tx("Watch curve video")}</Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(40rem,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                    <div className="mb-3 flex items-center justify-between">
                        <Dialog.Title className="text-sm font-medium">{tx("Curve tutorial")}</Dialog.Title>
                        <Dialog.Close
                            render={<Button variant="ghost" size="icon-sm" aria-label={tx("Close")} />}
                        >
                            <X aria-hidden />
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">{tx("A YouTube video explaining how to set the curve on the high time frame.")}</Dialog.Description>
                    <TutorialLanguageHint />
                    <div className="overflow-hidden rounded-2xl border border-border bg-black">
                        <iframe
                            ref={iframeRef}
                            src={tutorialVideoUrl(YOUTUBE_CURVE_VIDEO_ID, language)}
                            title={tx("Curve tutorial video")}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="aspect-video w-full"
                        />
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
