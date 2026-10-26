const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fixtures = require('./fixtures/offline-license-fixtures.json');
const { KeyMint, verifyOfflineLicense, OfflineLicenseError } = require('../dist/index.js');

const seconds = date => (date === null ? null : date.getTime() / 1000);

function optionsFor(testCase) {
  const options = {
    publicKeys: fixtures.publicKeys,
    productId: testCase.options.productId,
    machineCode: testCase.options.machineCode,
    now: new Date(testCase.options.now * 1000)
  };
  if (testCase.options.clockSkew !== undefined) options.clockSkewSeconds = testCase.options.clockSkew;
  return options;
}

test('fixture file has the expected 34 cases', () => {
  assert.equal(fixtures.cases.length, 34);
});

for (const testCase of fixtures.cases) {
  test(`fixture: ${testCase.name}`, () => {
    const options = optionsFor(testCase);
    if (testCase.expect.valid) {
      const license = verifyOfflineLicense(testCase.input, options);
      const expected = testCase.expect.license;
      assert.deepEqual({
        licenseKey: license.licenseKey,
        productId: license.productId,
        machineCode: license.machineCode,
        keyId: license.keyId,
        issuedAt: seconds(license.issuedAt),
        expiresAt: seconds(license.expiresAt)
      }, {
        licenseKey: expected.licenseKey,
        productId: expected.productId,
        machineCode: expected.machineCode,
        keyId: expected.keyId,
        issuedAt: expected.issuedAt,
        expiresAt: expected.expiresAt
      });
    } else {
      assert.throws(() => verifyOfflineLicense(testCase.input, options), error => {
        assert.ok(error instanceof OfflineLicenseError, `expected OfflineLicenseError, got ${error}`);
        assert.equal(error.code, testCase.expect.error);
        assert.equal(error.name, 'OfflineLicenseError');
        return true;
      });
    }
  });
}

const firstValid = fixtures.cases.find(c => c.expect.valid);

test('errors never include the license key', () => {
  const testCase = fixtures.cases.find(c => c.name === 'wrong product');
  try {
    verifyOfflineLicense(testCase.input, optionsFor(testCase));
    assert.fail('expected an error');
  } catch (error) {
    assert.ok(error instanceof OfflineLicenseError);
    assert.ok(!error.message.includes(firstValid.expect.license.licenseKey));
    assert.ok(!String(error.stack).includes(firstValid.expect.license.licenseKey));
  }
});

test('KeyMint.verifyOfflineLicense is the same verifier', () => {
  const license = KeyMint.verifyOfflineLicense(firstValid.input, optionsFor(firstValid));
  assert.equal(license.licenseKey, firstValid.expect.license.licenseKey);
});

test('now defaults to the system clock', () => {
  const options = optionsFor(firstValid);
  delete options.now;
  const expiresAt = firstValid.expect.license.expiresAt;
  if (Date.now() / 1000 < expiresAt) {
    assert.equal(verifyOfflineLicense(firstValid.input, options).expiresAt.getTime() / 1000, expiresAt);
  } else {
    assert.throws(() => verifyOfflineLicense(firstValid.input, options), { code: 'expired' });
  }
});

test('argument errors are TypeError/RangeError, not verification results', () => {
  const base = optionsFor(firstValid);
  const rsaPem = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    .publicKey.export({ type: 'spki', format: 'pem' });
  const ed25519Private = crypto.generateKeyPairSync('ed25519')
    .privateKey.export({ type: 'pkcs8', format: 'pem' });
  const cases = [
    [{ ...base, publicKeys: [] }, TypeError],
    [{ ...base, publicKeys: undefined }, TypeError],
    [{ ...base, publicKeys: ['not a pem'] }, TypeError],
    [{ ...base, publicKeys: ['-----BEGIN PUBLIC KEY-----\ngarbage\n-----END PUBLIC KEY-----\n'] }, TypeError],
    [{ ...base, publicKeys: [rsaPem] }, TypeError],
    [{ ...base, publicKeys: [fixtures.publicKeys[0], rsaPem] }, TypeError],
    [{ ...base, publicKeys: [ed25519Private] }, TypeError],
    [{ ...base, productId: '' }, TypeError],
    [{ ...base, productId: undefined }, TypeError],
    [{ ...base, machineCode: '' }, TypeError],
    [{ ...base, machineCode: undefined }, TypeError],
    [{ ...base, clockSkewSeconds: -1 }, RangeError],
    [{ ...base, clockSkewSeconds: 3601 }, RangeError],
    [{ ...base, clockSkewSeconds: NaN }, RangeError],
    [{ ...base, now: new Date(NaN) }, TypeError],
    [{ ...base, now: 1800000000 }, TypeError]
  ];
  for (const [options, ErrorType] of cases) {
    assert.throws(() => verifyOfflineLicense(firstValid.input, options), error => {
      assert.ok(error instanceof ErrorType, `expected ${ErrorType.name}, got ${error}`);
      assert.ok(!(error instanceof OfflineLicenseError));
      return true;
    });
  }
  // Bounds are inclusive.
  for (const clockSkewSeconds of [0, 3600]) {
    assert.ok(verifyOfflineLicense(firstValid.input, { ...base, clockSkewSeconds }));
  }
});
