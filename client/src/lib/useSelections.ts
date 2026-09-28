import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Selection } from "./types";
import { useSelectionChanges, useSocketConnect } from "./socket";

/** Single-button selections in progress, by station; reloaded after a reconnection. */
export function useSelections() {
  const [selections, setSelections] = useState<ReadonlyMap<string, Selection>>(new Map());

  const load = useCallback(() => {
    api
      .getSelections()
      .then((list) => setSelections(new Map(list.map((s) => [s.workcenterId, s]))))
      .catch(console.error);
  }, []);
  useEffect(load, [load]);
  useSocketConnect(load);

  useSelectionChanges(
    useCallback(({ workcenterId, selection }: { workcenterId: string; selection: Selection | null }) => {
      setSelections((prev) => {
        const next = new Map(prev);
        if (selection) next.set(workcenterId, selection);
        else next.delete(workcenterId);
        return next;
      });
    }, []),
  );

  return selections;
}
