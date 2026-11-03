import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
export function compareVersions(a, b) {
  if (!stableVersion.test(a) || !stableVersion.test(b)) throw new Error('Invalid stable version');
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return left[i] - right[i];
  return 0;
}
export function highestPublishedVersion(metadata) {
  if (metadata === null) return null;
  if (!metadata.versions || typeof metadata.versions !== 'object') throw new Error('Invalid npm metadata');
  return Object.keys(metadata.versions).filter(v => stableVersion.test(v)).sort(compareVersions).at(-1) ?? null;
}
export function packageIntegrity(tarball) {
  return `sha512-${createHash('sha512').update(tarball).digest('base64')}`;
}
export async function readRegistry(path = '') {
  const response = await fetch(`https://registry.npmjs.org/@tendstead%2fui${path}`, {
    signal: AbortSignal.timeout(20_000), headers: { 'cache-control': 'no-cache' },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry returned ${response.status}`);
  return response.json();
}
export async function getRegistryVersion() {
  return highestPublishedVersion(await readRegistry());
}
export function npmPublishEnvironment(sourceSha, environment = process.env) {
  if (!/^[a-f0-9]{40}$/.test(sourceSha ?? '')) throw new Error('Invalid npm source SHA');
  // npm's automatic provenance takes its source material revision from
  // GITHUB_SHA. A coalesced run or retry can build a different main revision
  // from the triggering event; retain the real run/workflow identity.
  return { ...environment, GITHUB_SHA: sourceSha };
}
export async function ensureNpmPublished({ version, tarball, tarballPath,
  readVersion = () => readRegistry(`/${version}`),
  publish = path => execFileSync('npm', ['publish', path, '--access', 'public', '--ignore-scripts', '--registry', 'https://registry.npmjs.org/'], {
    stdio: 'inherit', env: npmPublishEnvironment(process.env.RELEASE_SHA),
  }),
}) {
  if (!stableVersion.test(version)) throw new Error('Invalid release version');
  const integrity = packageIntegrity(tarball);
  let existing = await readVersion();
  if (existing === null) {
    await publish(tarballPath);
    existing = await readVersion();
  }
  if (existing?.dist?.integrity !== integrity) {
    throw new Error(`${version} has a different package in npm, or publication is not visible yet. Refusing to complete the GitHub release.`);
  }
}
