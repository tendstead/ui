import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writeFile, rm, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import publish from '../../scripts/publish-release.mjs';

let artifactDirectory: string;
beforeEach(async () => { artifactDirectory = await mkdtemp(join(tmpdir(), 'ui-release-test-')); });
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(artifactDirectory, { recursive: true, force: true });
});

describe('GitHub release publication', () => {
  it('does not make a release public if the artifact upload fails', async () => {
    vi.stubEnv('RELEASE_VERSION', '98.0.0');
    vi.stubEnv('RELEASE_SHA', 'a'.repeat(40));
    await writeFile(join(artifactDirectory, 'tendstead-ui-98.0.0.tgz'), 'test artifact');
    await writeFile(join(artifactDirectory, 'tendstead-release-notes.md'), 'test notes');
    const visibility: boolean[] = [];
    const github = {
      paginate: async () => [],
      rest: { git: { getRef: async () => { throw Object.assign(new Error("not found"), { status: 404 }); } }, repos: {
        listReleases: () => {},
        createRelease: async (input: { draft: boolean }) => {
          visibility.push(input.draft);
          return { data: { id: 1 } };
        },
        uploadReleaseAsset: async () => { throw new Error('Upload failed'); },
        updateRelease: async (input: { draft: boolean }) => { visibility.push(input.draft); },
      } },
    };
    await expect(publish({ publishNpm: async () => {}, github, artifactDirectory, context: { repo: { owner: 'test', repo: 'ui' } } })).rejects.toThrow('Upload failed');
    expect(visibility).toEqual([true]);
  });
  it('uploads the package before publishing and refuses to replace a public release', async () => {
    vi.stubEnv('RELEASE_VERSION', '98.0.0');
    vi.stubEnv('RELEASE_SHA', 'a'.repeat(40));
    await writeFile(join(artifactDirectory, 'tendstead-ui-98.0.0.tgz'), 'test artifact');
    await writeFile(join(artifactDirectory, 'tendstead-release-notes.md'), 'test notes');
    const events: string[] = [];
    let releases: { tag_name: string; draft: boolean }[] = [];
    const github = {
      paginate: async () => releases,
      rest: { git: { getRef: async () => { throw Object.assign(new Error("not found"), { status: 404 }); } }, repos: {
        listReleases: () => {},
        createRelease: async () => { events.push('draft'); return { data: { id: 1 } }; },
        uploadReleaseAsset: async () => { events.push('upload'); },
        updateRelease: async () => { events.push('publish'); },
      } },
    };
    const context = { repo: { owner: 'test', repo: 'ui' } };
    await publish({ publishNpm: async () => { events.push('npm'); }, github, context, artifactDirectory });
    expect(events).toEqual(['draft', 'upload', 'npm', 'publish']);
    releases = [{ tag_name: 'v98.0.0', draft: false }];
    await expect(publish({ publishNpm: async () => {}, github, context, artifactDirectory })).rejects.toThrow('already published');
    expect(events).toEqual(['draft', 'upload', 'npm', 'publish']);
  });
  it('keeps the GitHub release in draft if npm fails', async () => {
    vi.stubEnv('RELEASE_VERSION', '98.0.0');
    vi.stubEnv('RELEASE_SHA', 'a'.repeat(40));
    await writeFile(join(artifactDirectory, 'tendstead-ui-98.0.0.tgz'), 'test artifact');
    await writeFile(join(artifactDirectory, 'tendstead-release-notes.md'), 'notes');
    let madePublic = false;
    const github = {
      paginate: async () => [],
      rest: { git: { getRef: async () => { throw Object.assign(new Error("not found"), { status: 404 }); } }, repos: {
        listReleases: () => {},
        createRelease: async () => ({ data: { id: 1 } }),
        uploadReleaseAsset: async () => {},
        updateRelease: async () => { madePublic = true; },
      } },
    };
    await expect(publish({ github, context: { repo: { owner: 'test', repo: 'ui' } }, artifactDirectory,
      publishNpm: async () => { throw new Error('OIDC rejected'); },
    })).rejects.toThrow('OIDC rejected');
    expect(madePublic).toBe(false);
  });
});
