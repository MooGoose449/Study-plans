import app from "./app";
import { startBot } from "./bot/index";
import { logger } from "./lib/logger";

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
