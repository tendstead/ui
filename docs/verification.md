# Verification record — 2026-11-03

Before the final review fixes, the lead rebuilt `Dockerfile.test` from the working tree after implementation and ran:

```sh
docker build -f Dockerfile.test -t tendstead-ui-test:review .
docker run --rm --ipc=host tendstead-ui-test:review
```

The container runs `npm run verify` with pinned Playwright 1.63.0 and matching official browser image. Those pre-fix results: exit 0; Svelte check 0 errors/0 warnings; library and demo build; 6 unit tests; independent packed-tarball consumer browser build and SSR; 105 behavior/layout/accessibility tests (35 each in Chromium, Firefox, WebKit); 18 Chromium visual comparisons.

The implementer separately ran the mounted canonical environment and a fresh standalone test image with the same passing results. Docker dev package watching and static-demo SPA navigation were exercised. CI configuration is present but has not run on GitHub.

## Final review fix verification

After correcting viewport sidebar scrolling and duplicate account snippet IDs, the implementer ran the full final `npm run verify` in the mounted canonical `mcr.microsoft.com/playwright:v1.63.0-noble` environment with `--ipc=host --user 1000:1000`, HOME=/tmp and CI=1. Result: **exit 0**, Svelte check **0 errors/0 warnings**, package/demo build, unit **6/6**, independent packed consumer build/SSR, browser behavior/layout/accessibility **114/114** (**38 per engine**), and normal visual comparisons **18/18**. Three new regression cases account for the increase from 105 to 114 browser tests. Compose configuration, helper script syntax and `git diff --check` also passed.

The desktop sidebar now stays within the viewport while app content scrolls. Its named, focusable overflow area supports native keyboard scrolling without shrinking navigation targets. A narrow Svelte compiler annotation permits tabindex on this actual scroll area; no axe rule is disabled. The account snippet is mounted once while switching between sidebar and drawer. `accountForm=1&account=1` exercises an ordinary consumer label and explicit input ID; the original `account=1` button fixture remains unchanged. README now states that active matching expects root-relative destination paths; relative navigation hrefs are not route-resolved for matching.

An explicit canonical `npm run test:visual:update` preceded the normal comparison run. Six references changed intentionally: `downloader-desktop.png`, `receipts-above-breakpoint.png`, `receipts-at-breakpoint.png`, `receipts-desktop.png`, `receipts-landscape.png`, and `receipts-wide-dark-long.png`. The implementer inspected each changed composition at native size plus a contact sheet. Sidebar overflow in short/long maps is intentional and tested for reachability. All other references, including the mobile bar/drawer captures, remained byte-identical. Reference ownership is 1000:1000. These observations are automated implementation review, not owner design approval.

## Tests shown to detect regressions

- New sidebar regressions failed before the fix: scrolling app content put the sidebar top at **-573 px** (1280x800) and **-1001 px** (873x393). Both now pass in all engines, including native End-key scrolling, service/account click reachability without changing document scroll, and return to primary navigation.
- New explicit account-ID regression failed before the fix with **2** inputs for one ID when Menu opened. It now passes in all engines: exactly one ID while open/closed and across repeated 767↔768 transitions; the visible label focuses the visible input; Escape still returns focus to Menu.
- Removing app-content link styling isolation failed its browser assertion; scoped shell styling restored it.
- Removing a focused account snippet while a drawer was open failed focus containment; detached-focus recovery restored it in all three engines.
- Temporarily making the mobile bar 80vh failed the last-content-action clearance assertion; the change was restored.
- Temporarily omitting the app navigation callback failed route/drawer focus restoration; the change was restored.
- Temporarily removing a reference screenshot failed the normal visual command and did not recreate the reference; the reference was restored.

No tests skipped, axe rules excluded, screenshot regions masked or custom image-diff tolerances added.

## Visual and manual acceptance

Independent whole-project review found two usability issues beyond the initial suite: document-height desktop navigation and duplicate account snippet IDs. Both were reproduced with failing browser tests, fixed in `fcc6244`, and approved in a scoped re-review. The lead then rebuilt the final test image and repeated full verification: exit 0, 6 unit tests, 114 cross-browser tests, 18 visual comparisons, check/build and independent packed consumer/SSR passed. A live Chromium smoke check of the final local static demo passed account label focus/ID uniqueness and downloader interaction.

Canonical reference images are committed in `tests/screenshots/`. The lead inspected representative desktop/mobile, dark long-label drawer and reduced-height drawer captures; the implementer inspected all 18 compositions. These references remain provisional until the owner reviews the design. Ordinary visual tests compare but never update them; use the separate explicit container update workflow in CONTRIBUTING.md.

Real phone safe areas, screen reader behavior, text zoom, touch and software-keyboard checks remain manual. App-specific router and server authorization integrations require testing in each consumer. Automated checks do not guarantee every visual or accessibility defect is caught.

The dependency audit reported three low-severity development-tool findings with no available fix; no forced dependency updates were made. The package remains private pending a separate license/publication decision.
