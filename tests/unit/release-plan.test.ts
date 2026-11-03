import { afterEach, beforeEach, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import plan from '../../scripts/plan-release.mjs';

let cwd: string;
function git(...args: string[]) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}
beforeEach(async () => {
  cwd = await mkdtemp(join(tmpdir(), 'ui-release-plan-'));
  git('init', '-b', 'main');
  git('config', 'user.name', 'Release test');
  git('config', 'user.email', 'test@example.invalid');
  git('commit', '--allow-empty', '-m', 'previous release');
  git('tag', 'v0.1.0');
});
afterEach(async () => { await rm(cwd, { recursive: true, force: true }); });

it('batches intervening merged PRs, excludes other branches, and skips a completed release', async () => {
  git('commit', '--allow-empty', '-m', 'patch');
  const patchSha = git('rev-parse', 'HEAD');
  git('commit', '--allow-empty', '-m', 'feature');
  const featureSha = git('rev-parse', 'HEAD');
  let tag = 'v0.1.0';
  const pr = (number: number, sha: string, label: string, base = 'main') => ({
    number, merge_commit_sha: sha, merged_at: '2026-11-03', base: { ref: base },
    title: `Change ${number}`, labels: [{ name: label }],
  });
  const releases = 'releases';
  const github = {
    rest: { repos: { listReleases: releases, listPullRequestsAssociatedWithCommit: 'pulls' } },
    paginate: async (method: string, input: { commit_sha?: string }) => {
      if (method === releases) return [{ tag_name: tag, draft: false, prerelease: false }];
      if (input.commit_sha === patchSha) return [pr(1, patchSha, 'release:patch')];
      return [pr(2, featureSha, 'release:minor'), pr(3, featureSha, 'release:major', 'other')];
    },
  };
  const output: Record<string, string> = {};
  const core = { info: () => {}, setOutput: (key: string, value: string) => { output[key] = value; } };
  const context = { repo: { owner: 'test', repo: 'ui' } };
  await plan({ github, context, core, cwd, notesPath: join(cwd, 'notes.md'), getRegistryVersion: async () => '0.1.0' });
  expect(output).toEqual({ version: '0.2.0', sha: featureSha });
  git('tag', 'v0.2.0');
  tag = 'v0.2.0';
  delete output.version;
  delete output.sha;
  await plan({ github, context, core, cwd, notesPath: join(cwd, 'notes.md'), getRegistryVersion: async () => '0.1.0' });
  expect(output).toEqual({});
});

it('starts above a manually published npm bootstrap version', async () => {
  const sha = git('rev-parse', 'HEAD');
  const output: Record<string, string> = {};
  const github = {
    rest: { repos: { listReleases: 'releases', listPullRequestsAssociatedWithCommit: 'pulls' } },
    paginate: async (method: string) => method === 'releases' ? [] : [{ number: 1, title: 'Automate releases',
      merged_at: '2026-11-03', merge_commit_sha: sha, base: { ref: 'main' }, labels: [{ name: 'release:patch' }],
    }],
  };
  await plan({ github, context: { repo: { owner: 'test', repo: 'ui' } }, cwd,
    core: { info: () => {}, setOutput: (k: string, v: string) => { output[k] = v; } },
    getRegistryVersion: async () => '0.1.0', notesPath: join(cwd, 'notes.md'),
  });
  expect(output).toEqual({ version: '0.1.1', sha });
});

it('resumes a pending release at its original SHA even when main advances', async () => {
  const sha = git('rev-parse', 'HEAD');
  git('commit', '--allow-empty', '-m', 'newer change');
  const output: Record<string, string> = {};
  const github = {
    rest: { repos: { listReleases: 'releases' } },
    paginate: async () => [{ draft: true, tag_name: 'v0.1.1',
      body: `Notes\n<!-- tendstead-release:${JSON.stringify({ sha, integrity: 'test' })} -->`,
    }],
  };
  await plan({ github, context: { repo: { owner: 'test', repo: 'ui' } }, cwd,
    core: { info: () => {}, setOutput: (k: string, v: string) => { output[k] = v; } },
    notesPath: join(cwd, 'notes.md'),
    getRegistryVersion: async () => { throw new Error('Must not renumber a pending release'); },
  });
  expect(output).toEqual({ version: '0.1.1', sha });
});
