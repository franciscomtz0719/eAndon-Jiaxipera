import { useEffect } from "react";
import { io } from "socket.io-client";

export const socket = io({ path: "/socket.io" });

export interface StatusUpdatePayload {
  workcenterId: string;
  statusIndex: number;
  newStatus: string;
}

export function useStatusUpdates(handler: (payload: StatusUpdatePayload) => void) {
  useEffect(() => {
    socket.on("status:update", handler);
    return () => {
      socket.off("status:update", handler);
    };
  }, [handler]);
}
