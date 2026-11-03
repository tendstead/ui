# Verification record — 2026-11-03

The lead rebuilt `Dockerfile.test` from the working tree after implementation and ran:

```sh
docker build -f Dockerfile.test -t tendstead-ui-test:review .
docker run --rm --ipc=host tendstead-ui-test:review
```

The container runs `npm run verify` with pinned Playwright 1.63.0 and matching official browser image. Results: exit 0; Svelte check 0 errors/0 warnings; library and demo build; 6 unit tests; independent packed-tarball consumer browser build and SSR; 105 behavior/layout/accessibility tests (35 each in Chromium, Firefox, WebKit); 18 Chromium visual comparisons.

The implementer separately ran the mounted canonical environment and a fresh standalone test image with the same passing results. Docker dev package watching and static-demo SPA navigation were exercised. CI configuration is present but has not run on GitHub.

## Tests shown to detect regressions

- Removing app-content link styling isolation failed its browser assertion; scoped shell styling restored it.
- Removing a focused account snippet while a drawer was open failed focus containment; detached-focus recovery restored it in all three engines.
- Temporarily making the mobile bar 80vh failed the last-content-action clearance assertion; the change was restored.
- Temporarily omitting the app navigation callback failed route/drawer focus restoration; the change was restored.
- Temporarily removing a reference screenshot failed the normal visual command and did not recreate the reference; the reference was restored.

No tests skipped, axe rules excluded, screenshot regions masked or custom image-diff tolerances added.

## Visual and manual acceptance

Canonical reference images are committed in `tests/screenshots/`. The lead inspected representative desktop/mobile, dark long-label drawer and reduced-height drawer captures; the implementer inspected all 18 compositions. These references remain provisional until the owner reviews the design. Ordinary visual tests compare but never update them; use the separate explicit container update workflow in CONTRIBUTING.md.

Real phone safe areas, screen reader behavior, text zoom, touch and software-keyboard checks remain manual. App-specific router and server authorization integrations require testing in each consumer. Automated checks do not guarantee every visual or accessibility defect is caught.

The dependency audit reported three low-severity development-tool findings with no available fix; no forced dependency updates were made. The package remains private pending a separate license/publication decision.
