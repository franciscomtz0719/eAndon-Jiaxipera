import type { AlarmEvent } from "@prisma/client";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";
import { emitEventChanged } from "./realtime.js";

export type PressSource = "button" | "simulated";
export type PressResult = "opened" | "ignored" | "closed";

export const LOCKOUT_SETTING_ID = 5;
const DEFAULT_LOCKOUT_SECONDS = 30;

// Every write that opens or closes an event goes through this queue, so two presses arriving at the
// same time can never both see "no open alarm" and open two events for the same button.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function lockoutSeconds(): Promise<number> {
  const setting = await prisma.settings.findUnique({ where: { settingId: LOCKOUT_SETTING_ID } });
  const value = Number(setting?.currentSetting);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_LOCKOUT_SECONDS;
}

async function resolveTarget(workcenterId: string, statusRow: number) {
  const [workcenter, department] = await Promise.all([
    prisma.workcenter.findUnique({ where: { workcenterId } }),
    prisma.statusDefinition.findUnique({ where: { statusRow } }),
  ]);
  if (!workcenter) throw new HttpError(404, "Workcenter not found");
  if (!department || !department.statusEnabled) throw new HttpError(400, "statusRow: department does not exist or is disabled");
  return { workcenter, department };
}

function findOpenEvent(workcenterId: string, statusRow: number) {
  return prisma.alarmEvent.findFirst({ where: { workcenterId, statusRow, state: "open" } });
}

/**
 * Button rule: no open alarm → open; open for less than the lockout → ignore; otherwise → close.
 * The lockout counts from when the alarm was opened. A repeated idempotencyKey returns the first outcome.
 */
export function registerPress(input: {
  workcenterId: string;
  statusRow: number;
  source: PressSource;
  deviceId?: number;
  idempotencyKey?: string;
}): Promise<{ result: PressResult; event: AlarmEvent }> {
  return serialized(async () => {
    if (input.idempotencyKey) {
      const previous = await prisma.buttonPress.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { event: true } });
      if (previous?.event) return { result: previous.result as PressResult, event: previous.event };
    }

    const { workcenter, department } = await resolveTarget(input.workcenterId, input.statusRow);
    const now = new Date();
    const open = await findOpenEvent(input.workcenterId, input.statusRow);

    let result: PressResult;
    let event: AlarmEvent;
    if (!open) {
      result = "opened";
      event = await prisma.alarmEvent.create({
        data: {
          workcenterId: workcenter.workcenterId,
          workcenterName: workcenter.workcenterName,
          statusRow: department.statusRow,
          departmentName: department.statusName,
          state: "open",
          openedAt: now,
          openedBy: input.source,
          pressCount: 1,
          lastPressAt: now,
        },
      });
    } else if (now.getTime() - open.openedAt.getTime() < (await lockoutSeconds()) * 1000) {
      result = "ignored";
      event = await prisma.alarmEvent.update({ where: { id: open.id }, data: { pressCount: { increment: 1 }, lastPressAt: now } });
    } else {
      result = "closed";
      event = await prisma.alarmEvent.update({
        where: { id: open.id },
        data: { state: "closed", closedAt: now, closedBy: input.source, pressCount: { increment: 1 }, lastPressAt: now },
      });
    }

    await prisma.buttonPress.create({
      data: {
        deviceId: input.deviceId,
        workcenterId: input.workcenterId,
        statusRow: input.statusRow,
        source: input.source,
        pressedAt: now,
        result,
        eventId: event.id,
        idempotencyKey: input.idempotencyKey,
      },
    });

    // Ignored presses change nothing on the boards, so only openings and closings are broadcast.
    if (result !== "ignored") emitEventChanged(event);
    return { result, event };
  });
}

/** Computer (admin page): opens with optional details; refuses if that button already has an open alarm. */
export function openFromComputer(input: {
  workcenterId: string;
  statusRow: number;
  detailLocation?: string;
  detailType?: string;
  detailText?: string;
}): Promise<AlarmEvent> {
  return serialized(async () => {
    const { workcenter, department } = await resolveTarget(input.workcenterId, input.statusRow);
    if (await findOpenEvent(input.workcenterId, input.statusRow)) {
      throw new HttpError(409, "This department already has an open alarm at this station.");
    }
    const event = await prisma.alarmEvent.create({
      data: {
        workcenterId: workcenter.workcenterId,
        workcenterName: workcenter.workcenterName,
        statusRow: department.statusRow,
        departmentName: department.statusName,
        state: "open",
        openedAt: new Date(),
        openedBy: "computer",
        detailLocation: input.detailLocation || null,
        detailType: input.detailType || null,
        detailText: input.detailText || null,
      },
    });
    emitEventChanged(event);
    return event;
  });
}

/** Computer (admin page): closes immediately; the button lockout does not apply. */
export function closeFromComputer(eventId: number): Promise<AlarmEvent> {
  return serialized(async () => {
    const open = await prisma.alarmEvent.findUnique({ where: { id: eventId } });
    if (!open) throw new HttpError(404, "Alarm not found");
    if (open.state !== "open") throw new HttpError(409, "This alarm is already closed.");
    const event = await prisma.alarmEvent.update({ where: { id: eventId }, data: { state: "closed", closedAt: new Date(), closedBy: "computer" } });
    emitEventChanged(event);
    return event;
  });
}
