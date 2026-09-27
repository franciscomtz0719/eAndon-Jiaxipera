import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../http.js";
import { startDetailsOf } from "../detailStructure.js";

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
    // The client reads alarm details already parsed and never handles the stored "ON|…" format.
    res.json({
      statusDefinitions: statusDefinitions.map((def) => ({ ...def, startDetails: startDetailsOf(def) })),
      settings,
      localization,
      areas,
      workcenters,
    });
  }),
);
