"use client";

import { Children, useLayoutEffect, useRef, useState, type SVGProps } from "react";
import { useLanguage } from "@/components/language-provider";
import { translateIllustration } from "@/lib/odds-illustration-translations";

export function IllustrationZoneText({ short, ...props }: SVGProps<SVGTextElement> & { short: boolean }) {
  const { language } = useLanguage();
  if (language === "en") return <text {...props}>{short ? "SZ" : "DZ"}</text>;
  return <IllustrationText maxWidth={22} {...props}>{translateIllustration(language, short ? "SZ" : "DZ")}</IllustrationText>;
}

export function IllustrationText({
  maxWidth, children, ...props
}: SVGProps<SVGTextElement> & { maxWidth: number }) {
  const { language } = useLanguage();
  const rtl = language === "ar" || language === "he";
  const ref = useRef<SVGTextElement>(null);
  const [fittedWidth, setFittedWidth] = useState<number>();

  useLayoutEffect(() => {
    const text = ref.current;
    if (language === "en" || !text?.getComputedTextLength) return;
    const previous = text.getAttribute("textLength");
    text.removeAttribute("textLength");
    const length = text.getComputedTextLength();
    const width = Math.max(length, text.getBBox?.().width ?? length);
    if (previous !== null) text.setAttribute("textLength", previous);
    setFittedWidth(width > maxWidth ? length * maxWidth / width : undefined);
  }, [language, children, maxWidth, props.fontSize, props.fontWeight]);

  return (
    <text ref={ref} {...props} textAnchor={props.textAnchor ?? (rtl ? "end" : undefined)}
      direction={language === "en" ? props.direction : rtl ? "rtl" : "ltr"}
      style={language === "en" ? props.style : { ...props.style, unicodeBidi: "plaintext" }}
      data-max-width={maxWidth} textLength={language !== "en" ? fittedWidth : undefined}
      lengthAdjust={language !== "en" && fittedWidth !== undefined ? "spacingAndGlyphs" : undefined}>
      {rtl ? Children.map(children, (child) => typeof child === "string"
        ? child.split(/([<>≥≤]?\s*\d+(?:[.–:]\d+)*(?:%)?)/).map((part, index) =>
          /\d/.test(part) ? <tspan key={index} direction="ltr" style={{ unicodeBidi: "isolate" }}>{part}</tspan> : part,
        )
        : child)
        : children}
    </text>
  );
}
