import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, idParams, parse } from "../http.js";

export const screensRouter = Router();

const screenBody = z.object({
  name: z.string().trim().min(1).max(100),
  areaId: z.number().int().positive().nullable(),
  volume: z.number().int().min(0).max(100),
  soundEnabled: z.boolean(),
});

screensRouter.get(
  "/screens",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.screen.findMany({ orderBy: { id: "asc" } }));
  }),
);

// Used by the TV boards, which only know their own screen id.
screensRouter.get(
  "/screens/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    const screen = await prisma.screen.findUnique({ where: { id } });
    if (!screen) throw new HttpError(404, "Screen not found");
    res.json(screen);
  }),
);

screensRouter.post(
  "/screens",
  asyncHandler(async (req, res) => {
    const data = parse(screenBody.partial({ areaId: true, volume: true, soundEnabled: true }), req.body);
    res.status(201).json(await prisma.screen.create({ data }));
  }),
);

screensRouter.patch(
  "/screens/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    const data = parse(screenBody.partial(), req.body);
    res.json(await prisma.screen.update({ where: { id }, data }));
  }),
);

screensRouter.delete(
  "/screens/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    await prisma.screen.delete({ where: { id } });
    res.json({ success: true });
  }),
);
