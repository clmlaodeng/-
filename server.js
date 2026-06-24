const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const { generateProblems, getFinderGroups, getTypeCatalog } = require("./src/generator");

const PUBLIC_DIR = path.join(__dirname, "public");
const DEFAULT_PORT = 3107;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function hasAiKey(env = process.env) {
  return Boolean(env.OPENAI_API_KEY || env.DEEPSEEK_API_KEY);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large"));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", reject);
  });
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const pathname = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(content);
  });
}

function getAiProvider(env = process.env) {
  if (env.OPENAI_API_KEY) {
    return {
      apiKey: env.OPENAI_API_KEY,
      baseUrl: env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      model: env.OPENAI_MODEL || "gpt-4o-mini",
    };
  }

  if (env.DEEPSEEK_API_KEY) {
    return {
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/chat/completions",
      model: env.DEEPSEEK_MODEL || "deepseek-chat",
    };
  }

  return null;
}

async function callAiProvider(options, env = process.env) {
  const provider = getAiProvider(env);
  const apiKey = provider?.apiKey;
  if (!apiKey) {
    throw new Error("AI API key is not configured");
  }

  const prompt = [
    "你是一名小学高年级到初一数学老师。",
    "请生成基础解方程练习题，避免超纲，只输出 JSON。",
    `题目数量：${options.count}`,
    `难度：${options.difficulty}`,
    `是否包含解析：${options.includeSolution !== false}`,
    'JSON 格式：{"problems":[{"question":"2x + 3 = 9","answer":3,"solution":"..."}]}',
  ].join("\n");

  const response = await fetch(provider.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed.problems)) {
    throw new Error("AI response did not include problems");
  }

  return {
    message: "已使用 AI 增强生成。",
    problems: parsed.problems.map((problem) => ({
      question: String(problem.question || ""),
      answer: Number(problem.answer),
      solution: options.includeSolution === false ? "" : String(problem.solution || ""),
      equation: problem.equation || null,
    })),
  };
}

function createServer(options = {}) {
  const env = options.env || process.env;
  const aiAvailable = hasAiKey(env);
  const callAi = options.callAi || ((payload) => callAiProvider(payload, env));

  return http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, "http://localhost");

    if (request.method === "GET" && requestUrl.pathname === "/api/config-status") {
      sendJson(response, 200, { aiAvailable });
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/catalog") {
      sendJson(response, 200, { categories: getTypeCatalog(), finderGroups: getFinderGroups() });
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/generate") {
      try {
        const payload = await readRequestBody(request);
        const result = await generateProblems(payload, { aiAvailable, callAi });
        sendJson(response, 200, result);
      } catch (error) {
        sendJson(response, 400, { error: error.message });
      }
      return;
    }

    if (request.method === "GET") {
      serveStatic(request, response);
      return;
    }

    response.writeHead(405);
    response.end("Method not allowed");
  });
}

function listenOnPort(server, port, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

async function startServer(options = {}) {
  const preferredPort = Number.parseInt(options.preferredPort || process.env.PORT || DEFAULT_PORT, 10);
  const host = options.host || "0.0.0.0";
  const maxAttempts = options.maxAttempts || 20;

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = preferredPort + offset;
    const server = createServer(options);

    try {
      await listenOnPort(server, port, host);
      return { server, port, host };
    } catch (error) {
      if (error.code !== "EADDRINUSE" || offset === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("No available port found");
}

if (require.main === module) {
  startServer()
    .then(({ port }) => {
      console.log(`解方程练习生成器已启动：http://localhost:${port}`);
    })
    .catch((error) => {
      console.error(`启动失败：${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = {
  DEFAULT_PORT,
  createServer,
  hasAiKey,
  startServer,
};
