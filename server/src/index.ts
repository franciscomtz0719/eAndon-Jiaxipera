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
import { errorHandler } from "./http.js";
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

app.get("/api/health", (_req, res) => res.json({ ok: true }));

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
