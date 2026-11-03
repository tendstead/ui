import { expect, it } from 'vitest';
import { verifyReleaseTag } from '../../scripts/publish-release.mjs';

it('rejects an existing release tag pointing at different source code', async () => {
  const github = { rest: { git: { getRef: async () => ({ data: { object: { type: 'commit', sha: 'other' } } }) } } };
  await expect(verifyReleaseTag({ github, repo: { owner: 'test', repo: 'ui' }, tag: 'v0.1.1', sha: 'expected' })).rejects.toThrow('different source');
});

it('accepts a new tag or an annotated tag pointing at the verified SHA', async () => {
  const repo = { owner: 'test', repo: 'ui' };
  const github = { rest: { git: {
    getRef: async () => ({ data: { object: { type: 'tag', sha: 'annotation' } } }),
    getTag: async () => ({ data: { object: { type: 'commit', sha: 'expected' } } }),
  } } };
  await expect(verifyReleaseTag({ github, repo, tag: 'v0.1.1', sha: 'expected' })).resolves.toBeUndefined();
  github.rest.git.getRef = async () => { throw Object.assign(new Error('not found'), { status: 404 }); };
  await expect(verifyReleaseTag({ github, repo, tag: 'v0.1.1', sha: 'expected' })).resolves.toBeUndefined();
});
