# @tendstead/ui

Svelte 5 / TypeScript shell for independent Tendstead tools. This is a working package and synthetic demo, with no backend, authentication, or live downloads. Licensed under the [MIT License](LICENSE).

```sh
npm ci
npm run dev                 # http://localhost:5173; watches package + demo
npm run build               # dist package + demo-dist static demo
npm run preview             # built demo, port 4173 by default
```

Requires Node 22 and Svelte >=5.20. The demo consumes the package's built exports, as an independent app would. Source changes rebuild `dist` in dev mode. Demo links update history; Back/Forward work. Try `/?app=downloader` or `/?theme=dark&long=1&services=1&account=1`. `route=/receipts/review/42`, `controls=1`, `admin=1`, and `denied=1` provide deterministic fixtures. Add `accountForm=1&account=1` to exercise consumer account labels and explicit input IDs. Expand Demo configuration for reactive controls. Receipt Menu includes Collections and Statistics under Explore, a zero-badge Review queue, and optional Administration (`admin=1` or its fixture control). Connected-service examples are synthetic Shopping list (receipts) and Media library (downloader) links supplied by the demo, with no package-owned catalog. All sample data and actions stay local.

## Use in an app

Build and `npm pack` locally, then install the resulting tarball in your app. Import the theme explicitly; no Tailwind, reset or SvelteKit required.

```svelte
<script lang="ts">
  import { AppShell, type Destination } from '@tendstead/ui';
  import '@tendstead/ui/theme.css';
  let pathname = $state('/'); // supply this from your app's router
  const destinations: Destination[] = [
    { id: 'overview', label: 'Overview', href: '/', match: 'exact' },
    { id: 'receipts', label: 'Receipts', href: '/receipts', badge: 0 },
    { id: 'settings', label: 'Settings', href: '/settings' },
  ];
</script>
<AppShell brand="Tendstead" appLabel="Receipts" pageTitle="Overview"
  {pathname} {destinations} mobilePrimaryIds={['overview', 'receipts']}
  primaryAction={{ id: 'add', label: 'Add', onclick: () => {} }}>
  {#snippet pageActions()}<button type="button">Export</button>{/snippet}
  <p>Your app content.</p>
</AppShell>
```

The package exports `AppShell` and `AppShellProps`, `Destination`, `NavigationGroup`, `ServiceLink`, `PrimaryAction`, `ShellIcon` types. Destinations have unique IDs and optional app-supplied Svelte icon components, `groupId`, `badge` (including zero), `visible`, `permitted` and `match: 'exact' | 'prefix'`. Supply `groups={[{id:'manage',label:'Manage'}]}` to label groups. Active matching expects root-relative destination paths such as `/receipts`; the most specific segment-aware route wins, and query/hash are ignored. Relative hrefs are allowed for navigation but are not resolved against the current route for active matching. Filtered or unknown mobile IDs disappear; every permitted destination remains in Menu. Keep primary IDs to a small curated set. Primary actions support `href` or `onclick`; account and pageActions are optional Svelte snippets.

Links use normal browser navigation. For client routing, supply `onNavigate={(event, destination) => { event.preventDefault(); router.goto(destination.href); }}` and feed the current pathname back to the shell. The callback runs for ordinary left clicks only; modified clicks retain browser behavior. The shell does not intercept unrelated content links. Apps own route transitions, data, authorization and document titles.

Optional connected services use ordinary same-tab anchors:

```ts
const serviceLinks = [
  { id: 'shopping', label: 'Shopping list', href: 'https://shopping.example.test/' },
  // Only include an admin service if this app's trusted configuration permits it.
];
```

Pass `serviceLinks` to the shell. Empty is the default, with no placeholder section. Services appear in the sidebar and complete mobile menu, never primary tabs. The shell does no discovery, probing, credential sharing or server communication. Visible/permitted flags only control presentation: each destination server must authorize access. Unsafe obvious non-navigation protocols are omitted. App configuration and contextual handoff/return paths remain app responsibilities.

## Theme and layout

Set `data-theme="dark"` or `data-theme="light"` on an ancestor. Override `--ts-primary`, `--ts-on-primary`, `--ts-nav`, `--ts-on-nav`, `--ts-selection`, `--ts-on-selection`, `--ts-surface`, `--ts-surface-subtle`, `--ts-text`, `--ts-muted`, `--ts-border`, `--ts-focus`, and `--ts-font` there. Defaults use neutral surfaces and purple `#6750A4`; token changes need contrast review. Theme CSS applies shell geometry and box sizing inside the shell; ordinary content links retain app/browser styling. No external fonts or images are fetched.

Desktop sidebar starts at 768 CSS px. It stays within the viewport while the document scrolls, and its own scroll area is keyboard focusable for short screens and long destination maps. Smaller layouts use primary navigation and a complete modal drawer with focus trapping/return, Escape/backdrop dismissal, inert background, scroll lock, and resize/unmount cleanup. Bottom clearance follows the measured navigation height; safe areas are included. Your content must still wrap responsibly.

## Docker

```sh
docker compose up --build dev    # http://localhost:5173; source + demo watched
docker compose up --build demo   # http://localhost:8080; static demo, SPA fallback
docker compose run --build --rm test
```

`Dockerfile` provides dev, build and static demo targets; `Dockerfile.test` uses `mcr.microsoft.com/playwright:v1.63.0-noble`, matching pinned Playwright 1.63.0. No image is pushed or deployed. For canonical visual changes and ownership-preserving mounted test runs, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Verify

```sh
npm run check
npm run test:unit          # navigation/config contracts
npm run test:consumer      # npm pack -> independent temp app build + SSR
npm run test:browser       # Chromium, Firefox, WebKit
npm run test:visual        # Chromium reference comparisons; never updates
npm run verify            # all above, plus package/demo build
```

Install browser binaries with `npx playwright install --with-deps` for host behavior runs. Use the canonical container for screenshot comparisons. CI runs the same full verification and retains HTML reports, traces, screenshot actual/diff files, and references. Initial automated baselines are provisional pending human design review. Automated accessibility and browser checks do not replace real phone, safe-area, touch or software-keyboard testing. See [CONTRIBUTING.md](CONTRIBUTING.md) for manual acceptance and baseline review.

Configuration may change while a drawer is open. When an app removes a focused navigation destination or account snippet, focus recovers inside the dialog; the standard modal close still returns focus to Menu.
