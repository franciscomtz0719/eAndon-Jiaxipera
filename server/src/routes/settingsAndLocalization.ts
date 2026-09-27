import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, parse } from "../http.js";
import { LOCKOUT_SETTING_ID } from "../events.js";

export const settingsRouter = Router();

/** Minutes before an open alarm turns from yellow to red on the boards (client/src/lib/settings.ts). */
const RED_AFTER_SETTING_ID = 6;

settingsRouter.patch(
  "/settings/:settingId",
  asyncHandler(async (req, res) => {
    const { settingId } = parse(z.object({ settingId: z.coerce.number().int().positive() }), req.params);
    const { value } = parse(z.object({ value: z.string().trim().min(1).max(200) }), req.body);

    const setting = await prisma.settings.findUnique({ where: { settingId } });
    if (!setting) throw new HttpError(404, "Setting not found");
    // Settings with a "|" list only accept one of the listed options.
    const options = setting.possibleSettings.split("|");
    if (options.length > 1 && !options.includes(value)) {
      throw new HttpError(400, `value: must be one of ${options.join(", ")}`);
    }
    if (settingId === LOCKOUT_SETTING_ID) {
      const seconds = Number(value);
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 600) throw new HttpError(400, "value: lockout must be a whole number of seconds between 5 and 600");
    }
    if (settingId === RED_AFTER_SETTING_ID) {
      const minutes = Number(value);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) throw new HttpError(400, "value: must be a whole number of minutes between 1 and 240");
    }

    res.json(await prisma.settings.update({ where: { settingId }, data: { currentSetting: value } }));
  }),
);

settingsRouter.post(
  "/settings/reset",
  asyncHandler(async (_req, res) => {
    const all = await prisma.settings.findMany();
    await prisma.$transaction(
      all.map((s) => prisma.settings.update({ where: { settingId: s.settingId }, data: { currentSetting: s.defaultSetting } })),
    );
    res.json({ success: true });
  }),
);

settingsRouter.patch(
  "/localization/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().min(1).max(200) }), req.params);
    const { spanish } = parse(z.object({ spanish: z.string().max(500) }), req.body);
    res.json(await prisma.localization.update({ where: { id }, data: { spanish } }));
  }),
);
