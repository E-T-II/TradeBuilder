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

import type { LanguageCode } from "@/lib/languages";

export function tutorialVideoUrl(videoId: string, language: LanguageCode): string {
    const params = new URLSearchParams({
        autoplay: "1",
        rel: "0",
        controls: "1",
        enablejsapi: "1",
        hl: language,
        cc_lang_pref: language,
    });
    return `https://www.youtube.com/embed/${videoId}?${params}`;
}

export function stopEmbeddedYouTubeVideo(iframe: HTMLIFrameElement | null) {
    if (!iframe?.contentWindow) return;

    iframe.contentWindow.postMessage(
        JSON.stringify({
            event: "command",
            func: "stopVideo",
            args: [],
        }),
        "*",
    );
}
