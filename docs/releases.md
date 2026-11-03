# Releases

PRs select exactly one `release:*` label. Merging `release:patch`,
`release:minor`, or `release:major` into `main` requests an automatic public
GitHub release and an npm package, using the same verified tarball. `release:none` does not request
a release. All source changes on the branch ship with the next release,
including changes from `release:none` PRs.

The initial npm package `0.1.0` was published manually. Automation starts above
the highest stable version already published on npm or GitHub and uses the highest impact of
all release-labelled PRs since the previous published release. During `0.x`,
use minor for breaking changes and provide migration notes in the PR.
`release:major` is rejected during `0.x`; graduation to `1.0` is a separate,
intentional policy change. Patch means a compatible fix. After `1.0`, major
means a breaking change.

## Automatic publication

1. Checkout current `main` and find merged PRs since the last published version.
2. Calculate the version and prepare release notes from PR titles and numbers.
3. Set that version in the local package and lockfile, without committing to `main`.
4. Run the full `npm run verify` suite in the canonical Playwright container.
5. Pass the verified tarball and notes through an immutable Actions artifact to a
   separate publishing job. Build/test jobs have read-only repository access and no npm publishing identity.
   A separate metadata-only planner has write access because GitHub hides drafts
   from read-only callers. It never installs dependencies or runs package scripts.
6. In the `npm` environment on `main`, upload the package to a temporary GitHub
   draft, recording its source SHA and package integrity for recovery.
7. Publish that exact tarball to npm using OIDC, without running package scripts.
8. Confirm npm reports the same package integrity and any existing tag points to
   the verified source, then publish the GitHub release.
9. Dispatch one more scan of `main` to drain any changes merged during recovery.
   A scan with no release changes stops without dispatching again.

Releases are serialized. If GitHub coalesces pending workflow runs, the next
run collects all intervening PRs and uses their highest impact. The tag points
to the source commit that was verified; the tarball has the calculated release
version. `main` keeps its development package version (`0.0.1` initially), so
published stable versions on npm and GitHub determine the next version.
This avoids automated commits and bypassing branch protection. Build a release
locally by checking out its tag and setting the version from the tag before
packing; a raw source checkout retains the development version.

Install a downloaded release artifact in a consuming app:

```sh
npm install @tendstead/ui
# Or install a downloaded GitHub release artifact:
npm install ./tendstead-ui-0.1.1.tgz
```

No Docker image is published and no app is deployed. The npm package is public.
A GitHub release inherits the visibility of its repository.

## Repository setup

The workflows use the automatic `GITHUB_TOKEN` and OIDC identity; no npm token
or personal access token is needed. Repository
and organization Actions policy must allow the declared `contents: write` and
`issues: write` permissions. Create release labels once using Actions → Set up release labels → Run workflow,
or create them manually in Issues → Labels. Release runs do not create labels. Unlabelled
historical PRs are ignored for versioning and release notes.

Make Release label / release-label and the existing verification job required
checks in branch rules if you want GitHub to block invalid PRs. Workflow files
alone cannot enforce branch rules. Direct pushes have no release label and
should be reserved for repository setup; use PRs for release decisions.

## npm and GitHub configuration

Configure the npm trusted publisher with GitHub organization `tendstead`,
repository `ui`, workflow filename `release.yml`, environment `npm`, and direct
`npm publish` allowed. GitHub's `npm` environment must permit only the branch
`main`. Leave environment reviewers unset to preserve automatic publication.
The publishing job declares `environment: npm` and `id-token: write`. It also
requests `actions: write` solely to dispatch the follow-up scan. The npm
subprocess receives the verified source SHA for its provenance source revision,
while preserving the actual workflow run identity.

The publisher installs npm CLI `11.19.0` explicitly for OIDC support. Actions
are pinned to full commit hashes. Release jobs do not restore dependency caches;
the publisher does not install the library's dependencies or run its lifecycle
scripts. Keep branch rules and repository write access restricted to trusted
maintainers. Do not add repository publishing tokens.

npm trusted publisher connections must complete a successful publish within
2 days of configuration; recreate an expired connection before retrying.
After successful setup, npm's "Require two-factor authentication and disallow
tokens" publishing access setting is compatible with OIDC.

## Failure and retry

Verification failures publish nothing. A failure during publication may leave
an unpublished GitHub draft. The planner resumes that draft's original version
and source SHA, even if `main` advances or npm already has the version. It
rebuilds and verifies the source, and refuses to continue if the tarball differs
from the draft's recorded integrity. Missing or multiple ambiguous draft states
need investigation rather than guessing a new version.

If npm already contains the version, the publisher skips uploading only when
npm's integrity matches the verified tarball. A version containing different
bytes fails; it is never overwritten. Registry errors fail the release rather
than being interpreted as an absent version. The GitHub release becomes public
only after npm publication and integrity verification succeed.

Run Release package manually on `main` to recover a failure. Do not manually
publish or delete the temporary draft; it records pending publication state.
After successful publication, the workflow automatically dispatches another
scan to process changes merged since that source revision. If dispatch itself
fails, manually run Release package again on `main`.

If recovery requires changing build inputs in the original source revision,
investigate the pending npm version before abandoning the draft. An npm version
cannot be replaced. Published releases are never silently changed by the workflow.
