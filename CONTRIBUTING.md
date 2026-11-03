# Contributing

Keep changes local and the package private. Preserve app boundaries; do not introduce backend behavior, publish, choose a license, or deploy as part of UI work.

Run `npm ci`, then `npm run dev`. The package watcher writes built exports and Vite reloads the consuming demo. For a change, add a test for the observable break first; run `npm run verify` before review. `test:consumer` packs the real package and installs it into a fresh temporary directory, builds a standalone app, and SSR-renders it without browser globals. It requires npm registry/cache access and removes its fixture afterward.

## Canonical screenshots

Playwright and its image must both remain **1.63.0**. Screenshot references use Chromium on `mcr.microsoft.com/playwright:v1.63.0-noble`, deterministic system fonts, en-US locale, Europe/Berlin timezone, reduced motion and fixed data. No external media is loaded. Do not update references on the host or from Firefox/WebKit. The focused 18-image matrix covers both apps, light/dark, long labels, services/account present/absent, zero badges, open drawers, short-height mobile, form content, and the desktop breakpoint. Behavior tests cover all specified viewports plus 767/768/769 px and 393x430 short mobile.

From this repository root on Linux:

```sh
# Compare (missing references fail; this command does not create them).
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e CI=1 -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run verify

# Explicit reference update only after deciding the visual change is intended.
docker run --rm --ipc=host --user "$(id -u):$(id -g)" \
  -e HOME=/tmp -e CI=1 -v "$PWD:/work" -w /work \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run test:visual:update
```

The mounted commands require Linux-compatible `node_modules` from `npm ci`. Docker Compose's test service alternatively installs dependencies in its image and exports reports. Compose containers may create report files as root; use the mounted command above to preserve host ownership. Do not add automatic baseline updates to CI. The config defaults to `updateSnapshots: 'none'`; the separate update command is the sole intended write path.

Review every new/changed PNG in `tests/screenshots/` at native size: content clearance, wraps, badges, selected state, focus, drawer reachability and neutral theme contrast. Run comparison again after update. Commit references with the change; include expected/actual/diff and trace evidence when discussing failures. Initial generated references are **provisional until the user reviews them**. No custom pixel tolerance, masked regions, disabled axe rules or skipped tests are currently used. A passing image comparison only detects changes from the reference; geometry and interaction assertions protect behavior independently.

## Manual acceptance before adopting in a real app

- Review both apps at 360x740, 393x873, 873x393, 1280x800, 1440x900, and 767/768/769 widths, with long labels and both themes.
- On a real phone, check portrait/landscape, browser chrome collapse, notch/home indicator safe areas, and thumb reach. Check the last control can scroll clear of the bottom bar.
- Open a form and the software keyboard; check inputs, drawer scrolling and close controls remain usable. The 393x430 automated case approximates reduced height but cannot emulate an actual keyboard or visual viewport behavior.
- Check touch, Tab/Shift+Tab, skip link, focus visibility, focus trap/return, Escape, backdrop dismissal, route close, screen-reader dialog/nav names, zoom and enlarged text.
- Verify actual consumer router integration, Back/Forward and modified link clicks; verify server authorization independently of link visibility.

Accessibility scans are automated assistance, not a complete accessibility audit. The package is ready for local review; real-device acceptance and a license/hosting decision remain separate work.
