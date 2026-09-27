import type { Server } from "socket.io";

let io: Server | null = null;

export function setIo(server: Server) {
  io = server;
}

export function emitStatusUpdate(workcenterId: string, statusIndex: number, newStatus: string) {
  io?.emit("status:update", { workcenterId, statusIndex, newStatus });
}
