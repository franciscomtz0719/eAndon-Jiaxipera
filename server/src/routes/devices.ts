import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { asyncHandler, HttpError, idParams, parse } from "../http.js";

export const devicesRouter = Router();

const GATEWAY_ID = 1;

const gatewayBody = z.object({
  host: z
    .string()
    .trim()
    .max(253)
    .regex(/^[A-Za-z0-9.-]*$/, "Expected an IP address or host name"),
  port: z.number().int().min(1).max(65535),
  pollIntervalMs: z.number().int().min(100).max(5000),
  timeoutMs: z.number().int().min(100).max(10000),
  watchdogCycles: z.number().int().min(1).max(1000),
  enabled: z.boolean(),
});

devicesRouter.get(
  "/gateway",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.gatewayConfig.upsert({ where: { id: GATEWAY_ID }, update: {}, create: { id: GATEWAY_ID } }));
  }),
);

devicesRouter.patch(
  "/gateway",
  asyncHandler(async (req, res) => {
    const data = parse(gatewayBody.partial(), req.body);
    res.json(await prisma.gatewayConfig.upsert({ where: { id: GATEWAY_ID }, update: data, create: { id: GATEWAY_ID, ...data } }));
  }),
);

const deviceBody = z.object({
  name: z.string().trim().max(100),
  workcenterId: z.string().trim().min(1),
  statusRow: z.number().int().min(1).max(5),
  // Modbus unit ids are 1-247; register addresses are 16-bit. Null until the register map is known.
  modbusUnitId: z.number().int().min(1).max(247).nullable(),
  registerAddress: z.number().int().min(0).max(65535).nullable(),
  readType: z.enum(["bit", "counter"]),
  active: z.boolean(),
});

async function assertDepartmentExists(statusRow: number | undefined) {
  if (statusRow === undefined) return;
  const definition = await prisma.statusDefinition.findUnique({ where: { statusRow } });
  if (!definition) throw new HttpError(400, `statusRow: department ${statusRow} does not exist`);
}

devicesRouter.get(
  "/devices",
  asyncHandler(async (_req, res) => {
    res.json(await prisma.device.findMany({ orderBy: [{ workcenterId: "asc" }, { statusRow: "asc" }] }));
  }),
);

devicesRouter.post(
  "/devices",
  asyncHandler(async (req, res) => {
    const data = parse(
      deviceBody.partial({ name: true, modbusUnitId: true, registerAddress: true, readType: true, active: true }),
      req.body,
    );
    await assertDepartmentExists(data.statusRow);
    res.status(201).json(await prisma.device.create({ data }));
  }),
);

devicesRouter.patch(
  "/devices/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    const data = parse(deviceBody.partial(), req.body);
    await assertDepartmentExists(data.statusRow);
    res.json(await prisma.device.update({ where: { id }, data }));
  }),
);

devicesRouter.delete(
  "/devices/:id",
  asyncHandler(async (req, res) => {
    const { id } = parse(idParams, req.params);
    await prisma.device.delete({ where: { id } });
    res.json({ success: true });
  }),
);
