import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Observe the checkout itself; a pull_request event's GITHUB_SHA can identify a
// synthetic merge revision even when the workflow checked out the PR head.
export function observeGitRevision() {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  let observed;
  try {
    const options = { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] };
    const top = execFileSync('git', ['rev-parse', '--show-toplevel'], options).trim();
    if (realpathSync(top) !== realpathSync(root)) throw new Error('Not the expected repository root');
    const commit = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], options).trim();
    if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Invalid observed commit');
    const worktreeDirty = execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], options).trim().length > 0;
    observed = { status: 'AVAILABLE', commit, worktreeDirty };
  } catch {
    observed = { status: 'UNAVAILABLE', reason: 'No Git checkout at the expected repository root; source hashes identify this local snapshot.' };
  }
  const expected = process.env.ISS_EXPECTED_SOURCE_SHA;
  if (expected && (observed.status !== 'AVAILABLE' || observed.commit !== expected || observed.worktreeDirty))
    throw new Error('Hosted component receipt requires the expected clean source revision');
  return observed;
}
