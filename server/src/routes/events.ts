import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { asyncHandler, idParams, parse } from "../http.js";
import { closeFromComputer, openFromComputer, registerPress } from "../events.js";

export const eventsRouter = Router();

const NO_AREA = "none";
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const statusRow = z.number().int().min(1).max(5);
// "-- N/A --" is what the details dialog sends when an option was left unselected.
const detail = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v === "-- N/A --" ? undefined : v));

async function workcenterIdsInArea(areaId: number | typeof NO_AREA) {
  const stations = await prisma.workcenter.findMany({ where: { areaId: areaId === NO_AREA ? null : areaId }, select: { workcenterId: true } });
  return stations.map((s) => s.workcenterId);
}

const areaParam = z.union([z.literal(NO_AREA), z.coerce.number().int().positive()]);

eventsRouter.get(
  "/events/open",
  asyncHandler(async (req, res) => {
    const { areaId } = parse(z.object({ areaId: areaParam.optional() }), req.query);
    const where: Prisma.AlarmEventWhereInput = { state: "open" };
    if (areaId !== undefined) where.workcenterId = { in: await workcenterIdsInArea(areaId) };
    res.json(await prisma.alarmEvent.findMany({ where, orderBy: { openedAt: "asc" } }));
  }),
);

eventsRouter.get(
  "/events",
  asyncHandler(async (req, res) => {
    const query = parse(
      z.object({
        areaId: areaParam.optional(),
        workcenterId: z.string().trim().max(50).optional(),
        state: z.enum(["open", "closed"]).optional(),
        startDate: date.optional(),
        endDate: date.optional(),
        limit: z.coerce.number().int().min(1).max(5000).default(1000),
      }),
      req.query,
    );
    const where: Prisma.AlarmEventWhereInput = {};
    if (query.areaId !== undefined) where.workcenterId = { in: await workcenterIdsInArea(query.areaId) };
    if (query.workcenterId) where.workcenterId = query.workcenterId;
    if (query.state) where.state = query.state;
    if (query.startDate || query.endDate) {
      const end = query.endDate ? new Date(query.endDate) : undefined;
      end?.setHours(23, 59, 59, 999);
      where.openedAt = { ...(query.startDate ? { gte: new Date(query.startDate) } : {}), ...(end ? { lte: end } : {}) };
    }
    res.json(await prisma.alarmEvent.findMany({ where, orderBy: { openedAt: "desc" }, take: query.limit }));
  }),
);

// Button presses: the acquisition service sends source "button"; the admin page sends "simulated" for tests.
eventsRouter.post(
  "/presses",
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({
        workcenterId: z.string().trim().min(1).max(50),
        statusRow,
        source: z.enum(["button", "simulated"]),
        deviceId: z.number().int().positive().optional(),
        idempotencyKey: z.string().trim().min(1).max(200).optional(),
      }),
      req.body,
    );
    res.json(await registerPress(body));
  }),
);

eventsRouter.get(
  "/presses",
  asyncHandler(async (req, res) => {
    const { workcenterId, limit } = parse(
      z.object({ workcenterId: z.string().trim().min(1).max(50), limit: z.coerce.number().int().min(1).max(500).default(20) }),
      req.query,
    );
    res.json(await prisma.buttonPress.findMany({ where: { workcenterId }, orderBy: { pressedAt: "desc" }, take: limit }));
  }),
);

eventsRouter.post(
  "/events",
  asyncHandler(async (req, res) => {
    const body = parse(
      z.object({ workcenterId: z.string().trim().min(1).max(50), statusRow, detailLocation: detail, detailType: detail, detailText: detail }),
      req.body,
    );
    res.status(201).json(await openFromComputer(body));
  }),
);

eventsRouter.post(
  "/events/:id/close",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    res.json(await closeFromComputer(id));
  }),
);
