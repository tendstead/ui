/** @param {string[]} labels */
export function releaseImpact(labels) {
  const selected = labels.filter(label => label.startsWith('release:'));
  if (selected.length !== 1 || !/^release:(none|patch|minor|major)$/.test(selected[0])) {
    throw new Error('Apply exactly one of release:none, release:patch, release:minor, release:major.');
  }
  return selected[0].slice('release:'.length);
}

/** @param {string | null} previous @param {string[]} impacts */
export function nextVersion(previous, impacts) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(previous ?? '0.0.0');
  if (!match) throw new Error(`Invalid release version: ${previous}`);
  let [major, minor, patch] = match.slice(1).map(Number);
  if (major === 0 && impacts.includes('major')) {
    throw new Error('Use release:minor for breaking changes during 0.x. Graduate to 1.0 separately.');
  }
  if (!impacts.some(impact => impact !== 'none')) return null;
  if (previous === null) return '0.1.0';
  if (impacts.includes('major')) { major++; minor = 0; patch = 0; }
  else if (impacts.includes('minor')) { minor++; patch = 0; }
  else patch++;
  return `${major}.${minor}.${patch}`;
}
