import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, idParams, parse } from "../http.js";
import { toChinese } from "../translate.js";

export const areasRouter = Router();

const areaBody = z.object({
  name: z.string().trim().min(1).max(100),
  nameZh: z.string().trim().max(100),
  sortOrder: z.number().int().min(0).max(10000),
  active: z.boolean(),
});

areasRouter.get(
  "/areas",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.area.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }));
  }),
);

areasRouter.post(
  "/areas",
  asyncHandler(async (req, res) => {
    const { nameZh, ...data } = parse(areaBody.partial({ nameZh: true, sortOrder: true, active: true }), req.body);
    const last = await prisma.area.findFirst({ orderBy: { sortOrder: "desc" } });
    // Like stations: a new area without a Chinese name gets one translated; renaming never re-translates.
    const created = await prisma.area.create({
      data: { sortOrder: (last?.sortOrder ?? 0) + 1, ...data, nameZh: nameZh || (await toChinese(data.name)) },
    });
    res.status(201).json(created);
  }),
);

areasRouter.patch(
  "/areas/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    const data = parse(areaBody.partial(), req.body);
    res.json(await prisma.area.update({ where: { id }, data }));
  }),
);

// Stations and screens of a deleted area are left without area (onDelete: SetNull), not deleted.
areasRouter.delete(
  "/areas/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    await prisma.area.delete({ where: { id } });
    res.json({ success: true });
  }),
);
