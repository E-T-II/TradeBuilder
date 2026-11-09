<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Localization

- All new and changed interface content, including the trade-plan worksheet and diagrams, must respond to the selected language. Use `useLanguage().text(...)` and update every catalog in `src/lib/locales/`.
- Preserve canonical stored values and user-entered text when translating display labels. Support Arabic/Hebrew RTL layout without mirroring trading diagrams.
- Follow the localization guidance in `README.md` and validate with `src/lib/translations.test.ts` plus affected component tests.
