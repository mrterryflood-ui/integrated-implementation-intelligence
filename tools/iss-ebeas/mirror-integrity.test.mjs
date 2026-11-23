import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest } from './gate.mjs';
import { verifyMirror } from './mirror-integrity.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(here, '../..');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'iss-mirror-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const origin = JSON.parse(fs.readFileSync(path.join(here, 'origin.json'), 'utf8'));
  for (const relative of ['tools/iss-ebeas/origin.json',
    ...Object.keys(origin.sourceFiles).map(p => 'tools/iss-ebeas/' + p),
    ...Object.keys(origin.repositoryFiles)]) {
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true });
    fs.copyFileSync(path.join(sourceRoot, relative), path.join(root, relative));
  }
  return { root, origin };
}
test('recorded canonical mirror matches without granting release or signature status', t => {
  const { root } = fixture(t), result = verifyMirror(root);
  assert.equal(result.status, 'PASS');
  assert.equal(result.releaseReadiness, 'NOT_EVALUATED');
  assert.equal(result.signature, 'UNSIGNED_LOCAL_CHECK');
});
for (const relative of ['tools/iss-ebeas/gate.mjs', 'schemas/iss-manifest.schema.json',
  'docs/engineering/ISS-EBEAS-1.1.md']) {
  test('recorded mirror rejects byte drift: ' + relative, t => {
    const { root } = fixture(t);
    fs.appendFileSync(path.join(root, relative), '\n');
    assert.throws(() => verifyMirror(root), /MIRROR_CONTENT_MISMATCH/);
  });
}
test('removing an inventory entry cannot hide a changed gate', t => {
  const { root, origin } = fixture(t);
  delete origin.sourceFiles['gate.mjs'];
  fs.writeFileSync(path.join(root, 'tools/iss-ebeas/origin.json'), JSON.stringify(origin));
  assert.throws(() => verifyMirror(root), /MIRROR_INVENTORY_INCOMPLETE/);
});
test('mirror inventory cannot escape through a traversal path', t => {
  const { root, origin } = fixture(t);
  origin.repositoryFiles['../outside'] = digest('fixture');
  fs.writeFileSync(path.join(root, 'tools/iss-ebeas/origin.json'), JSON.stringify(origin));
  assert.throws(() => verifyMirror(root), /UNSAFE_PATH/);
});
test('mirror inventory rejects linked files', t => {
  const { root } = fixture(t), target = path.join(root, 'schemas/iss-manifest.schema.json');
  fs.unlinkSync(target);
  fs.symlinkSync(path.join(sourceRoot, 'schemas/iss-manifest.schema.json'), target);
  assert.throws(() => verifyMirror(root), /SYMLINK_PATH/);
});
