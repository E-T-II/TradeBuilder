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
