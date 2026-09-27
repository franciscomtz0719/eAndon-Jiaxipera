import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, parse } from "../http.js";
import { toChinese } from "../translate.js";

export const workcentersRouter = Router();

workcentersRouter.get("/workcenters", async (_req, res) => {
  const workcenters = await prisma.workcenter.findMany({ orderBy: { workcenterRow: "asc" } });
  res.json(workcenters);
});

workcentersRouter.get("/workcenters/:workcenterId", async (req, res) => {
  const workcenter = await prisma.workcenter.findUnique({ where: { workcenterId: req.params.workcenterId } });
  if (!workcenter) return res.status(404).json({ error: "Workcenter not found" });
  res.json(workcenter);
});

const rowParams = z.object({ workcenterRow: z.coerce.number().int().positive() });

const workcenterBody = z.object({
  workcenterId: z.string().trim().min(1).max(50),
  workcenterName: z.string().trim().min(1).max(100),
  workcenterNameZh: z.string().trim().max(100),
  areaId: z.number().int().positive().nullable(),
});

workcentersRouter.post(
  "/workcenters",
  asyncHandler(async (req, res) => {
    const { workcenterId, workcenterName, workcenterNameZh: givenZh, areaId } = parse(workcenterBody.partial({ workcenterNameZh: true, areaId: true }), req.body);

    const existing = await prisma.workcenter.findUnique({ where: { workcenterId } });
    if (existing) throw new HttpError(400, "The workcenter ID must be unique.");

    const last = await prisma.workcenter.findFirst({ orderBy: { workcenterRow: "desc" } });
    const nextRow = (last?.workcenterRow ?? 0) + 1;

    // A new station without a Chinese name gets one translated from its Spanish/English name.
    const workcenterNameZh = givenZh || (await toChinese(workcenterName));

    const created = await prisma.workcenter.create({
      data: { workcenterRow: nextRow, workcenterId, workcenterName, workcenterNameZh, areaId, status1: "green", status2: "green", status3: "green", status4: "green", status5: "green" },
    });
    res.status(201).json(created);
  }),
);

workcentersRouter.patch(
  "/workcenters/:workcenterRow",
  asyncHandler(async (req, res) => {
    const { workcenterRow } = parse(rowParams, req.params);
    const { workcenterName, workcenterNameZh, workcenterId, areaId } = parse(workcenterBody.partial(), req.body);

    // Renaming never re-translates: the Chinese name only changes when it is sent explicitly
    // (typed by hand or filled with the "Translate" button).
    // Renaming workcenterId cascades to its devices (FK onUpdate: Cascade).
    const updated = await prisma.workcenter.update({
      where: { workcenterRow },
      data: {
        ...(workcenterName !== undefined ? { workcenterName } : {}),
        ...(workcenterNameZh !== undefined ? { workcenterNameZh } : {}),
        ...(workcenterId !== undefined ? { workcenterId } : {}),
        ...(areaId !== undefined ? { areaId } : {}),
      },
    });
    res.json(updated);
  }),
);

// Reordering renumbers workcenterRow (the display order) instead of copying fields between rows,
// so workcenterId stays unique throughout and every column moves with its station.
const PARKED_ROW = -1;

workcentersRouter.post(
  "/workcenters/:workcenterRow/move",
  asyncHandler(async (req, res) => {
    const { workcenterRow } = parse(rowParams, req.params);
    const { direction } = parse(z.object({ direction: z.enum(["up", "down"]) }), req.body);

    const current = await prisma.workcenter.findUnique({ where: { workcenterRow } });
    if (!current) throw new HttpError(404, "Workcenter not found");

    const neighborRow = direction === "up" ? workcenterRow - 1 : workcenterRow + 1;
    const neighbor = await prisma.workcenter.findUnique({ where: { workcenterRow: neighborRow } });
    if (!neighbor) throw new HttpError(400, "Cannot move workcenter further");

    await prisma.$transaction([
      prisma.workcenter.update({ where: { workcenterRow }, data: { workcenterRow: PARKED_ROW } }),
      prisma.workcenter.update({ where: { workcenterRow: neighborRow }, data: { workcenterRow } }),
      prisma.workcenter.update({ where: { workcenterRow: PARKED_ROW }, data: { workcenterRow: neighborRow } }),
    ]);

    res.json({ success: true });
  }),
);

// Deleting a workcenter also deletes its devices (FK onDelete: Cascade); its logs are kept.
workcentersRouter.delete(
  "/workcenters/:workcenterRow",
  asyncHandler(async (req, res) => {
    const { workcenterRow } = parse(rowParams, req.params);

    const toDelete = await prisma.workcenter.findUnique({ where: { workcenterRow } });
    if (!toDelete) throw new HttpError(404, "Workcenter not found");

    const following = await prisma.workcenter.findMany({
      where: { workcenterRow: { gt: workcenterRow } },
      orderBy: { workcenterRow: "asc" },
    });

    await prisma.$transaction(async (tx) => {
      await tx.workcenter.delete({ where: { workcenterRow } });
      for (const wc of following) {
        await tx.workcenter.update({ where: { workcenterRow: wc.workcenterRow }, data: { workcenterRow: wc.workcenterRow - 1 } });
      }
    });

    res.json({ success: true });
  }),
);
