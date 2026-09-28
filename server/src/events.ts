import type { AlarmEvent } from "@prisma/client";
import { prisma } from "./db.js";
import { HttpError } from "./http.js";
import { detailsProblem } from "./detailStructure.js";
import { emitEventChanged, emitSelectionChanged, type SelectionView } from "./realtime.js";

export type PressSource = "button" | "simulated";
export type PressResult = "opened" | "ignored" | "closed" | "selected";

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
    const problem = detailsProblem(department, input);
    if (problem) throw new HttpError(400, problem);
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

// ─── Single-button mode ──────────────────────────────────────────────────────────────────────────
// One button per station: each press moves the selection to the next department (in
// singleButtonOrder) and restarts the confirmation countdown. When the countdown ends without
// another press, the call opens — or, if that department already has an open call, it closes.
// Selections live in memory: a server restart during those seconds drops them (the operator presses again).

export const SINGLE_CONFIRM_SETTING_ID = 7;
const DEFAULT_SINGLE_CONFIRM_SECONDS = 10;

interface Selection extends SelectionView {
  source: PressSource;
  timer: NodeJS.Timeout;
}

const selections = new Map<string, Selection>();

const viewOf = ({ workcenterId, statusRow, action, expiresAt, pressCount }: Selection): SelectionView => ({ workcenterId, statusRow, action, expiresAt, pressCount });

export function currentSelections(): SelectionView[] {
  return [...selections.values()].map(viewOf);
}

async function singleConfirmSeconds(): Promise<number> {
  const setting = await prisma.settings.findUnique({ where: { settingId: SINGLE_CONFIRM_SETTING_ID } });
  const value = Number(setting?.currentSetting);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_SINGLE_CONFIRM_SECONDS;
}

export function registerSinglePress(input: {
  workcenterId: string;
  source: PressSource;
  deviceId?: number;
  idempotencyKey?: string;
}): Promise<{ result: "selected"; selection: SelectionView | null }> {
  return serialized(async () => {
    const current = selections.get(input.workcenterId);
    // A retried press never counts twice; the selection may have been confirmed since.
    if (input.idempotencyKey && (await prisma.buttonPress.findUnique({ where: { idempotencyKey: input.idempotencyKey } }))) {
      return { result: "selected", selection: current ? viewOf(current) : null };
    }

    const workcenter = await prisma.workcenter.findUnique({ where: { workcenterId: input.workcenterId } });
    if (!workcenter) throw new HttpError(404, "Workcenter not found");
    const cycle = await prisma.statusDefinition.findMany({ where: { statusEnabled: true }, orderBy: [{ singleButtonOrder: "asc" }, { statusRow: "asc" }] });
    if (cycle.length === 0) throw new HttpError(400, "No department is enabled");

    const position = current ? cycle.findIndex((d) => d.statusRow === current.statusRow) : -1;
    const department = cycle[(position + 1) % cycle.length]!;
    const open = await findOpenEvent(input.workcenterId, department.statusRow);
    const now = Date.now();
    const seconds = await singleConfirmSeconds();

    if (current) clearTimeout(current.timer);
    const selection: Selection = {
      workcenterId: input.workcenterId,
      statusRow: department.statusRow,
      action: open ? "close" : "open",
      expiresAt: now + seconds * 1000,
      pressCount: (current?.pressCount ?? 0) + 1,
      source: input.source,
      timer: setTimeout(() => {
        confirmSelection(selection).catch((err) => console.error("Single-button confirm failed:", err));
      }, seconds * 1000),
    };
    selections.set(input.workcenterId, selection);

    await prisma.buttonPress.create({
      data: {
        deviceId: input.deviceId,
        workcenterId: input.workcenterId,
        statusRow: department.statusRow,
        source: input.source,
        pressedAt: new Date(now),
        result: "selected",
        eventId: open?.id,
        idempotencyKey: input.idempotencyKey,
      },
    });

    emitSelectionChanged(input.workcenterId, viewOf(selection));
    return { result: "selected", selection: viewOf(selection) };
  });
}

/**
 * Countdown ended: open the selected department's call, or close it if it is already open.
 * Only confirms the selection whose timer fired: a press queued just before it replaced the selection.
 */
function confirmSelection(expected: Selection): Promise<void> {
  const { workcenterId } = expected;
  return serialized(async () => {
    const selection = selections.get(workcenterId);
    if (selection !== expected) return;
    selections.delete(workcenterId);
    emitSelectionChanged(workcenterId, null);

    const workcenter = await prisma.workcenter.findUnique({ where: { workcenterId } });
    const department = await prisma.statusDefinition.findUnique({ where: { statusRow: selection.statusRow } });
    if (!workcenter || !department) return;

    // The open/closed state is checked again now: it may have changed from the computer meanwhile.
    const open = await findOpenEvent(workcenterId, selection.statusRow);
    const now = new Date();
    const event = open
      ? await prisma.alarmEvent.update({
          where: { id: open.id },
          data: { state: "closed", closedAt: now, closedBy: selection.source, pressCount: { increment: selection.pressCount }, lastPressAt: now },
        })
      : await prisma.alarmEvent.create({
          data: {
            workcenterId,
            workcenterName: workcenter.workcenterName,
            statusRow: department.statusRow,
            departmentName: department.statusName,
            state: "open",
            openedAt: now,
            openedBy: selection.source,
            pressCount: selection.pressCount,
            lastPressAt: now,
          },
        });
    emitEventChanged(event);
  });
}
