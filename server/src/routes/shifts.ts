import { Router } from "express";
import { z } from "zod";
import type { Shift } from "@prisma/client";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, idParams, parse } from "../http.js";

export const shiftsRouter = Router();

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:MM (24 h)");

const shiftBody = z.object({
  name: z.string().trim().min(1).max(50),
  startTime: time,
  endTime: time,
  days: z.array(z.number().int().min(1).max(7)).min(1).max(7),
  active: z.boolean(),
});

// Days are stored as "1,2,3" (ISO weekdays) but exchanged with the client as number arrays.
function toApi(shift: Shift) {
  return { ...shift, days: shift.days.split(",").filter(Boolean).map(Number) };
}

function serializeDays(days: number[]) {
  return [...new Set(days)].sort((a, b) => a - b).join(",");
}

function assertNotEmpty(startTime: string, endTime: string) {
  if (startTime === endTime) throw new HttpError(400, "startTime and endTime must be different");
}

shiftsRouter.get(
  "/shifts",
  asyncHandler(async (_req, res) => {
    const shifts = await prisma.shift.findMany({ orderBy: { startTime: "asc" } });
    res.json(shifts.map(toApi));
  }),
);

shiftsRouter.post(
  "/shifts",
  asyncHandler(async (req, res) => {
    const { days, ...data } = parse(shiftBody.partial({ active: true }), req.body);
    assertNotEmpty(data.startTime, data.endTime);
    const created = await prisma.shift.create({ data: { ...data, days: serializeDays(days) } });
    res.status(201).json(toApi(created));
  }),
);

shiftsRouter.patch(
  "/shifts/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    const { days, ...data } = parse(shiftBody.partial(), req.body);
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, "Shift not found");
    assertNotEmpty(data.startTime ?? existing.startTime, data.endTime ?? existing.endTime);

    const updated = await prisma.shift.update({
      where: { id },
      data: { ...data, ...(days ? { days: serializeDays(days) } : {}) },
    });
    res.json(toApi(updated));
  }),
);

shiftsRouter.delete(
  "/shifts/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    await prisma.shift.delete({ where: { id } });
    res.json({ success: true });
  }),
);
