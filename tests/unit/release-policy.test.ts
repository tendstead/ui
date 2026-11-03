import { describe, expect, it } from 'vitest';
import { releaseImpact, nextVersion } from '../../scripts/release-policy.mjs';

describe('release labels', () => {
  it('requires one explicit release decision', () => {
    expect(releaseImpact(['bug', 'release:none'])).toBe('none');
    expect(releaseImpact(['release:patch'])).toBe('patch');
    expect(() => releaseImpact([])).toThrow();
    expect(() => releaseImpact(['release:none', 'release:patch'])).toThrow();
    expect(() => releaseImpact(['release:typo'])).toThrow();
  });
  it('batches changes using the highest impact, ignoring none', () => {
    expect(nextVersion('0.2.3', ['none', 'patch', 'minor'])).toBe('0.3.0');
    expect(nextVersion('1.2.3', ['minor', 'major'])).toBe('2.0.0');
    expect(nextVersion('1.2.3', ['none'])).toBeNull();
    expect(nextVersion('1.2.3', ['patch'])).toBe('1.2.4');
  });
  it('starts at 0.1.0 and rejects major labels during 0.x', () => {
    expect(nextVersion(null, ['patch'])).toBe('0.1.0');
    expect(nextVersion(null, ['none'])).toBeNull();
    expect(() => nextVersion('0.2.0', ['major'])).toThrow();
    expect(() => nextVersion('garbage', ['patch'])).toThrow();
  });
});
