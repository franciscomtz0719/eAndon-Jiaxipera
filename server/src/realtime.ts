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
