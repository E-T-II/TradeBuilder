# Engineered Risk — the book

The full specification of the Engineered Risk Trading Strategy. This manuscript
is the **source of truth**: the Trade Builder app, the repo `README.md`, and
`docs/ENGINEERING.md` are all downstream of it. When the book and the code
disagree, the book is right and the code is a bug.

## Layout

```
ebook/
  metadata.yaml        title, author, rights — read by pandoc
  manuscript/          numbered chapters, concatenated in filename order
  assets/images/       screenshots, chart photographs
  assets/diagrams/     SVG figures (the app's price-map.svg lives here too)
  build/               generated output, not committed
```

Chapters are numbered with a two-digit prefix so `manuscript/*.md` expands in
reading order. Leave gaps when inserting (`07a-…`) rather than renumbering, so
cross-references and git history stay intact.

## Building

Nothing here depends on a build step — the Markdown is readable as-is. To
produce an EPUB or PDF:

```sh
# EPUB
pandoc metadata.yaml manuscript/*.md -o build/engineered-risk.epub \
  --toc --toc-depth=2 --resource-path=.:assets

# PDF
pandoc metadata.yaml manuscript/*.md -o build/engineered-risk.pdf \
  --toc --toc-depth=2 --resource-path=.:assets
```

Install with `brew install pandoc` (PDF also needs a LaTeX engine, e.g.
`brew install --cask basictex`).

## Conventions

- **One idea per chapter.** If a chapter needs an "and" in its title, split it.
- **Name the rule, then show the arithmetic, then show the chart.** Every
  numeric rule in this strategy has a worked example somewhere; keep them
  consistent with the running example (a $600 account, NVDA at ATR 5.93).
- **Hard rules are called out as hard rules.** Reward:risk below 3:1 and the 6%
  ceiling reject a trade outright. The prose must not soften them into
  suggestions — the app treats them as vetoes.
- **Proximal / distal, never "top/bottom".** A demand zone's near edge is always
  its top; a supply zone's near edge is always its bottom. This is fixed per
  zone, not per direction.
- **Cross-reference the implementation** where a chapter pins down behaviour the
  app must match, e.g. `src/lib/trade-builder.ts`. That link is what keeps the
  spec and the code honest.

## Status

Every chapter currently carries a `> **Status:** outline` blockquote and a
"Must cover" checklist seeded from the existing README. Delete the blockquote
when a chapter is drafted.
