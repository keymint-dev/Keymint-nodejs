const test = require('node:test');
const assert = require('node:assert/strict');
const { KeyMint } = require('../dist/index.js');

function required(name) {
  const value = process.env[name];
  assert.ok(value, `Missing required environment variable: ${name}`);
  return value;
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
    const created = await admin.createKey({
      productId,
      maxActivations: '2',
      metadata: { purpose: 'node-sdk-live-test', runId }
    });
    nodeKey = created.key;
    assert.ok(nodeKey);

    const lookup = await readOnly.getKey({ productId, licenseKey: nodeKey });
    assert.equal(lookup.data.license.productId, productId);

    const activation = await client.activateKey({
      productId, licenseKey: nodeKey, hostId: nodeHost, deviceTag: 'Node SDK CI'
    });
    assert.equal(activation.metadata.hostId, nodeHost);

    const deactivated = await client.deactivateKey({ productId, licenseKey: nodeKey, hostId: nodeHost });
    assert.equal(deactivated.devicesRemoved, 1);
    await admin.updateKey({ productId, licenseKey: nodeKey, maxActivations: 3 });
    await admin.blockKey({ productId, licenseKey: nodeKey });
    await admin.unblockKey({ productId, licenseKey: nodeKey });

    const floating = await admin.createKey({
      productId,
      licenseType: 'floating',
      maxConcurrentSessions: 1,
      heartbeatInterval: 60,
      sessionLeaseDuration: 300,
      metadata: { purpose: 'node-sdk-floating-live-test', runId }
    });
    floatingKey = floating.key;
    assert.ok(floatingKey);

    const checkout = await client.floatingCheckout({
      productId, licenseKey: floatingKey, hostId: `node-floating-${runId}`
    });
    const heartbeat = await client.floatingHeartbeat({
      productId,
      licenseKey: floatingKey,
      sessionId: checkout.sessionId,
      timestamp: checkout.nextNonce,
      signature: KeyMint.generateSessionSignature(checkout.sessionId, checkout.nextNonce, checkout.sessionSecret)
    });
    await client.floatingCheckin({
      productId,
      licenseKey: floatingKey,
      sessionId: checkout.sessionId,
      timestamp: heartbeat.nextNonce,
      signature: KeyMint.generateSessionSignature(checkout.sessionId, heartbeat.nextNonce, checkout.sessionSecret)
    });

    const signed = await admin.signKey({ productId, licenseKey: nodeKey, hostId: nodeHost, ttl: 300 });
    assert.equal(typeof signed.file, 'string');
    assert.match(signed.file, /signedKey/);

    const customer = await admin.createCustomer({ name: 'Node SDK CI', email: `node-ci-${runId}@example.com` });
    customerId = customer.data.id;
    assert.ok(customerId);
    const fetched = await admin.getCustomerById({ customerId });
    assert.ok(fetched.data.some(item => item.id === customerId));
    await admin.updateCustomer({ customerId, name: 'Node SDK CI Updated' });
    const customers = await admin.getAllCustomers();
    assert.ok(customers.data.some(item => item.id === customerId));
    assert.ok(Array.isArray(await admin.getCustomerWithKeys({ customerId })));
    assert.equal((await admin.toggleCustomerStatus({ customerId })).status, true);
    assert.equal((await admin.toggleCustomerStatus({ customerId })).status, true);
    assert.equal((await admin.deleteCustomer({ customerId })).status, true);
    customerId = undefined;
  } finally {
    if (customerId) await admin.deleteCustomer({ customerId }).catch(() => {});
    if (nodeKey) await admin.blockKey({ productId, licenseKey: nodeKey }).catch(() => {});
    if (floatingKey) await admin.blockKey({ productId, licenseKey: floatingKey }).catch(() => {});
  }
});
