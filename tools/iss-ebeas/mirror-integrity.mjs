#!/usr/bin/env node
// Recorded source integrity only. This is not a signature or product acceptance.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { safePath, digest, canonical } from './gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REQUIRED_TOOL_FILES = ['gate.mjs', 'gate.test.mjs', 'fixture.mjs', 'iron_gate.py',
  'package.json', 'package-lock.json', 'README.md', 'static-delivery.test.mjs',
  'validation-inputs.test.mjs', 'mirror-integrity.mjs', 'mirror-integrity.test.mjs'];
const REQUIRED_REPOSITORY_FILES = ['schemas/iss-manifest.schema.json',
  'docs/engineering/ISS-EBEAS-1.1.md', 'docs/engineering/ISS-EBEAS-RELEASE-CHECKLIST.md',
  'docs/engineering/ISS-EBEAS-VALIDATION-MIRROR.md'];
const HASH = /^[a-f0-9]{64}$/;

export function verifyMirror(root = path.resolve(HERE, '../..')) {
  const originPath = safePath(root, 'tools/iss-ebeas/origin.json', { file: true });
  const originBytes = fs.readFileSync(originPath);
  const origin = JSON.parse(originBytes.toString('utf8'));
  if (origin.standard !== 'ISS-EBEAS' || origin.version !== '1.1.0' ||
      origin.canonicalRepository !== 'mrterryflood-ui/integrated-implementation-intelligence' ||
      !/^[a-f0-9]{40}$/.test(origin.sourceParentRevision ?? ''))
    throw new Error('MIRROR_ORIGIN_INVALID');
  const entries = [];
  for (const [key, required, prefix] of [
    ['sourceFiles', REQUIRED_TOOL_FILES, 'tools/iss-ebeas/'],
    ['repositoryFiles', REQUIRED_REPOSITORY_FILES, ''],
  ]) {
    const mapping = origin[key];
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping) ||
        Object.keys(mapping).length > 100 || !required.every(name => Object.hasOwn(mapping, name)))
      throw new Error('MIRROR_INVENTORY_INCOMPLETE');
    for (const [name, expected] of Object.entries(mapping)) {
      if (!HASH.test(expected ?? '') || (prefix && !/^[A-Za-z0-9_.-]+$/.test(name)))
        throw new Error('MIRROR_REFERENCE_INVALID');
      const relative = prefix + name;
      const file = safePath(root, relative, { file: true });
      if (digest(fs.readFileSync(file)) !== expected)
        throw new Error('MIRROR_CONTENT_MISMATCH:' + relative);
      entries.push([relative, expected]);
    }
  }
  return {
    status: 'PASS', filesVerified: entries.length,
    originSha256: digest(originBytes), mirrorDigest: digest(canonical(entries.sort())),
    canonicalRepository: origin.canonicalRepository, sourceParentRevision: origin.sourceParentRevision,
    meaning: 'Bytes match the recorded mirror inventory; independent canonical pin/review and release provenance are still required.',
    signature: 'UNSIGNED_LOCAL_CHECK', releaseReadiness: 'NOT_EVALUATED',
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error('UNSUPPORTED_ARGUMENTS');
    console.log(JSON.stringify(verifyMirror(), null, 2));
  } catch (error) {
    console.error('ISS-EBEAS mirror check failed: ' +
      (/^[A-Z0-9_:/a-z.\-]+$/.test(error?.message ?? '') ? error.message : 'INVALID_OR_UNREADABLE_INPUT'));
    process.exitCode = 1;
  }
}
