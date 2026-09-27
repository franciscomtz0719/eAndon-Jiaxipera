import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Workcenter } from "./types";
import { useStatusUpdates, type StatusUpdatePayload } from "./socket";

export const STATUS_FIELDS = ["status1", "status2", "status3", "status4", "status5"] as const;

/** Stations with their alarm states kept current by socket updates. */
export function useLiveWorkcenters() {
  const [workcenters, setWorkcenters] = useState<Workcenter[]>([]);

  useEffect(() => {
    api.getWorkcenters().then(setWorkcenters).catch(console.error);
  }, []);

  const onStatusUpdate = useCallback((payload: StatusUpdatePayload) => {
    setWorkcenters((prev) =>
      prev.map((wc) => (wc.workcenterId === payload.workcenterId ? { ...wc, [STATUS_FIELDS[payload.statusIndex]!]: payload.newStatus } : wc)),
    );
  }, []);
  useStatusUpdates(onStatusUpdate);

  return workcenters;
}

export function hasActiveAlarm(wc: Workcenter) {
  return STATUS_FIELDS.some((field) => wc[field].startsWith("red"));
}

export function countActiveAlarms(wc: Workcenter) {
  return STATUS_FIELDS.filter((field) => wc[field].startsWith("red")).length;
}
