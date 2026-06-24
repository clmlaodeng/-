const test = require("node:test");
const assert = require("node:assert/strict");

const { createServer, hasAiKey, startServer } = require("../server");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

test("detects AI key from environment", () => {
  assert.equal(hasAiKey({ OPENAI_API_KEY: "sk-test" }), true);
  assert.equal(hasAiKey({ DEEPSEEK_API_KEY: "deepseek-test" }), true);
  assert.equal(hasAiKey({}), false);
});

test("serves config status and generated problems", async () => {
  const server = createServer({ env: {}, callAi: null });
  const baseUrl = await listen(server);

  try {
    const statusResponse = await fetch(`${baseUrl}/api/config-status`);
    const status = await statusResponse.json();
    assert.equal(status.aiAvailable, false);

    const generateResponse = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: 4,
        difficulty: "medium",
        useAi: true,
        includeSolution: true,
      }),
    });
    const generated = await generateResponse.json();

    assert.equal(generateResponse.status, 200);
    assert.equal(generated.source, "local");
    assert.equal(generated.problems.length, 4);
    assert.match(generated.problems[0].question, /x/);
  } finally {
    server.close();
  }
});

test("serves the vertical type catalog", async () => {
  const server = createServer({ env: {}, callAi: null });
  const baseUrl = await listen(server);

  try {
    const response = await fetch(`${baseUrl}/api/catalog`);
    const catalog = await response.json();

    assert.equal(response.status, 200);
    assert.ok(catalog.categories.length >= 8);
    assert.ok(catalog.categories.some((category) => category.id === "special_position"));
    assert.ok(
      catalog.categories
        .flatMap((category) => category.types)
        .some((type) => type.id === "unknown_as_divisor")
    );
    assert.ok(Array.isArray(catalog.finderGroups));
    assert.ok(catalog.finderGroups.some((group) => group.title === "按年级阶段"));
    assert.ok(catalog.finderGroups.some((group) => group.title === "按易错点"));
    assert.ok(catalog.finderGroups.some((group) => group.title === "按题面特征"));
    assert.ok(
      catalog.finderGroups
        .flatMap((group) => group.items)
        .some((item) => item.query === "等号两边都有x")
    );
  } finally {
    server.close();
  }
});

test("starts on the next port when preferred port is occupied", async () => {
  const blocker = createServer({ env: {} });
  await new Promise((resolve) => blocker.listen(0, "127.0.0.1", resolve));
  const preferredPort = blocker.address().port;

  let app;
  try {
    app = await startServer({ preferredPort, host: "127.0.0.1", env: {} });

    assert.equal(app.port, preferredPort + 1);
    const html = await fetch(`http://127.0.0.1:${app.port}/`).then((response) => response.text());
    assert.match(html, /解方程练习生成器/);
  } finally {
    if (app) await new Promise((resolve) => app.server.close(resolve));
    await new Promise((resolve) => blocker.close(resolve));
  }
});
