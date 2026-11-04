
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// .envを読み込む
const envPath = path.join(__dirname, ".env");

for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const index = trimmed.indexOf("=");
  if (index === -1) continue;

  const key = trimmed.slice(0, index).trim();
  const value = trimmed.slice(index + 1).trim();
  process.env[key] = value;
}

const PORT = 8787;
const HOST = "127.0.0.1";

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
const DEV_TOKEN = process.env.GIFT_MEMORY_DEV_TOKEN;

if (!SUPABASE_URL || !PUBLISHABLE_KEY || !DEV_TOKEN) {
  throw new Error("必要な環境変数が設定されていません");
}

const allowedOrigins = new Set([
  "http://127.0.0.1:5500",
  "http://localhost:5500",
]);

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;

  // Live Server以外からのブラウザアクセスを制限
  if (!origin || !allowedOrigins.has(origin)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  if (req.url !== "/recommend-gifts" || req.method !== "POST") {
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  try {
    let body = "";

    for await (const chunk of req) {
      body += chunk;
      if (body.length > 10000) {
        throw new Error("Request too large");
      }
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/recommend-gifts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": PUBLISHABLE_KEY,
          "x-gift-memory-dev-token": DEV_TOKEN,
        },
        body,
      }
    );

    const result = await response.text();

    res.writeHead(response.status, corsHeaders);
    res.end(result);
  } catch (error) {
    console.error("Local API error:", error);

    res.writeHead(500, corsHeaders);
    res.end(JSON.stringify({
      error: "ローカルAPIサーバーでエラーが発生しました",
    }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Gift Memory Dev API: http://${HOST}:${PORT}`);
});
