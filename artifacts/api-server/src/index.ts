import app from "./app";
import { startBot } from "./bot/index";
import { logger } from "./lib/logger";

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

function startKeepAlive(baseUrl: string): void {
  const url = `${baseUrl}/api/healthz`;
  setInterval(async () => {
    try {
      const res = await fetch(url);
      logger.debug({ status: res.status }, "Keep-alive ping");
    } catch (err) {
      logger.warn({ err }, "Keep-alive ping failed");
    }
  }, PING_INTERVAL_MS);
  logger.info({ url, intervalMinutes: 14 }, "Keep-alive pinger started");
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
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

  // Keep-alive ping — prevents Render free-tier spin-down.
  // RENDER_EXTERNAL_URL is set automatically by Render; APP_URL is a manual override.
  const baseUrl = process.env["RENDER_EXTERNAL_URL"] ?? process.env["APP_URL"];
  if (baseUrl) {
    startKeepAlive(baseUrl.replace(/\/$/, ""));
  }
});

// Start Discord bot
startBot()
  .then(() => {
    logger.info("Discord bot started");
  })
  .catch((err) => {
    logger.error({ err }, "Failed to start Discord bot — server continues running");
    // Don't exit: the HTTP server (health check for Render) should stay up
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down");
  void import("./bot/index").then(({ stopBot }) => {
    stopBot();
    process.exit(0);
  });
});
