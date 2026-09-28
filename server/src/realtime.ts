import type { Server } from "socket.io";
import type { AlarmEvent } from "@prisma/client";

let io: Server | null = null;

export function setIo(server: Server) {
  io = server;
}

/** Boards and admin pages upsert open events and drop closed ones. */
export function emitEventChanged(event: AlarmEvent) {
  io?.emit("event:changed", event);
}

export interface SelectionView {
  workcenterId: string;
  statusRow: number;
  /** What happens when the countdown ends: open a call, or close the one already open. */
  action: "open" | "close";
  /** Epoch ms when the selection confirms. */
  expiresAt: number;
  pressCount: number;
}

/** Single-button mode: a selection started or changed (selection), or ended (null). */
export function emitSelectionChanged(workcenterId: string, selection: SelectionView | null) {
  io?.emit("selection:changed", { workcenterId, selection });
}
