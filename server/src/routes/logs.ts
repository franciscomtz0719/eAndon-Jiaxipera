import { Router } from "express";
import { prisma } from "../db.js";
import type { AndonLog } from "@prisma/client";

export const logsRouter = Router();

function groupAndPickFinished(logs: AndonLog[]): AndonLog[] {
  const groups = new Map<string, AndonLog[]>();
  for (const log of logs) {
    const key = `${log.workcenterId}|${log.alarmName ?? ""}|${log.alarmStartTime?.toISOString() ?? ""}`;
    const arr = groups.get(key) ?? [];
    arr.push(log);
    groups.set(key, arr);
  }
  const result: AndonLog[] = [];
  for (const group of groups.values()) {
    const finished = group.find((l) => l.alarmEndTime != null);
    result.push(finished ?? group[0]!);
  }
  return result;
}

logsRouter.get("/logs", async (req, res) => {
  const { startDate, endDate, workcenterId, showFinishedAlarms } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = {};
  if (startDate) where.changeDateTime = { ...(where.changeDateTime as object), gte: new Date(startDate) };
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.changeDateTime = { ...(where.changeDateTime as object), lte: end };
  }
  if (workcenterId) where.workcenterId = workcenterId;

  const logs = await prisma.andonLog.findMany({ where });
  let selected = groupAndPickFinished(logs);
  if (showFinishedAlarms === "true") {
    selected = selected.filter((l) => l.alarmEndTime != null);
  }
  selected.sort((a, b) => b.changeDateTime.getTime() - a.changeDateTime.getTime());

  res.json(selected);
});

logsRouter.get("/logs/history", async (req, res) => {
  const { workcenterId } = req.query as Record<string, string | undefined>;
  const where: Record<string, unknown> = {};
  if (workcenterId) where.workcenterId = workcenterId;

  const logs = await prisma.andonLog.findMany({ where });
  const selected = groupAndPickFinished(logs).sort(
    (a, b) => (b.alarmStartTime?.getTime() ?? 0) - (a.alarmStartTime?.getTime() ?? 0),
  );

  const withDuration = selected.map((l) => {
    const end = l.alarmEndTime ?? new Date();
    const durationMinutes = l.alarmStartTime ? (end.getTime() - l.alarmStartTime.getTime()) / 60000 : 0;
    return {
      alarmId: l.id,
      alarmName: l.alarmName,
      alarmStartTime: l.alarmStartTime,
      alarmEndTime: l.alarmEndTime,
      durationMinutes,
      alarmStartText1: l.alarmStartText1,
      alarmStartText2: l.alarmStartText2,
      alarmStartText3: l.alarmStartText3,
    };
  });

  res.json(withDuration);
});
