import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, parse } from "../http.js";
import { startDetailsData, startDetailsOf, startDetailsSchema } from "../detailStructure.js";

export const statusDefinitionsRouter = Router();

const rowParams = z.object({ statusRow: z.coerce.number().int().min(1).max(5) });

const definitionBody = z.object({
  statusName: z.string().trim().min(1).max(50),
  statusEnabled: z.boolean(),
  statusDetailsEnabled: z.number().int().min(0).max(3),
  iconName: z.string().trim().max(60).regex(/^[a-z0-9 -]*$/, "Expected Font Awesome classes, e.g. \"fa fa-cogs\""),
});

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

  // Every setting of the department moves with it; only statusRow (the button position) stays.
  const fieldsOf = ({ statusRow: _row, ...fields }: typeof current) => fields;

  await prisma.$transaction([
    prisma.statusDefinition.update({ where: { statusRow }, data: fieldsOf(neighbor) }),
    prisma.statusDefinition.update({ where: { statusRow: neighborRow }, data: fieldsOf(current) }),
  ]);

  res.json({ success: true });
}));

// Alarm details editor: the whole configuration of one department, already parsed (see detailStructure.ts).
statusDefinitionsRouter.put("/status-definitions/:statusRow/details", asyncHandler(async (req, res) => {
  const { statusRow } = parse(rowParams, req.params);
  const details = parse(startDetailsSchema, req.body);

  const current = await prisma.statusDefinition.findUnique({ where: { statusRow } });
  if (!current) throw new HttpError(404, "Status definition not found");

  const updated = await prisma.statusDefinition.update({ where: { statusRow }, data: startDetailsData(current, details) });
  res.json({ ...updated, startDetails: startDetailsOf(updated) });
}));
