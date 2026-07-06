import app from "./app";
import { startBot } from "./bot/index";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

/** Ping our own health endpoint to prevent Render free-tier spin-down. */
function startHttpKeepAlive(port: number): void {
  // Prefer the public Render URL so the ping goes through the load balancer.
  // Fall back to localhost so it always works even without that var set.
  const raw =
    process.env["RENDER_EXTERNAL_URL"] ??
    process.env["APP_URL"] ??
    `http://localhost:${port}`;
  const url = `${raw.replace(/\/$/, "")}/api/healthz`;

  setInterval(async () => {
    try {
      const res = await fetch(url);
      logger.debug({ status: res.status }, "Keep-alive HTTP ping");
    } catch (err) {
      logger.warn({ err }, "Keep-alive HTTP ping failed");
    }
  }, PING_INTERVAL_MS);

  logger.info({ url, intervalMinutes: 14 }, "HTTP keep-alive started");
}

/** Run a cheap query every 14 minutes to keep the Neon connection warm. */
function startDbKeepAlive(): void {
  setInterval(async () => {
    try {
      await pool.query("SELECT 1");
      logger.debug("Keep-alive DB ping");
    } catch (err) {
      logger.warn({ err }, "Keep-alive DB ping failed");
    }
  }, PING_INTERVAL_MS);

  logger.info({ intervalMinutes: 14 }, "DB keep-alive started");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start Express server
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");

  startHttpKeepAlive(port);
  startDbKeepAlive();
});

// Start Discord bot
startBot()
  .then(() => {
    logger.info("Discord bot started");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to start Discord bot — server continues running");
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down");
  void import("./bot/index").then(({ stopBot }) => {
    stopBot();
    process.exit(0);
  });
});
