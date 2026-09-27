import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import type { AlarmEvent } from "./types";
import { useEventChanges, useSocketConnect } from "./socket";

export function eventKey(workcenterId: string, statusRow: number) {
  return `${workcenterId}|${statusRow}`;
}

/** All open alarms, kept current by socket updates and reloaded after a reconnection. */
export function useOpenEvents() {
  const [events, setEvents] = useState<AlarmEvent[]>([]);

  const load = useCallback(() => {
    api.getOpenEvents().then(setEvents).catch(console.error);
  }, []);
  useEffect(load, [load]);
  useSocketConnect(load);

  const onChange = useCallback((event: AlarmEvent) => {
    setEvents((prev) => {
      const others = prev.filter((e) => e.id !== event.id);
      return event.state === "open" ? [...others, event] : others;
    });
  }, []);
  useEventChanges(onChange);

  const byKey = useMemo(() => new Map(events.map((e) => [eventKey(e.workcenterId, e.statusRow), e])), [events]);

  const openFor = useCallback((workcenterId: string, statusRow: number) => byKey.get(eventKey(workcenterId, statusRow)), [byKey]);
  const countFor = useCallback((workcenterId: string) => events.filter((e) => e.workcenterId === workcenterId).length, [events]);

  return { events, openFor, countFor };
}
