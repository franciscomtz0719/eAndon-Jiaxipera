import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";

import { bootstrapRouter } from "./routes/bootstrap.js";
import { workcentersRouter } from "./routes/workcenters.js";
import { eventsRouter } from "./routes/events.js";
import { statisticsRouter } from "./routes/statistics.js";
import { statusDefinitionsRouter } from "./routes/statusDefinitions.js";
import { settingsRouter } from "./routes/settingsAndLocalization.js";
import { areasRouter } from "./routes/areas.js";
import { screensRouter } from "./routes/screens.js";
import { shiftsRouter } from "./routes/shifts.js";
import { devicesRouter } from "./routes/devices.js";
import { translateRouter } from "./routes/translate.js";
import { asyncHandler, errorHandler } from "./http.js";
import { prisma } from "./db.js";
import { setIo } from "./realtime.js";
import { backfillChineseNames } from "./translate.js";

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.use("/api", bootstrapRouter);
app.use("/api", workcentersRouter);
app.use("/api", eventsRouter);
app.use("/api", statisticsRouter);
app.use("/api", statusDefinitionsRouter);
app.use("/api", settingsRouter);
app.use("/api", areasRouter);
app.use("/api", screensRouter);
app.use("/api", shiftsRouter);
app.use("/api", devicesRouter);
app.use("/api", translateRouter);

// Changes on every restart or deploy; TV boards reload themselves when it changes.
const SERVER_VERSION = new Date().toISOString();

// TV boards poll this to detect a lost connection. "gateway" becomes "ok" / "down" once the
// acquisition service reports in (phase 2); until then it is "unknown" or "not_configured".
app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    const gateway = await prisma.gatewayConfig.findUnique({ where: { id: 1 } });
    res.json({ ok: true, version: SERVER_VERSION, gateway: gateway?.enabled ? "unknown" : "not_configured" });
  }),
);

app.use(errorHandler);

// Older handlers are not wrapped in asyncHandler yet; log their failures instead of letting one
// bad request take down the andon server.
process.on("unhandledRejection", (err) => console.error("Unhandled rejection:", err));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: CLIENT_ORIGIN } });
setIo(io);

httpServer.listen(PORT, () => {
  console.log(`eAndon API listening on http://localhost:${PORT}`);
  backfillChineseNames().catch(console.error);
});
