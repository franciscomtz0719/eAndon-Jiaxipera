import { Router } from "express";
import { prisma } from "../db.js";
import { decodeStatus, encodeStatus } from "../util.js";
import { emitStatusUpdate } from "../realtime.js";

export const statusRouter = Router();

const STATUS_FIELDS = ["status1", "status2", "status3", "status4", "status5"] as const;

statusRouter.post("/workcenters/:workcenterId/status/:statusIndex", async (req, res) => {
  const { workcenterId } = req.params;
  const statusIndex = Number(req.params.statusIndex);
  const { workcenterName, alarmName, color, dropdown1 = "", dropdown2 = "", textField = "" } = req.body as {
    workcenterName?: string;
    alarmName?: string;
    color: "red" | "green";
    dropdown1?: string;
    dropdown2?: string;
    textField?: string;
  };

  if (statusIndex < 0 || statusIndex > 4) {
    return res.status(400).json({ error: "Invalid statusIndex" });
  }
  const field = STATUS_FIELDS[statusIndex];

  const workcenter = await prisma.workcenter.findUnique({ where: { workcenterId } });
  if (!workcenter) return res.status(404).json({ error: "Workcenter not found" });

  const statusDefinitions = await prisma.statusDefinition.findMany({ orderBy: { statusRow: "asc" } });
  const definition = statusDefinitions[statusIndex];

  const currentRaw = workcenter[field];
  const newRaw = encodeStatus(color, dropdown1, dropdown2, textField);

  await prisma.workcenter.update({ where: { workcenterId }, data: { [field]: newRaw } });

  const oldColor = decodeStatus(currentRaw).color;
  const newColor = decodeStatus(newRaw).color;

  const detailsEnabled = definition?.statusDetailsEnabled === 1 || definition?.statusDetailsEnabled === 3;
  const text1On = definition?.alarmStartText1Structure?.split("|")[0] === "ON";
  const text2On = definition?.alarmStartText2Structure?.split("|")[0] === "ON";
  const text3On = definition?.alarmStartText3Structure?.split("|")[0] === "ON";

  const now = new Date();
  const logData: Parameters<typeof prisma.andonLog.create>[0]["data"] = {
    workcenterId,
    workcenterName: workcenterName ?? workcenter.workcenterName,
    statusIndex,
    alarmName: alarmName ?? definition?.statusName ?? null,
    oldStatus: oldColor,
    newStatus: newColor,
    changeDateTime: now,
    alarmStartText1: detailsEnabled && text1On ? dropdown1 : "",
    alarmStartText2: detailsEnabled && text2On ? dropdown2 : "",
    alarmStartText3: detailsEnabled && text3On ? textField : "",
  };

  if (newColor === "red") {
    logData.alarmStartTime = now;
  } else {
    const lastRed = await prisma.andonLog.findFirst({
      where: { workcenterId, statusIndex, newStatus: "red" },
      orderBy: { changeDateTime: "desc" },
    });
    if (lastRed) {
      logData.alarmStartTime = lastRed.alarmStartTime;
      logData.alarmEndTime = now;
      logData.alarmStartText1 = lastRed.alarmStartText1;
      logData.alarmStartText2 = lastRed.alarmStartText2;
      logData.alarmStartText3 = lastRed.alarmStartText3;
    }
  }

  await prisma.andonLog.create({ data: logData });

  emitStatusUpdate(workcenterId, statusIndex, newRaw);

  res.json({ newStatus: newRaw });
});
