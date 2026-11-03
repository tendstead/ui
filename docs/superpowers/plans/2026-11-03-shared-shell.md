# Tendstead Shared Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a reusable composed navigation shell, two demos and regression protection.
**Architecture:** Svelte package with a framework-independent destination model and theme; real demo consumes built exports. Playwright verifies real browser layout, behavior and appearance.
**Tech Stack:** Svelte 5, TypeScript, plain CSS, Vite, Vitest, Playwright, axe, Docker.
**Spec:** ../specs/2026-11-03-shared-shell-design.md

## Global Constraints
- Neutral navigation with purple accents, light primary #6750A4; deliberate light/dark palettes.
- Svelte 5; no SvelteKit, backend, Tailwind/reset dependency or app-specific knowledge.
- One destination registry, mobile references IDs; optional services and accounts; zero badges remain visible.
- No publishing, production app changes, external messaging or license selection. Package remains private.
- Viewports: 360x740, 393x873, 873x393, 1280x800, 1440x900; breakpoint +/-1.
- Normal visual checks never update snapshots; initial references require human review.

## Review Focus
- Configuration changes while drawer open: no stale destinations/focus/scroll lock.
- Nested routes and encoded/query/hash URLs: only intended destination marked current.
- Long text at reduced width/height: usable links, no badge overlap or covered content.
- Consumer styling/SSR: no global reset leakage or browser-only imports.
- Optional integrations absent: no dead or empty service/account UI.

### Task 1: Shared shell and consumer demo
**Files:** package.json/lockfile, build/check configs, src/lib/{index.ts,types.ts,navigation.ts,theme.css,AppShell.svelte}, focused private components, demo/*, tests/unit/navigation.test.ts, initial tests/browser/shell.spec.ts, playwright.config.ts, vitest.config.ts.
**Interfaces:** Produces public AppShell + typed configuration and built package imports. Demo selected by ?app=receipts|downloader and scenario query params documented in report.
- [ ] Install/check compatible pinned dependencies; evaluate Melt manifest/docs and record decision.
- [ ] Write navigation contract tests first; run red; implement pure helpers and run green.
- [ ] Establish runnable minimal consumer fixture and failing browser behavior test; implement shell incrementally with test-first behavior checks.
- [ ] Implement complete accessible responsive shell, optional services/account, route state and styling as spec.
- [ ] Implement both interactive synthetic demos consuming built exports and exports/theme smoke check.
- [ ] Run check/build/unit/initial Chromium browser suite; record evidence and limitations in report.
- [ ] Self-review; commit if Git available; report exact public API and scenario URLs for Task 2.

### Task 2: Layout regression protection and delivery
**Files:** tests/browser/{layout,drawer,accessibility,visual}.spec.ts, tests/fixtures/*, tests/screenshots/*, Dockerfile*, compose.yaml, .dockerignore, .github/workflows/ci.yml, README.md, CONTRIBUTING.md, package scripts/config updates and consumer smoke script. May fix shell only for proven failures.
**Interfaces:** Consumes Task 1 public API and demo query contract. Produces test:unit/test:browser/test:visual/test:visual:update/verify scripts and Docker dev/demo/test services; CI same scripts.
- [ ] Add failing invariant/interaction tests first, then any minimal shell corrections; preserve test-first evidence.
- [ ] Cover spec viewports/scenarios; cross-browser behavior, focused deterministic Chromium snapshots, axe and keyboard tests. Include reactive changes and breakpoint drawer cleanup.
- [ ] Run explicit baseline generation in pinned canonical container only; inspect images. If Docker unavailable report exact limitation; do not pass off host snapshots as canonical.
- [ ] Inject temporary covered-content and focus/route regressions; confirm owning tests fail; restore and run green.
- [ ] Add reproducible Docker dev/build/static demo and CI reporting. Match Playwright package/image versions; normal CI fails missing screenshots.
- [ ] Add independent npm pack consumer smoke and SSR check; document API snippets, theme/routing/service integration, test commands, baseline review and manual phone checks.
- [ ] Run full verification; report test/browser counts, image review and remaining constraints; commit if Git available.

### Final review and lead verification
- [ ] Independent whole-project review against spec, tests and consumer boundaries; fix important findings with regression tests and scoped review.
- [ ] Run full checks and review generated screenshots; report exact evidence and remaining human baseline/phone review.
