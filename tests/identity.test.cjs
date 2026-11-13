const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { KeyMint, InstallationIdError } = require('../dist/index.js');

function tempDir(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keymint-id-'));
  t.after(() => {
    try { fs.chmodSync(dir, 0o700); } catch { /* ignore */ }
    fs.rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

// The parent "directory" is a regular file, so mkdir and write fail on every
// platform, even when the tests run as root.
function unwritablePath(t) {
  const blocker = path.join(tempDir(t), 'not-a-directory');
  fs.writeFileSync(blocker, 'x');
  return path.join(blocker, 'installation-id');
}

async function collectWarnings(run) {
  const warnings = [];
  const onWarning = warning => {
    if (warning.name === 'KeymintInstallationIdWarning') warnings.push(warning);
  };
  process.on('warning', onWarning);
  try {
    await run();
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    process.off('warning', onWarning);
  }
  return warnings;
}

test('saves the ID and returns the same value next time', async t => {
  const file = path.join(tempDir(t), 'nested', 'installation-id');
  let first, second;
  const warnings = await collectWarnings(() => {
    first = KeyMint.getOrCreateInstallationId(file);
    second = KeyMint.getOrCreateInstallationId(file);
  });
  assert.equal(warnings.length, 0);
  assert.equal(first, second);
  assert.equal(first, createHash('sha256').update(fs.readFileSync(file, 'utf8').trim()).digest('hex'));
});

test('strict mode saves normally, with either call form', t => {
  const file = path.join(tempDir(t), 'installation-id');
  const first = KeyMint.getOrCreateInstallationId(file, { requirePersisted: true });
  assert.equal(KeyMint.getOrCreateInstallationId({ storagePath: file, requirePersisted: true }), first);
  assert.equal(KeyMint.getOrCreateInstallationId({ storagePath: file }), first);
});

test('an existing readable file is reused', t => {
  const file = path.join(tempDir(t), 'installation-id');
  fs.writeFileSync(file, 'existing-id\n');
  const expected = createHash('sha256').update('existing-id').digest('hex');
  assert.equal(KeyMint.getOrCreateInstallationId(file), expected);
  assert.equal(KeyMint.getOrCreateInstallationId(file, { requirePersisted: true }), expected);
  assert.equal(fs.readFileSync(file, 'utf8'), 'existing-id\n');
});

test('strict mode throws InstallationIdError when the ID cannot be saved', async t => {
  const file = unwritablePath(t);
  const warnings = await collectWarnings(() => {
    assert.throws(
      () => KeyMint.getOrCreateInstallationId(file, { requirePersisted: true }),
      err => err instanceof InstallationIdError
        && err.name === 'InstallationIdError'
        && err.path === file
        && err.message.includes(file)
        && err.cause !== undefined,
    );
  });
  assert.equal(warnings.length, 0);
});

test('strict mode throws when the saved value does not read back', t => {
  const file = path.join(tempDir(t), 'installation-id');
  const original = fs.writeFileSync;
  fs.writeFileSync = (target, data, ...rest) => original(target, String(data).slice(0, -1), ...rest);
  t.after(() => { fs.writeFileSync = original; });
  assert.throws(() => KeyMint.getOrCreateInstallationId(file, { requirePersisted: true }), InstallationIdError);
});

test('read-only directory: strict throws', { skip: process.platform === 'win32' || process.getuid?.() === 0 }, t => {
  const dir = tempDir(t);
  fs.chmodSync(dir, 0o500);
  assert.throws(
    () => KeyMint.getOrCreateInstallationId(path.join(dir, 'installation-id'), { requirePersisted: true }),
    InstallationIdError,
  );
});

// Keep this the only test that falls back in default mode: the warning is
// emitted once per process, and node --test runs each file in its own process.
test('default mode returns an unsaved ID and warns once per process', async t => {
  const file = unwritablePath(t);
  let first, second;
  const warnings = await collectWarnings(() => {
    first = KeyMint.getOrCreateInstallationId(file);
    second = KeyMint.getOrCreateInstallationId(file);
  });
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.match(second, /^[0-9a-f]{64}$/);
  assert.notEqual(first, second); // nothing was saved
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0].code, 'KEYMINT_INSTALLATION_ID_NOT_SAVED');
  assert.ok(warnings[0].message.includes(file));
});
