const test = require('node:test');
const assert = require('node:assert/strict');
const { KeyMint, verifyOfflineLicense } = require('../dist/index.js');

function required(name) {
  const value = process.env[name];
  assert.ok(value, `Missing required environment variable: ${name}`);
  return value;
}

// The shared test workspace is rate-limited per minute. A 429 is rejected
// before it is processed, so retrying it is safe (same as the Go and C# suites).
const isRateLimited = (err) => err?.status === 429 || /too many requests/i.test(err?.message ?? '');

async function live(call) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (err) {
      if (!isRateLimited(err) || attempt === 4) throw err;
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}

test('current license and customer workflows work end to end', async () => {
  const productId = required('KEYMINT_TEST_PRODUCT_ID');
  const baseUrl = process.env.KEYMINT_TEST_BASE_URL || 'https://api.keymint.dev';
  const admin = new KeyMint(required('KEYMINT_TEST_ADMIN_API_KEY'), baseUrl);
  const readOnly = new KeyMint(required('KEYMINT_TEST_READONLY_API_KEY'), baseUrl);
  const client = new KeyMint(required('KEYMINT_TEST_CLIENT_API_KEY'), baseUrl);
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const nodeHost = `node-ci-${runId}`;
  let nodeKey;
  let floatingKey;
  let customerId;

  try {
    const created = await live(() => admin.createKey({
      productId,
      maxActivations: '2',
      metadata: { purpose: 'node-sdk-live-test', runId }
    }));
    nodeKey = created.key;
    assert.ok(nodeKey);

    const lookup = await live(() => readOnly.getKey({ productId, licenseKey: nodeKey }));
    assert.equal(lookup.data.license.productId, productId);

    const activation = await live(() => client.activateKey({
      productId, licenseKey: nodeKey, hostId: nodeHost, deviceTag: 'Node SDK CI'
    }));
    assert.equal(activation.metadata.hostId, nodeHost);

    const deactivated = await live(() => client.deactivateKey({ productId, licenseKey: nodeKey, hostId: nodeHost }));
    assert.equal(deactivated.devicesRemoved, 1);
    await live(() => admin.updateKey({ productId, licenseKey: nodeKey, maxActivations: 3 }));
    await live(() => admin.blockKey({ productId, licenseKey: nodeKey }));
    await live(() => admin.unblockKey({ productId, licenseKey: nodeKey }));

    const floating = await live(() => admin.createKey({
      productId,
      licenseType: 'floating',
      maxConcurrentSessions: 1,
      heartbeatInterval: 60,
      sessionLeaseDuration: 300,
      metadata: { purpose: 'node-sdk-floating-live-test', runId }
    }));
    floatingKey = floating.key;
    assert.ok(floatingKey);

    const checkout = await live(() => client.floatingCheckout({
      productId, licenseKey: floatingKey, hostId: `node-floating-${runId}`
    }));
    const heartbeat = await live(() => client.floatingHeartbeat({
      productId,
      licenseKey: floatingKey,
      sessionId: checkout.sessionId,
      timestamp: checkout.nextNonce,
      signature: KeyMint.generateSessionSignature(checkout.sessionId, checkout.nextNonce, checkout.sessionSecret)
    }));
    await live(() => client.floatingCheckin({
      productId,
      licenseKey: floatingKey,
      sessionId: checkout.sessionId,
      timestamp: heartbeat.nextNonce,
      signature: KeyMint.generateSessionSignature(checkout.sessionId, heartbeat.nextNonce, checkout.sessionSecret)
    }));

    const signed = await live(() => admin.signKey({ productId, licenseKey: nodeKey, hostId: nodeHost, ttl: 300 }));
    assert.equal(typeof signed.file, 'string');
    assert.match(signed.file, /signedKey/);
    const publicKey = process.env.KEYMINT_TEST_PUBLIC_KEY;
    if (publicKey) {
      const offline = verifyOfflineLicense(signed.file, { publicKeys: [publicKey], productId, machineCode: nodeHost });
      assert.equal(offline.licenseKey, nodeKey);
      assert.equal(offline.productId, productId);
      assert.equal(offline.machineCode, nodeHost);
      assert.ok(offline.expiresAt.getTime() > Date.now());
      assert.throws(
        () => verifyOfflineLicense(signed.file, { publicKeys: [publicKey], productId: `${productId}-other`, machineCode: nodeHost }),
        { code: 'wrong_product' }
      );
    } else {
      console.log('KEYMINT_TEST_PUBLIC_KEY not set; skipping offline license verification');
    }

    const customer = await live(() => admin.createCustomer({ name: 'Node SDK CI', email: `node-ci-${runId}@example.com` }));
    customerId = customer.data.id;
    assert.ok(customerId);
    const fetched = await live(() => admin.getCustomerById({ customerId }));
    assert.ok(fetched.data.some(item => item.id === customerId));
    await live(() => admin.updateCustomer({ customerId, name: 'Node SDK CI Updated' }));
    const customers = await live(() => admin.getAllCustomers());
    assert.ok(customers.data.some(item => item.id === customerId));
    assert.ok(Array.isArray(await live(() => admin.getCustomerWithKeys({ customerId }))));
    assert.equal((await live(() => admin.toggleCustomerStatus({ customerId }))).status, true);
    assert.equal((await live(() => admin.toggleCustomerStatus({ customerId }))).status, true);
    assert.equal((await live(() => admin.deleteCustomer({ customerId }))).status, true);
    customerId = undefined;

    const deleted = await live(() => admin.deleteKey({ productId, licenseKey: nodeKey }));
    assert.equal(deleted.code, 0);
    const deletedKey = nodeKey;
    nodeKey = undefined;
    await assert.rejects(
      () => live(() => readOnly.getKey({ productId, licenseKey: deletedKey })),
      error => error.status >= 400 && error.status < 500 && error.status !== 429
    );
  } finally {
    // Delete (not just block) what this run created so the shared test workspace
    // does not fill up its license limit.
    if (customerId) await live(() => admin.deleteCustomer({ customerId })).catch(() => {});
    if (nodeKey) await live(() => admin.deleteKey({ productId, licenseKey: nodeKey })).catch(() => {});
    if (floatingKey) await live(() => admin.deleteKey({ productId, licenseKey: floatingKey })).catch(() => {});
  }
});
