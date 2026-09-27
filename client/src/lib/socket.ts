import { useEffect } from "react";
import { io } from "socket.io-client";
import type { AlarmEvent } from "./types";

export const socket = io({ path: "/socket.io" });

/** Called whenever an alarm is opened or closed anywhere. */
export function useEventChanges(handler: (event: AlarmEvent) => void) {
  useEffect(() => {
    socket.on("event:changed", handler);
    return () => {
      socket.off("event:changed", handler);
    };
  }, [handler]);
}

/** Called on every (re)connection, so pages can reload state they may have missed while offline. */
export function useSocketConnect(handler: () => void) {
  useEffect(() => {
    socket.on("connect", handler);
    return () => {
      socket.off("connect", handler);
    };
  }, [handler]);
}
