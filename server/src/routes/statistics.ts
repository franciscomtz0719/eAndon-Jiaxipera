import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import type { AlarmEvent, Workcenter } from "@prisma/client";
import { asyncHandler, HttpError, parse } from "../http.js";
import { NOT_SELECTED } from "../detailStructure.js";

export const statisticsRouter = Router();

/** Route value for stations without an area (matches the client's /areas/none). */
const NO_AREA = "none";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

const statisticsQuery = z.object({
  areaId: z.union([z.literal(NO_AREA), z.coerce.number().int().positive()]),
  workcenterId: z.string().trim().max(50).optional(),
  startDate: date.optional(),
  endDate: date.optional(),
});

type StatisticsQuery = z.infer<typeof statisticsQuery>;

// Area membership is today's configuration: a station moved to another area takes its history with it.
async function stationsInScope({ areaId, workcenterId }: StatisticsQuery): Promise<Workcenter[]> {
  const stations = await prisma.workcenter.findMany({
    where: { areaId: areaId === NO_AREA ? null : areaId },
    orderBy: { workcenterRow: "asc" },
  });
  if (!workcenterId) return stations;
  const station = stations.find((wc) => wc.workcenterId === workcenterId);
  if (!station) throw new HttpError(400, "workcenterId: station is not in the selected area");
  return [station];
}

// Closed alarms of the stations in scope. Simulated alarms are tests and never count.
async function loadFinishedLogs(query: StatisticsQuery, stations: Workcenter[]): Promise<AlarmEvent[]> {
  const where: Record<string, unknown> = {
    state: "closed",
    openedBy: { not: "simulated" },
    workcenterId: { in: stations.map((wc) => wc.workcenterId) },
  };
  if (query.startDate) where.openedAt = { gte: new Date(query.startDate) };
  if (query.endDate) {
    const end = new Date(query.endDate);
    end.setHours(23, 59, 59, 999);
    where.closedAt = { lte: end };
  }

  return prisma.alarmEvent.findMany({ where, orderBy: { openedAt: "asc" } });
}

statisticsRouter.get(
  "/statistics",
  asyncHandler(async (req, res) => {
    const query = parse(statisticsQuery, req.query);
    const stations = await stationsInScope(query);
    const finishedLogs = await loadFinishedLogs(query, stations);

    const totalAlarms = finishedLogs.length;

    const mttr = totalAlarms
      ? finishedLogs.reduce((sum, l) => sum + (l.closedAt!.getTime() - l.openedAt.getTime()) / 1000, 0) / totalAlarms
      : 0;

    let mtbf = 0;
    if (finishedLogs.length > 1) {
      const gaps: number[] = [];
      for (let i = 0; i < finishedLogs.length - 1; i++) {
        const a = finishedLogs[i]!;
        const b = finishedLogs[i + 1]!;
        gaps.push((b.openedAt.getTime() - a.closedAt!.getTime()) / 1000);
      }
      mtbf = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    }

    const workcenterStatistics = stations.map((w) => ({
      workcenterId: w.workcenterId,
      workcenterName: w.workcenterName,
      workcenterNameZh: w.workcenterNameZh,
      numberOfAlarms: finishedLogs.filter((l) => l.workcenterId === w.workcenterId).length,
    }));

    res.json({ totalAlarms, mttr, mtbf, workcenterStatistics });
  }),
);

function percentageBreakdown(items: (string | null | undefined)[], total: number) {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item || item === NOT_SELECTED) continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, numberOfAlarms]) => ({ key, numberOfAlarms, percentageOfTotal: total ? (numberOfAlarms / total) * 100 : 0 }))
    .sort((a, b) => b.numberOfAlarms - a.numberOfAlarms);
}

statisticsRouter.get(
  "/statistics/breakdown",
  asyncHandler(async (req, res) => {
    const query = parse(statisticsQuery, req.query);
    const stations = await stationsInScope(query);
    const finishedLogs = await loadFinishedLogs(query, stations);
    const totalAlarms = finishedLogs.length;

    // Grouped by button slot (statusRow) under the department's current name,
    // so renaming a department does not split its history.
    const definitions = await prisma.statusDefinition.findMany({ where: { statusEnabled: true }, orderBy: { statusRow: "asc" } });
    const departmentStatistics = definitions.map((def) => {
      const numberOfAlarms = finishedLogs.filter((l) => l.statusRow === def.statusRow).length;
      return {
        statusRow: def.statusRow,
        departmentName: def.statusName,
        numberOfAlarms,
        percentageOfTotal: totalAlarms ? (numberOfAlarms / totalAlarms) * 100 : 0,
      };
    });

    const alarmLocationStatistics = percentageBreakdown(finishedLogs.map((l) => l.detailLocation), totalAlarms).map((r) => ({
      alarmLocation: r.key,
      numberOfAlarms: r.numberOfAlarms,
      percentageOfTotal: r.percentageOfTotal,
    }));

    const alarmTypeStatistics = percentageBreakdown(finishedLogs.map((l) => l.detailType), totalAlarms).map((r) => ({
      alarmType: r.key,
      numberOfAlarms: r.numberOfAlarms,
      percentageOfTotal: r.percentageOfTotal,
    }));

    res.json({ departmentStatistics, alarmLocationStatistics, alarmTypeStatistics });
  }),
);
