import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../http.js";

export const bootstrapRouter = Router();

bootstrapRouter.get(
  "/bootstrap",
  asyncHandler(async (_req, res) => {
    const [statusDefinitions, settings, localization, areas, workcenters] = await Promise.all([
      prisma.statusDefinition.findMany({ orderBy: { statusRow: "asc" } }),
      prisma.settings.findMany(),
      prisma.localization.findMany(),
      prisma.area.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
      prisma.workcenter.findMany({ orderBy: { workcenterRow: "asc" } }),
    ]);
    res.json({ statusDefinitions, settings, localization, areas, workcenters });
  }),
);
