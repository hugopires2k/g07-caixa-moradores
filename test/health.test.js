const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../index.js');

test('GET /health responde 200 com status ok', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
  } finally {
    server.close();
  }
});

test('Rota inexistente responde 404', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/rota-que-nao-existe`);
    assert.strictEqual(res.status, 404);
  } finally {
    server.close();
  }
});
