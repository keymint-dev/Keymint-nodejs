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
