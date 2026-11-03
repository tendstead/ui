import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ensureNpmPublished, packageIntegrity } from './npm-release.mjs';

export async function verifyReleaseTag({ github, repo, tag, sha }) {
  let object;
  try {
    object = (await github.rest.git.getRef({ ...repo, ref: `tags/${tag}` })).data.object;
  } catch (error) {
    if (error.status === 404) return;
    throw error;
  }
  for (let depth = 0; object.type === 'tag' && depth < 8; depth++) {
    object = (await github.rest.git.getTag({ ...repo, tag_sha: object.sha })).data.object;
  }
  if (object.type !== 'commit' || object.sha !== sha) throw new Error(`${tag} points at different source code`);
}

export default async function publish({ github, context, artifactDirectory = '/tmp', publishNpm = ensureNpmPublished }) {
  const repo = context.repo;
  const version = process.env.RELEASE_VERSION;
  if (!/^\d+\.\d+\.\d+$/.test(version ?? '')) throw new Error('Invalid release version');
  const tag = `v${version}`;
  const filename = `tendstead-ui-${version}.tgz`;
  const data = await readFile(join(artifactDirectory, filename));
  const notes = await readFile(join(artifactDirectory, 'tendstead-release-notes.md'), 'utf8');
  const sha = process.env.RELEASE_SHA;
  if (!/^[a-f0-9]{40}$/.test(sha ?? '')) throw new Error('Invalid release source SHA');
  const integrity = packageIntegrity(data);
  await verifyReleaseTag({ github, repo, tag, sha });
  const state = { sha, integrity };
  const body = `${notes}\n<!-- tendstead-release:${JSON.stringify(state)} -->`;
  const releases = await github.paginate(github.rest.repos.listReleases, { ...repo, per_page: 100 });
  let release = releases.find(r => r.tag_name === tag);
  if (release && !release.draft) throw new Error(`${tag} is already published; refusing to replace it`);
  if (release) {
    const marker = /<!-- tendstead-release:(.*?) -->/.exec(release.body ?? '');
    if (!marker) throw new Error('Existing draft is not managed by this workflow');
    const previous = JSON.parse(marker[1]);
    if (previous.sha !== sha || previous.integrity !== integrity) throw new Error('Retry source or package differs from the pending release');
  }
  const fields = { ...repo, tag_name: tag, target_commitish: process.env.RELEASE_SHA, name: tag, body, draft: true };
  if (release) {
    release = (await github.rest.repos.updateRelease({ ...fields, release_id: release.id })).data;
    for (const asset of release.assets) {
      if (asset.name === filename) await github.rest.repos.deleteReleaseAsset({ ...repo, asset_id: asset.id });
    }
  } else release = (await github.rest.repos.createRelease(fields)).data;
  await github.rest.repos.uploadReleaseAsset({ ...repo, release_id: release.id, name: filename, data,
    headers: { 'content-type': 'application/gzip', 'content-length': data.length } });
  await publishNpm({ version, tarball: data, tarballPath: join(artifactDirectory, filename) });
  await verifyReleaseTag({ github, repo, tag, sha });
  await github.rest.repos.updateRelease({ ...repo, release_id: release.id, draft: false, make_latest: 'true' });
}
