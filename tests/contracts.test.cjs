const http = require('node:http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { KeyMint } = require('../dist/index.js');

async function withServer(handler, run) {
  const server = http.createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('getKey sends the license in x-license-key, never the URL', async () => {
  await withServer((request, response) => {
    assert.equal(request.headers['x-license-key'], 'secret/license+key');
    assert.equal(new URL(request.url, 'http://localhost').searchParams.get('licenseKey'), null);
    assert.equal(new URL(request.url, 'http://localhost').searchParams.get('productId'), 'product 123');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ code: 0, data: { license: { productId: 'product 123' } } }));
  }, async baseUrl => {
    const result = await new KeyMint('readonly_test', baseUrl).getKey({
      productId: 'product 123',
      licenseKey: 'secret/license+key'
    });
    assert.equal(result.data.license.productId, 'product 123');
  });
});

test('signKey accepts the current serialized file response', async () => {
  await withServer((_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ file: '{"signedKey":"signature","keyId":"key_123"}' }));
  }, async baseUrl => {
    const result = await new KeyMint('admin_test', baseUrl).signKey({
      productId: 'product_123', licenseKey: 'license_123', hostId: 'host_123'
    });
    assert.equal(typeof result.file, 'string');
    assert.match(result.file, /signedKey/);
  });
});

test('nested API errors preserve the actionable server message', async () => {
  await withServer((_request, response) => {
    response.statusCode = 409;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({
      success: false,
      error: { code: 'CUSTOMER_EMAIL_EXISTS', message: 'Customer email already exists in team' },
      code: 1
    }));
  }, async baseUrl => {
    await assert.rejects(
      () => new KeyMint('admin_test', baseUrl).createKey({ productId: 'product_123' }),
      error => error.message === 'Customer email already exists in team' && error.code === 1
    );
  });
});

function jsonResponder(path, body) {
  return (request, response) => {
    assert.equal(request.method, 'POST');
    assert.equal(request.url, path);
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(body));
  };
}

for (const expirationDate of ['2027-03-01T00:00:00.000Z', null]) {
  test(`activateKey passes through expirationDate (${expirationDate})`, async () => {
    await withServer(jsonResponder('/key/activate', {
      code: 0, message: 'License valid', expirationDate, metadata: null
    }), async baseUrl => {
      const result = await new KeyMint('client_test', baseUrl).activateKey({
        productId: 'product_123', licenseKey: 'license_123', hostId: 'host_123'
      });
      assert.equal(result.code, 0);
      assert.ok('expirationDate' in result);
      assert.equal(result.expirationDate, expirationDate);
    });
  });

  test(`floatingCheckout passes through expirationDate separately from expiresAt (${expirationDate})`, async () => {
    await withServer(jsonResponder('/key/checkout', {
      code: 0,
      message: 'Session checked out',
      sessionId: 'session_1234567890123',
      sessionSecret: 'secret',
      nextNonce: 'nonce',
      expiresAt: '2026-10-26T12:30:00.000Z',
      heartbeatInterval: 300,
      metadata: {},
      expirationDate,
      currentSessions: 1,
      maxSessions: 5
    }), async baseUrl => {
      const result = await new KeyMint('client_test', baseUrl).floatingCheckout({
        productId: 'product_123', licenseKey: 'license_123', hostId: 'host_123'
      });
      assert.equal(result.expiresAt, '2026-10-26T12:30:00.000Z');
      assert.ok('expirationDate' in result);
      assert.equal(result.expirationDate, expirationDate);
    });
  });
}

test('activateKey tolerates older servers that omit expirationDate', async () => {
  await withServer(jsonResponder('/key/activate', { code: 0, message: 'License valid' }), async baseUrl => {
    const result = await new KeyMint('client_test', baseUrl).activateKey({
      productId: 'product_123', licenseKey: 'license_123'
    });
    assert.equal(result.expirationDate, undefined);
  });
});

function readJson(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', chunk => { raw += chunk; });
    request.on('end', () => {
      try { resolve({ raw, body: JSON.parse(raw) }); } catch (err) { reject(err); }
    });
    request.on('error', reject);
  });
}

test('deleteKey sends DELETE /key with the license in the JSON body, never the URL', async () => {
  const licenseKey = 'secret/license+key';
  await withServer(async (request, response) => {
    assert.equal(request.method, 'DELETE');
    assert.equal(request.url, '/key');
    assert.ok(!decodeURIComponent(request.url).includes(licenseKey));
    assert.equal(request.headers.authorization, 'Bearer admin_test');
    assert.match(request.headers['content-type'], /^application\/json/);
    const { body } = await readJson(request);
    assert.deepEqual(body, { productId: 'product_123', licenseKey });
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ message: 'Key deleted', code: 0 }));
  }, async baseUrl => {
    const result = await new KeyMint('admin_test', baseUrl).deleteKey({ productId: 'product_123', licenseKey });
    assert.deepEqual(result, { message: 'Key deleted', code: 0 });
  });
});

test('deleteKey rejects an unknown key with the SDK error shape', async () => {
  await withServer((request, response) => {
    request.resume();
    response.statusCode = 404;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ message: 'Invalid license key', code: 1 }));
  }, async baseUrl => {
    await assert.rejects(
      () => new KeyMint('admin_test', baseUrl).deleteKey({ productId: 'product_123', licenseKey: 'missing' }),
      error => {
        assert.deepEqual(error, { message: 'Invalid license key', code: 1, status: 404 });
        return true;
      }
    );
  });
});
