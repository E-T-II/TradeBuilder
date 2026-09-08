"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { CirclePlay, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopEmbeddedYouTubeVideo } from "@/lib/youtube";

const YOUTUBE_ZONING_VIDEO_ID = "XLq6BR3MRTw";
const YOUTUBE_ZONING_VIDEO_URL =
    `https://www.youtube.com/embed/${YOUTUBE_ZONING_VIDEO_ID}?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&enablejsapi=1`;

export function ZoningVideoDialog() {
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
                <CirclePlay aria-hidden />
                Watch zoning video
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[min(40rem,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-lg outline-none transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
                    <div className="mb-3 flex items-center justify-between">
                        <Dialog.Title className="text-sm font-medium">Zoning tutorial video</Dialog.Title>
                        <Dialog.Close
                            render={<Button variant="ghost" size="icon-sm" aria-label="Close" />}
                        >
                            <X aria-hidden />
                        </Dialog.Close>
                    </div>
                    <Dialog.Description className="sr-only">
                        A YouTube video explaining how to mark supply and demand zones on the chart.
                    </Dialog.Description>
                    <div className="overflow-hidden rounded-2xl border border-border bg-black">
                        <iframe
                            ref={iframeRef}
                            src={YOUTUBE_ZONING_VIDEO_URL}
                            title="Zoning tutorial video"
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
