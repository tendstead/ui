import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { releaseImpact, nextVersion } from './release-policy.mjs';
import { compareVersions, getRegistryVersion as registryVersion } from './npm-release.mjs';

export default async function plan({ github, context, core, cwd = process.cwd(), notesPath = '/tmp/tendstead-release-notes.md', getRegistryVersion = registryVersion }) {
  const repo = context.repo;
  const releases = await github.paginate(github.rest.repos.listReleases, { ...repo, per_page: 100 });
  const previous = releases.filter(r => !r.draft && !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
    .sort((a, b) => compareVersions(b.tag_name.slice(1), a.tag_name.slice(1)))[0];
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd }).trim();
  const pending = releases.filter(r => r.draft && r.body?.includes('<!-- tendstead-release:'));
  if (pending.length > 1) throw new Error('Multiple pending automated releases; resolve them before continuing.');
  if (pending.length) {
    const draft = pending[0];
    const match = /<!-- tendstead-release:(.*?) -->/.exec(draft.body);
    if (!match) throw new Error('Invalid pending release state');
    const state = JSON.parse(match[1]);
    if (!/^v\d+\.\d+\.\d+$/.test(draft.tag_name) || !/^[a-f0-9]{40}$/.test(state.sha)) throw new Error('Invalid pending release state');
    // A retry must finish the same source revision, even if main has advanced.
    execFileSync('git', ['merge-base', '--is-ancestor', state.sha, sha], { cwd });
    await writeFile(notesPath, draft.body.replace(/\n<!-- tendstead-release:.*? -->/, ''));
    core.setOutput('version', draft.tag_name.slice(1));
    core.setOutput('sha', state.sha);
    return;
  }
  const range = previous ? `${previous.tag_name}..${sha}` : sha;
  const commits = execFileSync('git', ['log', '--first-parent', '--format=%H', range], { encoding: 'utf8', cwd }).trim().split('\n').filter(Boolean);
  const pulls = new Map();
  for (const commit_sha of commits) {
    const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, { ...repo, commit_sha, per_page: 100 });
    for (const pr of associated) {
      if (pr.merged_at && pr.base.ref === 'main' && commits.includes(pr.merge_commit_sha)) pulls.set(pr.number, pr);
    }
  }
  const impacts = [];
  const notes = [];
  for (const pr of pulls.values()) {
    const labels = pr.labels.map(l => l.name);
    // Existing history before adoption can have no release label.
    if (!labels.some(label => label.startsWith('release:'))) continue;
    const impact = releaseImpact(labels);
    impacts.push(impact);
    if (impact !== 'none') {
      const title = pr.title.replace(/[\\`*_{}\[\]<>#@]/g, '\\$&');
      notes.push(`- ${title} (#${pr.number}) — ${impact}`);
    }
  }
  if (!impacts.some(impact => impact !== 'none')) { core.info('No release requested by merged PRs.'); return; }
  const npmVersion = await getRegistryVersion();
  let baseline = previous?.tag_name.slice(1) ?? null;
  if (npmVersion && (!baseline || compareVersions(npmVersion, baseline) > 0)) baseline = npmVersion;
  const version = nextVersion(baseline, impacts);
  if (!version) { core.info('No release requested by merged PRs.'); return; }
  await writeFile(notesPath, `## Changes\n\n${notes.join('\n')}\n\nIncludes all source changes since the previous release, including PRs marked release:none.\n\nInstall the attached package with \`npm install ./tendstead-ui-${version}.tgz\`.\n`);
  core.setOutput('version', version);
  core.setOutput('sha', sha);
}
