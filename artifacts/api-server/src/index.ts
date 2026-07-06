import app from "./app";
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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Render free tier spins down after 15 minutes of inactivity.
  // Ping our own healthz endpoint every 14 minutes to keep the instance warm.
  const renderUrl = process.env["RENDER_EXTERNAL_URL"];
  if (renderUrl) {
    const pingUrl = new URL("/api/healthz", renderUrl).toString();
    logger.info({ pingUrl }, "Render wake-up ping enabled");

    setInterval(async () => {
      try {
        const res = await fetch(pingUrl);
        if (res.ok) {
          logger.info({ status: res.status }, "Render wake-up ping sent");
        } else {
          logger.warn({ status: res.status }, "Render wake-up ping returned non-OK status");
        }
      } catch (err) {
        logger.warn({ err }, "Render wake-up ping failed");
      }
    }, 14 * 60 * 1000);
  } else {
    logger.info("Render wake-up ping disabled (RENDER_EXTERNAL_URL not set)");
  }
});
