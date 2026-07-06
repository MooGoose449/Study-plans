import http from "http";
import app from "./app";
import { startBot, stopBot } from "./bot/index";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes — keeps Render free-tier from sleeping

/** Ping our own health endpoint to prevent Render free-tier spin-down. */
function startHttpKeepAlive(port: number): NodeJS.Timeout {
  const raw =
    process.env["RENDER_EXTERNAL_URL"] ??
    process.env["APP_URL"] ??
    `http://localhost:${port}`;
  const url = new URL("/api/healthz", raw.replace(/\/$/, "")).toString();

  const sendPing = async () => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        logger.debug({ status: res.status }, "Keep-alive HTTP ping");
      } else {
        logger.warn({ status: res.status }, "Keep-alive HTTP ping returned non-OK status");
      }
    } catch (err) {
      logger.warn({ err }, "Keep-alive HTTP ping failed");
    }
  };

  void sendPing();
  const interval = setInterval(sendPing, PING_INTERVAL_MS);
  logger.info({ url, intervalMinutes: 5 }, "HTTP keep-alive started");
  return interval;
}

/** Run a cheap query every 5 minutes to keep the Neon connection warm. */
function startDbKeepAlive(): NodeJS.Timeout {
  const sendPing = async () => {
    try {
      await pool.query("SELECT 1");
      logger.debug("Keep-alive DB ping");
    } catch (err) {
      logger.warn({ err }, "Keep-alive DB ping failed");
    }
  };

  void sendPing();
  const interval = setInterval(sendPing, PING_INTERVAL_MS);
  logger.info({ intervalMinutes: 5 }, "DB keep-alive started");
  return interval;
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server explicitly so we can close it on shutdown
const server = http.createServer(app);

server.on("error", (err) => {
  logger.error({ err }, "Server error");
  process.exit(1);
});

server.listen(port, () => {
  logger.info({ port }, "Server listening");

  startHttpKeepAlive(port);
  startDbKeepAlive();
});

// Start Discord bot (non-fatal if it fails — server keeps running)
startBot()
  .then(() => {
    logger.info("Discord bot started");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to start Discord bot — server continues running");
  });

// Graceful shutdown — close bot, HTTP server, and DB pool before exiting
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received");

  stopBot();

  await new Promise<void>((resolve) => {
    server.close((err) => {
      if (err) logger.warn({ err }, "Error closing HTTP server");
      resolve();
    });
  });

  await pool.end().catch((err) => logger.warn({ err }, "Error closing DB pool"));

  logger.info("Shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT",  () => { void shutdown("SIGINT"); });
