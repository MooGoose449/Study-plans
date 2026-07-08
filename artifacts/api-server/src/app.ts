import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { getCacheStats } from "./bot/utils/cache.js";
import { getQueueStats } from "./bot/reminders/dmQueue.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Simple metrics endpoint exposing cache + queue stats
app.get("/metrics", (_req, res) => {
  try {
    const cache = getCacheStats();
    const queue = getQueueStats();
    res.json({ cache, queue });
  } catch (err) {
    res.status(500).json({ error: "Metrics unavailable" });
  }
});

export default app;
