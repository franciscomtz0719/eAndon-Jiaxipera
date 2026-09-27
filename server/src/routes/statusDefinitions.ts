import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, parse } from "../http.js";

export const statusDefinitionsRouter = Router();

const rowParams = z.object({ statusRow: z.coerce.number().int().min(1).max(5) });

const definitionBody = z.object({
  statusName: z.string().trim().min(1).max(50),
  statusEnabled: z.boolean(),
  statusDetailsEnabled: z.number().int().min(0).max(3),
  iconName: z.string().trim().max(60).regex(/^[a-z0-9 -]*$/, "Expected Font Awesome classes, e.g. \"fa fa-cogs\""),
});

// Alarm details: "OFF", or "ON" optionally followed by "|option|option…".
const detailStructure = z.string().max(2000).regex(/^(OFF|ON(\|.*)?)$/, 'Expected "OFF" or "ON|option|option…"');

statusDefinitionsRouter.patch("/status-definitions/:statusRow", asyncHandler(async (req, res) => {
  const { statusRow } = parse(rowParams, req.params);
  const { statusName, statusEnabled, statusDetailsEnabled, iconName } = parse(definitionBody.partial(), req.body);

  const updated = await prisma.statusDefinition.update({
    where: { statusRow },
    data: {
      ...(statusName !== undefined ? { statusName } : {}),
      ...(statusEnabled !== undefined ? { statusEnabled } : {}),
      ...(statusDetailsEnabled !== undefined ? { statusDetailsEnabled } : {}),
      ...(iconName !== undefined ? { iconName } : {}),
    },
  });
  res.json(updated);
}));

statusDefinitionsRouter.post("/status-definitions/:statusRow/move", asyncHandler(async (req, res) => {
  const { statusRow } = parse(rowParams, req.params);
  const { direction } = parse(z.object({ direction: z.enum(["up", "down"]) }), req.body);

  const current = await prisma.statusDefinition.findUnique({ where: { statusRow } });
  if (!current) throw new HttpError(404, "Status definition not found");

  const neighborRow = direction === "up" ? statusRow - 1 : statusRow + 1;
  const neighbor = await prisma.statusDefinition.findUnique({ where: { statusRow: neighborRow } });
  if (!neighbor) throw new HttpError(400, "Cannot move status further");

  const swapFields = { statusName: current.statusName, statusEnabled: current.statusEnabled, statusDetailsEnabled: current.statusDetailsEnabled, iconName: current.iconName };
  const neighborFields = { statusName: neighbor.statusName, statusEnabled: neighbor.statusEnabled, statusDetailsEnabled: neighbor.statusDetailsEnabled, iconName: neighbor.iconName };

  await prisma.$transaction([
    prisma.statusDefinition.update({ where: { statusRow }, data: neighborFields }),
    prisma.statusDefinition.update({ where: { statusRow: neighborRow }, data: swapFields }),
  ]);

  res.json({ success: true });
}));

statusDefinitionsRouter.patch("/status-definitions/index/:statusIndex/start-details", asyncHandler(async (req, res) => {
  const { statusIndex } = parse(z.object({ statusIndex: z.coerce.number().int().min(0).max(4) }), req.params);
  const { failureLocationOptions, failureTypeOptions, detailsTextOptions } = parse(
    z.object({ failureLocationOptions: detailStructure, failureTypeOptions: detailStructure, detailsTextOptions: detailStructure }),
    req.body,
  );

  const statusRow = statusIndex + 1;
  const existing = await prisma.statusDefinition.findUnique({ where: { statusRow } });
  if (!existing) throw new HttpError(404, "Status definition not found");

  await prisma.statusDefinition.update({
    where: { statusRow },
    data: {
      alarmStartText1Structure: failureLocationOptions,
      alarmStartText2Structure: failureTypeOptions,
      alarmStartText3Structure: detailsTextOptions,
    },
  });

  res.json({ success: true });
}));
