import { describe, expect, it } from 'vitest';
import { ensureNpmPublished, highestPublishedVersion, npmPublishEnvironment } from '../../scripts/npm-release.mjs';
import { createHash } from 'node:crypto';

const tarball = Buffer.from('verified package');
const integrity = `sha512-${createHash('sha512').update(tarball).digest('base64')}`;

describe('npm publication', () => {
  it('records the actual source revision while retaining the workflow run identity', () => {
    const sourceSha = 'a'.repeat(40);
    expect(npmPublishEnvironment(sourceSha, { GITHUB_SHA: 'old-event-sha', GITHUB_RUN_ID: '123' }))
      .toEqual({ GITHUB_SHA: sourceSha, GITHUB_RUN_ID: '123' });
    expect(() => npmPublishEnvironment('bad')).toThrow('Invalid npm source SHA');
  });
  it('finds the highest stable version, including a manual bootstrap publication', () => {
    expect(highestPublishedVersion({ versions: { '0.1.0': {}, '0.9.0': {}, '0.10.0': {}, '1.0.0-rc.1': {} } })).toBe('0.10.0');
    expect(highestPublishedVersion(null)).toBeNull();
  });
  it('skips an existing version only when its integrity matches', async () => {
    let published = false;
    await ensureNpmPublished({ version: '0.1.1', tarball, tarballPath: '/unused',
      readVersion: async () => ({ dist: { integrity } }),
      publish: () => { published = true; },
    });
    expect(published).toBe(false);
    await expect(ensureNpmPublished({ version: '0.1.1', tarball, tarballPath: '/unused',
      readVersion: async () => ({ dist: { integrity: 'different' } }),
      publish: () => { published = true; },
    })).rejects.toThrow('different package');
    expect(published).toBe(false);
  });
  it('publishes a missing version and checks the registry afterwards', async () => {
    let published = false;
    await ensureNpmPublished({ version: '0.1.1', tarball, tarballPath: '/verified.tgz',
      readVersion: async () => published ? { dist: { integrity } } : null,
      publish: (path: string) => { expect(path).toBe('/verified.tgz'); published = true; },
    });
    expect(published).toBe(true);
  });
  it('does not interpret a registry outage as permission to publish', async () => {
    let published = false;
    await expect(ensureNpmPublished({ version: '0.1.1', tarball, tarballPath: '/unused',
      readVersion: async () => { throw new Error('Registry unavailable'); },
      publish: () => { published = true; },
    })).rejects.toThrow('Registry unavailable');
    expect(published).toBe(false);
  });
});
