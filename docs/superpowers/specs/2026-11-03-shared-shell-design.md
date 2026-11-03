# Tendstead shared UI design

## Intent
A small composed Svelte shell lets independent household tools share familiar navigation. Authorize implementation from the user's 2026-11-03 request to implement now with subagents. Neutral navigation with purple accents is accepted. Do not modify existing apps or publish anything.

## Package and boundaries
- Local project: ui; package @tendstead/ui; Svelte 5 and TypeScript; plain component CSS, no Tailwind/reset requirement, no SvelteKit dependency.
- Export AppShell, public types, and independently importable theme.css. Keep internal components private. Snippets supply page content, page actions and optional account controls.
- Theme tokens define deliberate light/dark primary/on-primary (#6750A4 light), nav/on-nav, selection, surfaces/text/borders, focus. Neutral content and navigation; no imagery.
- One registry of destinations: IDs, labels, hrefs, icons, group IDs, optional numeric/string badges (zero rendered), visible/permitted flags, exact/prefix matching. Groups have IDs and labels. Mobile primary IDs refer to this registry; menu exposes every visible/permitted destination. App supplies pathname. Nested matching is segment-aware and most-specific wins; query/hash do not change matching.
- Configurable brand/app label, page title, optional primary action, optional account snippet. Actions are buttons; href destinations are links. Optional href primary action supported. Icons are app-supplied Svelte components; demo uses a consistent public outline icon library.
- Desktop sidebar/header, mobile primary bar, complete modal drawer. No forced five tabs/auth; receipt mobile: Overview / Receipts / Add / Search / Menu. Downloader has fewer tabs. Add is labeled in bar, not floating.
- Desktop sidebar stays within the viewport and scrolls independently on short screens or long navigation maps. The account snippet has only one mounted instance between the sidebar and open drawer, avoiding duplicate consumer IDs and hidden label targets.
- Optional serviceLinks list supplied by consuming app: id, label, href, icon. Empty by default; no empty section. Connected services are secondary in desktop sidebar/mobile drawer, not primary tabs. Apps/config decide visibility and permission. No service-specific knowledge, discovery, backend communication, credentials or URL probing. Cross-service anchors use ordinary same-tab navigation. Contextual integrations can be supplied as page actions; handoff/return path agreements remain app responsibilities.
- App server authorizes access; link filtering is not a security boundary. Avoid unsafe script URLs in link inputs; configuration is trusted but reject obvious non-navigation protocols.
- Support real application routing without intercepting normal links globally: anchors and optional app navigation callback that can prevent default for in-app client routing; browser modifiers/default behavior preserved.
- Drawer: accessible name, focus trap/return, Escape/outside dismissal, background inert/scroll lock, safe cleanup on unmount and desktop resize. Evaluate Melt Dialog 0.86.x compatibility first; one primitive only. Approximately 44px effective touch targets, safe-area accommodation, no overlap/clipped content. Long/German labels wrap.

## Demo and delivery
Receipt demo includes Collections/Statistics under Explore, zero-count Review queue and optional Administration. Also check reduced-height mobile 393x430. Interactive synthetic receipt and no-login downloader demos; fixture controls for theme, long labels, account/service configuration. No backend behaviors implied. Include a form/long content to test scroll clearance. Independent package consumption (demo imports package exports/built dist, not unpublished source alias).
Docker dev/build/static-demo instructions; reproducible lockfile; CI with checks/build/unit/browser/visual artifacts; no remote publishing/deployment. MIT suggested but not selected: do not add an unapproved license. Keep package private for now.

## Acceptance and tests
Vitest pure navigation/config contracts; Playwright real built demo in Chromium/Firefox/WebKit for behavior, canonical Chromium screenshot comparisons. @axe-core/playwright checks plus keyboard interaction assertions. Pinned matching official Playwright Docker image for canonical visual comparisons; stable data/fonts/reduced motion. Viewports 360x740, 393x873, 873x393, 1280x800, 1440x900 plus breakpoint +/-1. Light/dark, both configs, long labels, drawer open, service/account absent/present, zero badges.
Layout invariants: no horizontal page overflow; >=44px nav targets; content can scroll clear of mobile bar and be clicked; long labels don't overlap badges; every permitted destination reachable; resizing releases drawer scroll lock. Drawer tests focus trap/return, Escape/backdrop, body inert, unmount cleanup. Route tests nested/exact/segment matching, modifiers and zero badges, reactive permission removal and mobile ID filtering.
Baselines are committed and reviewed; normal checks fail on absent/changed snapshots and never update them. Separate explicit update command. Upload expected/actual/diff + traces on CI failures; initial generated images are provisional until human reviewed. Report any changed tests/tolerances/skips/baselines. Prove selected tests detect deliberately injected temporary regressions and restore code.
Package smoke: build and npm pack; import in independent fixture outside source tree; ensure emitted Svelte and theme are included. No guarantee every defect is caught; real phone/software keyboard checks documented manual acceptance.

## Approaches
Chosen: composed shell with narrow API and independent theme. Separate public layout primitives rejected initially (apps duplicate coordination). Cross-service full navigation chosen to retain independent deployments; shared task components and unified frontend deferred.

## Builder decisions
Choose exact type/property names, modest file boundaries and dependency versions after checking compatibility. Prefer Melt if compatible and behavior meets requirements; document evidence if choosing native dialog instead. Do not introduce parallel overlapping stacks. SSR import/render must not access browser globals at module initialization.
